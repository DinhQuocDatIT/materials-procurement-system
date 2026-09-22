import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Button,
  Input,
  Space,
  Tag,
  Modal,
  Form,
  Select,
  InputNumber,
  Popconfirm,
  Card,
  Row,
  Col,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  MoreOutlined,
  FilterOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { supplierService } from "../../services/supplierService";
import styles from "./SupplierList.module.css";

const { Option } = Select;

const statusLabels = {
  PRIORITY: { text: "Ưu tiên", className: "statusPriority" },
  GOOD: { text: "Tốt", className: "statusGood" },
  AVERAGE: { text: "Trung bình", className: "statusAverage" },
  REVIEW: { text: "Cần xem xét", className: "statusReview" },
  POOR: { text: "Hạn chế", className: "statusPoor" },
};

const rankLabels = {
  A: { text: "A", className: "rankA" },
  B: { text: "B", className: "rankB" },
  C: { text: "C", className: "rankC" },
};

const fieldOptions = [
  "Phụ tùng máy",
  "Vật tư an toàn",
  "Thiết bị hàng hải",
  "Vật tư cơ khí",
  "Vật tư hàn",
  "Thiết bị an toàn",
  "Thiết bị SON/EP",
  "Vật tư tổng hợp",
];

export default function SupplierList() {
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedField, setSelectedField] = useState(undefined);
  const [selectedRank, setSelectedRank] = useState(undefined);
  const [selectedStatus, setSelectedStatus] = useState(undefined);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const data = await supplierService.getAll();
      setSuppliers(data);
    } catch (error) {
      toast.error("Không tải được dữ liệu: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ===== LỌC =====
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch =
        s.name.toLowerCase().includes(q) ||
        s.tax_code.toLowerCase().includes(q) ||
        s.field.toLowerCase().includes(q);

      const matchField = selectedField ? s.field === selectedField : true;
      const matchRank = selectedRank ? s.rank === selectedRank : true;
      const matchStatus = selectedStatus ? s.status === selectedStatus : true;

      return matchSearch && matchField && matchRank && matchStatus;
    });
  }, [suppliers, search, selectedField, selectedRank, selectedStatus]);

  const handleAdd = () => {
    setEditingSupplier(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    form.setFieldsValue(supplier);
    setIsModalOpen(true);
  };

  const handleView = (supplier) => {
    navigate(`/dashboard/suppliers/${supplier.id}`);
  };

  const handleDelete = async (id) => {
    try {
      const s = suppliers.find((x) => x.id === id);
      await supplierService.delete(id);
      setSuppliers(suppliers.filter((x) => x.id !== id));
      toast.success(`Đã xóa "${s?.name}"!`);
    } catch (error) {
      toast.error("Lỗi xóa: " + error.message);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const rank =
        values.rating >= 4.5 ? "A" : values.rating >= 3.5 ? "B" : "C";
      const payload = { ...values, rank };

      if (editingSupplier) {
        const updated = await supplierService.update(
          editingSupplier.id,
          payload,
        );
        setSuppliers(suppliers.map((s) => (s.id === updated.id ? updated : s)));
        toast.success("Cập nhật thành công!");
      } else {
        const created = await supplierService.create(payload);
        setSuppliers([...suppliers, created]);
        toast.success("Thêm nhà cung cấp thành công!");
      }

      setIsModalOpen(false);
      form.resetFields();
    } catch (err) {
      if (err?.errorFields?.length > 0) {
        toast.error("Vui lòng kiểm tra lại thông tin!");
      } else {
        toast.error("Lỗi: " + err.message);
      }
    }
  };

  const handleReset = () => {
    setSearch("");
    setSelectedField(undefined);
    setSelectedRank(undefined);
    setSelectedStatus(undefined);
    toast.info("Đã đặt lại bộ lọc");
  };

  // ===== COLUMNS =====
  const columns = [
    {
      title: "STT",
      width: 60,
      align: "center",
      render: (_, __, index) => <span>{index + 1}</span>,
    },
    {
      title: "Tên nhà cung cấp",
      dataIndex: "name",
      render: (name, record) => (
        <a
          className={styles.supplierName}
          onClick={() => handleView(record)}
          style={{ cursor: "pointer", color: "#1677ff", fontWeight: 600 }}
        >
          {name}
        </a>
      ),
    },
    {
      title: "Mã số thuế",
      dataIndex: "tax_code",
      width: 130,
    },
    {
      title: "Lĩnh vực cung cấp",
      dataIndex: "field",
      width: 160,
    },
    {
      title: "Số hợp đồng",
      dataIndex: "contract_count",
      width: 100,
      align: "center",
      sorter: (a, b) => a.contract_count - b.contract_count,
    },
    {
      title: "Điểm TB (5)",
      dataIndex: "rating",
      width: 110,
      align: "center",
      sorter: (a, b) => a.rating - b.rating,
      render: (rating) => (
        <span className={styles.ratingCell}>
          <span className={styles.star}>★</span>
          <span>{rating.toFixed(1)}</span>
        </span>
      ),
    },
    {
      title: "Xếp loại",
      dataIndex: "rank",
      width: 90,
      align: "center",
      render: (rank) => {
        const r = rankLabels[rank] || rankLabels.C;
        return (
          <span className={`${styles.rankBadge} ${styles[r.className]}`}>
            {r.text}
          </span>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 130,
      align: "center",
      render: (status) => {
        const s = statusLabels[status] || statusLabels.GOOD;
        return (
          <span className={`${styles.statusBadge} ${styles[s.className]}`}>
            {s.text}
          </span>
        );
      },
    },
    {
      title: "Thao tác",
      width: 130,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <Space size={2}>
          {/* ⭐ XEM — navigate tới trang chi tiết */}
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>

          {/* SỬA */}
          <Tooltip title="Sửa">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/dashboard/suppliers/edit/${record.id}`)}
            />
          </Tooltip>

          {/* XÓA */}
          <Popconfirm
            title="Xóa nhà cung cấp?"
            description={`Bạn chắc chắn muốn xóa "${record.name}"?`}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record.id)}
          >
            <Tooltip title="Xóa">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>

          {/* MORE */}
          <Tooltip title="Thêm">
            <Button
              type="text"
              size="small"
              icon={<MoreOutlined />}
              onClick={() => toast.info(`Thêm tùy chọn cho: ${record.name}`)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleWrapper}>
            <div className={styles.iconBox}>
              <TeamOutlined />
            </div>
            <div>
              <h2 className={styles.title}>Danh sách nhà cung cấp</h2>
              <p className={styles.subtitle}>
                Quản lý thông tin nhà cung cấp, theo dõi lịch sử hợp tác và đánh
                giá năng lực
              </p>
            </div>
          </div>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          className={styles.addBtn}
        >
          Thêm nhà cung cấp
        </Button>
      </div>

      {/* BỘ LỌC */}
      <Card className={styles.filterCard} bodyStyle={{ padding: "16px" }}>
        <div className={styles.filterContainer}>
          <Input
            placeholder="Tìm kiếm theo tên, mã số thuế, lĩnh vực..."
            prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            className={styles.searchBox}
          />
          <Select
            placeholder="Tất cả nhóm ngành"
            style={{ width: 180 }}
            value={selectedField}
            onChange={setSelectedField}
            allowClear
          >
            {fieldOptions.map((f) => (
              <Option key={f} value={f}>
                {f}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="Tất cả xếp loại"
            style={{ width: 140 }}
            value={selectedRank}
            onChange={setSelectedRank}
            allowClear
          >
            <Option value="A">A</Option>
            <Option value="B">B</Option>
            <Option value="C">C</Option>
          </Select>
          <Select
            placeholder="Tất cả trạng thái"
            style={{ width: 150 }}
            value={selectedStatus}
            onChange={setSelectedStatus}
            allowClear
          >
            {Object.entries(statusLabels).map(([value, { text }]) => (
              <Option key={value} value={value}>
                {text}
              </Option>
            ))}
          </Select>
          <Button
            icon={<FilterOutlined />}
            onClick={handleReset}
            className={styles.filterBtn}
          >
            Bộ lọc nâng cao
          </Button>
        </div>
      </Card>

      {/* BẢNG */}
      <Card className={styles.tableCard} bodyStyle={{ padding: 0 }}>
        <Table
          loading={loading}
          columns={columns}
          dataSource={filteredSuppliers}
          rowKey="id"
          scroll={{ x: 1100 }}
          pagination={{
            pageSize: 8,
            showSizeChanger: false,
            showTotal: (total, range) =>
              `Hiển thị ${range[0]} - ${range[1]} / ${total} nhà cung cấp`,
            position: ["bottomRight"],
          }}
        />
      </Card>

      {/* MODAL */}
      <Modal
        title={editingSupplier ? "Sửa nhà cung cấp" : "Thêm nhà cung cấp"}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        okText={editingSupplier ? "Cập nhật" : "Thêm"}
        cancelText="Hủy"
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ rating: 5, contract_count: 0, status: "GOOD" }}
        >
          <Form.Item
            label="Tên nhà cung cấp"
            name="name"
            rules={[
              { required: true, message: "Vui lòng nhập tên" },
              { min: 2, message: "Tên ít nhất 2 ký tự" },
            ]}
          >
            <Input placeholder="MarineTech VN" size="large" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                label="Mã số thuế"
                name="tax_code"
                rules={[
                  { required: true, message: "Vui lòng nhập mã số thuế" },
                  {
                    pattern: /^[0-9]{10,13}$/,
                    message: "MST phải là 10-13 chữ số",
                  },
                ]}
              >
                <Input placeholder="0101234567" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Lĩnh vực cung cấp"
                name="field"
                rules={[{ required: true, message: "Vui lòng chọn lĩnh vực" }]}
              >
                <Select size="large" placeholder="Chọn lĩnh vực">
                  {fieldOptions.map((f) => (
                    <Option key={f} value={f}>
                      {f}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                label="Số hợp đồng"
                name="contract_count"
                rules={[{ required: true, message: "Vui lòng nhập" }]}
              >
                <InputNumber min={0} size="large" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Điểm đánh giá (0-5)"
                name="rating"
                rules={[{ required: true, message: "Vui lòng chọn điểm" }]}
              >
                <InputNumber
                  min={0}
                  max={5}
                  step={0.1}
                  size="large"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Trạng thái"
            name="status"
            rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
          >
            <Select size="large">
              {Object.entries(statusLabels).map(([value, { text }]) => (
                <Option key={value} value={value}>
                  {text}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
