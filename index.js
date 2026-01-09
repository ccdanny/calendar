const express = require('express');
require('dotenv').config();
const cors = require('cors');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { PrismaClient } = require('@prisma/client');
const dayjs = require('dayjs');
const { Parser } = require('json2csv');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 8080;
const API_SECRET = process.env.API_SECRET || 'dev_secret';

// Log environment mode
const NODE_ENV = process.env.NODE_ENV || 'development';
console.log(`🔧 Environment: ${NODE_ENV}`);

app.use(cors());
app.use(express.json());

// Middleware to verify secret for webhook
const verifySecret = (req, res, next) => {
  const secret = req.headers['x-secret-key'];
  if (secret !== API_SECRET) {
    return res.status(403).json({ error: 'Invalid secret key' });
  }
  next();
};

// --- API Routes ---

// 1. Get records for a specific month
app.get('/api/records', async (req, res) => {
  const { month } = req.query; // Format: YYYY-MM
  if (!month) return res.status(400).json({ error: 'Month is required (YYYY-MM)' });

  try {
    const records = await prisma.record.findMany({
      where: {
        date: {
          startsWith: month
        }
      }
    });
    res.json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

// 2. Upsert a record (Manual entry)
app.post('/api/records', async (req, res) => {
  const { date, type, duration, note, clockOutTime } = req.body;
  
  if (!date) return res.status(400).json({ error: 'Date is required' });

  try {
    const record = await prisma.record.upsert({
      where: { date },
      update: {
        type,
        duration: duration ? parseFloat(duration) : null,
        note,
        clockOutTime: clockOutTime ? new Date(clockOutTime) : undefined,
      },
      create: {
        date,
        type: type || 'WORK',
        duration: duration ? parseFloat(duration) : null,
        note,
        clockOutTime: clockOutTime ? new Date(clockOutTime) : undefined,
      },
    });
    res.json(record);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save record' });
  }
});

// 3. Webhook for Auto Clock-out (Hammerspoon)
app.post('/api/webhook/clock-out', verifySecret, async (req, res) => {
  const { timestamp } = req.body; // Unix timestamp or ISO string
  
  // Handle timestamp (support both seconds and milliseconds)
  let now = dayjs();
  if (timestamp) {
    if (typeof timestamp === 'number' && timestamp < 10000000000) {
      now = dayjs.unix(timestamp);
    } else {
      now = dayjs(timestamp);
    }
  }
  
  const dateStr = now.format('YYYY-MM-DD');

  // Check for Overtime (After 21:00 Beijing Time)
  // Beijing is UTC+8
  const utcDate = now.toDate();
  const beijingHour = (utcDate.getUTCHours() + 8) % 24;
  
  let type = 'WORK';
  let duration = null;
  let note = 'Auto-clocked via Hammerspoon';
  
  // If after 21:00 Beijing Time, mark as OVERTIME
  if (beijingHour >= 21) {
    type = 'OVERTIME';
    const beijingMinute = utcDate.getUTCMinutes();
    // Duration from 21:00
    duration = parseFloat(((beijingHour - 21) + (beijingMinute / 60)).toFixed(2));
    note = 'Auto-clocked Overtime (after 21:00)';
  }

  try {
    // Upsert: If record exists, update clockOutTime; otherwise create new WORK/OVERTIME record
    const record = await prisma.record.upsert({
      where: { date: dateStr },
      update: {
        clockOutTime: now.toDate(),
        ...(type === 'OVERTIME' && { type, duration }), // Only update type/duration if it is overtime
      },
      create: {
        date: dateStr,
        type,
        duration,
        clockOutTime: now.toDate(),
        note,
      },
    });
    console.log(`[Auto-Clock] Clocked out for ${dateStr} at ${now.format('HH:mm:ss')} (Type: ${type})`);
    res.json({ success: true, record });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// 4. Export Data
app.get('/api/export', async (req, res) => {
  const { year } = req.query;
  if (!year) return res.status(400).json({ error: 'Year is required' });

  try {
    const records = await prisma.record.findMany({
      where: { date: { startsWith: year } },
      orderBy: { date: 'asc' }
    });

    const fields = ['date', 'type', 'clockOutTime', 'duration', 'note'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(records);

    res.header('Content-Type', 'text/csv');
    res.attachment(`work-records-${year}.csv`);
    return res.send(csv);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// Serve static frontend files
// In development, proxy to Vite dev server for React app
// In production, serve static files from dist
if (NODE_ENV === 'production') {
  const clientPath = path.join(__dirname, 'client', 'dist');
  const fs = require('fs');
  
  // Check if dist directory exists
  if (!fs.existsSync(clientPath)) {
    console.error(`❌ Error: ${clientPath} directory does not exist. Please build the frontend first.`);
    console.error('   Run: cd client && npm run build');
  }
  
  // Middleware to serve Brotli compressed files if available
  app.use((req, res, next) => {
    // Only handle static assets (JS, CSS, etc.), not HTML files
    if (req.path.startsWith('/api') || req.path.endsWith('.html')) {
      return next();
    }
    
    // Check if client accepts Brotli compression
    const acceptEncoding = req.headers['accept-encoding'] || '';
    if (acceptEncoding.includes('br')) {
      const brPath = path.join(clientPath, req.path + '.br');
      if (fs.existsSync(brPath)) {
        // Set appropriate content type based on original file extension
        const ext = path.extname(req.path);
        const contentTypes = {
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.svg': 'image/svg+xml',
          '.woff': 'font/woff',
          '.woff2': 'font/woff2',
        };
        if (contentTypes[ext]) {
          res.setHeader('Content-Type', contentTypes[ext]);
        }
        res.setHeader('Content-Encoding', 'br');
        res.setHeader('Vary', 'Accept-Encoding');
        return res.sendFile(brPath);
      }
    }
    next();
  });
  
  // Serve static files from dist directory
  app.use(express.static(clientPath));
  
  // Route for calendar.html - React app (production)
  app.get('/calendar.html', (req, res) => {
    const calendarPath = path.join(__dirname, 'client', 'dist', 'calendar.html');
    if (fs.existsSync(calendarPath)) {
      res.sendFile(calendarPath);
    } else {
      console.error(`❌ Error: ${calendarPath} does not exist. Please build the frontend first.`);
      res.status(404).json({ 
        error: 'calendar.html not found. Please build the frontend: cd client && npm run build' 
      });
    }
  });
  
  // Fallback: serve index.html for all other routes (SPA routing)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      const indexPath = path.join(__dirname, 'client', 'dist', 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).json({ 
          error: 'Frontend not built. Please build the frontend: cd client && npm run build' 
        });
      }
    } else {
      res.status(404).json({ error: 'API endpoint not found' });
    }
  });
} else {
  // Development mode
  // Serve root and index.html directly (static files)
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'index.html'));
  });
  
  app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'index.html'));
  });
  
  // Proxy calendar.html and all other frontend requests to Vite dev server
  // This must be after specific routes but will catch everything else
  app.use(createProxyMiddleware({
    target: 'http://127.0.0.1:5173', // Use IPv4 explicitly
    changeOrigin: true,
    ws: true, // Enable websocket proxying for HMR
    logLevel: 'silent',
    // Proxy all non-API requests (except / and /index.html which are handled above)
    filter: (pathname, req) => {
      // Don't proxy API requests
      if (pathname.startsWith('/api')) {
        return false;
      }
      // Don't proxy root and index.html (already handled by routes above)
      if (pathname === '/' || pathname === '/index.html') {
        return false;
      }
      // Proxy everything else (calendar.html, calender.html, assets, etc.)
      return true;
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err.message);
      console.error('Make sure Vite dev server is running on port 5173');
      res.status(500).send('Proxy error: Vite dev server may not be running. Please start it with: npm run client:dev');
    },
  }));
}

// Start server listening on 0.0.0.0 to accept connections from all network interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
  console.log(`📅 Smart Work Calendar API: http://0.0.0.0:${PORT}/api`);
  console.log(`🌐 Frontend: http://0.0.0.0:${PORT}`);
  console.log(`📋 Calendar App: http://0.0.0.0:${PORT}/calendar.html`);
  if (NODE_ENV !== 'production') {
    console.log(`🔧 Development mode - Vite dev server should be running on port 5173`);
    console.log(`⏳ Please wait 2-5 minutes for the internal gateway to fully initialize`);
  } else {
    console.log(`📦 Production mode - Serving static files from client/dist`);
  }
});
