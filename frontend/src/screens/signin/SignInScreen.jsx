import React, { useState, useEffect } from 'react';
import Container from 'react-bootstrap/Container';
import { toast } from 'react-toastify';
import { useNavigate, useLocation, Link } from 'react-router-dom';

import { login } from '../../services/auth.service';
import { saveAuth, isAuthenticated } from '../../utils/authUtils';

import logoCompleto from '../../logos/logoFunciona.png';
import '../../components/css/header.css';
import '../../components/css/signin.css';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { search } = useLocation();
  const redirect = new URLSearchParams(search).get('redirect') || '/';

  useEffect(() => {
    if (isAuthenticated()) navigate(redirect);
  }, [navigate, redirect]);

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      if (!email || !password) throw new Error('Email y contraseña requeridos');

      setLoading(true);
      const data = await login(email, password);

      saveAuth(data);
      toast.success('Sesión iniciada');
      navigate(redirect);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Error de login';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chap-auth-page">
      <Container className="py-5">
        <div className="chap-auth-card mx-auto">
          <div className="chap-auth-brand text-center">
            <Link to="/" className="d-inline-block">
              <img src={logoCompleto} alt="Chapacar" className="chap-auth-logo" />
            </Link>
            <p className="chap-auth-subtitle mb-0">
              Repuestos • Taller • Reservas
            </p>
          </div>

          <div className="chap-auth-body">
            <h4 className="mb-1">Iniciar sesión</h4>
            <p className="text-muted mb-4" style={{ fontSize: 14 }}>
              Accedé para ver tus reservas, compras y el panel del taller.
            </p>

            <form onSubmit={submitHandler}>
              {/* Email */}
              <div className="mb-3">
                <label className="form-label">Correo electrónico</label>
                <div className="input-group chap-input">
                  <span className="input-group-text">✉️</span>
                  <input
                    className="form-control"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="mb-2">
                <label className="form-label">Contraseña</label>
                <div className="input-group chap-input">
                  <span className="input-group-text">🔒</span>
                  <input
                    className="form-control"
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPwd((s) => !s)}
                    style={{ borderLeft: '0' }}
                    aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPwd ? '🙈' : '👁️'}
                  </button>
                </div>

                <div className="d-flex justify-content-end mt-2">
                  <Link to="/forgot-password" className="chap-link">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
              </div>

              {/* CTA */}
              <button
                className="btn btn-chapacar w-100 mt-3 chap-auth-btn"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Ingresando…' : 'Ingresar'}
              </button>

              {/* Divider */}
              <div className="chap-divider my-4">
                <span>o</span>
              </div>

              <Link
                className="btn btn-outline-dark w-100"
                to={`/signup?redirect=${encodeURIComponent(redirect)}`}
              >
                Crear cuenta
              </Link>

              <div className="text-center mt-3" style={{ fontSize: 13 }}>
                <Link to="/" className="chap-link">
                  ← Volver a la tienda
                </Link>
              </div>
            </form>
          </div>
        </div>

        <div className="text-center text-muted mt-4" style={{ fontSize: 12 }}>
          © {new Date().getFullYear()} Chapacar — Repuestos & Taller
        </div>
      </Container>
    </div>
  );
}
