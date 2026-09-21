import {
  faChartSimple,
  faBoxesStacked,
  faUserTie,
  faFileInvoice,
  faWarehouse,
  faUsers,
  faGear,
} from "@fortawesome/free-solid-svg-icons";

export const sidebarMenus = [
  { path: "/dashboard", name: "Tổng quan", icon: faChartSimple },
  {
    path: "/dashboard/materials",
    name: "Vật tư",
    icon: faBoxesStacked,
    children: [
      { path: "/dashboard/materials/list", name: "Danh sách vật tư" },
      { path: "/dashboard/materials/categories", name: "Loại vật tư" },
      { path: "/dashboard/materials/units", name: "Đơn vị tính" },
    ],
  },
  { path: "/dashboard/suppliers", name: "Nhà cung cấp", icon: faUserTie },
  {
    path: "/dashboard/purchase-orders",
    name: "Đơn mua hàng",
    icon: faFileInvoice,
    children: [
      { path: "/dashboard/purchase-orders/list", name: "Danh sách đơn" },
      { path: "/dashboard/purchase-orders/create", name: "Tạo đơn mới" },
      { path: "/dashboard/purchase-orders/approval", name: "Phê duyệt đơn" },
    ],
  },
  {
    path: "/dashboard/inventory",
    name: "Kho",
    icon: faWarehouse,
    children: [
      { path: "/dashboard/inventory/stock-in", name: "Nhập kho" },
      { path: "/dashboard/inventory/stock-out", name: "Xuất kho" },
      { path: "/dashboard/inventory/stocktake", name: "Kiểm kê" },
    ],
  },
  { path: "/dashboard/users", name: "Người dùng", icon: faUsers },
  { path: "/dashboard/settings", name: "Cài đặt", icon: faGear },
  { path: "/dashboard/users", name: "Người dùng", icon: faUsers },
];
