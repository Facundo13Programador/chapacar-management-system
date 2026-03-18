import React, { useEffect, useState } from 'react';
import { getUser } from '../utils/authUtils';
import { Link, useNavigate } from 'react-router-dom';
import { requestMechanicRole } from '../services/users.service';
import { toast } from 'react-toastify';
import { getAllReservations } from '../services/reservations.service';
import { getAllOrders } from '../services/orders.service';
import logoCompleto from '../logos/logoFunciona.png';
import '../components/css/header.css';
import { buildWhatsAppLink } from "../utils/whatsapp";

function getInitials(fullName = '') {
  const trimmed = fullName.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  const first = parts[0];
  const last = parts.length > 1 ? parts[parts.length - 1] : '';
  return ((first?.[0] || '') + (last?.[0] || '')).toUpperCase();
}

export default function Header({
  user,
  onLogout,
  onCartOpen,
  onHeaderSearch,
  variant = 'site',
}) {
  const isAdminHeader = variant === 'admin';

  const me = user || getUser();
  const role = me?.role || 'client';
  const navigate = useNavigate();
  const canCreate = me && ['system_admin', 'bussiness_admin'].includes(role);
  const canRequestMechanic = me && role === 'client';
  const [pendingReservations, setPendingReservations] = useState(0);
  const [loadingReservationsCount, setLoadingReservationsCount] = useState(false);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [loadingOrdersCount, setLoadingOrdersCount] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');
  const isMechanic = me && role === "operator";



  const whatsappLink = buildWhatsAppLink(); 

  useEffect(() => {
    let isMounted = true;

    async function fetchCounts() {
      if (!canCreate) {
        if (isMounted) {
          setPendingReservations(0);
          setPendingOrders(0);
        }
        return;
      }

      try {
        setLoadingReservationsCount(true);
        setLoadingOrdersCount(true);

        const [reservations, orders] = await Promise.all([
          getAllReservations(),
          getAllOrders({ status: 'pending' }),
        ]);

        if (!isMounted) return;

        const pendingResCount = Array.isArray(reservations)
          ? reservations.filter((r) => r.status === 'pending').length
          : 0;

        const pendingOrdCount = Array.isArray(orders) ? orders.length : 0;

        setPendingReservations(pendingResCount);
        setPendingOrders(pendingOrdCount);
      } catch (e) {
        console.error('No se pudieron cargar contadores (reservas/órdenes)', e);
      } finally {
        if (!isMounted) return;
        setLoadingReservationsCount(false);
        setLoadingOrdersCount(false);
      }
    }

    fetchCounts();

    return () => {
      isMounted = false;
    };
  }, [canCreate]);

  const handleRequestMechanic = async () => {
    try {
      await requestMechanicRole();
      toast.success('Solicitud de rol de mecánico enviada');
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || 'No se pudo enviar la solicitud';
      toast.error(msg);
    }
  };

  const initials = getInitials(me?.name || '');

  const handleHeaderSearchSubmit = (e) => {
    e.preventDefault();
    if (!onHeaderSearch) return;
    const text = headerSearch.trim();
    onHeaderSearch(text);
  };

  return (
    <header className={`chap-header border-bottom bg-white ${!isAdminHeader ? 'is-sticky' : ''}`}>
      {/* MODO ADMIN */}
      {isAdminHeader ? (
        <>
          <div className="container chap-top py-3">
            <div className="row align-items-center">
              <div className="col-4 d-none d-sm-block" />

              <div className="col-12 col-sm-4 text-center">
                <Link to="/" className="text-decoration-none d-inline-block">
                  <img src={logoCompleto} alt="Chapacar" className="logo" />
                </Link>
              </div>

              <div className="col-12 col-sm-4 d-flex justify-content-sm-end justify-content-center gap-2 mt-3 mt-sm-0">
                {me && (
                  <Link to="/profile" className="chap-avatar text-decoration-none">
                    {initials}
                  </Link>
                )}

                {me ? (
                  <button
                    type="button"
                    className="chap-auth-btn"
                    onClick={onLogout}
                  >
                    Cerrar sesión
                  </button>
                ) : (
                  <button
                  className="chap-auth-btn"
                  type="button"
                  onClick={() => navigate('/signin')}
                >
                  Ingresar
                </button>
                )}

              </div>
            </div>
          </div>

          <nav className="bg-dark">
            <div className="container">
              <ul className="nav nav-pills py-2">
                <li className="nav-item">
                  <Link className="nav-link text-white" to="/">
                    ← Volver a la tienda
                  </Link>
                </li>

                {me && canCreate && (
                  <>
                    <li className="nav-item ms-auto">
                      <Link
                        to="/admin/reservations"
                        className="nav-link text-warning fw-semibold"
                      >
                        {loadingReservationsCount
                          ? 'Reservas ...'
                          : pendingReservations > 0
                            ? `Reservas Pendientes (${pendingReservations})`
                            : 'Reservas '}
                      </Link>
                    </li>

                    <li className="nav-item ms-2">
                      <Link
                        to="/admin?section=orders"
                        className="nav-link text-success fw-semibold"
                      >
                        {loadingOrdersCount
                          ? 'Compras ...'
                          : pendingOrders > 0
                            ? `Nuevas compras (${pendingOrders})`
                            : 'Compras'}
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </nav>
        </>
      ) : (
        /* MODO SITIO */
        <>
          <div className="container chap-top d-flex align-items-center gap-3">
            <Link to="/" className="text-decoration-none">
              <img src={logoCompleto} alt="Chapacar" className="logo" />
            </Link>

            <div className="flex-grow-1 chap-search">
              <form className="input-group" onSubmit={handleHeaderSearchSubmit}>
                <input
                  className="form-control"
                  placeholder="Producto o código…"
                  value={headerSearch}
                  onChange={(e) => setHeaderSearch(e.target.value)}
                />
                <button className="btn btn-chapacar" type="submit">
                  Buscar
                </button>
              </form>
            </div>

            <div className="chap-actions">
              <button
                type="button"
                className="chap-icon-btn chap-cart-btn"
                onClick={() => onCartOpen && onCartOpen()}
                aria-label="Abrir carrito"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM3.102 4l1.313 7h8.17l1.312-7H3.102z" />
                  <path d="M5.5 13a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
                </svg>
              </button>



              {me && (
                <Link to="/profile" className="chap-icon-btn text-decoration-none fw-bold">
                  {initials}
                </Link>
              )}

              {me ? (
                <>
                  {canRequestMechanic && (
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm chap-mech-btn"
                      onClick={handleRequestMechanic}
                    >
                      Solicitar rol de mecánico
                    </button>
                  )}

                  <button
                    type="button"
                    className="chap-auth-btn"
                    onClick={onLogout}
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <button
                  className="chap-auth-btn"
                  type="button"
                  onClick={() => navigate('/signin')}
                >
                  Ingresar
                </button> 
              )}

            </div>
          </div>

          <nav className="chap-nav">
            <div className="container">
              <ul className="nav nav-pills py-2">
                <li className="nav-item">
                  <Link className="nav-link" to="/">
                    Inicio
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/">
                    Tienda
                  </Link>
                </li>

                <li className="nav-item dropdown">
                  <button
                    className="nav-link dropdown-toggle bg-transparent border-0"
                    type="button"
                    data-bs-toggle="dropdown"
                  >
                    Nosotros
                  </button>
                  <ul className="dropdown-menu">
                    <li>
                      <Link className="dropdown-item" to="/empresa">
                        Empresa
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/ubicacion">
                        Ubicación
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/faq">
                        Preguntas frecuentes
                      </Link>
                    </li>
                  </ul>
                </li>

                <li className="nav-item">
                  <a
                    className="nav-link text-white"
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Contacto
                  </a>
                </li>

                {me && canCreate && (
                  <li className="nav-item ms-2">
                    <Link to="/admin" className="nav-link text-warning">
                      Panel del taller
                    </Link>
                  </li>
                )}

                {isMechanic && (
                  <li className="nav-item ms-2">
                    <Link to="/forum" className="nav-link text-primary fw-semibold">
                      Foro
                    </Link>
                  </li>
                )}

                {me && !canCreate && (
                  <li className="nav-item ms-2">
                    <Link to="/reservations" className="nav-link text-info">
                      Realizar una Reserva
                    </Link>
                  </li>
                )}

                {me && canCreate && (
                  <>
                    {/* Reservas pendientes */}
                    <li className="nav-item ms-auto">
                      <Link
                        to="/admin/reservations"
                        className="nav-link text-warning fw-semibold"
                      >
                        {loadingReservationsCount
                          ? 'Reservas ...'
                          : pendingReservations > 0
                            ? `Reservas Pendientes (${pendingReservations})`
                            : 'Reservas '}
                      </Link>
                    </li>


                    <li className="nav-item ms-2">
                      <Link
                        to="/admin?section=orders"
                        className="nav-link text-success fw-semibold"
                      >
                        {loadingOrdersCount
                          ? 'Compras ...'
                          : pendingOrders > 0
                            ? `Nuevas compras (${pendingOrders})`
                            : 'Compras'}
                      </Link>
                    </li>
                  </>
                )}



              </ul>
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
