// src/screens/admin/WorkshopDashboard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Header from '../../components/Header.jsx';
import { getCurrentUser, logout as apiLogout } from '../../services/auth.service';
import { clearAuth } from '../../utils/authUtils';
import { hasPermission, SCOPES } from '../../utils/permissionsFront';
import ProductList from '../products/ProductList.jsx';
import CategoryList from '../categories/CategoryList.jsx';
import BrandList from '../brands/BrandList.jsx';
import BudgetList from '../budgets/BudgetList.jsx';
import WorkOrderList from './WorkOrderList.jsx';
import AdminOrderList from './AdminOrderList.jsx';
import RoleRequestsPanel from '../../components/RoleRequestsPanel.jsx';
import SiteSettingsScreen from './SiteSettingsScreen.jsx';
import ChatTest from '../../components/chatTest.jsx';
import { listRoleRequests, resolveRoleRequest } from '../../services/users.service';
import '../../components/css/header.css';
import '../../components/css/adminDashboard.css';
import UsersRolesList from './UsersRolesList.jsx';

const USERS_MODULE_ENABLED = true;

function DashboardHome({
  onSelect,
  canViewProducts,
  canViewCategories,
  canViewBrands,
  canViewUsers,
  canViewWorkOrders,
  canViewBudgets,
  canViewOrders,
  canViewSiteSettings,
}) {
  const tiles = [
    canViewProducts && {
      key: 'products',
      title: 'Productos',
      desc: 'Alta, edición y listado de productos del catálogo.',
      icon: '📦',
      btn: 'Ir a productos',
      tone: 'chap',
      disabled: false,
    },
    canViewCategories && {
      key: 'categories',
      title: 'Categorías',
      desc: 'Organizá el catálogo por grupos y subgrupos.',
      icon: '🧩',
      btn: 'Ir a categorías',
      tone: 'chap',
      disabled: false,
    },
    canViewBrands && {
      key: 'brands',
      title: 'Marcas',
      desc: 'Gestioná marcas, modelos y alias.',
      icon: '🏷️',
      btn: 'Ir a marcas',
      tone: 'chap',
      disabled: false,
    },
    canViewBudgets && {
      key: 'budgets',
      title: 'Presupuestos',
      desc: 'Creá, editá y administrá presupuestos del taller.',
      icon: '🧾',
      btn: 'Ir a presupuestos',
      tone: 'chap',
      disabled: false,
    },
    canViewWorkOrders && {
      key: 'workOrders',
      title: 'Órdenes de Trabajo',
      desc: 'Seguimiento de OT: estado, tareas y notas.',
      icon: '🛠️',
      btn: 'Ir a OT',
      tone: 'chap',
      disabled: false,
    },
    canViewOrders && {
      key: 'orders',
      title: 'Compras',
      desc: 'Consultá compras realizadas en la tienda online.',
      icon: '🧺',
      btn: 'Ver compras',
      tone: 'dark',
      disabled: false,
    },

    canViewUsers && {
      key: 'users',
      title: 'Usuarios y roles',
      desc: 'Gestión de usuarios y permisos del sistema.',
      icon: '👤',
      btn: 'En desarrollo',
      tone: 'chap',
      disabled: !USERS_MODULE_ENABLED,
    },

    canViewSiteSettings && {
      key: 'siteSettings',
      title: 'Configuración del sitio',
      desc: 'Configuración del sitio web.',
      icon: '⚙️',
      btn: 'Ir a configuración',
      tone: 'chap',
      disabled: false,
    },
  ].filter(Boolean);

  return (
    <div className="adm-panel">
      <div className="adm-hero">
        <div>
          <div className="adm-badge">Panel del Taller</div>
          <h2 className="adm-title">Panel de control</h2>
          <p className="adm-subtitle">
            Accedé rápidamente a la gestión del taller: productos, categorías, marcas, presupuestos,
            OT, compras y usuarios.
          </p>
        </div>

        <div className="adm-quick">
          <div className="adm-quick-card">
            <div className="adm-quick-icon">⚡</div>
            <div>
              <div className="adm-quick-title">Gestión rápida</div>
              <div className="adm-quick-sub">Navegación directa por módulos</div>
            </div>
          </div>
          <div className="adm-quick-card">
            <div className="adm-quick-icon">📈</div>
            <div>
              <div className="adm-quick-title">Operación</div>
              <div className="adm-quick-sub">Control del flujo del taller</div>
            </div>
          </div>
          <div className="adm-quick-card">
            <div className="adm-quick-icon">🔒</div>
            <div>
              <div className="adm-quick-title">Permisos</div>
              <div className="adm-quick-sub">Según rol del usuario</div>
            </div>
          </div>
        </div>
      </div>

      <div className="adm-grid">
        {tiles.map((t) => (
          <div key={t.key} className="adm-tile">
            <div className="adm-tile-head">
              <div className="adm-tile-icon">{t.icon}</div>
              <div>
                <div className="adm-tile-title">{t.title}</div>
                <div className="adm-tile-desc">{t.desc}</div>
              </div>
            </div>

            <button
              className={`btn ${t.tone === 'dark' ? 'btn-dark' : 'btn-chapacar'} w-100 mt-3`}
              onClick={() => !t.disabled && onSelect(t.key)}
              type="button"
              disabled={t.disabled}
            >
              {t.btn}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WorkshopDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const user = getCurrentUser();
  const role = user?.role || 'client';

  const canViewProducts = hasPermission(role, 'products', [SCOPES.canView]);
  const canViewCategories = hasPermission(role, 'categories', [SCOPES.canView]);
  const canViewBrands = hasPermission(role, 'brands', [SCOPES.canView]);
  const canViewUsers = hasPermission(role, 'users', [SCOPES.canView]);
  const canEditUsers = hasPermission(role, 'users', [SCOPES.canEdit]);
  const canViewOrders = hasPermission(role, 'adminScreen', [SCOPES.canView]);
  const canViewSiteSettings = hasPermission(role, 'siteSettings', [SCOPES.canView]);
  const canEditSiteSettings = hasPermission(role, 'siteSettings', [SCOPES.canEdit]);
  const canViewBudgets = hasPermission(role, 'products', [SCOPES.canView]);
  const canViewWorkOrders = hasPermission(role, 'adminScreen', [SCOPES.canView]);

  const sectionFromUrl = searchParams.get('section') || 'dashboard';
  const [section, setSection] = useState(sectionFromUrl);

  useEffect(() => {
    const s = searchParams.get('section') || 'dashboard';

    if (s === 'users' && !USERS_MODULE_ENABLED) {
      setSection('dashboard');
      setSearchParams((prev) => {
        const p = new URLSearchParams(prev);
        p.set('section', 'dashboard');
        p.delete('id');
        return p;
      });
      return;
    }

    setSection(s);
  }, [searchParams, setSearchParams]);

  const goSection = (sec) => {
    if (sec === 'users' && !USERS_MODULE_ENABLED) return;

    setSection(sec);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('section', sec);
      if (sec !== 'workOrders') p.delete('id');
      return p;
    });
  };

  const [requests, setRequests] = useState([]);
  const [loadingReq, setLoadingReq] = useState(false);
  const pendingCount = useMemo(() => requests.length, [requests]);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (section === 'mechanicRole' && canEditUsers) {
      (async () => {
        try {
          setLoadingReq(true);
          const data = await listRoleRequests();
          setRequests(data || []);
        } catch (e) {
          console.error(e);
          toast.error('No se pudieron cargar las solicitudes');
        } finally {
          setLoadingReq(false);
        }
      })();
    }
  }, [section, canEditUsers]);

  const handleResolve = async (id, action) => {
    const ok = window.confirm(
      action === 'approve'
        ? '¿Aceptar esta solicitud de rol?'
        : '¿Rechazar esta solicitud de rol?'
    );
    if (!ok) return;

    try {
      await resolveRoleRequest(id, action);
      toast.success(action === 'approve' ? 'Solicitud aprobada' : 'Solicitud rechazada');
      setRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || e.message || 'No se pudo procesar la solicitud');
    }
  };

  const onLogout = async () => {
    try {
      await apiLogout();
    } catch { }
    clearAuth();
    toast.info('Sesión cerrada');
    navigate('/signin');
  };

  const sectionTitle = useMemo(() => {
    const map = {
      dashboard: 'Panel general',
      products: 'Productos',
      categories: 'Categorías',
      brands: 'Marcas',
      budgets: 'Presupuestos',
      workOrders: 'Órdenes de trabajo',
      orders: 'Compras',
      users: 'Usuarios y roles',
      mechanicRole: 'Solicitudes de rol',
      siteSettings: 'Configuración del sitio',
    };

    if (section === 'users' && !USERS_MODULE_ENABLED) return map.dashboard;

    return map[section] || 'Panel';
  }, [section]);

  const renderContent = () => {
    switch (section) {
      case 'products':
        return <ProductList />;
      case 'categories':
        return <CategoryList />;
      case 'brands':
        return <BrandList />;
      case 'budgets':
        return <BudgetList />;
      case 'workOrders':
        return <WorkOrderList embedded />;
      case 'orders':
        return <AdminOrderList />;
      case 'users':
        if (!canViewUsers) {
          return <div className="alert alert-warning">No tenés permisos para ver usuarios.</div>;
        }
        return <UsersRolesList />;

      case 'mechanicRole':
        if (!canEditUsers) {
          return <div className="alert alert-warning">No tenés permisos para gestionar solicitudes de rol.</div>;
        }
        return (
          <RoleRequestsPanel
            requests={requests}
            loading={loadingReq}
            onApprove={(id) => handleResolve(id, 'approve')}
            onReject={(id) => handleResolve(id, 'reject')}
            onClose={() => goSection('dashboard')}
          />
        );

      case 'siteSettings':
        if (!canViewSiteSettings) {
          return <div className="alert alert-warning">No tenés permisos para acceder a la configuración del sitio.</div>;
        }
        return <SiteSettingsScreen canEdit={canEditSiteSettings} />;

      default:
        return (
          <DashboardHome
            onSelect={goSection}
            canViewProducts={canViewProducts}
            canViewCategories={canViewCategories}
            canViewBrands={canViewBrands}
            canViewUsers={canViewUsers}
            canViewBudgets={canViewBudgets}
            canViewWorkOrders={canViewWorkOrders}
            canViewOrders={canViewOrders}
            canViewSiteSettings={canViewSiteSettings}
          />
        );
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header user={user} onLogout={onLogout} variant="admin" />

      <div className="d-flex flex-grow-1">
        {/* Sidebar */}
        <aside className="adm-sidebar">
          <div className="adm-sidebar-top">
            <div className="adm-sidebar-title">Panel del taller</div>
            {user && <div className="adm-sidebar-sub">Jefe: {user.name}</div>}
          </div>

          <nav className="adm-nav">
            <button
              className={`adm-navbtn ${section === 'dashboard' ? 'is-active' : ''}`}
              onClick={() => goSection('dashboard')}
              type="button"
            >
              <span>🏠</span>
              <span>Panel general</span>
            </button>

            {canViewProducts && (
              <button
                className={`adm-navbtn ${section === 'products' ? 'is-active' : ''}`}
                onClick={() => goSection('products')}
                type="button"
              >
                <span>📦</span>
                <span>Productos</span>
              </button>
            )}

            {canViewCategories && (
              <button
                className={`adm-navbtn ${section === 'categories' ? 'is-active' : ''}`}
                onClick={() => goSection('categories')}
                type="button"
              >
                <span>🧩</span>
                <span>Categorías</span>
              </button>
            )}

            {canViewBrands && (
              <button
                className={`adm-navbtn ${section === 'brands' ? 'is-active' : ''}`}
                onClick={() => goSection('brands')}
                type="button"
              >
                <span>🏷️</span>
                <span>Marcas</span>
              </button>
            )}

            {canViewBudgets && (
              <button
                className={`adm-navbtn ${section === 'budgets' ? 'is-active' : ''}`}
                onClick={() => goSection('budgets')}
                type="button"
              >
                <span>🧾</span>
                <span>Presupuestos</span>
              </button>
            )}

            {canViewWorkOrders && (
              <button
                className={`adm-navbtn ${section === 'workOrders' ? 'is-active' : ''}`}
                onClick={() => goSection('workOrders')}
                type="button"
              >
                <span>🛠️</span>
                <span>Órdenes de trabajo</span>
              </button>
            )}

            {canViewOrders && (
              <button
                className={`adm-navbtn ${section === 'orders' ? 'is-active' : ''}`}
                onClick={() => goSection('orders')}
                type="button"
              >
                <span>🧺</span>
                <span>Compras</span>
              </button>
            )}

            {canViewUsers && (
              <button
                className={`adm-navbtn ${section === 'users' ? 'is-active' : ''}`}
                onClick={() => goSection('users')}
                type="button"
              >
                <span>👤</span>
                <span>Usuarios y roles</span>
              </button>
            )}

            <div className="adm-sep" />

            {canEditUsers && (
              <>
                <div className="adm-navlabel">Rol de mecánico</div>
                <button
                  className={`adm-navbtn adm-navbtn-success ${section === 'mechanicRole' ? 'is-active' : ''}`}
                  onClick={() => goSection('mechanicRole')}
                  type="button"
                >
                  <span>✅</span>
                  <span className="d-flex align-items-center justify-content-between w-100">
                    <span>Solicitudes</span>
                    {pendingCount > 0 && <span className="adm-badge-count">{pendingCount}</span>}
                  </span>
                </button>
              </>
            )}

            <div className="adm-sep" />

            <div className="adm-navlabel">Configuración</div>

            {canViewSiteSettings && (
              <button
                className={`adm-navbtn ${section === 'siteSettings' ? 'is-active' : ''}`}
                onClick={() => goSection('siteSettings')}
                type="button"
              >
                <span>⚙️</span>
                <span>Configuración del sitio</span>
              </button>
            )}

            <button className="adm-navbtn" type="button" disabled>
              <span>📊</span>
              <span>Informes (en desarrollo)</span>
            </button>
          </nav>
        </aside>

        {/* Contenido */}
        <main className="adm-main">
          <div className="adm-topbar">
            <div>
              <div className="adm-topbar-kicker">Panel del taller</div>
              <h3 className="adm-topbar-title">{sectionTitle}</h3>
            </div>

            <div className="adm-topbar-actions">
              {section !== 'dashboard' && (
                <button
                  className="btn btn-outline-secondary btn-sm"
                  type="button"
                  onClick={() => goSection('dashboard')}
                >
                  ← Volver al panel
                </button>
              )}
            </div>
          </div>

          <div className="adm-content">{renderContent()}</div>
        </main>
      </div>

      {isChatOpen && <ChatTest onClose={() => setIsChatOpen(false)} />}
      <button
        type="button"
        onClick={() => setIsChatOpen((prev) => !prev)}
        className="chap-fab"
        aria-label={isChatOpen ? 'Cerrar chat' : 'Abrir chat'}
        title={isChatOpen ? 'Cerrar chat' : 'Abrir chat'}
      >
        {isChatOpen ? '×' : '💬'}
      </button>
    </div>
  );
}
