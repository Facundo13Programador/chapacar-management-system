// src/components/sideCart/sideCart.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './sideCart.css';
import CartItem from './cartItem/cartItem.jsx';
import {
  getCart,
  onCartChange,
  updateItemQty,
  removeFromCart,
  clearCart,
} from '../../utils/cartUtils.js';
import { getPublicProduct } from '../../services/products.service.js';
import '../../components/css/header.css';

export default function SideCart({ isOpen, onClose }) {
  const [items, setItems] = useState(getCart());
  const navigate = useNavigate();

  useEffect(() => {
    setItems(getCart());
    const off = onCartChange((newItems) => setItems(newItems));
    return off;
  }, []);

  const total = items.reduce(
    (acc, it) => acc + (Number(it.price) || 0) * (Number(it.qty) || 1),
    0
  );

  // 🔹 Valida contra stock en backend y luego actualiza carrito
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

  const handleGoToCartPage = () => {
    if (!items.length) return;
    if (onClose) onClose();
    navigate('/cart');
  };

  return (
    <>
      {isOpen && (
        <div
          className="sidecart-backdrop"
          onClick={onClose}
        />
      )}

      <aside className={`sidecart-panel ${isOpen ? 'open' : ''}`}>
        <div className="sidecart-header d-flex justify-content-between align-items-center">
          <h5 className="m-0">Carrito</h5>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>

        <div className="sidecart-body">
          {items.length === 0 ? (
            <p className="text-muted">El carrito está vacío.</p>
          ) : (
            items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onQtyChange={handleQtyChange}
                onRemove={handleRemove}
              />
            ))
          )}
        </div>

        <div className="sidecart-footer">
          <div className="d-flex justify-content-between mb-2">
            <span>Total</span>
            <strong>$ {total.toFixed(2)}</strong>
          </div>

          <button
            className="btn btn-outline-danger w-100 mb-2"
            onClick={handleClear}
            disabled={items.length === 0}
          >
            Vaciar carrito
          </button>

          <button
            className="btn btn-chapacar w-100"
            disabled={items.length === 0}
            onClick={handleGoToCartPage}
          >
            Finalizar compra
          </button>
        </div>
      </aside>
    </>
  );
}
