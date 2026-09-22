import React from "react";
import { CheckOutlined } from "@ant-design/icons";
import styles from "./RequestProgress.module.css";

const STEPS = [
  { key: "DRAFT", label: "Nháp", desc: "Đang tạo nội dung" },
  { key: "PENDING", label: "Chờ duyệt", desc: "Chờ quản lý duyệt" },
  { key: "APPROVED", label: "Đã duyệt", desc: "Đã phê duyệt" },
  { key: "COMPLETED", label: "Hoàn tất", desc: "Đã nhập kho" },
];

const getCurrentStep = (status) => {
  if (status === "REJECTED") return -1;
  const idx = STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
};

const RequestProgress = ({ status }) => {
  const currentStep = getCurrentStep(status);
  const isRejected = status === "REJECTED";

  return (
    <div className={styles.wrapper}>
      <div className={styles.steps}>
        {STEPS.map((step, index) => {
          const isCompleted = !isRejected && index < currentStep;
          const isCurrent = !isRejected && index === currentStep;
          const isPending = !isRejected && index > currentStep;

          return (
            <div key={step.key} className={styles.stepItem}>
              {/* Connector line (bên trái) */}
              {index > 0 && (
                <div
                  className={`${styles.connector} ${
                    isCompleted || isCurrent
                      ? styles.connectorDone
                      : styles.connectorPending
                  }`}
                />
              )}

              {/* Step circle + text */}
              <div className={styles.stepContent}>
                <div
                  className={`${styles.circle} ${
                    isCompleted
                      ? styles.circleDone
                      : isCurrent
                        ? styles.circleCurrent
                        : styles.circlePending
                  }`}
                >
                  {isCompleted ? (
                    <CheckOutlined className={styles.checkIcon} />
                  ) : (
                    <span className={styles.stepNumber}>{index + 1}</span>
                  )}
                </div>

                <div className={styles.stepText}>
                  <div
                    className={`${styles.stepLabel} ${
                      isCompleted
                        ? styles.labelDone
                        : isCurrent
                          ? styles.labelCurrent
                          : styles.labelPending
                    }`}
                  >
                    {step.label}
                  </div>
                  <div
                    className={`${styles.stepDesc} ${
                      isCompleted || isCurrent
                        ? styles.descActive
                        : styles.descPending
                    }`}
                  >
                    {step.desc}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rejected banner */}
      {isRejected && (
        <div className={styles.rejectedBanner}>Yêu cầu này đã bị từ chối</div>
      )}
    </div>
  );
};

export default RequestProgress;
