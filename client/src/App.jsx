import React, { useState, useEffect } from "react";
import {
  Calendar,
  Badge,
  Modal,
  Form,
  Input,
  Radio,
  InputNumber,
  Button,
  Tag,
  message,
} from "antd";
import dayjs from "dayjs";
import { isWorkday, isHoliday } from "chinese-days";
import { getRecords, saveRecord, exportData } from "./api";

// 响应式样式
const styles = {
  container: {
    padding: "20px",
    maxWidth: "100%",
    overflowX: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: "10px",
  },
  title: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "bold",
  },
  exportButton: {
    whiteSpace: "nowrap",
  },
  calendarCell: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    width: "100%",
    maxWidth: "100%",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    gap: "1px",
  },
  noteText: {
    fontSize: "10px",
    color: "#999",
    wordBreak: "break-word",
  },
};

// 响应式样式（通过媒体查询在 CSS 中处理）
const mobileStyles = `
  /* 统一所有 PickerCell 的大小 */
  .ant-picker-cell {
    height: auto !important;
  }
  .ant-picker-cell-inner {
    width: 100% !important;
    height: 100% !important;
    max-width: 100% !important;
    max-height: 100% !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
  }
  .ant-picker-calendar-date {
    width: 100% !important;
    height: 100% !important;
    max-width: 100% !important;
    max-height: 100% !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
    padding: 4px 2px !important;
    display: flex !important;
    flex-direction: column !important;
  }
  .ant-picker-calendar-date-content {
    width: 100% !important;
    max-width: 100% !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
    height: auto !important;
    flex: 1 !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: flex-start !important;
  }

  /* 统一单元格高度 */
  .ant-picker-calendar-date {
    min-height: 80px !important;
    height: 80px !important;
  }

  /* Badge 字体大小优化 */
  .ant-badge {
    font-size: 10px !important;
    line-height: 1.2 !important;
  }
  .ant-badge-status-text {
    font-size: 10px !important;
    margin-left: 4px !important;
  }
  .ant-badge-status-dot {
    width: 6px !important;
    height: 6px !important;
  }

  /* Tag 优化 */
  .ant-tag {
    font-size: 10px !important;
    padding: 1px 4px !important;
    margin: 1px 0 !important;
    line-height: 1.3 !important;
    display: inline-block !important;
    max-width: 100% !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
  }

  @media (max-width: 768px) {
    .calendar-container {
      padding: 10px 8px !important;
    }
    .calendar-header {
      flex-direction: column !important;
      align-items: flex-start !important;
      margin-bottom: 15px !important;
    }
    .calendar-title {
      font-size: 20px !important;
      margin-bottom: 10px !important;
    }
    .calendar-export-btn {
      width: 100% !important;
      font-size: 14px !important;
    }
    .ant-picker-calendar {
      font-size: 12px !important;
    }
    .ant-picker-calendar-date {
      min-height: 70px !important;
      height: 70px !important;
      padding: 3px 2px !important;
    }
    .ant-picker-calendar-date-content {
      min-height: 50px !important;
    }
    .ant-badge {
      font-size: 7px !important;
    }
    .ant-badge-status-text {
      font-size: 7px !important;
    }
    .ant-tag {
      font-size: 7px !important;
      padding: 1px 3px !important;
    }
    /* Note 文本字体 */
    .ant-picker-calendar-date-content li {
      font-size: 7px !important;
    }
    .ant-modal {
      max-width: 95vw !important;
      margin: 10px auto !important;
    }
    .ant-modal-content {
      padding: 16px !important;
    }
    .ant-form-item-label {
      padding-bottom: 4px !important;
    }
    .ant-radio-group {
      display: flex !important;
      flex-direction: column !important;
      gap: 8px !important;
    }
    .ant-radio-wrapper {
      margin-right: 0 !important;
    }
  }
  @media (max-width: 480px) {
    .calendar-container {
      padding: 8px 4px !important;
    }
    .calendar-title {
      font-size: 18px !important;
    }
    .ant-picker-calendar-date {
      min-height: 60px !important;
      height: 60px !important;
      padding: 2px 1px !important;
    }
    .ant-picker-calendar-date-content {
      min-height: 40px !important;
    }
    .ant-badge {
      font-size: 6px !important;
    }
    .ant-badge-status-text {
      font-size: 6px !important;
      margin-left: 2px !important;
    }
    .ant-badge-status-dot {
      width: 4px !important;
      height: 4px !important;
    }
    .ant-tag {
      font-size: 6px !important;
      padding: 1px 2px !important;
    }
    /* Note 文本字体 */
    .ant-picker-calendar-date-content li {
      font-size: 6px !important;
    }
  }
`;

const App = () => {
  const [records, setRecords] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [form] = Form.useForm();
  const [currentMonth, setCurrentMonth] = useState(dayjs());

  // Fetch records when month changes
  useEffect(() => {
    fetchRecords(currentMonth.format("YYYY-MM"));
  }, [currentMonth]);

  const fetchRecords = async (monthStr) => {
    try {
      const res = await getRecords(monthStr);
      const recordMap = {};
      res.data.forEach((r) => {
        recordMap[r.date] = r;
      });
      setRecords(recordMap);
    } catch (err) {
      message.error("Failed to load records");
    }
  };

  const handleSelect = (date, { source }) => {
    if (source === "date") {
      openEditModal(date);
    }
  };

  // Also open modal on direct click if needed, or rely on double click/select
  const openEditModal = (date) => {
    setSelectedDate(date);
    const dateStr = date.format("YYYY-MM-DD");
    const record = records[dateStr];

    form.setFieldsValue({
      type: record?.type || "WORK",
      duration: record?.duration || 0,
      note: record?.note || "",
      clockOutTime: record?.clockOutTime
        ? dayjs(record.clockOutTime).format("HH:mm")
        : "",
    });
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const dateStr = selectedDate.format("YYYY-MM-DD");

      // Merge clock out time if manually edited (simple string append for now or full parsing)
      let clockOutDateObj = null;
      if (values.clockOutTime) {
        // Create a date object combining the selected date and the time string
        const [h, m] = values.clockOutTime.split(":");
        clockOutDateObj = selectedDate.hour(h).minute(m).toDate();
      }

      await saveRecord({
        date: dateStr,
        ...values,
        clockOutTime: clockOutDateObj,
      });

      message.success("Saved");
      setIsModalOpen(false);
      fetchRecords(currentMonth.format("YYYY-MM")); // Refresh
    } catch (err) {
      console.error(err);
      message.error("Failed to save");
    }
  };

  const dateCellRender = (value) => {
    const dateStr = value.format("YYYY-MM-DD");
    const record = records[dateStr];

    // 1. Determine base status (Official Holiday/Workday)
    const isCnHoliday = isHoliday(value.toDate());
    const isCnWorkday = isWorkday(value.toDate());

    // 2. Override with User Record
    let type = record?.type;
    if (!type) {
      if (isCnHoliday) type = "HOLIDAY_OFFICIAL";
      else if (!isCnWorkday) type = "WEEKEND";
      else type = "WORK_DEFAULT";
    }

    // 3. Render Badges
    return (
      <ul style={styles.calendarCell}>
        {record?.clockOutTime && (
          <li
            key="clock"
            style={{ margin: 0, padding: 0, width: "100%", overflow: "hidden" }}
          >
            <Tag
              color="blue"
              style={{
                margin: 0,
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              🏃 {dayjs(record.clockOutTime).format("HH:mm")}
            </Tag>
          </li>
        )}
        {type === "OVERTIME" && (
          <li
            style={{ margin: 0, padding: 0, width: "100%", overflow: "hidden" }}
          >
            <Badge status="error" text={`加班 ${record.duration}h`} />
          </li>
        )}
        {type === "LEAVE" && (
          <li
            style={{ margin: 0, padding: 0, width: "100%", overflow: "hidden" }}
          >
            <Badge status="success" text="请假/调休" />
          </li>
        )}
        {/* {record?.note && (
          <li
            style={{
              ...styles.noteText,
              width: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {record.note}
          </li>
        )}*/}

        {/* Show holiday tag if no manual record overrides it negatively */}
        {!record && isCnHoliday && (
          <li
            style={{ margin: 0, padding: 0, width: "100%", overflow: "hidden" }}
          >
            <Tag
              color="red"
              style={{
                margin: 0,
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              节假日
            </Tag>
          </li>
        )}
        {!record && !isCnWorkday && !isCnHoliday && (
          <li
            style={{ margin: 0, padding: 0, width: "100%", overflow: "hidden" }}
          >
            <span style={{ color: "#ccc", fontSize: "10px" }}>休息</span>
          </li>
        )}
      </ul>
    );
  };

  return (
    <>
      <style>{mobileStyles}</style>
      <div className="calendar-container" style={styles.container}>
        <div className="calendar-header" style={styles.header}>
          <h1 className="calendar-title" style={styles.title}>
            📅 Smart Work Calendar
          </h1>
          <Button
            className="calendar-export-btn"
            style={styles.exportButton}
            onClick={() => exportData(currentMonth.format("YYYY"))}
          >
            Export {currentMonth.format("YYYY")} Data
          </Button>
        </div>

        <Calendar
          onPanelChange={(date) => setCurrentMonth(date)}
          onSelect={handleSelect}
          cellRender={dateCellRender}
        />

        <Modal
          title={`Edit Record: ${selectedDate?.format("YYYY-MM-DD")}`}
          open={isModalOpen}
          onOk={handleOk}
          onCancel={() => setIsModalOpen(false)}
          width="90%"
          style={{ maxWidth: "500px" }}
        >
          <Form form={form} layout="vertical">
            <Form.Item name="type" label="类型">
              <Radio.Group>
                <Radio value="WORK">正常工作</Radio>
                <Radio value="OVERTIME">加班</Radio>
                <Radio value="LEAVE">调休/请假</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item name="clockOutTime" label="下班时间 (自动或手动)">
              <Input placeholder="HH:mm" />
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prev, current) => prev.type !== current.type}
            >
              {({ getFieldValue }) =>
                getFieldValue("type") === "OVERTIME" ? (
                  <Form.Item name="duration" label="加班时长 (小时)">
                    <InputNumber min={0} step={0.5} style={{ width: "100%" }} />
                  </Form.Item>
                ) : null
              }
            </Form.Item>

            <Form.Item name="note" label="备注">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </>
  );
};

export default App;
