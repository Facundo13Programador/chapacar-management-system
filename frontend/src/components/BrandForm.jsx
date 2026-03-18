// src/components/BrandForm.jsx
import React, { useEffect, useState } from 'react';
import '../components/css/header.css';

const emptyBrand = {
  name: '',
  models: [],
};

export default function BrandForm({ initialValue, onSubmit, submitting = false }) {
  const [form, setForm] = useState(() => initialValue || emptyBrand);

  useEffect(() => {
    setForm(initialValue || emptyBrand);
  }, [initialValue]);

  const setField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const addModel = () => {
    setField('models', [...(form.models || []), '']);
  };

  const updateModel = (idx, value) => {
    const next = [...(form.models || [])];
    next[idx] = value;
    setField('models', next);
  };

  const removeModel = (idx) => {
    setField(
      'models',
      (form.models || []).filter((_, i) => i !== idx)
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const cleanedModels = (form.models || [])
      .map((m) => String(m).trim())
      .filter(Boolean);

    const payload = {
      name: String(form.name || '').trim(),
      models: cleanedModels,
    };

    if (!payload.name) {
      alert('El nombre de la marca es obligatorio');
      return;
    }

    onSubmit?.(payload);
  };

  const models = form.models || [];

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label">Nombre de la marca *</label>
        <input
          className="form-control"
          value={form.name || ''}
          onChange={(e) => setField('name', e.target.value)}
          required
        />
      </div>

      <div className="mb-3">
        <div className="d-flex justify-content-between align-items-center">
          <label className="form-label m-0">Modelos</label>
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={addModel}
          >
            + Agregar modelo
          </button>
        </div>
        {models.length === 0 && (
          <div className="form-text">
            Ejemplo: Corolla, Hilux, Etios…
          </div>
        )}
        {models.map((m, idx) => (
          <div className="input-group mb-2" key={idx}>
            <input
              className="form-control"
              placeholder={`Modelo #${idx + 1}`}
              value={m}
              onChange={(e) => updateModel(idx, e.target.value)}
            />
            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={() => removeModel(idx)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button type="submit" className="btn btn-chapacar" disabled={submitting}>
        {submitting ? 'Guardando…' : 'Guardar marca'}
      </button>
    </form>
  );
}
