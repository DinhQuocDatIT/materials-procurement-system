import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import styles from "./MainLayout.module.css";
import Header from "../components/dashboard/Header/Header";
import Sidebar from "../components/dashboard/Sidebar/Sidebar";

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className={styles.mainLayout}>
      <Header onToggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <div className={styles.body}>
        <Sidebar isOpen={isSidebarOpen} currentPath={location.pathname} />
        <main
          className={`${styles.content} ${
            !isSidebarOpen ? styles.expanded : ""
          }`}
        >
          <div className={styles.contentInner}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
