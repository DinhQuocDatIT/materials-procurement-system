import React, { useState } from "react";
import { Form, Input, Button } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { userService } from "../../services/userService";
import AuthStorage from "../../services/AuthStorage";
import styles from "./Login.module.css";

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
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logoBox}>
          <div className={styles.logoIcon}>M</div>
          <h1 className={styles.title}>MPS System</h1>
          <p className={styles.subtitle}>Đăng nhập để tiếp tục</p>
        </div>

        {/* Form */}
        <Form layout="vertical" onFinish={handleSubmit} size="large">
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input
              prefix={<UserOutlined className={styles.inputIcon} />}
              placeholder="email@company.com"
            />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
          >
            <Input.Password
              prefix={<LockOutlined className={styles.inputIcon} />}
              placeholder="Nhập mật khẩu"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              className={styles.submitBtn}
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>

        {/* Demo hint */}
        
      </div>
    </div>
  );
}
