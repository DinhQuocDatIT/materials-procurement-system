import React, { useState, useMemo } from "react";
import {
  Table,
  Button,
  Input,
  Space,
  Tag,
  Modal,
  Form,
  Select,
  DatePicker,
  Popconfirm,
  Avatar,
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
  UserOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import styles from "./UserList.module.css";

const { Option } = Select;

// ===== DỮ LIỆU GIẢ =====
const initialUsers = [
  {
    id: 1,
    name: "Nguyễn Văn An",
    birthday: "1996-05-12",
    email: "an.nguyen@company.com",
    role: "ADMIN",
    gender: "MALE",
  },
  {
    id: 2,
    name: "Trần Thị Bích",
    birthday: "1992-08-20",
    email: "bich.tran@company.com",
    role: "MANAGER",
    gender: "FEMALE",
  },
  {
    id: 3,
    name: "Lê Hoàng Cường",
    birthday: "1999-03-05",
    email: "cuong.le@company.com",
    role: "STAFF",
    gender: "MALE",
  },
  {
    id: 4,
    name: "Phạm Thu Dung",
    birthday: "1997-11-18",
    email: "dung.pham@company.com",
    role: "STAFF",
    gender: "FEMALE",
  },
  {
    id: 5,
    name: "Hoàng Minh Đức",
    birthday: "1989-01-25",
    email: "duc.hoang@company.com",
    role: "MANAGER",
    gender: "MALE",
  },
];

// ===== MAP LABEL =====
const roleLabels = {
  ADMIN: { text: "Quản trị viên", color: "red" },
  MANAGER: { text: "Quản lý", color: "orange" },
  STAFF: { text: "Nhân viên", color: "blue" },
};

const genderLabels = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
};

// ===== HELPER =====
const calcAge = (birthday) => {
  if (!birthday) return 0;
  return dayjs().diff(dayjs(birthday), "year");
};

const formatDate = (date) => {
  if (!date) return "—";
  return dayjs(date).format("DD/MM/YYYY");
};

export default function UserList() {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  // ===== LỌC DỮ LIỆU (chỉ search) =====
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      return (
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        String(u.id).includes(search)
      );
    });
  }, [users, search]);

  // ===== THÊM =====
  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  // ===== SỬA =====
  const handleEdit = (user) => {
    setEditingUser(user);
    form.setFieldsValue({
      ...user,
      birthday: user.birthday ? dayjs(user.birthday) : null,
    });
    setIsModalOpen(true);
  };

  // ===== XÓA =====
  const handleDelete = (id) => {
    const user = users.find((u) => u.id === id);
    setUsers(users.filter((u) => u.id !== id));
    toast.success(`Đã xóa "${user?.name}"!`);
  };

  // ===== LƯU =====
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const payload = {
        ...values,
        birthday: values.birthday ? values.birthday.format("YYYY-MM-DD") : null,
      };

      const isDuplicateEmail = users.some(
        (u) =>
          u.email.toLowerCase() === payload.email.toLowerCase() &&
          u.id !== editingUser?.id,
      );
      if (isDuplicateEmail) {
        toast.error("Email đã tồn tại trong hệ thống!");
        return;
      }

      if (editingUser) {
        setUsers(
          users.map((u) =>
            u.id === editingUser.id ? { ...u, ...payload } : u,
          ),
        );
        toast.success("Cập nhật thành công!");
      } else {
        const newId = Math.max(...users.map((u) => u.id), 0) + 1;
        setUsers([...users, { id: newId, ...payload }]);
        toast.success("Thêm người dùng thành công!");
      }

      setIsModalOpen(false);
      form.resetFields();
    } catch (err) {
      if (err?.errorFields?.length > 0) {
        toast.error("Vui lòng kiểm tra lại thông tin!");
      }
    }
  };

  // ===== RESET =====
  const handleReset = () => {
    setSearch("");
    toast.info("Đã đặt lại bộ lọc");
  };

  // ===== COLUMNS =====
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 70,
      sorter: (a, b) => a.id - b.id,
      render: (id) => <strong>#{id}</strong>,
    },
    {
      title: "Người dùng",
      dataIndex: "name",
      render: (_, record) => (
        <div className={styles.userCell}>
          <Avatar
            size={40}
            icon={<UserOutlined />}
            style={{ background: "#6366f1" }}
          />
          <div className={styles.userInfo}>
            <span className={styles.userName}>{record.name}</span>
            <span className={styles.userEmail}>{record.email}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Ngày sinh",
      dataIndex: "birthday",
      width: 130,
      sorter: (a, b) => dayjs(a.birthday).unix() - dayjs(b.birthday).unix(),
      render: (birthday) => formatDate(birthday),
    },
    {
      title: "Tuổi",
      dataIndex: "birthday",
      key: "age",
      width: 90,
      sorter: (a, b) => calcAge(a.birthday) - calcAge(b.birthday),
      render: (birthday) => <span>{calcAge(birthday)} tuổi</span>,
    },
    {
      title: "Email",
      dataIndex: "email",
      ellipsis: true,
      render: (email) => <a href={`mailto:${email}`}>{email}</a>,
    },
    {
      title: "Giới tính",
      dataIndex: "gender",
      width: 110,
      filters: [
        { text: "Nam", value: "MALE" },
        { text: "Nữ", value: "FEMALE" },
        { text: "Khác", value: "OTHER" },
      ],
      onFilter: (value, record) => record.gender === value,
      render: (gender) => <span>{genderLabels[gender] || "Khác"}</span>,
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      width: 140,
      filters: Object.entries(roleLabels).map(([value, { text }]) => ({
        text,
        value,
      })),
      onFilter: (value, record) => record.role === value,
      render: (role) => {
        const r = roleLabels[role] || { text: role, color: "default" };
        return <Tag color={r.color}>{r.text}</Tag>;
      },
    },
    {
      title: "Hành động",
      width: 120,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Tooltip title="Sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa người dùng?"
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
      {/* ===== HEADER ===== */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>Quản lý người dùng</h2>
          <p className={styles.subtitle}>
            Tổng cộng <strong>{users.length}</strong> người dùng
          </p>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          Thêm người dùng
        </Button>
      </div>

      {/* ===== BỘ LỌC (chỉ còn search + reset) ===== */}
      <Card className={styles.filterCard}>
        <Row gutter={12}>
          <Col xs={24} md={18}>
            <Input
              size="large"
              placeholder="Tìm theo tên, email, ID..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </Col>
        </Row>
      </Card>

      {/* ===== BẢNG ===== */}
      <Card className={styles.tableCard} bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          scroll={{ x: 1100 }}
          pagination={{
            pageSize: 8,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} / ${total} người dùng`,
          }}
        />
      </Card>

      {/* ===== MODAL ===== */}
      <Modal
        title={editingUser ? "Sửa người dùng" : "Thêm người dùng mới"}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        okText={editingUser ? "Cập nhật" : "Thêm"}
        cancelText="Hủy"
        width={560}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ gender: "MALE", role: "STAFF" }}
        >
          <Form.Item
            label="Họ và tên"
            name="name"
            rules={[
              { required: true, message: "Vui lòng nhập họ tên" },
              { min: 2, message: "Họ tên ít nhất 2 ký tự" },
              { max: 50, message: "Họ tên tối đa 50 ký tự" },
              {
                pattern: /^[a-zA-ZÀ-ỹ\s]+$/,
                message: "Họ tên chỉ chứa chữ cái và khoảng trắng",
              },
            ]}
          >
            <Input placeholder="Nguyễn Văn A" size="large" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                label="Ngày sinh"
                name="birthday"
                rules={[
                  { required: true, message: "Vui lòng chọn ngày sinh" },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      const age = dayjs().diff(value, "year");
                      if (age < 18) {
                        return Promise.reject(new Error("Phải đủ 18 tuổi"));
                      }
                      if (age > 100) {
                        return Promise.reject(new Error("Tuổi không hợp lệ"));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <DatePicker
                  size="large"
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày sinh"
                  disabledDate={(current) =>
                    current && current > dayjs().endOf("day")
                  }
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Giới tính"
                name="gender"
                rules={[{ required: true, message: "Vui lòng chọn giới tính" }]}
              >
                <Select size="large" placeholder="Chọn giới tính">
                  <Option value="MALE">Nam</Option>
                  <Option value="FEMALE">Nữ</Option>
                  <Option value="OTHER">Khác</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email không hợp lệ" },
              { max: 100, message: "Email tối đa 100 ký tự" },
            ]}
          >
            <Input placeholder="email@company.com" size="large" />
          </Form.Item>

          <Form.Item
            label="Vai trò"
            name="role"
            rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
          >
            <Select size="large" placeholder="Chọn vai trò">
              <Option value="ADMIN">Quản trị viên</Option>
              <Option value="MANAGER">Quản lý</Option>
              <Option value="STAFF">Nhân viên</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
