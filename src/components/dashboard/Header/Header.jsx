import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faBell,
  faChevronDown,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import styles from "./Header.module.css";
import AuthStorage from "../../../services/AuthStorage";

const Header = ({ onToggleSidebar, isSidebarOpen }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const user = AuthStorage.getUser();
  const userName = user?.name || "Người dùng";
  const userRole = user?.role || "STAFF";

  const handleLogout = () => {
    AuthStorage.removeUser();
    toast.success("Đã đăng xuất");
    navigate("/login");
  };

  return (
    <header
      className={`${styles.header} ${!isSidebarOpen ? styles.expanded : ""}`}
    >
      <div className={styles.left}>
        <button
          className={styles.toggleBtn}
          onClick={onToggleSidebar}
          aria-label="Toggle Sidebar"
        >
          <FontAwesomeIcon icon={faBars} className={styles.toggleIcon} />
        </button>
      </div>

      <div className={styles.right}>
        <div className={styles.notificationBtn}>
          <FontAwesomeIcon icon={faBell} className={styles.bellIcon} />
          <span className={styles.badge}></span>
        </div>

        <div className={styles.userProfile} onClick={() => setIsOpen(!isOpen)}>
          <div className={styles.avatar}>
            <img
              src="https://api.dicebear.com/7.x/adventurer/svg?seed=Admin"
              alt="Avatar"
            />
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{userName}</span>
            <span className={styles.userRole}>{userRole}</span>
          </div>
          <FontAwesomeIcon
            icon={faChevronDown}
            className={styles.dropdownIcon}
          />

          {isOpen && (
            <div className={styles.dropdown}>
              <button className={styles.dropdownItem} onClick={handleLogout}>
                <FontAwesomeIcon icon={faRightFromBracket} />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
