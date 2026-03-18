
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import Header from '../../components/Header.jsx';
import Footer from '../../components/Footer.jsx';
import SideCart from '../../components/sideCart/sideCart.jsx';
import SearchBar from '../../components/SearchBar.jsx';
import CategorySidebar from '../../components/CategorySidebar.jsx';
import ChatTest from '../../components/chatTest.jsx';

import { getUser, clearAuth, onAuthChange } from '../../utils/authUtils.js';
import { logout as apiLogout } from '../../services/auth.service.js';
import { listPublicProducts } from '../../services/products.service.js';
import ProductListView from '../../components/ProductListView.jsx';

export default function ProductSearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [user, setUser] = useState(getUser());
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasFilters, setHasFilters] = useState(false);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const off = onAuthChange(() => setUser(getUser()));
    return off;
  }, []);

  const onLogout = async () => {
    try {
      await apiLogout();
    } catch {}
    clearAuth();
    setUser(null);
    toast.info('Sesión cerrada');
    navigate('/signin');
  };

  const loadProducts = async (filters = {}) => {
    try {
      setLoading(true);
      const data = await listPublicProducts(filters);
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error('No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const brand = searchParams.get('brand') || '';
    const model = searchParams.get('model') || '';
    const category = searchParams.get('category') || '';
    const sku = searchParams.get('sku') || '';

    const filters = { brand, model, category, sku };
    const hasAny = Object.values(filters).some((v) => v && v !== '');
    setHasFilters(hasAny);

    loadProducts(filters);
  }, [searchParams]);

  const handleSearchFromBar = (filters) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '') params.set(key, value);
    });
    setSearchParams(params);
  };

  const handleSelectCategory = (categoryId) => {
    const params = new URLSearchParams(searchParams);
    if (categoryId) {
      params.set('category', categoryId);
    } else {
      params.delete('category');
    }
    setSearchParams(params);
  };

  const handleHeaderSearch = (text) => {
    const value = text.trim();
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('sku', value);
    } else {
      params.delete('sku');
    }
    setSearchParams(params);
  };

  const handleAddedToCart = () => {
    setIsCartOpen(true);
  };

  const resultsTitle = hasFilters
    ? `Resultados (${products.length})`
    : `Todos los productos (${products.length})`;

  return (
    <>
      <Header
        user={user}
        onLogout={onLogout}
        onCartOpen={() => setIsCartOpen(true)}
        onHeaderSearch={handleHeaderSearch}
      />

      <SideCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <main className="container my-4">
        {/* Encabezado de resultados */}
        <div className="mb-3">
          <h2 className="mb-1">{resultsTitle}</h2>
          <p className="text-muted mb-0">
            Refiná tu búsqueda por marca, modelo, categoría o código.
          </p>
        </div>

        {/* Barra de filtros principal */}
        <SearchBar onSearch={handleSearchFromBar} />

        <div className="row g-4">
          {/* Sidebar de categorías */}
          <div className="col-12 col-lg-3">
            <CategorySidebar onSelectCategory={handleSelectCategory} />
          </div>

          {/* Listado de productos */}
          <div className="col-12 col-lg-9">
            {loading ? (
              <div className="text-muted">Cargando productos…</div>
            ) : (
              <ProductListView
                products={products}
                onAddedToCart={handleAddedToCart}
              />
            )}
          </div>
        </div>
      </main>

      {/* Chat flotante */}
      {isChatOpen && <ChatTest onClose={() => setIsChatOpen(false)} />}
      <button
        type="button"
        onClick={() => setIsChatOpen((prev) => !prev)}
        className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '56px',
          height: '56px',
          zIndex: 2000,
          boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
          fontSize: '22px',
        }}
        aria-label={isChatOpen ? 'Cerrar chat' : 'Abrir chat'}
      >
        {isChatOpen ? '×' : '💬'}
      </button>

      <Footer />
    </>
  );
}
