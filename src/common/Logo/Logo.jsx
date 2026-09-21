import React from "react";
import { Link } from "react-router-dom";

const Logo = () => (
  <Link to="/dashboard">
    <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#4f46e5" }}>
      MPS System
    </span>
  </Link>
);

export default Logo;
