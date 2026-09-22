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
    children: [{ path: "/dashboard/materials/list", name: "Danh sách vật tư" }],
  },
  { path: "/dashboard/suppliers", name: "Nhà cung cấp", icon: faUserTie },
  {
    path: "/dashboard/purchase-requests",
    name: "Đơn mua hàng",
    icon: faFileInvoice,
    children: [
      {
        path: "/dashboard/purchase-requests/create",
        name: "Tạo yêu cầu mua sắm",
      },
      { path: "/dashboard/purchase-requests/list", name: "Danh sách yêu cầu" },
    ],
  },
];
