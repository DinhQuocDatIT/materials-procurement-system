import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Form,
  Input,
  Select,
  Row,
  Col,
  Spin,
  Alert,
  Slider,
} from "antd";
import {
  ArrowLeftOutlined,
  ShopOutlined,
  StarFilled,
  SaveOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";
import { supplierService } from "../../services/supplierService";
import { supplierReviewService } from "../../services/supplierReviewService";
import styles from "./SupplierEdit.module.css";

const { Option } = Select;
const { TextArea } = Input;

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

const statusOptions = {
  PRIORITY: "Ưu tiên",
  GOOD: "Tốt",
  AVERAGE: "Trung bình",
  REVIEW: "Cần xem xét",
  POOR: "Hạn chế",
};

const CRITERIA = [
  { key: "on_time_score", label: "Đúng tiến độ giao hàng", weight: 30 },
  { key: "quality_score", label: "Chất lượng vật tư", weight: 30 },
  { key: "technical_score", label: "Đáp ứng kỹ thuật", weight: 20 },
  { key: "document_score", label: "Hỗ trợ chứng từ", weight: 10 },
  { key: "cooperation_score", label: "Phối hợp xử lý", weight: 10 },
];

export default function SupplierEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [basicForm] = Form.useForm();
  const [reviewForm] = Form.useForm();

  const [supplier, setSupplier] = useState(null);
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ⭐ Key để force re-mount Form khi data load xong
  const [formKey, setFormKey] = useState(0);

  // Điểm đánh giá
  const [scores, setScores] = useState({
    on_time_score: 5,
    quality_score: 5,
    technical_score: 5,
    document_score: 5,
    cooperation_score: 5,
  });

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [supplierData, reviewData] = await Promise.all([
        supplierService.getById(id),
        supplierReviewService.getByYear(id, currentYear),
      ]);

      setSupplier(supplierData);
      setReview(reviewData);

      // Điểm đánh giá
      if (reviewData) {
        setScores({
          on_time_score: reviewData.on_time_score ?? 5,
          quality_score: reviewData.quality_score ?? 5,
          technical_score: reviewData.technical_score ?? 5,
          document_score: reviewData.document_score ?? 5,
          cooperation_score: reviewData.cooperation_score ?? 5,
        });
      }

      // ⭐ Tăng formKey để force re-mount Form với initialValues mới
      setFormKey((k) => k + 1);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi tải dữ liệu: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ===== Tính điểm TB realtime =====
  const calculateTotalScore = () => {
    const totalWeighted = CRITERIA.reduce(
      (sum, c) => sum + (scores[c.key] || 0) * c.weight,
      0,
    );
    return +(totalWeighted / 100).toFixed(1);
  };

  const totalScore = calculateTotalScore();

  const getRank = (score) => {
    if (score >= 4.5) return { text: "A", color: "green" };
    if (score >= 3.5) return { text: "B", color: "blue" };
    return { text: "C", color: "orange" };
  };

  const rank = getRank(totalScore);

  const handleScoreChange = (key, value) => {
    setScores((prev) => ({ ...prev, [key]: value }));
  };

  // ===== SUBMIT =====
  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      const basicValues = await basicForm.validateFields();

      // ⭐ Lấy comment trực tiếp từ form (không validate vì có thể trống)
      const comment = reviewForm.getFieldValue("comment") || null;

      const calculatedRank = getRank(totalScore).text;

      // 1. Update NCC
      await supplierService.update(id, {
        ...basicValues,
        rating: totalScore,
        rank: calculatedRank,
      });

      // 2. Upsert đánh giá
      await supplierReviewService.upsert({
        supplier_id: Number(id),
        year: currentYear,
        on_time_score: scores.on_time_score,
        quality_score: scores.quality_score,
        technical_score: scores.technical_score,
        document_score: scores.document_score,
        cooperation_score: scores.cooperation_score,
        comment: comment,
      });

      toast.success("Cập nhật thành công!");
      navigate(`/dashboard/suppliers/${id}`);
    } catch (error) {
      console.error(error);

      if (error?.errorFields) {
        toast.warning("Vui lòng kiểm tra lại các thông tin bắt buộc");
      } else {
        toast.error("Lỗi: " + error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spin size="large" />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className={styles.page}>
        <Alert
          message="Không tìm thấy nhà cung cấp!"
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Button onClick={() => navigate("/dashboard/suppliers")}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* BREADCRUMB */}
      

      {/* HEADER */}
      <div className={styles.pageHeader}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/dashboard/suppliers/${id}`)}
          type="text"
          className={styles.backBtn}
        >
          Quay lại
        </Button>
      </div>

      {/* TITLE */}
      

      <Row gutter={20}>
        {/* ============ CỘT TRÁI: THÔNG TIN ============ */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <span className={styles.cardTitle}>
                <ShopOutlined className={styles.cardIcon} />
                Thông tin cơ bản
              </span>
            }
            className={styles.card}
            bordered={false}
          >
            <Form
              form={basicForm}
              key={`basic-${formKey}`}
              layout="vertical"
              requiredMark={false}
              className={styles.form}
              // ⭐ initialValues để fill khi mount
              initialValues={{
                name: supplier.name,
                tax_code: supplier.tax_code,
                field: supplier.field,
                status: supplier.status,
                phone: supplier.phone,
                email: supplier.email,
                address: supplier.address,
              }}
            >
              <Form.Item
                label="Tên nhà cung cấp"
                name="name"
                rules={[
                  { required: true, message: "Vui lòng nhập tên" },
                  { min: 2, message: "Tên ít nhất 2 ký tự" },
                ]}
              >
                <Input size="large" placeholder="MarineTech VN" />
              </Form.Item>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label="Mã số thuế"
                    name="tax_code"
                    rules={[
                      { required: true, message: "Vui lòng nhập MST" },
                      {
                        pattern: /^[0-9]{10,13}$/,
                        message: "MST phải là 10-13 chữ số",
                      },
                    ]}
                  >
                    <Input size="large" placeholder="0101234567" />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label="Lĩnh vực cung cấp"
                    name="field"
                    rules={[{ required: true, message: "Chọn lĩnh vực" }]}
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
                    label="Số điện thoại"
                    name="phone"
                    rules={[
                      {
                        pattern: /^[0-9]{10,11}$/,
                        message: "SĐT phải là 10-11 chữ số",
                      },
                    ]}
                  >
                    <Input size="large" placeholder="0123456789" />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label="Email"
                    name="email"
                    rules={[{ type: "email", message: "Email không hợp lệ" }]}
                  >
                    <Input size="large" placeholder="contact@company.com" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Địa chỉ" name="address">
                <Input
                  size="large"
                  placeholder="123 Nguyễn Văn Linh, Vũng Tàu"
                />
              </Form.Item>

              <Form.Item
                label="Trạng thái"
                name="status"
                rules={[{ required: true, message: "Chọn trạng thái" }]}
              >
                <Select size="large">
                  {Object.entries(statusOptions).map(([value, text]) => (
                    <Option key={value} value={value}>
                      {text}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* ============ CỘT PHẢI: ĐÁNH GIÁ ============ */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <span className={styles.cardTitle}>
                <StarFilled
                  className={styles.cardIcon}
                  style={{ color: "#faad14" }}
                />
                Đánh giá năm {currentYear}
              </span>
            }
            className={styles.card}
            bordered={false}
          >
            {/* Điểm TB */}
            <div className={styles.scoreHeader}>
              <div className={styles.scoreNumber}>{totalScore}</div>
              <div className={styles.scoreInfo}>
                <div className={styles.scoreLabel}>Điểm TB / 5</div>
                <div className={styles.scoreStars}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <StarFilled
                      key={s}
                      className={
                        s <= Math.round(totalScore)
                          ? styles.starActive
                          : styles.starInactive
                      }
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Slider từng tiêu chí */}
            <div className={styles.criteriaList}>
              {CRITERIA.map((c) => (
                <div key={c.key} className={styles.criteriaItem}>
                  <div className={styles.criteriaHeader}>
                    <span className={styles.criteriaLabel}>
                      {c.label}
                      <span className={styles.criteriaWeight}>
                        ({c.weight}%)
                      </span>
                    </span>
                    <span className={styles.criteriaScore}>
                      {scores[c.key]}/5
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={5}
                    step={1}
                    value={scores[c.key]}
                    onChange={(val) => handleScoreChange(c.key, val)}
                    marks={{
                      0: "0",
                      1: "1",
                      2: "2",
                      3: "3",
                      4: "4",
                      5: "5",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Nhận xét */}
            <Form
              form={reviewForm}
              key={`review-${formKey}`}
              layout="vertical"
              // ⭐ initialValues sẽ fill khi Form mount
              initialValues={{
                comment: review?.comment || "",
              }}
            >
              <Form.Item label="Nhận xét chung" name="comment">
                <TextArea
                  rows={4}
                  placeholder="Nhập nhận xét về nhà cung cấp..."
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>

      {/* FOOTER */}
      <div className={styles.footer}>
        <Button
          onClick={() => navigate(`/dashboard/suppliers/${id}`)}
          size="large"
        >
          Hủy
        </Button>
        <Button
          type="primary"
          size="large"
          icon={<SaveOutlined />}
          loading={submitting}
          onClick={handleSubmit}
        >
          Lưu thay đổi
        </Button>
      </div>
    </div>
  );
}
