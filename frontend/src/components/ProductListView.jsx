// src/components/ProductListView.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { addToCart, getCart } from '../utils/cartUtils';

export default function ProductListView({ products, onAddedToCart }) {
  if (!products || products.length === 0) {
    return (
      <div className="alert alert-info">
        No se encontraron productos para los filtros seleccionados.
      </div>
    );
  }

  const handleAddToCart = (p) => {
    const stock = Number(p.countInStock ?? 0);

    if (stock <= 0) {
      toast.info('Este producto no tiene stock disponible.');
      return;
    }

    const cart = getCart();
    const id = p.id || p._id;
    const existing = cart.find((it) => it.id === id);
    const currentQty = existing?.qty || 0;

    const desiredQty = currentQty + 1;

    if (desiredQty > stock) {
      toast.warn(
        `Solo hay ${stock} unidades en stock. ` +
          `Ya tienes ${currentQty} en el carrito.`
      );
      return;
    }

    const cartProduct = {
      id,
      name: p.name,
      price: p.price,
      image:
        p.image ||
        p.images?.find((i) => i.isMain)?.url ||
        p.images?.[0]?.url ||
        null,
    };

    addToCart(cartProduct, 1);
    toast.success('Producto agregado al carrito');

    onAddedToCart?.(); 
  };

  return (
    <div className="list-group">
      {products.map((p) => {
        const stock = Number(p.countInStock ?? 0);
        const inStock = stock > 0;

        const mainImageUrl =
          p.image ||
          p.images?.find((i) => i.isMain)?.url ||
          p.images?.[0]?.url ||
          'https://via.placeholder.com/160x160?text=Sin+imagen';

        return (
          <div
            key={p._id}
            className="list-group-item mb-3 border rounded-3 shadow-sm"
          >
            <div className="row g-3 align-items-stretch">
              {/* Imagen */}
              <div className="col-12 col-md-3 d-flex align-items-center justify-content-center">
                <Link to={`/products/${p._id}`} className="text-decoration-none">
                  <div
                    className="bg-white d-flex align-items-center justify-content-center border rounded-3"
                    style={{ width: '100%', height: 160 }}
                  >
                    <img
                      src={mainImageUrl}
                      alt={p.name}
                      className="img-fluid"
                      style={{
                        maxHeight: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  </div>
                </Link>
              </div>

              {/* Info principal */}
              <div className="col-12 col-md-6 d-flex flex-column justify-content-between">
                <div>
                  <h5 className="mb-1">
                    <Link
                      to={`/products/${p._id}`}
                      className="text-decoration-none text-dark"
                    >
                      {p.name}
                    </Link>
                  </h5>
                  <div className="text-muted small mb-1">
                    Código: <strong>{p.code}</strong>
                  </div>
                  {p.brand?.name && (
                    <div className="text-muted small mb-1">
                      Marca: <strong>{p.brand.name}</strong>
                    </div>
                  )}
                  {Array.isArray(p.categories) && p.categories.length > 0 && (
                    <div className="mb-1">
                      {p.categories.map((c) => (
                        <span
                          key={c._id || c.name}
                          className="badge bg-light text-dark me-1 mb-1"
                        >
                          {c.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-2">
                  {inStock ? (
                    <span className="badge bg-success">
                      En stock: {stock} unidades
                    </span>
                  ) : (
                    <span className="badge bg-danger">Sin stock</span>
                  )}
                </div>
              </div>

              {/* Precio + acciones */}
              <div className="col-12 col-md-3 border-start d-flex flex-column justify-content-between p-3">
                <div className="text-end mb-2">
                  <div className="fw-bold" style={{ fontSize: '1.2rem' }}>
                    $
                    {' '}
                    {Number(p.price || 0).toLocaleString('es-UY', {
                      minimumFractionDigits: 0,
                    })}
                  </div>
                  <small className="text-muted">IVA incluido</small>
                </div>

                {inStock && (
                  <button
                    type="button"
                    className="btn btn-primary w-100"
                    onClick={() => handleAddToCart(p)}
                  >
                    🛒 Agregar al carrito
                  </button>
                )}

                <Link
                  to={`/products/${p._id}`}
                  className="btn btn-link btn-sm mt-2 p-0 text-end"
                >
                  Ver detalle
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
