import React, { useState, useEffect } from "react";
import { Card, Button, Table, Tag, Descriptions, Spin, Alert } from "antd";
import {
  ArrowLeftOutlined,
  CheckOutlined,
  FileTextOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { purchaseRequestService } from "../../services/purchaseRequestService";
import RequestProgress from "./RequestProgress";
import styles from "./RequestDetail.module.css";

const statusLabels = {
  DRAFT: { text: "Nháp", color: "default" },
  PENDING: { text: "Chờ duyệt", color: "orange" },
  APPROVED: { text: "Đã duyệt", color: "green" },
  REJECTED: { text: "Từ chối", color: "red" },
  COMPLETED: { text: "Hoàn tất", color: "blue" },
};

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const data = await purchaseRequestService.getById(id);
      setRequest(data);
    } catch (error) {
      toast.error("Lỗi tải dữ liệu: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className={styles.loading}>
        <Spin size="large" />
      </div>
    );
  }

  // Không tìm thấy
  if (!request) {
    return (
      <div className={styles.page}>
        <Alert
          message="Không tìm thấy yêu cầu!"
          description="Yêu cầu này có thể đã bị xóa hoặc không tồn tại."
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/dashboard/purchase-requests/list")}
        >
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const status = statusLabels[request.status] || statusLabels.DRAFT;
  const isPending = request.status === "PENDING";
  const isApproved = request.status === "APPROVED";
  const isRejected = request.status === "REJECTED";

  // Cột bảng vật tư
  const itemColumns = [
    {
      title: "STT",
      width: 70,
      align: "center",
      render: (_, __, i) => i + 1,
    },
    {
      title: "Mã VT",
      dataIndex: ["material", "code"],
      width: 120,
      render: (v) => <strong>{v}</strong>,
    },
    {
      title: "Tên vật tư",
      dataIndex: ["material", "name"],
    },
    {
      title: "Đơn vị",
      dataIndex: ["material", "unit"],
      width: 100,
      align: "center",
      render: (u) => <Tag>{u}</Tag>,
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      width: 120,
      align: "center",
      render: (q) => <strong style={{ fontSize: 15 }}>{q}</strong>,
    },
    {
      title: "Tồn kho hiện tại",
      dataIndex: ["material", "current_stock"],
      width: 150,
      align: "center",
      render: (stock, record) => {
        const isLow = stock < record.quantity;
        return (
          <span
            style={{
              color: isLow ? "#ef4444" : "#16a34a",
              fontWeight: 600,
            }}
          >
            {stock}
          </span>
        );
      },
    },
  ];

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.header}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/dashboard/purchase-requests/list")}
          className={styles.backBtn}
        >
          Quay lại
        </Button>

        <div className={styles.headerMain}>
          <div className={styles.headerIcon}>
            <FileTextOutlined />
          </div>
          <div>
            <h2 className={styles.title}>Chi tiết yêu cầu mua sắm</h2>
            <div className={styles.subtitle}>
              <strong>{request.code}</strong>
              <Tag color={status.color} style={{ marginLeft: 8 }}>
                {status.text}
              </Tag>
            </div>
          </div>
        </div>
      </div>

      {/* THANH TIẾN TRÌNH */}
      <RequestProgress status={request.status} />

      {/* THÔNG BÁO TRẠNG THÁI */}
      {isApproved && (
        <Alert
          message="Yêu cầu đã được duyệt"
          description=""
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      {isRejected && (
        <Alert
          message="Yêu cầu đã bị từ chối"
          description={request.note || "Không có lý do cụ thể."}
          type="error"
          showIcon
          icon={<CloseCircleOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* THÔNG TIN CHUNG */}
      <Card
        title={
          <span className={styles.sectionTitle}>
            <FileTextOutlined className={styles.sectionIcon} />
            Thông tin chung
          </span>
        }
        className={styles.card}
        bordered={false}
      >
        <Descriptions
          column={{ xs: 1, sm: 2 }}
          bordered
          size="middle"
          labelStyle={{
            width: 180,
            background: "#f8fafc",
            fontWeight: 600,
          }}
        >
          <Descriptions.Item label="Mã yêu cầu">
            <strong>{request.code}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={status.color}>{status.text}</Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Đơn vị sử dụng">
            {request.department}
          </Descriptions.Item>
          <Descriptions.Item label="Lý do mua sắm">
            {request.reason}
          </Descriptions.Item>

          <Descriptions.Item label="Ngày yêu cầu">
            {dayjs(request.request_date).format("DD/MM/YYYY")}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày dự kiến cần">
            {dayjs(request.expected_date).format("DD/MM/YYYY")}
          </Descriptions.Item>

          {/* ⭐ NHÀ CUNG CẤP — CÓ LINK */}
          <Descriptions.Item label="Nhà cung cấp">
            {request.supplier?.name ? (
              <span>
                <a
                  onClick={() =>
                    navigate(`/dashboard/suppliers/${request.supplier.id}`)
                  }
                  style={{
                    color: "#1677ff",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  {request.supplier.name}
                </a>
                {request.supplier.tax_code && (
                  <span style={{ color: "#94a3b8", fontSize: 12 }}>
                    {" "}
                    ({request.supplier.tax_code})
                  </span>
                )}
              </span>
            ) : (
              <span style={{ color: "#94a3b8" }}>Chưa chọn</span>
            )}
          </Descriptions.Item>

          <Descriptions.Item label="Người tạo">
            {request.creator?.name || "—"}
          </Descriptions.Item>

          {request.approver && (
            <Descriptions.Item label="Người duyệt">
              {request.approver.name}
            </Descriptions.Item>
          )}
          {request.approved_at && (
            <Descriptions.Item label="Ngày duyệt">
              {dayjs(request.approved_at).format("DD/MM/YYYY HH:mm")}
            </Descriptions.Item>
          )}

          {request.note && (
            <Descriptions.Item label="Ghi chú" span={2}>
              {request.note}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* DANH SÁCH VẬT TƯ */}
      <Card
        title={
          <span className={styles.sectionTitle}>
            <InboxOutlined className={styles.sectionIcon} />
            Danh sách vật tư ({request.items?.length || 0})
          </span>
        }
        className={styles.card}
        bordered={false}
      >
        <Table
          columns={itemColumns}
          dataSource={request.items}
          rowKey="id"
          pagination={false}
          size="middle"
          locale={{ emptyText: "Không có vật tư nào" }}
        />
      </Card>

      {/* NÚT ĐI TỚI DUYỆT */}
      {isPending && (
        <div className={styles.footer}>
          <Button
            type="primary"
            size="large"
            icon={<CheckOutlined />}
            onClick={() =>
              navigate(`/dashboard/purchase-requests/approve/${request.id}`)
            }
          >
            Đi tới duyệt
          </Button>
        </div>
      )}
    </div>
  );
}
