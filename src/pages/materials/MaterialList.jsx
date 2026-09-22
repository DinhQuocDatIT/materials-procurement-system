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
  ReloadOutlined,
  FilterOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import { materialService } from "../../services/materialService";
import SupplierDrawer from "./SupplierDrawer";
import styles from "./MaterialList.module.css";

const { Option } = Select;

// ===== DANH MỤC =====
const categories = [
  "Dầu mỡ",
  "Phụ tùng máy",
  "Vật tư thay thế",
  "Vật tư tiêu hao",
  "Vật tư cơ khí",
  "Hóa chất",
  "Thiết bị",
  "Vật tư bảo hộ",
];

const units = ["Lít", "Bộ", "Cái", "Kg", "Mét", "Đôi", "Thùng", "Cuộn"];

// ===== TÍNH TRẠNG THÁI =====
const getStatus = (current, min) => {
  if (current >= min) {
    return { key: "IN_STOCK", text: "Đủ tồn", className: "statusInStock" };
  }
  if (current >= min * 0.5) {
    return { key: "WARNING", text: "Cảnh báo", className: "statusWarning" };
  }
  return { key: "NEED_BUY", text: "Cần mua ngay", className: "statusNeedBuy" };
};

export default function MaterialList() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterUnit, setFilterUnit] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const data = await materialService.getAll();
      setMaterials(data);
    } catch (error) {
      toast.error("Không tải được dữ liệu: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ===== LỌC =====
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const q = search.toLowerCase();
      const matchSearch =
        m.code.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q);

      const matchCategory = !filterCategory || m.category === filterCategory;
      const matchUnit = !filterUnit || m.unit === filterUnit;

      const status = getStatus(m.current_stock, m.min_stock);
      const matchStatus = !filterStatus || status.key === filterStatus;

      return matchSearch && matchCategory && matchUnit && matchStatus;
    });
  }, [materials, search, filterCategory, filterUnit, filterStatus]);

  // ===== THÊM =====
  const handleAdd = () => {
    setEditingMaterial(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  // ===== SỬA =====
  const handleEdit = (material) => {
    setEditingMaterial(material);
    form.setFieldsValue(material);
    setIsModalOpen(true);
  };

  // ===== XÓA =====
  const handleDelete = async (id) => {
    try {
      const m = materials.find((x) => x.id === id);
      await materialService.delete(id);
      setMaterials(materials.filter((x) => x.id !== id));
      toast.success(`Đã xóa "${m?.name}"!`);
    } catch (error) {
      toast.error("Lỗi xóa: " + error.message);
    }
  };

  // ===== LƯU =====
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingMaterial) {
        const updated = await materialService.update(
          editingMaterial.id,
          values,
        );
        setMaterials(materials.map((m) => (m.id === updated.id ? updated : m)));
        toast.success("Cập nhật thành công!");
      } else {
        const created = await materialService.create(values);
        setMaterials([...materials, created]);
        toast.success("Thêm vật tư thành công!");
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

  // ===== MỞ DRAWER XEM NCC =====
  const handleViewSuppliers = (material) => {
    setSelectedMaterial(material);
    setIsDrawerOpen(true);
  };

  // ===== RESET =====
  const handleReset = () => {
    setSearch("");
    setFilterCategory(null);
    setFilterStatus(null);
    setFilterUnit(null);
    toast.info("Đã đặt lại bộ lọc");
  };

  // ===== COLUMNS =====
  const columns = [
    {
      title: "STT",
      width: 60,
      align: "center",
      render: (_, __, index) => <strong>{index + 1}</strong>,
    },
    {
      title: "Mã vật tư",
      dataIndex: "code",
      width: 110,
      render: (code) => <strong>{code}</strong>,
    },
    {
      title: "Tên vật tư",
      dataIndex: "name",
      render: (name) => <span>{name}</span>,
    },
    {
      title: "Nhóm vật tư",
      dataIndex: "category",
      width: 140,
      filters: categories.map((c) => ({ text: c, value: c })),
      onFilter: (value, record) => record.category === value,
    },
    {
      title: "Đơn vị tính",
      dataIndex: "unit",
      width: 100,
      align: "center",
      render: (unit) => <Tag>{unit}</Tag>,
    },
    {
      title: "Tồn kho",
      dataIndex: "current_stock",
      width: 100,
      align: "center",
      sorter: (a, b) => a.current_stock - b.current_stock,
      render: (val) => <strong>{val.toLocaleString()}</strong>,
    },
    {
      title: "Tối thiểu",
      dataIndex: "min_stock",
      width: 100,
      align: "center",
      render: (val) => val.toLocaleString(),
    },
    {
      title: "Tối đa",
      dataIndex: "max_stock",
      width: 100,
      align: "center",
      render: (val) => val.toLocaleString(),
    },
    {
      title: "Trạng thái",
      width: 140,
      align: "center",
      filters: [
        { text: "Đủ tồn", value: "IN_STOCK" },
        { text: "Cảnh báo", value: "WARNING" },
        { text: "Cần mua ngay", value: "NEED_BUY" },
      ],
      onFilter: (value, record) =>
        getStatus(record.current_stock, record.min_stock).key === value,
      render: (_, record) => {
        const status = getStatus(record.current_stock, record.min_stock);
        return (
          <span className={`${styles.statusBadge} ${styles[status.className]}`}>
            {status.text}
          </span>
        );
      },
    },
    {
      title: "Hành động",
      width: 160,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Xem nhà cung cấp">
            <Button
              type="text"
              icon={<ShoppingCartOutlined />}
              onClick={() => handleViewSuppliers(record)}
            />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa vật tư?"
            description={`Bạn chắc chắn muốn xóa "${record.name}"?`}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record.id)}
          >
            <Tooltip title="Xóa">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>Danh mục vật tư</h2>
          <p className={styles.subtitle}>
            Quản lý danh mục vật tư, phân loại và theo dõi thông tin vật tư
          </p>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          className={styles.addBtn}
        >
          Thêm vật tư
        </Button>
      </div>

      {/* BỘ LỌC */}
      <Card className={styles.filterCard}>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={8}>
            <Input
              size="large"
              placeholder="Tìm kiếm theo mã, tên vật tư, nhóm vật tư..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              size="large"
              placeholder="Tất cả nhóm"
              value={filterCategory}
              onChange={setFilterCategory}
              allowClear
              style={{ width: "100%" }}
            >
              {categories.map((c) => (
                <Option key={c} value={c}>
                  {c}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} md={4}>
            <Select
              size="large"
              placeholder="Tất cả trạng thái"
              value={filterStatus}
              onChange={setFilterStatus}
              allowClear
              style={{ width: "100%" }}
            >
              <Option value="IN_STOCK">Đủ tồn</Option>
              <Option value="WARNING">Cảnh báo</Option>
              <Option value="NEED_BUY">Cần mua ngay</Option>
            </Select>
          </Col>
          <Col xs={12} md={4}>
            <Select
              size="large"
              placeholder="Tất cả đơn vị tính"
              value={filterUnit}
              onChange={setFilterUnit}
              allowClear
              style={{ width: "100%" }}
            >
              {units.map((u) => (
                <Option key={u} value={u}>
                  {u}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} md={4}>
            <Button
              size="large"
              icon={<FilterOutlined />}
              onClick={handleReset}
              block
            >
              Đặt lại
            </Button>
          </Col>
        </Row>
      </Card>

      {/* BẢNG */}
      <Card className={styles.tableCard} bodyStyle={{ padding: 0 }}>
        <Table
          loading={loading}
          columns={columns}
          dataSource={filteredMaterials}
          rowKey="id"
          scroll={{ x: 1300 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `Hiển thị ${range[0]} - ${range[1]} / ${total} vật tư`,
          }}
        />
      </Card>

      {/* MODAL THÊM/SỬA */}
      <Modal
        title={editingMaterial ? "Sửa vật tư" : "Thêm vật tư mới"}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        okText={editingMaterial ? "Cập nhật" : "Thêm"}
        cancelText="Hủy"
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                label="Mã vật tư"
                name="code"
                rules={[
                  { required: true, message: "Vui lòng nhập mã" },
                  { pattern: /^VT-\d+$/, message: "Định dạng: VT-001" },
                ]}
              >
                <Input placeholder="VT-001" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Tên vật tư"
                name="name"
                rules={[{ required: true, message: "Vui lòng nhập tên" }]}
              >
                <Input placeholder="Dầu thủy lực" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                label="Nhóm vật tư"
                name="category"
                rules={[{ required: true, message: "Vui lòng chọn nhóm" }]}
              >
                <Select size="large" placeholder="Chọn nhóm">
                  {categories.map((c) => (
                    <Option key={c} value={c}>
                      {c}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Đơn vị tính"
                name="unit"
                rules={[{ required: true, message: "Vui lòng chọn ĐVT" }]}
              >
                <Select size="large" placeholder="Chọn ĐVT">
                  {units.map((u) => (
                    <Option key={u} value={u}>
                      {u}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={8}>
              <Form.Item
                label="Tồn kho"
                name="current_stock"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} size="large" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Mức tối thiểu"
                name="min_stock"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} size="large" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Mức tối đa"
                name="max_stock"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} size="large" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={3} placeholder="Mô tả vật tư..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* DRAWER XEM NCC */}
      <SupplierDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        material={selectedMaterial}
      />
    </div>
  );
}
