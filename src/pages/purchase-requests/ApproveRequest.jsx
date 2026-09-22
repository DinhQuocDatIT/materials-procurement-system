import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Table,
  Tag,
  Modal,
  Input,
  Alert,
  Spin,
  Space,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  ArrowLeftOutlined,
  WarningOutlined,
  FileTextOutlined,
  InboxOutlined,
  PrinterOutlined,
  MoreOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  CalendarOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { purchaseRequestService } from "../../services/purchaseRequestService";
import AuthStorage from "../../services/AuthStorage";
import RequestProgress from "./RequestProgress";
import styles from "./ApproveRequest.module.css";

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

  const handleApprove = async () => {
    try {
      setSubmitting(true);
      await purchaseRequestService.approve(id, currentUser.id);
      toast.success("Đã duyệt và trừ tồn kho!");
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

  const checkStock = () => {
    if (!request?.items) return { ok: true, errors: [] };
    const errors = request.items
      .filter((item) => item.material.current_stock < item.quantity)
      .map(
        (item) =>
          `"${item.material.name}": kho còn ${item.material.current_stock} / cần ${item.quantity}`,
      );
    return { ok: errors.length === 0, errors };
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spin size="large" />
      </div>
    );
  }

  if (!request) return <div>Không tìm thấy yêu cầu!</div>;

  const status = statusLabels[request.status] || statusLabels.DRAFT;
  const stockCheck = checkStock();
  const isPending = request.status === "PENDING";

  // ==================== TABLE VẬT TƯ ====================
  const itemColumns = [
    {
      title: "STT",
      width: 70,
      align: "center",
      render: (_, __, i) => i + 1,
    },
    {
      title: "Mã vật tư",
      dataIndex: ["material", "code"],
      width: 120,
      render: (v) => <strong className={styles.codeText}>{v}</strong>,
    },
    {
      title: "Tên vật tư",
      dataIndex: ["material", "name"],
      render: (v) => <span className={styles.nameText}>{v}</span>,
    },
    {
      title: "ĐVT",
      dataIndex: ["material", "unit"],
      width: 90,
      align: "center",
      render: (u) => <Tag>{u}</Tag>,
    },
    {
      title: "SL yêu cầu",
      dataIndex: "quantity",
      width: 120,
      align: "center",
      render: (q) => (
        <strong style={{ fontSize: 15, color: "#1677ff" }}>{q}</strong>
      ),
    },
    {
      title: "Tồn kho",
      dataIndex: ["material", "current_stock"],
      width: 120,
      align: "center",
      render: (stock, record) => {
        const isLow = stock < record.quantity;
        return (
          <span
            style={{
              color: isLow ? "#ef4444" : "#16a34a",
              fontWeight: 700,
            }}
          >
            {stock}
          </span>
        );
      },
    },
    {
      title: "Sau khi duyệt",
      width: 140,
      align: "center",
      render: (_, record) => {
        const remaining = record.material.current_stock - record.quantity;
        return (
          <span
            style={{
              color: remaining < 0 ? "#ef4444" : "#64748b",
              fontWeight: 600,
            }}
          >
            {remaining < 0 ? "Âm" : remaining}
          </span>
        );
      },
    },
  ];

  // ==================== INFO ITEMS ====================
  const infoItems = [
    request.supplier?.name && {
      icon: <ShopOutlined />,
      label: "Nhà cung cấp",
      value: request.supplier.name,
      subValue: request.supplier.tax_code
        ? `MST: ${request.supplier.tax_code}`
        : null,
      highlight: "blue",
      // ⭐ LINK tới trang chi tiết NCC — dùng ID
      link: {
        text: "Xem thông tin nhà cung cấp",
        onClick: () => navigate(`/dashboard/suppliers/${request.supplier.id}`),
      },
    },
    request.request_date && {
      icon: <CalendarOutlined />,
      label: "Ngày yêu cầu",
      value: dayjs(request.request_date).format("DD/MM/YYYY"),
    },
    request.expected_date && {
      icon: <ClockCircleOutlined />,
      label: "Ngày dự kiến cần",
      value: dayjs(request.expected_date).format("DD/MM/YYYY"),
    },
    request.status && {
      icon: <FileTextOutlined />,
      label: "Trạng thái",
      value: status.text,
      highlight:
        request.status === "APPROVED"
          ? "green"
          : request.status === "REJECTED"
            ? "red"
            : request.status === "PENDING"
              ? "orange"
              : "gray",
    },
    request.creator?.name && {
      icon: <TeamOutlined />,
      label: "Người tạo",
      value: request.creator.name,
    },
    request.department && {
      icon: <ShopOutlined />,
      label: "Đơn vị sử dụng",
      value: request.department,
    },
    request.reason && {
      icon: <FileTextOutlined />,
      label: "Lý do mua sắm",
      value: request.reason,
    },
  ].filter(Boolean);

  return (
    <div className={styles.page}>
      {/* ==================== BREADCRUMB ==================== */}
  

      {/* ==================== PAGE HEADER ==================== */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/dashboard/purchase-requests/list")}
            type="text"
            className={styles.backBtn}
          >
            Quay lại
          </Button>
        </div>

        <Space>
          <Button icon={<PrinterOutlined />}>In</Button>
          <Button icon={<MoreOutlined />} />
        </Space>
      </div>

      {/* ==================== TITLE + STATUS ==================== */}
      <div className={styles.titleBlock}>
        <h1 className={styles.pageTitle}>Duyệt yêu cầu {request.code}</h1>
        <Tag color={status.color} className={styles.statusBadge}>
          {status.text}
        </Tag>
      </div>

      {/* ==================== TIẾN TRÌNH ==================== */}
      <RequestProgress status={request.status} />

      {/* ==================== INFO CARD ==================== */}
      <Card className={styles.infoCard} bordered={false}>
        <div className={styles.infoGrid}>
          {infoItems.map((item, idx) => (
            <div key={idx} className={styles.infoItem}>
              <div className={styles.infoLabel}>
                <span className={styles.infoLabelIcon}>{item.icon}</span>
                {item.label}
              </div>
              <div
                className={`${styles.infoValue} ${
                  item.highlight === "blue"
                    ? styles.valueBlue
                    : item.highlight === "green"
                      ? styles.valueGreen
                      : item.highlight === "orange"
                        ? styles.valueOrange
                        : item.highlight === "red"
                          ? styles.valueRed
                          : ""
                }`}
              >
                {item.value}
              </div>
              {item.subValue && (
                <div className={styles.infoSub}>{item.subValue}</div>
              )}

              {/* ⭐ LINK */}
              {item.link && (
                <button
                  type="button"
                  className={styles.infoLink}
                  onClick={item.link.onClick}
                >
                  {item.link.text}
                  <span className={styles.infoLinkArrow}>→</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* ==================== ALERTS ==================== */}
      {isPending && !stockCheck.ok && (
        <Alert
          message="Không đủ tồn kho để duyệt!"
          description={
            <ul style={{ margin: "8px 0 0 0", paddingLeft: 20 }}>
              {stockCheck.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          }
          type="error"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 20 }}
        />
      )}

      {isPending && stockCheck.ok && (
        <Alert
          message="Đủ tồn kho — Có thể duyệt"
          description="Khi duyệt, hệ thống sẽ tự động trừ tồn kho."
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          style={{ marginBottom: 20 }}
        />
      )}

      {/* ==================== BẢNG VẬT TƯ ==================== */}
      <Card
        title={
          <span className={styles.sectionTitle}>
            <InboxOutlined className={styles.sectionIcon} />
            Danh sách vật tư ({request.items?.length || 0})
          </span>
        }
        className={styles.tableCard}
        bordered={false}
      >
        <Table
          columns={itemColumns}
          dataSource={request.items}
          rowKey="id"
          pagination={false}
          size="middle"
          scroll={{ x: 900 }}
          locale={{ emptyText: "Không có vật tư nào" }}
        />
      </Card>

      {/* ==================== NOTE ==================== */}
      {request.note && (
        <Card className={styles.noteCard} bordered={false}>
          <div className={styles.noteHeader}>
            <FileTextOutlined className={styles.noteIcon} />
            <span className={styles.noteLabel}>Ghi chú</span>
          </div>
          <div className={styles.noteContent}>{request.note}</div>
        </Card>
      )}

      {/* ==================== FOOTER ==================== */}
      <div className={styles.footer}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/dashboard/purchase-requests/list")}
          size="large"
        >
          Quay lại danh sách
        </Button>

        {isPending && (
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
              disabled={!stockCheck.ok}
            >
              {stockCheck.ok ? "Duyệt" : "Không đủ tồn kho"}
            </Button>
          </Space>
        )}
      </div>

      {/* ==================== REJECT MODAL ==================== */}
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
          placeholder="VD: Đã có sẵn trong kho..."
        />
      </Modal>
    </div>
  );
}
