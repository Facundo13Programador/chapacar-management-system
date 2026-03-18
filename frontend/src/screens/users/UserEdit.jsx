import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getUser, updateUser } from '../../services/users.service';
import { ROLES } from '../../utils/permissionsFront';
import '../../components/css/header.css';

const ROLE_OPTIONS = Object.entries(ROLES).map(([value, label]) => ({
  value,
  label,
}));

export default function UserEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'client',
    isAdmin: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getUser(id);
        setForm({
          name: data.name || '',
          email: data.email || '',
          role: data.role || 'client',
          isAdmin: !!data.isAdmin,
        });
      } catch (e) {
        console.error(e);
        toast.error('No se pudo cargar el usuario');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateUser(id, form);
      toast.success('Usuario actualizado');
      navigate('/users');
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || e.message || 'Error al actualizar usuario';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container my-4">
        <div className="text-muted">Cargando usuario…</div>
      </div>
    );
  }

  return (
    <div className="container my-4">
      <h3>Editar usuario</h3>

      <form className="mt-3" onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Nombre</label>
          <input
            type="text"
            name="name"
            className="form-control"
            value={form.name}
            onChange={handleChange}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            name="email"
            className="form-control"
            value={form.email}
            onChange={handleChange}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Rol</label>
          <select
            name="role"
            className="form-select"
            value={form.role}
            onChange={handleChange}
          >
            {ROLE_OPTIONS.map(r => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-check mb-3">
          <input
            type="checkbox"
            className="form-check-input"
            id="isAdmin"
            name="isAdmin"
            checked={form.isAdmin}
            onChange={handleChange}
          />
          <label className="form-check-label" htmlFor="isAdmin">
            Es administrador
          </label>
        </div>

        <button
          type="submit"
          className="btn btn-chapacar"
          disabled={saving}
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}
