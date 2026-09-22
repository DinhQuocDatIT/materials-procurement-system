import React, { useEffect, useMemo, useState } from "react";
import {
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Card,
  Table,
  InputNumber,
  Modal,
  Row,
  Col,
  Tag,
  Empty,
  Tooltip,
  Spin,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  SendOutlined,
  SearchOutlined,
  ArrowLeftOutlined,
  FileTextOutlined,
  ShoppingOutlined,
  TeamOutlined,
  SwapOutlined,
  CloseOutlined,
  CheckOutlined,
  InboxOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";

import { materialService } from "../../services/materialService";
import { supplierService } from "../../services/supplierService";
import { purchaseRequestService } from "../../services/purchaseRequestService";
import AuthStorage from "../../services/AuthStorage";

import styles from "./CreateRequest.module.css";

const { TextArea } = Input;

const departments = [
  "Tàu Trường Sa",
  "Tàu Hoàng Sa",
  "Phòng Kỹ thuật",
  "Phòng Sản xuất",
  "Phòng Bảo trì",
];

const reasons = [
  "Bảo dưỡng định kỳ",
  "Sửa chữa đột xuất",
  "Thay thế thiết bị hỏng",
  "Bổ sung tồn kho",
  "Dự án mới",
];

const supplierStatusLabels = {
  PRIORITY: { text: "Ưu tiên", className: "statusPriority" },
  GOOD: { text: "Tốt", className: "statusGood" },
  AVERAGE: { text: "Trung bình", className: "statusAverage" },
  REVIEW: { text: "Cần xem xét", className: "statusReview" },
  POOR: { text: "Hạn chế", className: "statusPoor" },
};

const rankLabels = { A: "A", B: "B", C: "C" };

const getSupplierRank = (supplier) => {
  if (supplier?.rank) return supplier.rank;
  const rating = Number(supplier?.rating || 0);
  if (rating >= 4.5) return "A";
  if (rating >= 3.5) return "B";
  return "C";
};

const getSupplierStatus = (supplier) => supplier?.status || "AVERAGE";

const getSupplierStatusInfo = (supplier) => {
  const status = getSupplierStatus(supplier);
  return (
    supplierStatusLabels[status] || {
      text: status,
      className: "statusAverage",
    }
  );
};

const formatRating = (rating) => Number(rating || 0).toFixed(1);

const EditRequest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [materials, setMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [requestItems, setRequestItems] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // Modal
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [materialSearch, setMaterialSearch] = useState("");
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierField, setSupplierField] = useState(undefined);
  const [supplierRank, setSupplierRank] = useState(undefined);
  const [supplierStatus, setSupplierStatus] = useState(undefined);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [materialRes, supplierRes, requestData] = await Promise.all([
        materialService.getAll(),
        supplierService.getAll(),
        purchaseRequestService.getById(id),
      ]);

      setMaterials(materialRes?.data || materialRes || []);
      setSuppliers(supplierRes?.data || supplierRes || []);

      // Check status
      if (requestData.status !== "DRAFT") {
        toast.error("Chỉ sửa được yêu cầu ở trạng thái Nháp!");
        navigate("/dashboard/purchase-requests/list");
        return;
      }

      // Fill form
      form.setFieldsValue({
        code: requestData.code,
        request_date: requestData.request_date
          ? dayjs(requestData.request_date)
          : dayjs(),
        expected_date: requestData.expected_date
          ? dayjs(requestData.expected_date)
          : null,
        department: requestData.department,
        reason: requestData.reason,
        supplier_id: requestData.supplier_id,
        note: requestData.note,
      });

      // Fill items
      const items = (requestData.items || []).map((item) => ({
        key: item.material_id,
        material_id: item.material_id,
        material_code: item.material?.code,
        material_name: item.material?.name,
        unit: item.material?.unit,
        quantity: item.quantity,
        stock_quantity: item.material?.current_stock ?? 0,
      }));
      setRequestItems(items);

      // Fill supplier
      if (requestData.supplier) {
        setSelectedSupplier(requestData.supplier);
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi tải dữ liệu: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // MATERIAL
  // =========================

  const handleAddMaterial = (material) => {
    if (!material?.id) return;

    const exists = requestItems.some(
      (item) => item.material_id === material.id,
    );

    if (exists) {
      toast.warning("Vật tư này đã được thêm vào yêu cầu");
      return;
    }

    const stockQty =
      material.current_stock ??
      material.stock_quantity ??
      material.stock ??
      material.quantity ??
      0;

    const newItem = {
      key: material.id,
      material_id: material.id,
      material_code: material.code,
      material_name: material.name,
      unit: material.unit,
      quantity: 1,
      stock_quantity: stockQty,
    };

    setRequestItems((prev) => [...prev, newItem]);
    setIsMaterialModalOpen(false);
    setMaterialSearch("");

    if (stockQty === 0) {
      toast.warning(`"${material.name}" đã hết hàng trong kho!`);
    } else {
      toast.success("Đã thêm vật tư");
    }
  };

  const handleQuantityChange = (materialId, value) => {
    const safeValue = Math.max(1, Math.floor(Number(value) || 1));

    setRequestItems((prev) =>
      prev.map((item) =>
        item.material_id === materialId
          ? { ...item, quantity: safeValue }
          : item,
      ),
    );
  };

  const handleRemoveMaterial = (materialId) => {
    setRequestItems((prev) =>
      prev.filter((item) => item.material_id !== materialId),
    );
  };

  const filteredMaterials = useMemo(() => {
    const keyword = materialSearch.trim().toLowerCase();
    if (!keyword) return materials;

    return materials.filter((material) => {
      const code = String(material?.code || "").toLowerCase();
      const name = String(material?.name || "").toLowerCase();
      return code.includes(keyword) || name.includes(keyword);
    });
  }, [materials, materialSearch]);

  // =========================
  // SUPPLIER
  // =========================

  const openSupplierModal = () => {
    setSupplierSearch("");
    setSupplierField(undefined);
    setSupplierRank(undefined);
    setSupplierStatus(undefined);
    setIsSupplierModalOpen(true);
  };

  const handleSelectSupplier = (supplier) => {
    if (!supplier) return;

    setSelectedSupplier(supplier);
    form.setFieldValue("supplier_id", supplier.id);
    setIsSupplierModalOpen(false);
    toast.success(`Đã chọn nhà cung cấp "${supplier.name}"`);
  };

  const handleClearSupplier = () => {
    setSelectedSupplier(null);
    form.setFieldValue("supplier_id", null);
  };

  const handleResetSupplierFilters = () => {
    setSupplierSearch("");
    setSupplierField(undefined);
    setSupplierRank(undefined);
    setSupplierStatus(undefined);
  };

  const filteredSuppliers = useMemo(() => {
    const keyword = supplierSearch.trim().toLowerCase();

    return suppliers.filter((supplier) => {
      const name = String(supplier?.name || "").toLowerCase();
      const taxCode = String(supplier?.tax_code || "").toLowerCase();
      const field = String(supplier?.field || "").toLowerCase();

      const matchesSearch =
        !keyword ||
        name.includes(keyword) ||
        taxCode.includes(keyword) ||
        field.includes(keyword);

      const rank = getSupplierRank(supplier);
      const status = getSupplierStatus(supplier);

      const matchesField = !supplierField || supplier?.field === supplierField;
      const matchesRank = !supplierRank || rank === supplierRank;
      const matchesStatus = !supplierStatus || status === supplierStatus;

      return matchesSearch && matchesField && matchesRank && matchesStatus;
    });
  }, [suppliers, supplierSearch, supplierField, supplierRank, supplierStatus]);

  // =========================
  // SAVE
  // =========================

  const handleSave = async (status = "DRAFT") => {
    try {
      const values = await form.validateFields();
      const currentUser = AuthStorage.getUser?.();

      if (!currentUser?.id) {
        toast.error("Không xác định được người dùng hiện tại");
        return;
      }

      if (requestItems.length === 0) {
        toast.warning("Vui lòng thêm ít nhất một vật tư");
        return;
      }

      const invalidQty = requestItems.find(
        (item) => !item.quantity || item.quantity < 1,
      );
      if (invalidQty) {
        toast.error(`"${invalidQty.material_name}" có số lượng không hợp lệ`);
        return;
      }

      const overStock = requestItems.filter(
        (item) => item.quantity > item.stock_quantity,
      );
      if (overStock.length > 0) {
        const totalShortage = overStock.reduce(
          (sum, item) => sum + (item.quantity - item.stock_quantity),
          0,
        );
        toast.info(
          `Có ${overStock.length} vật tư vượt tồn kho (thiếu ${totalShortage.toLocaleString(
            "vi-VN",
          )} đơn vị).`,
          { autoClose: 5000 },
        );
      }

      if (status === "PENDING" && !values.supplier_id) {
        toast.warning("Vui lòng chọn nhà cung cấp trước khi gửi yêu cầu");
        return;
      }

      // Confirm khi GỬI DUYỆT
      if (status === "PENDING") {
        Modal.confirm({
          title: "Xác nhận gửi yêu cầu mua hàng?",
          icon: <ExclamationCircleOutlined style={{ color: "#faad14" }} />,
          content: (
            <div>
              <p>
                Bạn có chắc chắn muốn <strong>GỬI YÊU CẦU</strong> này không?
              </p>
              <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                <li>
                  <strong>Số vật tư:</strong> {requestItems.length}
                </li>
                <li>
                  <strong>Nhà cung cấp:</strong>{" "}
                  {selectedSupplier?.name || "Chưa chọn"}
                </li>
                <li>
                  <strong>Ngày cần hàng:</strong>{" "}
                  {values.expected_date?.format("DD/MM/YYYY")}
                </li>
              </ul>
              <p
                style={{
                  color: "#faad14",
                  fontWeight: 600,
                  marginTop: 12,
                }}
              >
                ⚠️ Sau khi gửi, yêu cầu sẽ chờ quản lý phê duyệt.
              </p>
            </div>
          ),
          okText: "Xác nhận gửi",
          cancelText: "Hủy",
          okButtonProps: {
            style: { background: "#1677ff", borderColor: "#1677ff" },
          },
          onOk: async () => {
            await doSave(status, values, currentUser);
          },
        });
        return;
      }

      // Lưu nháp → lưu luôn
      await doSave(status, values, currentUser);
    } catch (error) {
      console.error(error);

      if (error?.errorFields) {
        toast.warning("Vui lòng kiểm tra lại các thông tin bắt buộc");
      } else {
        toast.error(
          error?.response?.data?.message || "Có lỗi xảy ra khi lưu yêu cầu",
        );
      }
    }
  };

  const doSave = async (status, values, currentUser) => {
    try {
      setSubmitting(true);

      const requestData = {
        code: values.code,
        request_date: values.request_date
          ? values.request_date.format("YYYY-MM-DD")
          : null,
        expected_date: values.expected_date
          ? values.expected_date.format("YYYY-MM-DD")
          : null,
        department: values.department,
        reason: values.reason,
        supplier_id: values.supplier_id || null,
        note: values.note || null,
        created_by: currentUser.id,
        status,
      };

      // UPDATE thay vì CREATE
      await purchaseRequestService.update(id, requestData, requestItems);

      toast.success(
        status === "PENDING"
          ? "Đã gửi yêu cầu mua hàng"
          : "Đã lưu yêu cầu mua hàng",
      );

      navigate("/dashboard/purchase-requests/list");
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message || "Có lỗi xảy ra khi lưu yêu cầu",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================
  // TABLE
  // =========================

  const materialColumns = [
    {
      title: "STT",
      key: "index",
      width: 70,
      align: "center",
      render: (_, __, index) => (
        <span className={styles.indexNumber}>{index + 1}</span>
      ),
    },
    {
      title: "Mã vật tư",
      dataIndex: "material_code",
      key: "material_code",
      width: 150,
      render: (value) => (
        <span className={styles.materialCode}>{value || "-"}</span>
      ),
    },
    {
      title: "Tên vật tư",
      dataIndex: "material_name",
      key: "material_name",
      render: (value) => (
        <span className={styles.materialName}>{value || "-"}</span>
      ),
    },
    {
      title: "Đơn vị",
      dataIndex: "unit",
      key: "unit",
      width: 100,
      render: (value) => value || "-",
    },
    {
      title: "Tồn kho",
      dataIndex: "stock_quantity",
      key: "stock_quantity",
      width: 140,
      align: "right",
      render: (value, record) => {
        const isOver = record.quantity > value;
        const shortage = isOver ? record.quantity - value : 0;

        return (
          <div style={{ textAlign: "right", lineHeight: 1.3 }}>
            <span className={styles.stockValue}>
              {Number(value || 0).toLocaleString("vi-VN")}
            </span>
            {isOver && (
              <div
                style={{
                  color: "#faad14",
                  fontSize: 11,
                  marginTop: 2,
                  fontWeight: 600,
                }}
              >
                <WarningOutlined /> Thiếu {shortage.toLocaleString("vi-VN")}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Số lượng yêu cầu",
      dataIndex: "quantity",
      key: "quantity",
      width: 170,
      render: (_, record) => (
        <InputNumber
          min={1}
          max={100000}
          precision={0}
          value={record.quantity}
          onChange={(value) => handleQuantityChange(record.material_id, value)}
          className={styles.quantityInput}
          status={record.quantity > record.stock_quantity ? "warning" : ""}
        />
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 90,
      align: "center",
      render: (_, record) => (
        <Tooltip title="Xóa vật tư">
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleRemoveMaterial(record.material_id)}
          />
        </Tooltip>
      ),
    },
  ];

  const supplierColumns = [
    {
      title: "Nhà cung cấp",
      key: "supplier",
      width: 240,
      render: (_, record) => (
        <div className={styles.supplierTableName}>
          <div className={styles.supplierTableAvatar}>
            {String(record?.name || "?")
              .trim()
              .charAt(0)
              .toUpperCase()}
          </div>
          <div className={styles.supplierTableInfo}>
            <div className={styles.supplierTableTitle}>
              {record?.name || "Chưa có tên"}
            </div>
            <div className={styles.supplierTaxCode}>
              MST: {record?.tax_code || "Chưa cập nhật"}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Lĩnh vực",
      dataIndex: "field",
      key: "field",
      width: 170,
      render: (value) => (
        <Tag className={styles.fieldTag}>{value || "Chưa cập nhật"}</Tag>
      ),
    },
    {
      title: "HĐ",
      dataIndex: "contract_count",
      key: "contract_count",
      width: 70,
      align: "center",
      render: (value) => (
        <span className={styles.contractCount}>
          {Number(value || 0).toLocaleString("vi-VN")}
        </span>
      ),
    },
    {
      title: "Đánh giá",
      dataIndex: "rating",
      key: "rating",
      width: 100,
      align: "center",
      render: (value) => (
        <div className={styles.ratingCell}>
          <span className={styles.ratingStar}>★</span>
          <span>{formatRating(value)}</span>
        </div>
      ),
    },
    {
      title: "Hạng",
      key: "rank",
      width: 80,
      align: "center",
      render: (_, record) => {
        const rank = getSupplierRank(record);
        return (
          <span
            className={`${styles.rankBadge} ${styles[`rank${rank}`] || ""}`}
          >
            {rankLabels[rank] || rank}
          </span>
        );
      },
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 130,
      render: (_, record) => {
        const statusInfo = getSupplierStatusInfo(record);
        return (
          <span
            className={`${styles.statusBadge} ${
              styles[statusInfo.className] || ""
            }`}
          >
            {statusInfo.text}
          </span>
        );
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      align: "center",
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<CheckOutlined />}
          onClick={(event) => {
            event.stopPropagation();
            handleSelectSupplier(record);
          }}
        >
          Chọn
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/dashboard/purchase-requests/list")}
            className={styles.backButton}
          >
            Quay lại
          </Button>
          
        </div>

        {/* Header */}
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderLeft}>
            <div className={styles.pageHeaderIcon}>
              <FileTextOutlined />
            </div>
            <div>
              <h1>Sửa yêu cầu mua hàng</h1>
              <p>Cập nhật thông tin yêu cầu</p>
            </div>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          className={styles.form}
        >
          {/* THÔNG TIN */}
          <Card className={styles.card} bordered={false}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderIcon}>
                <FileTextOutlined />
              </div>
              <div>
                <h2>Thông tin yêu cầu</h2>
                <p>Thông tin cơ bản của yêu cầu mua hàng</p>
              </div>
            </div>

            <div className={styles.divider} />

            <Row gutter={[20, 0]}>
              <Col xs={24} md={8}>
                <Form.Item
                  label="Mã yêu cầu"
                  name="code"
                  rules={[{ required: true }]}
                >
                  <Input readOnly className={styles.readOnlyInput} />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item label="Ngày yêu cầu">
                  <DatePicker
                    format="DD/MM/YYYY"
                    style={{ width: "100%" }}
                    disabled
                  />
                  <Form.Item name="request_date" hidden noStyle>
                    <Input />
                  </Form.Item>
                </Form.Item>
              </Col>

              {/* ⭐ NGÀY CẦN HÀNG — VALIDATE CHUẨN */}
              <Col xs={24} md={8}>
                <Form.Item
                  label="Ngày cần hàng"
                  name="expected_date"
                  rules={[
                    { required: true, message: "Vui lòng chọn ngày cần hàng" },
                    {
                      validator: (_, value) => {
                        if (!value) return Promise.resolve();

                        const today = dayjs().startOf("day");
                        if (value.isBefore(today, "day")) {
                          return Promise.reject(
                            new Error("Ngày cần hàng không được ở quá khứ!"),
                          );
                        }

                        const requestDate = form.getFieldValue("request_date");
                        if (requestDate && value.isBefore(requestDate, "day")) {
                          return Promise.reject(
                            new Error(
                              "Ngày cần hàng phải sau hoặc bằng Ngày yêu cầu!",
                            ),
                          );
                        }

                        return Promise.resolve();
                      },
                    },
                  ]}
                  validateTrigger={["onChange", "onBlur"]}
                >
                  <DatePicker
                    format="DD/MM/YYYY"
                    style={{ width: "100%" }}
                    placeholder="Chọn ngày cần hàng"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Đơn vị / Bộ phận"
                  name="department"
                  rules={[{ required: true }]}
                >
                  <Select
                    placeholder="Chọn đơn vị"
                    options={departments.map((item) => ({
                      value: item,
                      label: item,
                    }))}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Lý do mua hàng"
                  name="reason"
                  rules={[{ required: true }]}
                >
                  <Select
                    placeholder="Chọn lý do"
                    options={reasons.map((item) => ({
                      value: item,
                      label: item,
                    }))}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* NCC */}
          <Card className={styles.card} bordered={false}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderIcon}>
                <TeamOutlined />
              </div>
              <div>
                <h2>Nhà cung cấp</h2>
                <p>Chọn nhà cung cấp phù hợp</p>
              </div>
            </div>

            <div className={styles.divider} />

            <Form.Item name="supplier_id" hidden>
              <Input />
            </Form.Item>

            {!selectedSupplier ? (
              <button
                type="button"
                className={styles.supplierPicker}
                onClick={openSupplierModal}
              >
                <div className={styles.supplierPickerIcon}>
                  <TeamOutlined />
                </div>
                <div className={styles.supplierPickerContent}>
                  <strong>Chọn nhà cung cấp</strong>
                  <span>Xem danh sách NCC trước khi lựa chọn</span>
                </div>
                <SwapOutlined className={styles.supplierPickerArrow} />
              </button>
            ) : (
              <div className={styles.selectedSupplier}>
                <div className={styles.selectedSupplierMain}>
                  <div className={styles.selectedSupplierAvatar}>
                    {String(selectedSupplier?.name || "?")
                      .trim()
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div className={styles.selectedSupplierInfo}>
                    <div className={styles.selectedSupplierTitle}>
                      {selectedSupplier?.name}
                    </div>
                    <div className={styles.selectedSupplierTax}>
                      MST: {selectedSupplier?.tax_code || "Chưa cập nhật"}
                    </div>
                    <div className={styles.selectedSupplierMeta}>
                      <span>
                        {selectedSupplier?.field || "Chưa cập nhật lĩnh vực"}
                      </span>
                      <span className={styles.metaDot}>•</span>
                      <span>
                        {Number(
                          selectedSupplier?.contract_count || 0,
                        ).toLocaleString("vi-VN")}{" "}
                        hợp đồng
                      </span>
                      <span className={styles.metaDot}>•</span>
                      <span className={styles.selectedRating}>
                        ★ {formatRating(selectedSupplier?.rating)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.selectedSupplierStatus}>
                    {(() => {
                      const statusInfo =
                        getSupplierStatusInfo(selectedSupplier);
                      return (
                        <span
                          className={`${styles.statusBadge} ${
                            styles[statusInfo.className] || ""
                          }`}
                        >
                          {statusInfo.text}
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <div className={styles.selectedSupplierActions}>
                  <Button icon={<SwapOutlined />} onClick={openSupplierModal}>
                    Đổi NCC
                  </Button>
                  <Button
                    danger
                    icon={<CloseOutlined />}
                    onClick={handleClearSupplier}
                  >
                    Xóa
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* VẬT TƯ */}
          <Card className={styles.card} bordered={false}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderIcon}>
                <ShoppingOutlined />
              </div>
              <div className={styles.cardHeaderContent}>
                <div>
                  <h2>Danh sách vật tư</h2>
                  <p>Thêm các vật tư cần mua vào yêu cầu</p>
                </div>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setIsMaterialModalOpen(true)}
                >
                  Thêm vật tư
                </Button>
              </div>
            </div>

            <div className={styles.divider} />

            {requestItems.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <InboxOutlined />
                </div>
                <h3>Chưa có vật tư</h3>
                <p>Hãy thêm vật tư để bắt đầu</p>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setIsMaterialModalOpen(true)}
                >
                  Thêm vật tư
                </Button>
              </div>
            ) : (
              <div className={styles.tableWrapper}>
                <Table
                  rowKey="material_id"
                  columns={materialColumns}
                  dataSource={requestItems}
                  pagination={false}
                  size="middle"
                  scroll={{ x: 900 }}
                  className={styles.mainTable}
                />
              </div>
            )}
          </Card>

          {/* GHI CHÚ */}
          <Card className={styles.card} bordered={false}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderIcon}>
                <FileTextOutlined />
              </div>
              <div>
                <h2>Ghi chú</h2>
                <p>Thông tin bổ sung</p>
              </div>
            </div>
            <div className={styles.divider} />
            <Form.Item name="note" style={{ marginBottom: 0 }}>
              <TextArea rows={4} placeholder="Nhập ghi chú..." />
            </Form.Item>
          </Card>
        </Form>
      </div>

      {/* FOOTER */}
      <div className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerSummary}>
            <span className={styles.footerDot} />
            <span>{requestItems.length} loại vật tư</span>
            {selectedSupplier && (
              <>
                <span className={styles.footerSeparator}>•</span>
                <span className={styles.footerSupplier}>
                  NCC: {selectedSupplier.name}
                </span>
              </>
            )}
          </div>

          <div className={styles.footerActions}>
            <Button
              onClick={() => navigate("/dashboard/purchase-requests/list")}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button
              icon={<SaveOutlined />}
              loading={submitting}
              onClick={() => handleSave("DRAFT")}
            >
              Lưu nháp
            </Button>
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={submitting}
              onClick={() => handleSave("PENDING")}
            >
              Gửi duyệt
            </Button>
          </div>
        </div>
      </div>

      {/* MODAL VẬT TƯ */}
      <Modal
        title="Chọn vật tư"
        open={isMaterialModalOpen}
        onCancel={() => {
          setIsMaterialModalOpen(false);
          setMaterialSearch("");
        }}
        footer={null}
        width={1000}
        getContainer={false}
      >
        <Input
          prefix={<SearchOutlined />}
          placeholder="Tìm vật tư..."
          value={materialSearch}
          onChange={(e) => setMaterialSearch(e.target.value)}
          allowClear
          size="large"
          style={{ marginBottom: 16 }}
        />

        <Table
          rowKey="id"
          loading={loading}
          dataSource={filteredMaterials}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          scroll={{ x: 750 }}
          onRow={(record) => ({
            onClick: () => handleAddMaterial(record),
            style: { cursor: "pointer" },
          })}
          columns={[
            { title: "Mã", dataIndex: "code", width: 150 },
            { title: "Tên vật tư", dataIndex: "name" },
            { title: "ĐVT", dataIndex: "unit", width: 100 },
            {
              title: "Tồn kho",
              key: "stock",
              width: 120,
              align: "right",
              render: (_, r) =>
                Number(
                  r?.current_stock ?? r?.stock_quantity ?? 0,
                ).toLocaleString("vi-VN"),
            },
          ]}
        />
      </Modal>

      {/* MODAL NCC */}
      <Modal
        title="Chọn nhà cung cấp"
        open={isSupplierModalOpen}
        onCancel={() => setIsSupplierModalOpen(false)}
        footer={null}
        width={1100}
        getContainer={false}
      >
        <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Tìm NCC..."
            value={supplierSearch}
            onChange={(e) => setSupplierSearch(e.target.value)}
            allowClear
            style={{ flex: 1 }}
          />
          <Button onClick={handleResetSupplierFilters}>Xóa lọc</Button>
        </div>

        <Table
          rowKey="id"
          dataSource={filteredSuppliers}
          columns={supplierColumns}
          pagination={{ pageSize: 7, showSizeChanger: false }}
          onRow={(record) => ({
            onClick: () => handleSelectSupplier(record),
            style: { cursor: "pointer" },
          })}
          locale={{
            emptyText: <Empty description="Không tìm thấy NCC" />,
          }}
        />
      </Modal>
    </div>
  );
};

export default EditRequest;
