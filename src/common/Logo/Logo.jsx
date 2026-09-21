import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCubes } from "@fortawesome/free-solid-svg-icons";

const Logo = () => (
  <Link
    to="/dashboard"
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      textDecoration: "none",
    }}
  >
    {/* Icon */}
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: "linear-gradient(135deg, #087f8c, #0ea5a8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 12px rgba(14, 165, 168, 0.3)",
        flexShrink: 0,
      }}
    >
      <FontAwesomeIcon
        icon={faCubes}
        style={{ color: "#ffffff", fontSize: 18 }}
      />
    </div>

    {/* Text - dùng màu đơn giản, chắc chắn hiện */}
    <span
      style={{
        fontSize: "1.05rem",
        fontWeight: 800,
        letterSpacing: "-0.02em",
        color: "#5eead4",
        whiteSpace: "nowrap",
      }}
    >
      MPS System
    </span>
  </Link>
);

export default Logo;
