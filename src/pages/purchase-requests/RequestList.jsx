import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Button,
  Input,
  Tag,
  Card,
  Space,
  Tooltip,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  DeleteOutlined,
  CheckOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { purchaseRequestService } from "../../services/purchaseRequestService";
import styles from "./RequestList.module.css";

const statusLabels = {
  DRAFT: { text: "Nháp", color: "default" },
  PENDING: { text: "Chờ duyệt", color: "orange" },
  APPROVED: { text: "Đã duyệt", color: "green" },
  REJECTED: { text: "Từ chối", color: "red" },
  COMPLETED: { text: "Hoàn tất", color: "blue" },
};

export default function RequestList() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await purchaseRequestService.getAll();
      setRequests(data);
    } catch (error) {
      toast.error("Lỗi tải dữ liệu: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = useMemo(() => {
    const q = search.toLowerCase();
    return requests.filter(
      (r) =>
        r.code.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q),
    );
  }, [requests, search]);

  const handleDelete = async (id) => {
    try {
      await purchaseRequestService.delete(id);
      setRequests(requests.filter((r) => r.id !== id));
      toast.success("Đã xóa yêu cầu!");
    } catch (error) {
      toast.error("Lỗi xóa: " + error.message);
    }
  };

  const columns = [
    { title: "STT", width: 60, align: "center", render: (_, __, i) => i + 1 },
    {
      title: "Mã YC",
      dataIndex: "code",
      width: 180,
      render: (code) => <strong>{code}</strong>,
    },
    {
      title: "Ngày YC",
      dataIndex: "request_date",
      width: 110,
      render: (d) => dayjs(d).format("DD/MM/YYYY"),
    },
    {
      title: "Ngày cần",
      dataIndex: "expected_date",
      width: 110,
      render: (d) => dayjs(d).format("DD/MM/YYYY"),
    },
    { title: "Đơn vị", dataIndex: "department", width: 150 },
    {
      title: "Người tạo",
      dataIndex: ["creator", "name"],
      width: 140,
      render: (name) => name || <span style={{ color: "#94a3b8" }}>—</span>,
    },
    {
      title: "Nhà cung cấp",
      dataIndex: ["supplier", "name"],
      width: 160,
      render: (name) => name || <span style={{ color: "#94a3b8" }}>—</span>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 120,
      align: "center",
      filters: Object.entries(statusLabels).map(([value, { text }]) => ({
        text,
        value,
      })),
      onFilter: (value, record) => record.status === value,
      render: (status) => {
        const s = statusLabels[status] || statusLabels.DRAFT;
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: "Thao tác",
      width: 200,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <Space size={4}>
          {/* Xem chi tiết - luôn hiện */}
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() =>
                navigate(`/dashboard/purchase-requests/${record.id}`)
              }
            />
          </Tooltip>

          {/* Sửa - chỉ hiện khi DRAFT */}
          {record.status === "DRAFT" && (
            <Tooltip title="Sửa yêu cầu">
              <Button
                type="text"
                icon={<EditOutlined style={{ color: "#1677ff" }} />}
                onClick={() =>
                  navigate(`/dashboard/purchase-requests/edit/${record.id}`)
                }
              />
            </Tooltip>
          )}

          {/* Duyệt - chỉ hiện khi PENDING */}
          {record.status === "PENDING" && (
            <Tooltip title="Duyệt yêu cầu">
              <Button
                type="text"
                icon={<CheckOutlined style={{ color: "#16a34a" }} />}
                onClick={() =>
                  navigate(`/dashboard/purchase-requests/approve/${record.id}`)
                }
              />
            </Tooltip>
          )}

          {/* Xóa - chỉ hiện khi DRAFT hoặc REJECTED */}
          {(record.status === "DRAFT" || record.status === "REJECTED") && (
            <Popconfirm
              title="Xóa yêu cầu?"
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(record.id)}
            >
              <Tooltip title="Xóa">
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Danh sách yêu cầu mua sắm</h2>
          <p className={styles.subtitle}>
            Tổng cộng <strong>{requests.length}</strong> yêu cầu
          </p>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => navigate("/dashboard/purchase-requests/create")}
        >
          Tạo yêu cầu
        </Button>
      </div>

      <Card className={styles.filterCard}>
        <Input
          size="large"
          placeholder="Tìm theo mã YC, đơn vị..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ maxWidth: 400 }}
        />
      </Card>

      <Card className={styles.tableCard} bodyStyle={{ padding: 0 }}>
        <Table
          loading={loading}
          columns={columns}
          dataSource={filteredRequests}
          rowKey="id"
          scroll={{ x: 1500 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `Hiển thị ${range[0]} - ${range[1]} / ${total} yêu cầu`,
          }}
        />
      </Card>
    </div>
  );
}
