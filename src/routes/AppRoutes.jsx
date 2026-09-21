import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../layout/MainLayout";
import PrivateRoute from "./PrivateRoute";
import Login from "../pages/auth/Login";
import Dashboard from "../pages/dashboard/Dashboard";
import MaterialList from "../pages/materials/MaterialList";
import UserList from "../pages/users/UserList";
import SupplierList from "../pages/suppliers/SupplierList";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Trang đăng nhập - public */}
      <Route path="/login" element={<Login />} />

      {/* Các trang cần đăng nhập */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="dashboard/users" element={<UserList />} />
        <Route path="dashboard/suppliers" element={<SupplierList />} />
        <Route path="dashboard/materials/list" element={<MaterialList />} />
      </Route>
    </Routes>
  );
}
