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
  Empty,
  Tooltip,
  Alert,
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
  CloseOutlined,
  CheckOutlined,
  InboxOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  StarFilled,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";

import { materialService } from "../../services/materialService";
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

const getSupplierStatusInfo = (supplier) => {
  const status = supplier?.status || "AVERAGE";
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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [requestItems, setRequestItems] = useState([]);

  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [materialSearch, setMaterialSearch] = useState("");

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [priceMap, setPriceMap] = useState({});
  const [expectedDateError, setExpectedDateError] = useState("");

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [materialRes, requestData] = await Promise.all([
        materialService.getAll(),
        purchaseRequestService.getById(id),
      ]);

      setMaterials(materialRes?.data || materialRes || []);

      // Check trạng thái — chỉ sửa được DRAFT
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
        max_stock: item.material?.max_stock ?? 0,
        min_stock: item.material?.min_stock ?? 0,
      }));
      setRequestItems(items);

      // Fill supplier + load price map
      if (requestData.supplier) {
        setSelectedSupplier(requestData.supplier);

        try {
          const prices = await materialService.getPricesBySupplier(
            requestData.supplier.id,
          );
          setPriceMap(prices);
        } catch (priceError) {
          console.error("Lỗi load giá:", priceError);
          setPriceMap({});
        }
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

    const stockQty = material.current_stock ?? 0;
    const maxStock = material.max_stock ?? 0;

    if (maxStock > 0 && stockQty >= maxStock) {
      toast.warning(
        `"${material.name}" đã đầy chỗ (${stockQty}/${maxStock}). Không thể nhập thêm!`,
      );
      return;
    }

    const newItem = {
      key: material.id,
      material_id: material.id,
      material_code: material.code,
      material_name: material.name,
      unit: material.unit,
      quantity: 1,
      stock_quantity: stockQty,
      min_stock: material.min_stock ?? 0,
      max_stock: maxStock,
    };

    setRequestItems((prev) => [...prev, newItem]);
    setIsMaterialModalOpen(false);
    setMaterialSearch("");

    if (selectedSupplier) {
      setSelectedSupplier(null);
      form.setFieldValue("supplier_id", null);
      setPriceMap({});
      toast.info("Đã thêm vật tư mới, vui lòng chọn lại nhà cung cấp");
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

    if (selectedSupplier) {
      setSelectedSupplier(null);
      form.setFieldValue("supplier_id", null);
      setPriceMap({});
    }
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

  const overMaxItems = useMemo(() => {
    return requestItems.filter((item) => {
      const max = Number(item.max_stock || 0);
      const current = Number(item.stock_quantity || 0);
      if (max === 0) return false;
      return current + item.quantity > max;
    });
  }, [requestItems]);

  const totalAmount = useMemo(() => {
    return requestItems.reduce((sum, item) => {
      const price = priceMap[item.material_id] || 0;
      return sum + price * item.quantity;
    }, 0);
  }, [requestItems, priceMap]);

  const hasPrice = Object.keys(priceMap).length > 0;

  // =========================
  // SUPPLIER
  // =========================

  const openSupplierModal = async () => {
    if (requestItems.length === 0) {
      toast.warning("Vui lòng thêm vật tư trước!");
      return;
    }

    setSupplierSearch("");
    setIsSupplierModalOpen(true);
    setLoadingSuppliers(true);

    try {
      const materialIds = requestItems.map((i) => i.material_id);
      const data = await materialService.findSuppliersForMaterials(materialIds);
      setSupplierOptions(data);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi tải danh sách NCC: " + error.message);
      setSupplierOptions([]);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const filteredSuppliers = useMemo(() => {
    const keyword = supplierSearch.trim().toLowerCase();
    if (!keyword) return supplierOptions;

    return supplierOptions.filter((opt) => {
      const name = String(opt.supplier?.name || "").toLowerCase();
      const taxCode = String(opt.supplier?.tax_code || "").toLowerCase();
      return name.includes(keyword) || taxCode.includes(keyword);
    });
  }, [supplierOptions, supplierSearch]);

  const handleSelectSupplier = async (option) => {
    const { supplier, missingMaterialIds, matchedCount, totalCount } = option;

    const applySupplier = async () => {
      setSelectedSupplier(supplier);
      form.setFieldValue("supplier_id", supplier.id);
      setIsSupplierModalOpen(false);

      try {
        const prices = await materialService.getPricesBySupplier(supplier.id);
        setPriceMap(prices);
      } catch (error) {
        console.error(error);
        setPriceMap({});
      }

      toast.success(`Đã chọn NCC "${supplier.name}"`);
    };

    if (missingMaterialIds.length > 0) {
      const missingNames = requestItems
        .filter((i) => missingMaterialIds.includes(i.material_id))
        .map((i) => i.material_name)
        .join(", ");

      Modal.confirm({
        title: "Nhà cung cấp không có đủ vật tư",
        icon: <ExclamationCircleOutlined style={{ color: "#faad14" }} />,
        content: (
          <div>
            <p>
              <strong>{supplier.name}</strong> chỉ cung cấp{" "}
              <strong>
                {matchedCount}/{totalCount}
              </strong>{" "}
              vật tư.
            </p>
            <p style={{ marginTop: 8 }}>Vật tư KHÔNG có:</p>
            <ul style={{ marginTop: 4, paddingLeft: 20, color: "#ef4444" }}>
              {requestItems
                .filter((i) => missingMaterialIds.includes(i.material_id))
                .map((i) => (
                  <li key={i.material_id}>
                    {i.material_code} — {i.material_name}
                  </li>
                ))}
            </ul>
            <p style={{ marginTop: 12, color: "#faad14", fontWeight: 600 }}>
              ⚠️ {missingNames} sẽ bị XÓA khỏi yêu cầu.
            </p>
          </div>
        ),
        okText: "Xác nhận & Xóa",
        cancelText: "Hủy",
        okButtonProps: { danger: true },
        onOk: async () => {
          setRequestItems((prev) =>
            prev.filter((i) => !missingMaterialIds.includes(i.material_id)),
          );
          await applySupplier();
        },
      });
    } else {
      await applySupplier();
    }
  };

  const handleClearSupplier = () => {
    setSelectedSupplier(null);
    form.setFieldValue("supplier_id", null);
    setPriceMap({});
  };

  // =========================
  // NGÀY
  // =========================

  const checkExpectedDate = (date) => {
    if (!date) return { ok: true, msg: "" };

    const today = dayjs().startOf("day");

    if (date.isBefore(today, "day")) {
      return { ok: false, msg: "Ngày cần hàng không được ở quá khứ!" };
    }

    const requestDate = form.getFieldValue("request_date");
    if (requestDate && date.isBefore(requestDate, "day")) {
      return {
        ok: false,
        msg: "Ngày cần hàng phải sau hoặc bằng Ngày yêu cầu!",
      };
    }

    return { ok: true, msg: "" };
  };

  const handleExpectedDateChange = (date) => {
    if (!date) {
      setExpectedDateError("");
      return;
    }
    const check = checkExpectedDate(date);
    if (!check.ok) {
      setExpectedDateError(check.msg);
      form.setFieldValue("expected_date", null);
    } else {
      setExpectedDateError("");
    }
  };

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

      const dateCheck = checkExpectedDate(values.expected_date);
      if (!dateCheck.ok) {
        setExpectedDateError(dateCheck.msg);
        toast.error(dateCheck.msg);
        return;
      }

      if (overMaxItems.length > 0) {
        const names = overMaxItems.map((i) => i.material_name).join(", ");
        toast.error(`Vật tư vượt chỗ chứa: ${names}. Vui lòng giảm số lượng!`);
        return;
      }

      if (status === "PENDING" && !values.supplier_id) {
        toast.warning("Vui lòng chọn nhà cung cấp trước khi gửi yêu cầu");
        return;
      }

      if (status === "PENDING") {
        Modal.confirm({
          title: "Xác nhận gửi yêu cầu mua hàng?",
          icon: <ExclamationCircleOutlined style={{ color: "#faad14" }} />,
          content: (
            <div>
              <p>Bạn có chắc chắn muốn GỬI YÊU CẦU này không?</p>
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
                {hasPrice && (
                  <li>
                    <strong>Tổng chi phí:</strong>{" "}
                    {totalAmount.toLocaleString("vi-VN")} đ
                  </li>
                )}
              </ul>
            </div>
          ),
          okText: "Xác nhận gửi",
          cancelText: "Hủy",
          onOk: async () => {
            await doSave(status, values, currentUser);
          },
        });
        return;
      }

      await doSave(status, values, currentUser);
    } catch (error) {
      console.error(error);
      if (error?.errorFields) {
        toast.warning("Vui lòng kiểm tra lại các thông tin bắt buộc");
      } else {
        toast.error("Có lỗi xảy ra khi lưu yêu cầu");
      }
    }
  };

  const doSave = async (status, values, currentUser) => {
    try {
      setSubmitting(true);

      const requestData = {
        code: values.code,
        request_date: values.request_date?.format("YYYY-MM-DD"),
        expected_date: values.expected_date?.format("YYYY-MM-DD"),
        department: values.department,
        reason: values.reason,
        supplier_id: values.supplier_id || null,
        note: values.note || null,
        created_by: currentUser.id,
        status,
      };

      // ⭐ Map items kèm price
      const itemsWithPrice = requestItems.map((item) => ({
        material_id: item.material_id,
        quantity: item.quantity,
        price: Number(priceMap[item.material_id] || 0),
      }));

      // ⭐ GỌI UPDATE (không phải create)
      await purchaseRequestService.update(id, requestData, itemsWithPrice);

      toast.success(
        status === "PENDING"
          ? "Đã gửi yêu cầu mua hàng"
          : "Đã lưu yêu cầu mua hàng",
      );

      navigate("/dashboard/purchase-requests/list");
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra khi lưu yêu cầu");
    } finally {
      setSubmitting(false);
    }
  };

  // =========================
  // TABLE VẬT TƯ
  // =========================

  const materialColumns = [
    {
      title: "STT",
      key: "index",
      width: 55,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Mã VT",
      dataIndex: "material_code",
      width: 95,
      render: (v) => <span className={styles.materialCode}>{v || "-"}</span>,
    },
    {
      title: "Tên vật tư",
      dataIndex: "material_name",
      render: (v) => <span className={styles.materialName}>{v || "-"}</span>,
    },
    {
      title: "ĐVT",
      dataIndex: "unit",
      width: 70,
      align: "center",
      render: (v) => v || "-",
    },
    {
      title: "Tồn kho",
      dataIndex: "stock_quantity",
      width: 85,
      align: "right",
      render: (value) => (
        <span style={{ color: "#595959" }}>
          {Number(value || 0).toLocaleString("vi-VN")}
        </span>
      ),
    },
    {
      title: "Còn chỗ",
      key: "available_space",
      width: 90,
      align: "right",
      render: (_, record) => {
        const max = Number(record.max_stock || 0);
        const current = Number(record.stock_quantity || 0);

        if (max === 0) {
          return (
            <span style={{ color: "#8c8c8c", fontSize: 12 }}>
              Không giới hạn
            </span>
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
    {
      title: "SL yêu cầu",
      dataIndex: "quantity",
      width: 110,
      render: (_, record) => {
        const max = Number(record.max_stock || 0);
        const current = Number(record.stock_quantity || 0);
        const available = max > 0 ? Math.max(0, max - current) : Infinity;
        const isOverMax = max > 0 && record.quantity > available;

        return (
          <div style={{ lineHeight: 1.3 }}>
            <InputNumber
              min={1}
              max={100000}
              precision={0}
              value={record.quantity}
              onChange={(value) =>
                handleQuantityChange(record.material_id, value)
              }
              size="small"
              status={isOverMax ? "error" : ""}
              style={{ width: "100%" }}
            />
            {isOverMax && (
              <div
                style={{
                  color: "#ef4444",
                  fontSize: 10,
                  marginTop: 2,
                  fontWeight: 600,
                }}
              >
                <WarningOutlined /> Vượt{" "}
                {(record.quantity - available).toLocaleString("vi-VN")}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Đơn giá",
      key: "unit_price",
      width: 120,
      align: "right",
      render: (_, record) => {
        if (!selectedSupplier) {
          return <span style={{ color: "#bfbfbf", fontSize: 12 }}>—</span>;
        }
        const price = priceMap[record.material_id];
        if (!price) {
          return (
            <span style={{ color: "#faad14", fontSize: 12 }}>Chưa có giá</span>
          );
        }
        return (
          <span style={{ color: "#595959" }}>
            {Number(price).toLocaleString("vi-VN")} đ
          </span>
        );
      },
    },
    {
      title: "Thành tiền",
      key: "total_price",
      width: 140,
      align: "right",
      render: (_, record) => {
        const price = priceMap[record.material_id] || 0;
        const total = price * record.quantity;
        if (!price) {
          return <span style={{ color: "#bfbfbf" }}>—</span>;
        }
        return (
          <strong style={{ color: "#1677ff" }}>
            {total.toLocaleString("vi-VN")} đ
          </strong>
        );
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: 70,
      align: "center",
      render: (_, record) => (
        <Tooltip title="Xóa">
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

  const renderSummary = () => {
    if (!hasPrice) return null;

    const totalCols = materialColumns.length;

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

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          className={styles.form}
        >
          {/* THÔNG TIN YÊU CẦU */}
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
                    style={{
                      width: "100%",
                      background: "#f5f5f5",
                      cursor: "not-allowed",
                    }}
                    value={dayjs()}
                    disabled
                  />
                  <Form.Item name="request_date" hidden noStyle>
                    <Input />
                  </Form.Item>
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item label="Ngày cần hàng" required>
                  <Form.Item
                    name="expected_date"
                    noStyle
                    rules={[
                      { required: true, message: "Vui lòng chọn ngày" },
                      {
                        validator: (_, value) => {
                          if (!value) return Promise.resolve();
                          const today = dayjs().startOf("day");
                          if (value.isBefore(today, "day")) {
                            const msg = "Ngày cần hàng không được ở quá khứ!";
                            setExpectedDateError(msg);
                            return Promise.reject(new Error(msg));
                          }
                          setExpectedDateError("");
                          return Promise.resolve();
                        },
                      },
                    ]}
                    validateTrigger={["onChange", "onBlur"]}
                  >
                    <DatePicker
                      format="DD/MM/YYYY"
                      style={{ width: "100%" }}
                      placeholder="Chọn ngày"
                      onChange={handleExpectedDateChange}
                      status={expectedDateError ? "error" : ""}
                    />
                  </Form.Item>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Đơn vị / Bộ phận"
                  name="department"
                  rules={[{ required: true, message: "Chọn đơn vị" }]}
                >
                  <Select
                    placeholder="Chọn đơn vị"
                    options={departments.map((d) => ({
                      value: d,
                      label: d,
                    }))}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Lý do mua hàng"
                  name="reason"
                  rules={[{ required: true, message: "Chọn lý do" }]}
                >
                  <Select
                    placeholder="Chọn lý do"
                    options={reasons.map((r) => ({
                      value: r,
                      label: r,
                    }))}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* VẬT TƯ */}
          <Card className={styles.card} bordered={false}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderIcon}>
                <ShoppingOutlined />
              </div>
              <div className={styles.cardHeaderContent}>
                <div>
                  <h2>1. Danh sách vật tư</h2>
                  <p>Thêm vật tư cần mua vào yêu cầu</p>
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

            {overMaxItems.length > 0 && (
              <Alert
                type="error"
                showIcon
                icon={<WarningOutlined />}
                message={`Có ${overMaxItems.length} vật tư vượt chỗ chứa!`}
                description={
                  <ul style={{ margin: "4px 0 0 0", paddingLeft: 20 }}>
                    {overMaxItems.map((item) => {
                      const max = item.max_stock;
                      const current = item.stock_quantity;
                      const available = max - current;
                      return (
                        <li key={item.material_id}>
                          <strong>
                            {item.material_code} — {item.material_name}
                          </strong>
                          : Tồn {current} + Nhập {item.quantity} ={" "}
                          {current + item.quantity} (Max: {max}, còn chỗ{" "}
                          {available})
                        </li>
                      );
                    })}
                  </ul>
                }
                style={{ marginBottom: 16 }}
              />
            )}

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
              <Table
                rowKey="material_id"
                columns={materialColumns}
                dataSource={requestItems}
                pagination={false}
                size="middle"
                className={styles.mainTable}
                summary={renderSummary}
              />
            )}
          </Card>

          {/* NCC */}
          <Card className={styles.card} bordered={false}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderIcon}>
                <TeamOutlined />
              </div>
              <div>
                <h2>2. Nhà cung cấp</h2>
                <p>
                  Chọn NCC đáp ứng danh sách vật tư (ưu tiên NCC có đủ tất cả)
                </p>
              </div>
            </div>

            <div className={styles.divider} />

            <Form.Item name="supplier_id" hidden>
              <Input />
            </Form.Item>

            {requestItems.length === 0 ? (
              <Alert
                type="info"
                showIcon
                message="Vui lòng thêm vật tư trước"
                description="Sau khi thêm vật tư, hệ thống sẽ tìm NCC đáp ứng."
              />
            ) : !selectedSupplier ? (
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
                  <span>
                    Hệ thống sẽ tìm NCC đáp ứng {requestItems.length} vật tư đã
                    chọn
                  </span>
                </div>
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
                      MST: {selectedSupplier?.tax_code || "—"}
                    </div>
                  </div>

                  <div className={styles.selectedSupplierStatus}>
                    {(() => {
                      const info = getSupplierStatusInfo(selectedSupplier);
                      return (
                        <span
                          className={`${styles.statusBadge} ${
                            styles[info.className] || ""
                          }`}
                        >
                          {info.text}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div className={styles.selectedSupplierActions}>
                  <Button icon={<TeamOutlined />} onClick={openSupplierModal}>
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
              <TextArea rows={3} placeholder="Nhập ghi chú..." />
            </Form.Item>
          </Card>
        </Form>
      </div>

      {/* FOOTER */}
      <div className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerSummary}></div>

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
              disabled={overMaxItems.length > 0}
            >
              Lưu nháp
            </Button>
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={submitting}
              onClick={() => handleSave("PENDING")}
              disabled={overMaxItems.length > 0}
            >
              Gửi yêu cầu
            </Button>
          </div>
        </div>
      </div>

      {/* MODAL VẬT TƯ — DẠNG ROW LIST */}
      <Modal
        title={null}
        open={isMaterialModalOpen}
        onCancel={() => {
          setIsMaterialModalOpen(false);
          setMaterialSearch("");
        }}
        footer={null}
        width={860}
        getContainer={false}
        styles={{ body: { padding: 0 } }}
        className={styles.premiumModal}
      >
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.modalHeaderIcon}>
              <ShoppingOutlined />
            </div>
            <div>
              <div className={styles.modalHeaderTitle}>Chọn vật tư</div>
              <div className={styles.modalHeaderSub}>
                Tìm và chọn vật tư cần thêm vào yêu cầu
              </div>
            </div>
          </div>
        </div>

        <div className={styles.modalBody}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Tìm theo mã hoặc tên vật tư..."
            value={materialSearch}
            onChange={(e) => setMaterialSearch(e.target.value)}
            allowClear
            size="large"
            className={styles.searchInput}
          />

          <div className={styles.modalCount}>
            <strong>{filteredMaterials.length}</strong> vật tư
          </div>

          {filteredMaterials.length === 0 ? (
            <div className={styles.emptyState} style={{ minHeight: 200 }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Không tìm thấy vật tư"
              />
            </div>
          ) : (
            <div className={styles.materialList}>
              {filteredMaterials.map((m) => {
                const maxStock = m.max_stock || 0;
                const isFull = maxStock > 0 && m.current_stock >= maxStock;

                return (
                  <button
                    key={m.id}
                    type="button"
                    className={`${styles.materialRow} ${
                      isFull ? styles.materialRowFull : ""
                    }`}
                    onClick={() => handleAddMaterial(m)}
                    disabled={isFull}
                  >
                    <div className={styles.materialRowLeft}>
                      <div className={styles.materialRowCode}>{m.code}</div>
                      <div className={styles.materialRowInfo}>
                        <div className={styles.materialRowName}>{m.name}</div>
                        <div className={styles.materialRowMeta}>
                          <span className={styles.materialRowUnit}>
                            {m.unit}
                          </span>
                          <span
                            className={
                              isFull
                                ? styles.materialRowStockFull
                                : styles.materialRowStock
                            }
                          >
                            Tồn: {m.current_stock}
                            {maxStock > 0 && ` / ${maxStock}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.materialRowRight}>
                      {isFull ? (
                        <span className={styles.materialRowBadgeFull}>
                          Đã đầy
                        </span>
                      ) : (
                        <span className={styles.materialRowAdd}>
                          <PlusOutlined /> Thêm
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* MODAL NCC — DẠNG CARD LIST */}
      <Modal
        title={null}
        open={isSupplierModalOpen}
        onCancel={() => setIsSupplierModalOpen(false)}
        footer={null}
        width={820}
        getContainer={false}
        styles={{ body: { padding: 0 } }}
        className={styles.premiumModal}
      >
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.modalHeaderIcon}>
              <TeamOutlined />
            </div>
            <div>
              <div className={styles.modalHeaderTitle}>Chọn nhà cung cấp</div>
              <div className={styles.modalHeaderSub}>
                Hệ thống tìm NCC đáp ứng {requestItems.length} vật tư đã chọn
              </div>
            </div>
          </div>
        </div>

        <div className={styles.modalBody}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Tìm theo tên NCC, mã số thuế..."
            value={supplierSearch}
            onChange={(e) => setSupplierSearch(e.target.value)}
            allowClear
            size="large"
            className={styles.searchInput}
          />

          {loadingSuppliers ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <Spin size="large" />
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <Empty description="Không tìm thấy NCC nào đáp ứng vật tư" />
          ) : (
            <>
              <div className={styles.modalCount}>
                <strong>{filteredSuppliers.length}</strong> nhà cung cấp phù hợp
              </div>

              <div className={styles.supplierList}>
                {filteredSuppliers.map((opt) => {
                  const isFull = opt.matchedCount === opt.totalCount;
                  const supplier = opt.supplier;

                  return (
                    <button
                      key={supplier.id}
                      type="button"
                      className={`${styles.supplierCard} ${
                        isFull ? styles.supplierCardFull : ""
                      }`}
                      onClick={() => handleSelectSupplier(opt)}
                    >
                      <div className={styles.supplierCardLeft}>
                        <div className={styles.supplierAvatar}>
                          {String(supplier.name || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div className={styles.supplierInfo}>
                          <div className={styles.supplierName}>
                            {supplier.name}
                            {isFull && (
                              <span className={styles.supplierTagFull}>
                                <CheckOutlined /> Đủ
                              </span>
                            )}
                          </div>
                          <div className={styles.supplierMeta}>
                            MST: {supplier.tax_code}
                          </div>
                        </div>
                      </div>

                      <div className={styles.supplierMatch}>
                        <div className={styles.supplierMatchText}>
                          <strong>{opt.matchedCount}</strong>/{opt.totalCount}{" "}
                          vật tư
                          {!isFull && (
                            <span className={styles.matchMissingInline}>
                              {" "}
                              • Thiếu {opt.missingMaterialIds.length}
                            </span>
                          )}
                        </div>
                        <div className={styles.matchBar}>
                          <div
                            className={`${styles.matchBarFill} ${
                              isFull ? styles.matchBarFull : ""
                            }`}
                            style={{ width: `${opt.matchPercent}%` }}
                          />
                        </div>
                      </div>

                      <div className={styles.supplierRight}>
                        <span className={styles.supplierRating}>
                          <StarFilled /> {formatRating(supplier.rating)}
                        </span>
                        <span className={styles.supplierArrow}>→</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default EditRequest;
