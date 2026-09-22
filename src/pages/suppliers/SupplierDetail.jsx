import React, { useState, useEffect } from "react";
import { Card, Button, Tag, Spin, Alert, Empty, Table } from "antd";
import {
  ArrowLeftOutlined,
  StarFilled,
  FileTextOutlined,
  ShopOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";
import { supplierService } from "../../services/supplierService";
import { supplierReviewService } from "../../services/supplierReviewService";
import styles from "./SupplierDetail.module.css";

const statusLabels = {
  PRIORITY: { text: "Nhà cung cấp ưu tiên", color: "green" },
  GOOD: { text: "Nhà cung cấp tốt", color: "blue" },
  AVERAGE: { text: "Trung bình", color: "orange" },
  REVIEW: { text: "Cần xem xét", color: "volcano" },
  POOR: { text: "Hạn chế", color: "red" },
};

const CRITERIA = [
  { key: "on_time_score", label: "Đúng tiến độ giao hàng", weight: 30 },
  { key: "quality_score", label: "Chất lượng vật tư", weight: 30 },
  { key: "technical_score", label: "Đáp ứng kỹ thuật", weight: 20 },
  { key: "document_score", label: "Hỗ trợ chứng từ", weight: 10 },
  { key: "cooperation_score", label: "Phối hợp xử lý", weight: 10 },
];

export default function SupplierDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [supplier, setSupplier] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [supplierData, reviewsData] = await Promise.all([
        supplierService.getById(id),
        supplierReviewService.getBySupplier(id),
      ]);

      setSupplier(supplierData);
      setReviews(reviewsData);
    } catch (error) {
      toast.error("Lỗi tải dữ liệu: " + error.message);
    } finally {
      setLoading(false);
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
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/dashboard/suppliers")}
        >
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  // Đánh giá mới nhất
  const currentReview = reviews[0] || null;

  const getScore = (review) => {
    if (!review) return 0;
    const totalWeighted = CRITERIA.reduce(
      (sum, c) => sum + (review[c.key] || 0) * c.weight,
      0,
    );
    return +(totalWeighted / 100).toFixed(1);
  };

  const totalScore = getScore(currentReview);

  const getRank = (score) => {
    if (score >= 4.5) return { text: "A", color: "green" };
    if (score >= 3.5) return { text: "B", color: "blue" };
    return { text: "C", color: "orange" };
  };

  const rank = getRank(totalScore);
  const status = statusLabels[supplier.status] || statusLabels.AVERAGE;

  // Radar chart data
  const radarData = CRITERIA.map((c) => ({
    criteria: c.label.split(" ").slice(0, 2).join(" "),
    supplier: currentReview?.[c.key] || 0,
    average: 3.5,
  }));

  // Bảng tiêu chí
  const criteriaColumns = [
    {
      title: "Tiêu chí",
      dataIndex: "label",
      key: "label",
      render: (v) => <span className={styles.criteriaName}>{v}</span>,
    },
    {
      title: "Trọng số",
      key: "weight",
      width: 110,
      align: "center",
      render: (_, r) => <span className={styles.weightCell}>{r.weight}%</span>,
    },
    {
      title: "Điểm",
      key: "score",
      width: 90,
      align: "center",
      render: (_, r) => (
        <span className={styles.scoreCell}>{currentReview?.[r.key] || 0}</span>
      ),
    },
    {
      title: "Điểm quy đổi",
      key: "weightedScore",
      width: 140,
      align: "center",
      render: (_, r) => (
        <span className={styles.weightedCell}>
          {(((currentReview?.[r.key] || 0) * r.weight) / 10).toFixed(1)}
        </span>
      ),
    },
  ];

  const criteriaData = CRITERIA.map((c) => ({ ...c, key: c.key }));

  // ⭐ Danh sách thông tin chi tiết — chỉ hiện field nào có giá trị
  const infoItems = [
    supplier.tax_code && {
      icon: <FileTextOutlined />,
      label: "Mã số thuế",
      value: supplier.tax_code,
    },
    supplier.field && {
      icon: <ShopOutlined />,
      label: "Lĩnh vực cung cấp",
      value: supplier.field,
    },
    supplier.phone && {
      icon: <PhoneOutlined />,
      label: "Số điện thoại",
      value: supplier.phone,
    },
    supplier.email && {
      icon: <MailOutlined />,
      label: "Email",
      value: supplier.email,
    },
    supplier.address && {
      icon: <EnvironmentOutlined />,
      label: "Địa chỉ",
      value: supplier.address,
      span: 2, // Chiếm 2 cột
    },
    supplier.contract_count !== undefined && {
      icon: <CalendarOutlined />,
      label: "Số hợp đồng đã thực hiện",
      value: `${supplier.contract_count} hợp đồng`,
    },
  ].filter(Boolean);

  return (
    <div className={styles.page}>
      {/* ==================== PAGE HEADER ==================== */}
      <div className={styles.pageHeader}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/dashboard/suppliers")}
          type="text"
          className={styles.backBtn}
        >
          Quay lại
        </Button>

        
      </div>

      {/* ==================== HERO NCC ==================== */}
      <Card className={styles.heroCard} bordered={false}>
        <div className={styles.heroContent}>
          <div className={styles.heroLogo}>
            {String(supplier.name || "?")
              .trim()
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className={styles.heroInfo}>
            <h2 className={styles.heroName}>{supplier.name}</h2>

            <div className={styles.heroMetaGrid}>
              <div className={styles.heroMetaItem}>
                <span className={styles.metaLabel}>Mã số thuế</span>
                <span className={styles.metaValue}>
                  {supplier.tax_code || "—"}
                </span>
              </div>

              <div className={styles.heroMetaItem}>
                <span className={styles.metaLabel}>Lĩnh vực cung cấp</span>
                <span className={styles.metaValue}>
                  {supplier.field || "—"}
                </span>
              </div>

              <div className={styles.heroMetaItem}>
                <span className={styles.metaLabel}>Số hợp đồng</span>
                <span className={styles.metaValue}>
                  {supplier.contract_count || 0}
                </span>
              </div>

              <div className={styles.heroMetaItem}>
                <span className={styles.metaLabel}>Xếp loại</span>
                <Tag color={rank.color} className={styles.metaTag}>
                  Hạng {rank.text}
                </Tag>
              </div>

              <div className={styles.heroMetaItem}>
                <span className={styles.metaLabel}>Trạng thái</span>
                <Tag color={status.color} className={styles.metaTag}>
                  {status.text}
                </Tag>
              </div>

              <div className={styles.heroMetaItem}>
                <span className={styles.metaLabel}>Điểm TB</span>
                <span className={styles.metaValueBlue}>{totalScore} / 5</span>
              </div>
            </div>
          </div>

          <div className={styles.heroScoreBox}>
            <div className={styles.heroScoreLabel}>Điểm đánh giá tổng</div>
            <div className={styles.heroScoreValue}>
              <span className={styles.heroScoreNumber}>{totalScore}</span>
              <span className={styles.heroScoreMax}>/ 5</span>
            </div>
            <div className={styles.heroStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <StarFilled
                  key={star}
                  className={
                    star <= Math.round(totalScore)
                      ? styles.starActive
                      : styles.starInactive
                  }
                />
              ))}
            </div>
            <Tag color={status.color} className={styles.heroStatus}>
              {status.text}
            </Tag>
          </div>
        </div>
      </Card>

      {/* ==================== ⭐ THÔNG TIN CHI TIẾT ==================== */}
      <Card
        title={
          <span className={styles.sectionTitle}>
            <ShopOutlined className={styles.sectionIcon} />
            Thông tin chi tiết
          </span>
        }
        className={styles.infoCard}
        bordered={false}
      >
        <div className={styles.infoGrid}>
          {infoItems.map((item, idx) => (
            <div
              key={idx}
              className={styles.infoItem}
              style={{
                gridColumn: item.span === 2 ? "span 2" : "span 1",
              }}
            >
              <div className={styles.infoLabel}>
                <span className={styles.infoLabelIcon}>{item.icon}</span>
                {item.label}
              </div>
              <div className={styles.infoValue}>{item.value}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* ==================== NỘI DUNG ĐÁNH GIÁ ==================== */}
      {!currentReview ? (
        <Card className={styles.emptyCard} bordered={false}>
          <Empty description="Chưa có dữ liệu đánh giá cho nhà cung cấp này" />
        </Card>
      ) : (
        <>
          {/* GRID: Bảng tiêu chí + Radar */}
          <Card className={styles.reviewCard} bordered={false}>
            <div className={styles.reviewGrid}>
              {/* Trái: Bảng tiêu chí */}
              <div className={styles.criteriaTableWrap}>
                <h3 className={styles.sectionTitle}>Kết quả đánh giá</h3>
                <Table
                  columns={criteriaColumns}
                  dataSource={criteriaData}
                  rowKey="key"
                  pagination={false}
                  size="middle"
                  summary={() => (
                    <Table.Summary.Row className={styles.summaryRow}>
                      <Table.Summary.Cell index={0} colSpan={3}>
                        <strong>Tổng điểm</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3} align="center">
                        <strong className={styles.totalScore}>
                          {totalScore} / 5
                        </strong>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                />
              </div>

              {/* Phải: Radar chart */}
              <div className={styles.radarWrap}>
                <h3 className={styles.sectionTitle}>
                  Biểu đồ đánh giá năng lực
                </h3>

                <ResponsiveContainer width="100%" height={320}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis
                      dataKey="criteria"
                      tick={{ fontSize: 12, fill: "#475569" }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 5]}
                      tick={{ fontSize: 10 }}
                    />
                    <Radar
                      name="Nhà cung cấp"
                      dataKey="supplier"
                      stroke="#1677ff"
                      fill="#1677ff"
                      fillOpacity={0.35}
                      strokeWidth={2}
                    />
                    <Radar
                      name="Trung bình ngành"
                      dataKey="average"
                      stroke="#cbd5e1"
                      fill="#cbd5e1"
                      fillOpacity={0.2}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          {/* Nhận xét + Xếp loại */}
          <Card className={styles.bottomCard} bordered={false}>
            <div className={styles.bottomGrid}>
              <div className={styles.commentBox}>
                <div className={styles.commentHeader}>
                  <FileTextOutlined className={styles.commentIcon} />
                  <span>Nhận xét chung</span>
                </div>
                <div className={styles.commentContent}>
                  {currentReview.comment || "Chưa có nhận xét."}
                </div>
              </div>

              <div className={styles.rankBox}>
                <div className={styles.rankLabel}>Xếp loại</div>
                <Tag color={status.color} className={styles.rankTag}>
                  {status.text}
                </Tag>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
