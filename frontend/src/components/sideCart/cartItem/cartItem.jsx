// src/components/sideCart/cartItem/cartItem.jsx
import React from 'react';
import './cartItem.css';

export default function CartItem({ item, onQtyChange, onRemove }) {
  const { id, name, price, qty, image } = item;

  const safePrice = Number(price) || 0;
  const safeQty = Number(qty) || 1;
  const subtotal = safePrice * safeQty;

  return (
    <div className="cart-item d-flex align-items-center mb-3">
      {image && (
        <img
          src={image}
          alt={name}
          className="cart-item-image me-2"
        />
      )}

      <div className="flex-grow-1">
        <div className="d-flex justify-content-between">
          <strong>{name}</strong>
          <button
            className="btn btn-sm btn-link text-danger p-0"
            onClick={() => onRemove(id)}
          >
            ✕
          </button>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-1">
          <span className="text-muted">$ {safePrice.toFixed(2)}</span>

          <div className="d-flex align-items-center gap-1">
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => onQtyChange(id, safeQty - 1)}
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
                onQtyChange(id, parseInt(e.target.value || 1, 10))
              }
            />
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => onQtyChange(id, safeQty + 1)}
            >
              +
            </button>
          </div>

          <span className="fw-semibold">$ {subtotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
