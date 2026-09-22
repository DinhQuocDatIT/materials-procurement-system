import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Button,
  Table,
  Tag,
  Descriptions,
  Spin,
  Alert,
  Modal,
  Input,
  Space,
  Tooltip,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
  FileTextOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  PrinterOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { purchaseRequestService } from "../../services/purchaseRequestService";
import AuthStorage from "../../services/AuthStorage";
import RequestProgress from "./RequestProgress";
import styles from "./RequestDetail.module.css";

const { TextArea } = Input;

const statusLabels = {
  DRAFT: { text: "Nháp", color: "default" },
  PENDING: { text: "Chờ duyệt", color: "orange" },
  APPROVED: { text: "Đã duyệt", color: "green" },
  REJECTED: { text: "Từ chối", color: "red" },
  COMPLETED: { text: "Hoàn tất", color: "blue" },
};

export default function ApproveRequest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = AuthStorage.getUser();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

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

  // ⭐ DUYỆT — KHÔNG TRỪ KHO (YC mua để BỔ SUNG kho)
  const handleApprove = async () => {
    try {
      setSubmitting(true);
      await purchaseRequestService.approve(id, currentUser.id);
      toast.success("Đã duyệt yêu cầu mua hàng!");
      fetchRequest();
    } catch (error) {
      toast.error(error.message, { autoClose: 8000 });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do!");
      return;
    }
    try {
      setSubmitting(true);
      await purchaseRequestService.reject(id, currentUser.id, rejectReason);
      toast.success("Đã từ chối yêu cầu!");
      setIsRejectModalOpen(false);
      setRejectReason("");
      fetchRequest();
    } catch (error) {
      toast.error("Lỗi: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ⭐ CHECK CHỖ CHỨA — không phải tồn kho
  const capacityCheck = useMemo(() => {
    if (!request?.items) return { ok: true, errors: [] };

    const errors = request.items
      .filter((item) => {
        const max = Number(item.material?.max_stock || 0);
        const current = Number(item.material?.current_stock || 0);
        if (max === 0) return false;
        return current + Number(item.quantity || 0) > max;
      })
      .map((item) => {
        const max = Number(item.material?.max_stock || 0);
        const current = Number(item.material?.current_stock || 0);
        const available = Math.max(0, max - current);
        return `"${item.material.name}": tồn ${current} + nhập ${item.quantity} = ${
          current + Number(item.quantity || 0)
        } (max ${max}, còn chỗ ${available})`;
      });

    return { ok: errors.length === 0, errors };
  }, [request]);

  // ⭐ Tổng tiền
  const totalAmount = useMemo(() => {
    if (!request?.items) return 0;
    return request.items.reduce((sum, item) => {
      const price = Number(item.price || 0);
      const qty = Number(item.quantity || 0);
      return sum + price * qty;
    }, 0);
  }, [request]);

  const hasPrice = useMemo(() => {
    if (!request?.items) return false;
    return request.items.some((item) => Number(item.price || 0) > 0);
  }, [request]);

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

  // ==================== CỘT BẢNG VẬT TƯ ====================
  const itemColumns = [
    {
      title: "STT",
      width: 60,
      align: "center",
      render: (_, __, i) => i + 1,
    },
    {
      title: "Mã VT",
      dataIndex: ["material", "code"],
      width: 110,
      render: (v) => <strong className={styles.materialCode}>{v}</strong>,
    },
    {
      title: "Tên vật tư",
      dataIndex: ["material", "name"],
      render: (v) => <span className={styles.materialName}>{v}</span>,
    },
    {
      title: "ĐVT",
      dataIndex: ["material", "unit"],
      width: 80,
      align: "center",
      render: (u) => <Tag>{u}</Tag>,
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      width: 90,
      align: "right",
      render: (q) => <strong>{Number(q || 0).toLocaleString("vi-VN")}</strong>,
    },
    {
      title: "Đơn giá",
      dataIndex: "price",
      width: 130,
      align: "right",
      render: (price) => {
        const p = Number(price || 0);
        if (!p) return <span style={{ color: "#bfbfbf" }}>—</span>;
        return (
          <span style={{ color: "#595959" }}>
            {p.toLocaleString("vi-VN")} đ
          </span>
        );
      },
    },
    {
      title: "Thành tiền",
      key: "total",
      width: 150,
      align: "right",
      render: (_, record) => {
        const price = Number(record.price || 0);
        const qty = Number(record.quantity || 0);
        const total = price * qty;
        if (!price) return <span style={{ color: "#bfbfbf" }}>—</span>;
        return (
          <strong style={{ color: "#1677ff" }}>
            {total.toLocaleString("vi-VN")} đ
          </strong>
        );
      },
    },
    {
      title: "Tồn kho",
      dataIndex: ["material", "current_stock"],
      width: 100,
      align: "right",
      render: (stock) => (
        <span style={{ color: "#595959" }}>
          {Number(stock || 0).toLocaleString("vi-VN")}
        </span>
      ),
    },
    {
      title: "Còn chỗ",
      key: "available_space",
      width: 90,
      align: "right",
      render: (_, record) => {
        const max = Number(record.material?.max_stock || 0);
        const current = Number(record.material?.current_stock || 0);

        if (max === 0) {
          return (
            <Tooltip title="Không giới hạn">
              <span
                style={{
                  color: "#8c8c8c",
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: "help",
                }}
              >
                ∞
              </span>
            </Tooltip>
          );
        }

        const available = Math.max(0, max - current);
        return (
          <span
            style={{
              color: available > 0 ? "#16a34a" : "#ef4444",
              fontWeight: 600,
            }}
          >
            {available.toLocaleString("vi-VN")}
          </span>
        );
      },
    },
  ];

  // ⭐ Summary row
  const renderSummary = () => {
    if (!hasPrice) return null;
    const totalCols = itemColumns.length;

    return (
      <Table.Summary fixed>
        <Table.Summary.Row className={styles.summaryRow}>
          <Table.Summary.Cell index={0} colSpan={totalCols}>
            <div className={styles.summaryInner}>
              <span className={styles.summaryLabel}>Tổng cộng: </span>
              <span className={styles.summaryValue}>
                {totalAmount.toLocaleString("vi-VN")} đ
              </span>
            </div>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      </Table.Summary>
    );
  };

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.header}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/dashboard/purchase-requests/list")}
            className={styles.backBtn}
          >
            Quay lại
          </Button>

          {/* <Space>
            <Button icon={<PrinterOutlined />}>In</Button>
            <Button icon={<MoreOutlined />} />
          </Space> */}
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

      {/* ⭐ CẢNH BÁO CHỖ CHỨA */}
      {isPending && !capacityCheck.ok && (
        <Alert
          message="Vượt chỗ chứa — Không thể duyệt!"
          description={
            <div>
              <p style={{ marginBottom: 8 }}>
                Sau khi nhập hàng, một số vật tư sẽ vượt quá sức chứa
                (max_stock):
              </p>
              <ul style={{ margin: "0", paddingLeft: 20 }}>
                {capacityCheck.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
              <p style={{ marginTop: 8, color: "#faad14", fontWeight: 600 }}>
                💡 Vui lòng giảm số lượng hoặc chọn NCC khác.
              </p>
            </div>
          }
          type="error"
          showIcon
          icon={<WarningOutlined />}
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

          {hasPrice && (
            <Descriptions.Item label="Tổng chi phí dự kiến" span={2}>
              <span style={{ color: "#1677ff", fontWeight: 700, fontSize: 15 }}>
                {totalAmount.toLocaleString("vi-VN")} đ
              </span>
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
          className={styles.mainTable}
          summary={renderSummary}
        />
      </Card>

      {/* FOOTER */}
      {isPending && (
        <div className={styles.footer}>
          <Space>
            <Button
              danger
              size="large"
              icon={<CloseOutlined />}
              onClick={() => setIsRejectModalOpen(true)}
              disabled={submitting}
            >
              Từ chối
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<CheckOutlined />}
              onClick={handleApprove}
              loading={submitting}
              disabled={!capacityCheck.ok}
            >
              {capacityCheck.ok ? "Duyệt yêu cầu" : "Vượt chỗ chứa"}
            </Button>
          </Space>
        </div>
      )}

      {/* REJECT MODAL */}
      <Modal
        title="Từ chối yêu cầu"
        open={isRejectModalOpen}
        onOk={handleReject}
        onCancel={() => {
          setIsRejectModalOpen(false);
          setRejectReason("");
        }}
        okText="Xác nhận từ chối"
        cancelText="Hủy"
        okButtonProps={{ danger: true, loading: submitting }}
      >
        <p>Lý do từ chối:</p>
        <TextArea
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="VD: Vượt ngân sách, NCC không đủ uy tín..."
        />
      </Modal>
    </div>
  );
}
