import React, { useState, useEffect } from "react";
import {
  Drawer,
  Table,
  Tag,
  Space,
  Button,
  Form,
  Modal,
  Select,
  InputNumber,
  Switch,
  Popconfirm,
  message,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  StarFilled,
  StarOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import { supplierMaterialService } from "../../services/materialService";
import { supplierService } from "../../services/supplierService";
import { supabase } from "../../services/supabaseClient";

export default function SupplierDrawer({ open, onClose, material }) {
  const [suppliers, setSuppliers] = useState([]);
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && material) {
      fetchSuppliersOfMaterial();
      fetchAllSuppliers();
    }
  }, [open, material]);

  const fetchSuppliersOfMaterial = async () => {
    try {
      setLoading(true);
      const data = await supplierMaterialService.getByMaterial(material.id);
      setSuppliers(data);
    } catch (error) {
      toast.error("Lỗi tải NCC: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSuppliers = async () => {
    try {
      const data = await supplierService.getAll();
      setAllSuppliers(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      supplier_id: record.supplier_id,
      price: record.price,
      lead_time_days: record.lead_time_days,
      is_preferred: record.is_preferred,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await supplierMaterialService.delete(id);
      setSuppliers(suppliers.filter((s) => s.id !== id));
      toast.success("Đã xóa NCC khỏi vật tư");
    } catch (error) {
      toast.error("Lỗi xóa: " + error.message);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Nếu set is_preferred = true → bỏ preferred của các NCC khác
      if (values.is_preferred) {
        const preferredRecords = suppliers.filter(
          (s) => s.is_preferred && s.id !== editingRecord?.id,
        );
        for (const rec of preferredRecords) {
          await supplierMaterialService.update(rec.id, { is_preferred: false });
        }
      }

      const payload = {
        ...values,
        material_id: material.id,
      };

      if (editingRecord) {
        const updated = await supplierMaterialService.update(
          editingRecord.id,
          payload,
        );
        // Reload để có thông tin supplier join
        await fetchSuppliersOfMaterial();
        toast.success("Cập nhật thành công!");
      } else {
        await supplierMaterialService.create(payload);
        await fetchSuppliersOfMaterial();
        toast.success("Thêm NCC thành công!");
      }

      setIsModalOpen(false);
      form.resetFields();
    } catch (err) {
      if (err?.errorFields?.length > 0) {
        toast.error("Vui lòng kiểm tra thông tin!");
      } else {
        toast.error("Lỗi: " + err.message);
      }
    }
  };

  const columns = [
    {
      title: "Nhà cung cấp",
      dataIndex: ["supplier", "name"],
      render: (name, record) => (
        <Space>
          {record.is_preferred && <StarFilled style={{ color: "#f59e0b" }} />}
          <div>
            <div style={{ fontWeight: 600 }}>{name}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              MST: {record.supplier?.tax_code}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Đơn giá",
      dataIndex: "price",
      width: 140,
      align: "right",
      render: (price) => new Intl.NumberFormat("vi-VN").format(price) + " đ",
      sorter: (a, b) => a.price - b.price,
    },
    {
      title: "Giao hàng",
      dataIndex: "lead_time_days",
      width: 110,
      align: "center",
      render: (days) => `${days} ngày`,
      sorter: (a, b) => a.lead_time_days - b.lead_time_days,
    },
    {
      title: "Xếp loại NCC",
      dataIndex: ["supplier", "rank"],
      width: 100,
      align: "center",
      render: (rank) => {
        const colors = { A: "green", B: "blue", C: "default" };
        return <Tag color={colors[rank]}>{rank}</Tag>;
      },
    },
    {
      title: "Hành động",
      width: 100,
      align: "center",
      render: (_, record) => (
        <Space size={4}>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Xóa NCC khỏi vật tư?"
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Drawer
        title={
          material
            ? `Nhà cung cấp — ${material.name} (${material.code})`
            : "Nhà cung cấp"
        }
        placement="right"
        width={720}
        open={open}
        onClose={onClose}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Thêm NCC
          </Button>
        }
      >
        <Table
          loading={loading}
          columns={columns}
          dataSource={suppliers}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Drawer>

      <Modal
        title={editingRecord ? "Sửa NCC" : "Thêm NCC cho vật tư"}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        okText={editingRecord ? "Cập nhật" : "Thêm"}
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Nhà cung cấp"
            name="supplier_id"
            rules={[{ required: true, message: "Chọn NCC" }]}
          >
            <Select
              size="large"
              placeholder="Chọn nhà cung cấp"
              disabled={!!editingRecord}
            >
              {allSuppliers.map((s) => (
                <Select.Option key={s.id} value={s.id}>
                  {s.name} — {s.tax_code}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Đơn giá (VNĐ)"
            name="price"
            rules={[{ required: true, message: "Nhập giá" }]}
          >
            <InputNumber
              min={0}
              size="large"
              style={{ width: "100%" }}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(v) => v.replace(/,/g, "")}
            />
          </Form.Item>

          <Form.Item
            label="Thời gian giao hàng (ngày)"
            name="lead_time_days"
            rules={[{ required: true, message: "Nhập số ngày" }]}
          >
            <InputNumber min={0} size="large" style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Nhà cung cấp ưu tiên?"
            name="is_preferred"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
