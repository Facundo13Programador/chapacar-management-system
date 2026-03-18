// src/components/CategorySidebar.jsx
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { listPublicCategories } from '../services/categories.service.js';

export default function CategorySidebar({ onSelectCategory }) {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await listPublicCategories();
        setCats(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        toast.error('No se pudieron cargar las categorías');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <aside className="list-group text-muted">
        Cargando categorías…
      </aside>
    );
  }

  if (!cats.length) {
    return (
      <aside className="list-group">
        <div className="list-group-item text-muted">
          No hay categorías disponibles.
        </div>
      </aside>
    );
  }

  return (
    <aside className="list-group">
      {/* Botón para limpiar filtro */}
      <button
        type="button"
        className="list-group-item list-group-item-action d-flex align-items-center gap-2"
        onClick={() => onSelectCategory && onSelectCategory(null)}
      >
        <span>📦</span>
        <span>Todos los productos</span>
      </button>

      {cats.map((c) => (
        <button
          key={c._id}
          type="button"
          className="list-group-item list-group-item-action d-flex align-items-center gap-2"
          onClick={() => onSelectCategory && onSelectCategory(c._id)}
        >
          <span>🔧</span>
          <span>{c.name}</span>
        </button>
      ))}
    </aside>
  );
}
