import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

import Header from '../../components/Header.jsx';
import Footer from '../../components/Footer.jsx';
import SideCart from '../../components/sideCart/sideCart.jsx';
import ProductRow from '../../components/ProductRow.jsx';
import ChatTest from '../../components/chatTest.jsx';

import { getProduct, getPublicProduct, listPublicProducts } from '../../services/products.service.js';
import { addToCart, getCart } from '../../utils/cartUtils.js';
import { getUser, isAuthenticated } from '../../utils/authUtils.js';

import '../../components/css/header.css';
import '../../components/css/productDetail.css';

export default function ProductDetail({ user, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();

  // ✅ si App no pasa user, lo tomamos del storage
  const me = user || getUser();
  const isLoggedIn = isAuthenticated(); // boolean estable

  const [product, setProduct] = useState(null);
  const [activeImg, setActiveImg] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [related, setRelated] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  useEffect(() => {
    let mounted = true;
  
    (async () => {
      try {
        setLoading(true);
        const p = await getPublicProduct(id);
        if (!mounted) return;
        setProduct(p);
  
        const main =
          p.images?.find((i) => i.isMain) ||
          (p.images && p.images[0]) ||
          null;
  
        setActiveImg(main);
      } catch (e) {
        console.error(e);
        if (!mounted) return;
        setProduct(null);
        toast.error('No se pudo cargar el producto');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();
  
    return () => { mounted = false; };
  }, [id]);


  // ✅ relacionados (siempre público)
  useEffect(() => {
    if (!product) return;

    (async () => {
      try {
        setLoadingRelated(true);

        const pid = product._id || product.id;
        const categoryId = product.categories?.[0]?._id || product.categories?.[0];
        const brandId = product.brand?._id || product.brand;

        const normalizeList = (data) => (Array.isArray(data) ? data : data?.products ?? []);
        const uniqById = (arr) => {
          const map = new Map();
          arr.forEach((x) => {
            const xid = x._id || x.id;
            if (!map.has(String(xid))) map.set(String(xid), x);
          });
          return Array.from(map.values());
        };

        let pool = [];

        if (categoryId) {
          const dataCat = await listPublicProducts({ category: categoryId, limit: 12 });
          pool = pool.concat(normalizeList(dataCat));
        }

        if (brandId) {
          const dataBrand = await listPublicProducts({ brand: brandId, limit: 12 });
          pool = pool.concat(normalizeList(dataBrand));
        }

        const cleaned = uniqById(
          pool.filter((p) => String(p._id || p.id) !== String(pid))
        );

        setRelated(cleaned.slice(0, 8));
      } catch (e) {
        console.error('Error cargando productos relacionados', e);
      } finally {
        setLoadingRelated(false);
      }
    })();
  }, [product]);

  const images = useMemo(() => product?.images || [], [product]);

  const mainImageUrl =
    activeImg?.url ||
    images?.[0]?.url ||
    'https://via.placeholder.com/900x600?text=Sin+imagen';

  const brandName = product?.brand?.name || 'Sin marca';
  const categoriesNames = (product?.categories || []).map((c) => c.name);

  const priceFmt = useMemo(() => {
    if (!product) return '';
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU',
      minimumFractionDigits: 2,
    }).format(product.price);
  }, [product]);

  const inStock = Number(product?.countInStock ?? 0) > 0;

  const handleAddToCart = () => {
    if (!product) return;

    const stock = Number(product.countInStock ?? 0);
    if (stock <= 0) {
      toast.info('Este producto no tiene stock disponible.');
      return;
    }

    const safeQty = Math.max(1, Number(qty) || 1);

    const cart = getCart();
    const pid = product.id || product._id;
    const existing = cart.find((it) => it.id === pid);
    const currentQty = existing?.qty || 0;

    const desiredQty = currentQty + safeQty;
    if (desiredQty > stock) {
      toast.warn(`Solo hay ${stock} unidades en stock. Ya tienes ${currentQty} en el carrito.`);
      return;
    }

    const cartProduct = {
      id: pid,
      name: product.name,
      price: product.price,
      image:
        product.image ||
        product.images?.find((i) => i.isMain)?.url ||
        product.images?.[0]?.url ||
        null,
    };

    addToCart(cartProduct, safeQty);
    toast.success('Producto agregado al carrito');
    setIsCartOpen(true);
  };

  if (loading) {
    return (
      <>
        <Header user={me} onLogout={onLogout} onCartOpen={() => setIsCartOpen(true)} />
        <SideCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

        <main className="container my-4">
          <div className="chap-pd-wrap">
            <p className="text-muted mb-0">Cargando producto…</p>
          </div>
        </main>

        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header user={me} onLogout={onLogout} onCartOpen={() => setIsCartOpen(true)} />
        <SideCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

        <main className="container my-4">
          <div className="alert alert-danger mb-0">Producto no encontrado</div>
        </main>

        <Footer />
      </>
    );
  }

  return (
    <>
      <Header
        user={me}
        onLogout={onLogout}
        onCartOpen={() => setIsCartOpen(true)}
      />
      <SideCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <main className="container my-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => navigate(-1)}
          >
            ← Volver
          </button>

          <small className="text-muted">
            <Link to="/" className="text-decoration-none">Inicio</Link> / <span>{product.name}</span>
          </small>
        </div>

        <div className="row g-4">
          <div className="col-12 col-lg-6">
            <div className="chap-pd-gallery">
              <div className="chap-pd-main">
                <img src={mainImageUrl} alt={activeImg?.alt || product.name} />
              </div>

              {images.length > 1 && (
                <div className="chap-pd-thumbs">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`chap-pd-thumb ${activeImg?.url === img.url ? 'is-active' : ''}`}
                      onClick={() => setActiveImg(img)}
                      aria-label={`Ver imagen ${idx + 1}`}
                      title="Cambiar imagen"
                    >
                      <img src={img.url} alt={img.alt || product.name} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className="chap-pd-wrap">
              <h2 className="chap-pd-title">{product.name}</h2>

              <p className="chap-pd-muted">
                Código: <strong>{product.code || '—'}</strong>
              </p>
              <p className="chap-pd-muted">
                Marca: <strong>{brandName}</strong>
              </p>

              {categoriesNames.length > 0 && (
                <div className="chap-pd-badges">
                  {categoriesNames.map((n, i) => (
                    <span key={i} className="chap-pill">
                      {n}
                    </span>
                  ))}
                </div>
              )}

              <div className="chap-pd-divider" />

              <div className="chap-pd-price">
                <div className="amount">{priceFmt}</div>
                <div className="note">Precio unitario (IVA incluido)</div>
              </div>

              <div className="chap-pd-badges">
                <span className={`chap-pill ${inStock ? 'ok' : 'no'}`}>
                  {inStock ? `En stock: ${product.countInStock}` : 'Sin stock'}
                </span>

                {product.iva != null && (
                  <span className="chap-pill iva">IVA {product.iva}%</span>
                )}
              </div>

              <div className="chap-pd-buybox">
                <div>
                  <label className="form-label mb-1">Cantidad</label>
                  <input
                    type="number"
                    min={1}
                    max={product.countInStock || 99}
                    className="form-control"
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                    disabled={!inStock}
                  />
                </div>

                <button
                  type="button"
                  className="btn btn-chapacar w-100"
                  disabled={!inStock}
                  onClick={handleAddToCart}
                >
                  🛒 Agregar al carrito
                </button>
              </div>

              <div className="chap-pd-divider" />

              <h5 className="mb-2">Descripción</h5>
              <p className="text-muted mb-0">
                {product.description || 'Sin descripción detallada.'}
              </p>
            </div>
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-12 col-lg-10">
            <div className="chap-pd-tabs">
              <ul className="nav nav-tabs mb-3">
                <li className="nav-item">
                  <button
                    className="nav-link active"
                    data-bs-toggle="tab"
                    data-bs-target="#tab-details"
                    type="button"
                  >
                    Detalles
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className="nav-link"
                    data-bs-toggle="tab"
                    data-bs-target="#tab-specs"
                    type="button"
                  >
                    Especificaciones
                  </button>
                </li>
              </ul>

              <div className="tab-content">
                <div className="tab-pane fade show active" id="tab-details">
                  {product.htmlDescription ? (
                    <div
                      className="text-muted"
                      dangerouslySetInnerHTML={{ __html: product.htmlDescription }}
                    />
                  ) : (
                    <p className="text-muted mb-0">
                      No hay descripción adicional del producto.
                    </p>
                  )}
                </div>

                <div className="tab-pane fade" id="tab-specs">
                  {product.attributes && product.attributes.length > 0 ? (
                    <table className="table table-sm mb-0">
                      <tbody>
                        {product.attributes.map((attr, idx) => (
                          <tr key={idx}>
                            <th style={{ width: '30%' }}>{attr.name}</th>
                            <td>{(attr.values || []).join(', ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-muted mb-0">
                      No hay especificaciones técnicas cargadas.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="chap-pd-divider" style={{ marginTop: 28 }} />

        {loadingRelated ? (
          <p className="text-muted mt-3 mb-0">Cargando productos relacionados…</p>
        ) : related.length > 0 ? (
          <div className="mt-4">
            <ProductRow title="Productos relacionados" products={related} />
          </div>
        ) : null}

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
      </main>

      <Footer />
    </>
  );
}
