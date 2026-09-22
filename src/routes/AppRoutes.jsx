import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../layout/MainLayout";
import PrivateRoute from "./PrivateRoute";
import Login from "../pages/auth/Login";
import Dashboard from "../pages/dashboard/Dashboard";
import UserList from "../pages/users/UserList";
import SupplierList from "../pages/suppliers/SupplierList";
import SupplierDetail from "../pages/suppliers/SupplierDetail";
import SupplierEdit from "../pages/suppliers/SupplierEdit";
import MaterialList from "../pages/materials/MaterialList";
import CreateRequest from "../pages/purchase-requests/CreateRequest";
import EditRequest from "../pages/purchase-requests/EditRequest";
import RequestList from "../pages/purchase-requests/RequestList";
import ApproveRequest from "../pages/purchase-requests/ApproveRequest";
import RequestDetail from "../pages/purchase-requests/RequestDetail";

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
        <Route path="dashboard/materials/list" element={<MaterialList />} />

        {/* ===== Nhà cung cấp ===== */}
        <Route path="dashboard/suppliers" element={<SupplierList />} />
        <Route path="dashboard/suppliers/edit/:id" element={<SupplierEdit />} />
        <Route path="dashboard/suppliers/:id" element={<SupplierDetail />} />

        {/* ===== Purchase Requests ===== */}
        <Route
          path="dashboard/purchase-requests/list"
          element={<RequestList />}
        />
        <Route
          path="dashboard/purchase-requests/create"
          element={<CreateRequest />}
        />
        <Route
          path="dashboard/purchase-requests/edit/:id"
          element={<EditRequest />}
        />
        <Route
          path="dashboard/purchase-requests/approve/:id"
          element={<ApproveRequest />}
        />
        <Route
          path="dashboard/purchase-requests/:id"
          element={<RequestDetail />}
        />
      </Route>
    </Routes>
  );
}
