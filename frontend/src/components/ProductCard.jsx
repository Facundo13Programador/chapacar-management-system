// src/components/ProductCard.jsx (ejemplo)
import React from 'react';
import { Link } from 'react-router-dom';
import '../components/css/header.css';

export default function ProductCard({ p, onAddToCart }) {
  const id = p.id || p._id;
  const img =
    p.image ||
    p.images?.find((i) => i.isMain)?.url ||
    p.images?.[0]?.url;

  return (
    <div className="chap-product-card h-100">
      <Link to={`/products/${id}`} className="chap-product-imgwrap">
        {img ? (
          <img src={img} alt={p.name} className="chap-product-img" />
        ) : (
          <div className="chap-product-noimg">Sin imagen</div>
        )}

        <span className={`chap-product-badge ${Number(p.countInStock) > 0 ? 'in' : 'out'}`}>
          {Number(p.countInStock) > 0 ? 'En stock' : 'Sin stock'}
        </span>
      </Link>

      <div className="chap-product-body">
        <Link to={`/products/${id}`} className="chap-product-title">
          {p.name}
        </Link>

        <div className="chap-product-price">
          <span className="chap-currency">$</span>
          <span className="chap-amount">{p.price}</span>
        </div>

        <div className="chap-product-actions">
          <button
            type="button"
            className="btn btn-chapacar btn-sm flex-grow-1"
            disabled={Number(p.countInStock) <= 0}
            onClick={() => onAddToCart && onAddToCart(p)}
          >
            Añadir
          </button>

          <Link to={`/products/${id}`} className="btn btn-outline-secondary btn-sm">
            Ver
          </Link>
        </div>
      </div>
    </div>
  );

}
