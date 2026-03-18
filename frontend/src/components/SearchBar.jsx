// src/components/SearchBar.jsx
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { listPublicCategories } from '../services/categories.service.js';
import { listPublicBrands } from '../services/brands.service.js';
import '../components/css/header.css';

export default function SearchBar({ onSearch }) {
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [sku, setSku] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [b, c] = await Promise.all([
          listPublicBrands(),
          listPublicCategories(),
        ]);

        setBrands(Array.isArray(b) ? b : []);
        setCategories(Array.isArray(c) ? c : []);
      } catch (e) {
        console.error(e);
        toast.error('No se pudieron cargar los filtros');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const submit = (e) => {
    e.preventDefault();
    onSearch?.({
      brand,
      category,
      sku: sku.trim(),
    });
  };

  return (
    <form className="bg-white border rounded-3 p-3 mb-0" onSubmit={submit}>
      <div className="row g-2">
        {/* Marca */}
        <div className="col-12 col-md-4">
          <select
            className="form-select"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            disabled={loading}
          >
            <option value="">Marca…</option>
            {brands.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Categoría */}
        <div className="col-12 col-md-4">
          <select
            className="form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={loading}
          >
            <option value="">Categoría…</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Texto/SKU + botón */}
        <div className="col-12 col-md-4">
          <div className="input-group">
            <input
              className="form-control"
              placeholder="Producto o código (opcional)…"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
            />
            <button className="btn btn-chapacar" type="submit" disabled={loading}>
              Buscar
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
