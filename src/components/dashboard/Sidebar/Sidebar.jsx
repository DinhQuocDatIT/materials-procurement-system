import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import styles from "./Sidebar.module.css";
import Logo from "../../../common/Logo/Logo";
import { sidebarMenus } from "../../../configs/sidebarMenu";

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({});

  useEffect(() => {
    const newOpenMenus = {};
    sidebarMenus.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some((child) =>
          location.pathname.startsWith(child.path),
        );
        if (hasActiveChild) newOpenMenus[item.path] = true;
      }
    });
    setOpenMenus((prev) => ({ ...prev, ...newOpenMenus }));
  }, [location.pathname]);

  const toggleSubmenu = (path) => {
    setOpenMenus((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  return (
    <aside className={`${styles.sidebar} ${!isOpen ? styles.closed : ""}`}>
      <div className={styles.topSection}>
        <div className={styles.logoContainer}>
          <Logo />
        </div>
      </div>

      <nav className={styles.nav}>
        {sidebarMenus.map((item) => {
          const hasChildren = item.children && item.children.length > 0;
          const isSubmenuOpen = openMenus[item.path];
          const isChildActive =
            hasChildren &&
            item.children.some((child) =>
              location.pathname.startsWith(child.path),
            );

          if (hasChildren) {
            return (
              <div key={item.path} className={styles.menuGroup}>
                <button
                  type="button"
                  className={`${styles.navLink} ${styles.parentLink} ${
                    isChildActive ? styles.parentActive : ""
                  }`}
                  onClick={() => toggleSubmenu(item.path)}
                  title={!isOpen ? item.name : ""}
                >
                  <div className={styles.iconWrapper}>
                    <FontAwesomeIcon icon={item.icon} className={styles.icon} />
                  </div>
                  <span className={styles.label}>{item.name}</span>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`${styles.chevron} ${
                      isSubmenuOpen ? styles.chevronOpen : ""
                    }`}
                  />
                </button>

                {isOpen && isSubmenuOpen && (
                  <div className={styles.submenu}>
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={({ isActive }) =>
                          `${styles.subLink} ${
                            isActive ? styles.subActive : ""
                          }`
                        }
                      >
                        <span className={styles.subDot}></span>
                        <span className={styles.subLabel}>{child.name}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ""}`
              }
              end={item.path === "/dashboard"}
              title={!isOpen ? item.name : ""}
            >
              <div className={styles.iconWrapper}>
                <FontAwesomeIcon icon={item.icon} className={styles.icon} />
              </div>
              <span className={styles.label}>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
