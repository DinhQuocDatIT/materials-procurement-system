import React, { useState } from "react";
import { Form, Input, Button, Card, Typography } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { userService } from "../../services/userService";
import AuthStorage from "../../services/AuthStorage";

const { Title, Text } = Typography;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const user = await userService.login(values.email, values.password);

      AuthStorage.setUser(user);

      toast.success(`Chào mừng ${user.name}!`);
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0b1120 0%, #1e293b 100%)",
        padding: 20,
      }}
    >
      <Card
        style={{
          width: 400,
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)",
        }}
        bodyStyle={{ padding: 32 }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0, color: "#6366f1" }}>
            MPS System
          </Title>
          <Text type="secondary">Đăng nhập để tiếp tục</Text>
        </div>

        <Form layout="vertical" onFinish={handleSubmit} size="large">
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="email@company.com" />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Nhập mật khẩu"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 12 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>

        <div
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "#94a3b8",
            marginTop: 12,
            padding: 10,
            background: "#f8fafc",
            borderRadius: 8,
          }}
        >
          <strong>Demo:</strong> an.nguyen@company.com / 123456
        </div>
      </Card>
    </div>
  );
}
