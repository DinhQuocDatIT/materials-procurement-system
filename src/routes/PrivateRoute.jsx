import { Navigate } from "react-router-dom";
import AuthStorage from "../services/AuthStorage";

export default function PrivateRoute({ children }) {
  return AuthStorage.isLoggedIn() ? children : <Navigate to="/login" replace />;
}
