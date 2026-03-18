// src/components/ProductRow.jsx
import React from 'react';
import ProductCard from './ProductCard.jsx';
import { addToCart } from '../utils/cartUtils';
import { toast } from 'react-toastify';
import '../components/css/header.css';
import '../components/css/home.v2.css';

export default function ProductRow({ title, products = [] }) {
  const handleAdd = (p) => {
    const cartProduct = {
      id: p.id || p._id,
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
  };

  return (
    <section className="mb-4">
      <div className="d-flex align-items-center gap-2 mb-3">
        <span
          className="btn btn-chapacar btn-sm"
          style={{ pointerEvents: 'none' }}
        >
          ⮕
        </span>
        <h5 className="m-0">{title}</h5>
      </div>

      <div className="row g-3">
        {products.map((p) => (
          <div key={p._id || p.id} className="col-12 col-sm-6 col-lg-3">
            <ProductCard p={p} onAddToCart={handleAdd} />
          </div>
        ))}
      </div>
    </section>
  );
}
