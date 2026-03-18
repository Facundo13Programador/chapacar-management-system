// src/screens/home/Home.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Header from '../../components/Header.jsx';
import Footer from '../../components/Footer.jsx';
import Carousel from '../../components/Carousel.jsx';
import ProductRow from '../../components/ProductRow.jsx';
import SideCart from '../../components/sideCart/sideCart.jsx';
import ChatTest from '../../components/chatTest.jsx';
import SearchBar from '../../components/SearchBar.jsx';
import { getUser, clearAuth, onAuthChange } from '../../utils/authUtils.js';
import { logout as apiLogout } from '../../services/auth.service.js';
import { listPublicProducts } from '../../services/products.service.js';
import { getMyProfile } from '../../services/users.service.js';
import {  setUser as setAuthUser } from '../../utils/authUtils.js';
import '../../components/css/header.css';
import '../../components/css/home.css';
import '../../components/css/home.v2.css';

function SkeletonCards({ count = 8 }) {
  return (
    <div className="row g-3">
      {Array.from({ length: count }).map((_, i) => (
        <div className="col-6 col-md-4 col-lg-3" key={i}>
          <div className="chap-skel-card">
            <div className="chap-skel-img" />
            <div className="chap-skel-line w-75" />
            <div className="chap-skel-line w-50" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getUser());

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const syncMe = async () => {
    try {
      const current = getUser();
      if (!current) return;
  
      const fresh = await getMyProfile();
  
      setAuthUser(fresh);
      setUser(fresh);
    } catch (e) {
      console.error('No se pudo refrescar perfil', e);
    }
  };

  useEffect(() => {
    const off = onAuthChange(() => setUser(getUser()));
    syncMe();
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await listPublicProducts({});
      const items = Array.isArray(data) ? data : (data?.products ?? []);
      setProducts(items);
    } catch (e) {
      console.error(e);
      toast.error('No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const onLogout = async () => {
    try { await apiLogout(); } catch {}
    clearAuth();
    setUser(null);
    toast.info('Sesión cerrada');
    navigate('/'); 
  };

  const handleHeaderSearch = (text) => {
    const value = text.trim();
    const params = new URLSearchParams();
    if (value) params.set('sku', value);
    navigate(`/search?${params.toString()}`);
  };

    const onSearch = (filters) => {
      const params = new URLSearchParams();
      Object.entries(filters || {}).forEach(([key, value]) => {
        if (value && value !== '') params.set(key, value);
      });
      navigate(`/search?${params.toString()}`);
    };
  

  const featured = useMemo(() => products.slice(0, 12), [products]);

  return (
    <>
      <Header
        user={user}
        onLogout={onLogout}
        onCartOpen={() => setIsCartOpen(true)}
        onHeaderSearch={handleHeaderSearch}
      />

      <SideCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <section className="chap-hero">
        <div className="container">
          <div className="chap-hero-card">
            <div className="chap-hero-left">
              <span className="chap-badge">Repuestos • Taller</span>
              <h1 className="chap-hero-title">Todo para tu auto, en un solo lugar.</h1>
              <p className="chap-hero-text">
                Encontrá repuestos por código o producto, y reservá tu servicio en minutos.
              </p>

              <div className="chap-hero-actions">
                <button
                  className="btn btn-chapacar"
                  onClick={() => navigate('/search')}
                  type="button"
                >
                  Buscar repuestos
                </button>

                <button
                  className="btn btn-outline-dark"
                  onClick={() => navigate('/reservations')}
                  type="button"
                >
                  Reservar en el taller
                </button>
              </div>
            </div>

            <div className="chap-hero-right">
              <div className="chap-hero-mini">
                <div className="chap-hero-mini-icon">⚡</div>
                <div>
                  <div className="chap-hero-mini-title">Entrega rápida</div>
                  <div className="chap-hero-mini-sub">Productos destacados y stock actualizado</div>
                </div>
              </div>

              <div className="chap-hero-mini">
                <div className="chap-hero-mini-icon">🛠️</div>
                <div>
                  <div className="chap-hero-mini-title">Taller</div>
                  <div className="chap-hero-mini-sub">Reservas, presupuestos y OT</div>
                </div>
              </div>

              <div className="chap-hero-mini">
                <div className="chap-hero-mini-icon">💬</div>
                <div>
                  <div className="chap-hero-mini-title">Soporte</div>
                  <div className="chap-hero-mini-sub">Te ayudamos a encontrar tu repuesto</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="container my-4">
        <section className="chap-featured">
          <div className="chap-featured-head">
            <div>
              <h4 className="mb-1">Destacados</h4>
              <p className="text-muted mb-0" style={{ fontSize: 14 }}>
                Novedades y productos recientes
              </p>
            </div>

            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={loadProducts}
                type="button"
                disabled={loading}
              >
                {loading ? 'Actualizando…' : 'Actualizar'}
              </button>

              <button
                className="btn btn-outline-dark btn-sm"
                onClick={() => navigate('/search')}
                type="button"
              >
                Ver todo →
              </button>
            </div>
          </div>

          <div className="chap-divider-soft" />

          <div className="chap-featured-carousel">
            <Carousel />
          </div>

          <div className="chap-featured-filters">
            <SearchBar onSearch={onSearch} />
          </div>
        </section>



        <div className="chap-divider-soft" />

        {/* Productos */}
        {loading ? (
          <SkeletonCards count={8} />
        ) : products.length === 0 ? (
          <div className="alert alert-info mb-0">
            No hay productos disponibles por el momento.
          </div>
        ) : (
          <ProductRow title="Novedades" products={featured} />
        )}
      </main>

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

      <Footer />
    </>
  );
}
