// App.jsx
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import SignInScreen from './screens/signin/SignInScreen.jsx';
import Home from './screens/home/Home.jsx';
import SignUpScreen from './screens/signin/SignUpScreen.jsx';
import ForgotPasswordScreen from './screens/signin/ForgotPasswordScreen.jsx';
import ResetPasswordScreen from './screens/signin/ResetPasswordScreen.jsx';
import UbicacionScreen from './screens/admin/UbicacionScreen';
import ProductList from './screens/products/ProductList.jsx';
import ProductDetail from './screens/products/ProductDetail.jsx';
import CategoryList from './screens/categories/CategoryList.jsx';
import PermissionWrapper from './permissions-utils/permissionWrapper.jsx';
import { SCOPES } from './utils/permissionsFront.js';
import WorkshopDashboard from './screens/admin/WorkshopDashboard.jsx';
import CompanyScreen from './screens/admin/CompanyScreen';
import BrandList from './screens/brands/BrandList.jsx';
import UserList from './screens/users/UserList.jsx';
import UserEdit from './screens/users/UserEdit.jsx';
import ProfileUser from './screens/profileUser/ProfileUser.jsx';
import Reservations from './screens/reservations/Reservations.jsx';
import AdminReservations from './screens/reservations/AdminReservations.jsx';
import CartPage from './screens/cart/CartPage.jsx';
import CheckoutPage from './screens/checkout/CheckoutPage.jsx';
import ProductSearchPage from './screens/products/ProductSearchPage.jsx';
import ForumScreen from "./screens/forum/ForumScreen.jsx";
import FaqScreen from './screens/admin/faqScreen.jsx';
import http from './services/http';
import { saveAuth, clearAuth } from './utils/authUtils';


function RedirectWorkOrderToDashboard() {
  const { id } = useParams();
  return <Navigate to={`/admin?section=workOrders&id=${id}`} replace />;
}

export default function App() {
  useEffect(() => {
    // si existe refreshToken en cookie y es válido -> te devuelve un nuevo accessToken
    http.post('/api/auth/refresh', null, { skipAuth: true })
      .then(({ data }) => {
        // data = { user, accessToken }
        saveAuth(data);
      })
      .catch(() => {
        // si no hay cookie o expiró -> limpiamos storage para evitar "sesión fantasma"
        clearAuth();
      });
  }, []);

  return (
    <Routes>
      {/* PÚBLICO / TIENDA */}
      <Route path="/" element={<Home />} />

      <Route path="/signin" element={<SignInScreen />} />
      <Route path="/signup" element={<SignUpScreen />} />
      <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
      <Route path="/reset-password/:token" element={<ResetPasswordScreen />} />

      <Route path="/products" element={<ProductList />} />
      <Route path="/products/:id" element={<ProductDetail />} />

      <Route path="/categories" element={<CategoryList />} />
      <Route path="/profile" element={<ProfileUser />} />

      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />

      <Route path="/search" element={<ProductSearchPage />} />

      <Route path="/forum" element={<ForumScreen />} />

      {/* MARCAS (con permisos) */}
      <Route
        path="/brands"
        element={
          <PermissionWrapper fn="brands" scopes={[SCOPES.canView]}>
            <BrandList />
          </PermissionWrapper>
        }
      />

      {/* PANEL DEL TALLER (ADMIN) */}
      <Route
        path="/admin"
        element={
          <PermissionWrapper fn="adminScreen" scopes={[SCOPES.canView]}>
            <WorkshopDashboard />
          </PermissionWrapper>
        }
      />

      {/* Rutas "viejas" o de compatibilidad para que redirijan al panel embebido */}
      <Route
        path="/admin/work-orders"
        element={<Navigate to="/admin?section=workOrders" replace />}
      />
      <Route
        path="/admin/work-orders/:id"
        element={<RedirectWorkOrderToDashboard />}
      />

      {/* compat /admin/orders */}
      <Route
        path="/admin/orders"
        element={<Navigate to="/admin?section=orders" replace />}
      />

      {/* Páginas informativas */}
      <Route path="/empresa" element={<CompanyScreen />} />
      <Route path="/ubicacion" element={<UbicacionScreen />} />
      <Route path="/faq" element={<FaqScreen />} />

      {/* USUARIOS (admin) */}
      <Route
        path="/users"
        element={
          <PermissionWrapper fn="users" scopes={[SCOPES.canView]}>
            <UserList />
          </PermissionWrapper>
        }
      />
      <Route
        path="/users/:id/edit"
        element={
          <PermissionWrapper fn="users" scopes={[SCOPES.canEdit]}>
            <UserEdit />
          </PermissionWrapper>
        }
      />

      {/* RESERVAS */}
      <Route path="/reservations" element={<Reservations />} />
      <Route path="/admin/reservations" element={<AdminReservations />} />

      {/* Wildcard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
