// src/screens/cart/CartPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header.jsx';
import Footer from '../../components/Footer.jsx';
import { getUser, onAuthChange, clearAuth } from '../../utils/authUtils.js';
import { logout as apiLogout } from '../../services/auth.service.js';
import '../../components/css/header.css';
import {
  getCart,
  onCartChange,
  updateItemQty,
  removeFromCart,
  clearCart,
} from '../../utils/cartUtils.js';
import { toast } from 'react-toastify';
import { getPublicProduct } from '../../services/products.service.js';

export default function CartPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(getUser());
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
    navigate('/signin');
  };

  const [items, setItems] = useState(() => getCart());

  useEffect(() => {
    setItems(getCart());
    const off = onCartChange((newItems) => setItems(newItems));
    return off;
  }, []);

  const handleQtyChange = async (id, qty) => {
    const safeQty = Number(qty) || 0;

    if (safeQty <= 0) {
      removeFromCart(id);
      return;
    }

    try {
      const product = await getPublicProduct(id);
      const stock = product?.countInStock ?? 0;

      if (!product || !product.isActive || stock <= 0) {
        toast.error(
          `El producto "${product?.name || ''}" ya no tiene stock. Lo quitamos del carrito.`
        );
        removeFromCart(id);
        return;
      }

      if (safeQty > stock) {
        toast.info(
          `Solo hay ${stock} unidad(es) disponibles de "${product.name}". Ajustamos la cantidad.`
        );
        updateItemQty(id, stock);
        return;
      }

      updateItemQty(id, safeQty);
    } catch (e) {
      console.error(e);
      toast.error('No se pudo validar el stock. Intentalo nuevamente.');
    }
  };

  const handleRemove = (id) => {
    removeFromCart(id);
  };

  const handleClear = () => {
    clearCart();
  };

  const subtotal = items.reduce(
    (acc, it) => acc + (Number(it.price) || 0) * (Number(it.qty) || 1),
    0
  );

  const validateCartBeforeCheckout = async () => {
    const currentItems = getCart();
    if (!currentItems.length) {
      toast.error('Tu carrito está vacío.');
      return false;
    }

    try {
      const results = await Promise.all(
        currentItems.map(async (item) => {
          try {
            const product = await getPublicProduct(item.id);
            return { item, product };
          } catch (e) {
            return { item, product: null, error: e };
          }
        })
      );

      let hasIssues = false;

      for (const { item, product } of results) {
        const stock = product?.countInStock ?? 0;

        if (!product || !product.isActive || stock <= 0) {
          hasIssues = true;
          removeFromCart(item.id);
        } else if (item.qty > stock) {
          hasIssues = true;
          updateItemQty(item.id, stock);
        }
      }

      if (hasIssues) {
        toast.error(
          'Se ajustó el carrito porque cambió el stock de algunos productos. Revisalo antes de continuar.'
        );
        return false;
      }

      return true;
    } catch (e) {
      console.error(e);
      toast.error('No se pudo validar el stock antes de continuar la compra.');
      return false;
    }
  };

  const handleContinueCheckout = async () => {
    if (!items.length) return;
    const ok = await validateCartBeforeCheckout();
    if (!ok) return;
    navigate('/checkout');
  };

  const cartCount = items.reduce((acc, it) => acc + (Number(it.qty) || 1), 0);

  const handleBackToShop = () => {
    navigate('/');
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header
        user={user}
        onLogout={onLogout}
        onCartOpen={null} 
        cartCount={cartCount}
      />

      <main className="container my-4 flex-grow-1">
        {items.length === 0 ? (
          <div className="row justify-content-center">
            <div className="col-12 col-md-8">
              <div className="card p-4 text-center">
                <h4 className="mb-3">Tu carrito está vacío</h4>
                <p className="text-muted mb-3">
                  Agregá productos desde la tienda para verlos acá.
                </p>
                <button
                  className="btn btn-chapacar"
                  onClick={handleBackToShop}
                >
                  Ir a la tienda
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {/* izquierda: productos */}
            <div className="col-12 col-lg-8">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title mb-3">
                    Productos en tu carrito ({items.length})
                  </h5>

                  <div className="list-group list-group-flush">
                    {items.map((item) => {
                      const safePrice = Number(item.price) || 0;
                      const safeQty = Number(item.qty) || 1;
                      const subtotalItem = safePrice * safeQty;

                      return (
                        <div
                          key={item.id}
                          className="list-group-item border-0 border-bottom py-3"
                        >
                          <div className="d-flex gap-3">
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                style={{
                                  width: 80,
                                  height: 80,
                                  objectFit: 'cover',
                                  borderRadius: 4,
                                  flexShrink: 0,
                                }}
                              />
                            )}

                            <div className="flex-grow-1 d-flex flex-column">
                              <div className="d-flex justify-content-between">
                                <div>
                                  <div className="fw-semibold">
                                    {item.name}
                                  </div>
                                </div>

                                <button
                                  className="btn btn-sm btn-link text-danger p-0"
                                  onClick={() => handleRemove(item.id)}
                                >
                                  Eliminar
                                </button>
                              </div>

                              <div className="d-flex justify-content-between align-items-center mt-2">
                                <div className="d-flex align-items-center gap-1">
                                  <button
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() =>
                                      handleQtyChange(item.id, safeQty - 1)
                                    }
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    className="form-control form-control-sm text-center"
                                    style={{ width: 60 }}
                                    value={safeQty}
                                    onChange={(e) =>
                                      handleQtyChange(
                                        item.id,
                                        parseInt(e.target.value || 1, 10)
                                      )
                                    }
                                  />
                                  <button
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() =>
                                      handleQtyChange(item.id, safeQty + 1)
                                    }
                                  >
                                    +
                                  </button>
                                </div>

                                <div className="text-end">
                                  <div className="text-muted small">
                                    Precio unitario
                                  </div>
                                  <div className="fw-semibold">
                                    $ {safePrice.toFixed(2)}
                                  </div>
                                  <div className="text-muted small">
                                    Subtotal: $ {subtotalItem.toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 d-flex justify-content-between">
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={handleClear}
                    >
                      Vaciar carrito
                    </button>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={handleBackToShop}
                    >
                      Seguir comprando
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* derecha: resumen */}
            <div className="col-12 col-lg-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title mb-3">Resumen de compra</h5>

                  <div className="d-flex justify-content-between mb-2">
                    <span>Productos ({items.length})</span>
                    <span>$ {subtotal.toFixed(2)}</span>
                  </div>

                  <hr />

                  <div className="d-flex justify-content-between mb-3">
                    <strong>Total</strong>
                    <strong>$ {subtotal.toFixed(2)}</strong>
                  </div>

                  <button
                    className="btn btn-chapacar w-100"
                    onClick={handleContinueCheckout}
                  >
                    Continuar compra
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
