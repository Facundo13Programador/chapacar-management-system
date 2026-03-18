import React, { useEffect, useMemo, useState } from 'react';
import Container from 'react-bootstrap/Container';
import { toast } from 'react-toastify';
import { useNavigate, useLocation, Link } from 'react-router-dom';

import { register } from '../../services/auth.service';
import { saveAuth, isAuthenticated } from '../../utils/authUtils';

import logoCompleto from '../../logos/logoFunciona.png';
import '../../components/css/header.css';
import '../../components/css/signin.css';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const hasNumber = (s) => /\d/.test(s);

function passwordScore(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (hasNumber(pw)) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

function meterWidth(score) {
  return `${Math.min(100, score * 25)}%`;
}

function meterLabel(score) {
  if (score <= 1) return 'Débil';
  if (score === 2) return 'Media';
  if (score === 3) return 'Buena';
  return 'Fuerte';
}

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirm: false,
  });

  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { search } = useLocation();
  const redirect = new URLSearchParams(search).get('redirect') || '/';

  useEffect(() => {
    if (isAuthenticated()) navigate(redirect);
  }, [navigate, redirect]);

  const validations = useMemo(() => {
    const vName = name.trim().length >= 2;
    const vEmail = emailRegex.test(email.trim());
    const vPwLen = password.length >= 8;
    const vPwNum = hasNumber(password);
    const vPwOk = vPwLen && vPwNum;
    const vConfirm = confirm.length > 0 && confirm === password;

    const score = passwordScore(password);

    return {
      vName,
      vEmail,
      vPwLen,
      vPwNum,
      vPwOk,
      vConfirm,
      score,
      canSubmit: vName && vEmail && vPwOk && vConfirm && !loading,
    };
  }, [name, email, password, confirm, loading]);

  const submitHandler = async (e) => {
    e.preventDefault();

    setTouched({ name: true, email: true, password: true, confirm: true });

    try {
      if (!validations.canSubmit) {
        throw new Error('Revisá los campos antes de continuar');
      }

      setLoading(true);
      const data = await register(name.trim(), email.trim(), password);
      saveAuth(data);

      toast.success('Cuenta creada');
      navigate(redirect);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Error al registrarse';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (ok, field) => {
    if (!touched[field]) return '';
    return ok ? 'is-valid' : 'is-invalid';
  };

  return (
    <div className="chap-auth-page">
      <Container className="py-5">
        <div className="chap-auth-card mx-auto">
          <div className="chap-auth-brand text-center">
            <Link to="/" className="d-inline-block">
              <img src={logoCompleto} alt="Chapacar" className="chap-auth-logo" />
            </Link>
            <p className="chap-auth-subtitle mb-0">Crear tu cuenta</p>
          </div>

          <div className="chap-auth-body">
            <h4 className="mb-1">Registrate</h4>
            <p className="text-muted mb-4" style={{ fontSize: 14 }}>
              Comprá repuestos y gestioná reservas en Chapacar.
            </p>

            <form onSubmit={submitHandler}>
              {/* Nombre */}
              <div className="mb-3">
                <label className="form-label">Nombre</label>
                <div className="input-group chap-input">
                  <span className="input-group-text">👤</span>
                  <input
                    className={`form-control ${inputClass(validations.vName, 'name')}`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                    placeholder="Tu nombre"
                    autoComplete="name"
                    required
                  />
                </div>
                {touched.name && (
                  <div className={`chap-help ${validations.vName ? 'is-ok' : 'is-error'}`}>
                    {validations.vName ? 'Perfecto.' : 'Ingresá al menos 2 caracteres.'}
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="mb-3">
                <label className="form-label">Correo electrónico</label>
                <div className="input-group chap-input">
                  <span className="input-group-text">✉️</span>
                  <input
                    className={`form-control ${inputClass(validations.vEmail, 'email')}`}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    placeholder="tu@email.com"
                    autoComplete="email"
                    required
                  />
                </div>
                {touched.email && (
                  <div className={`chap-help ${validations.vEmail ? 'is-ok' : 'is-error'}`}>
                    {validations.vEmail ? 'Email válido.' : 'Ingresá un email válido.'}
                  </div>
                )}
              </div>

              {/* Password */}
              <div className="mb-3">
                <label className="form-label">Contraseña</label>
                <div className="input-group chap-input">
                  <span className="input-group-text">🔒</span>
                  <input
                    className={`form-control ${inputClass(validations.vPwOk, 'password')}`}
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPwd((s) => !s)}
                    style={{ borderLeft: '0' }}
                  >
                    {showPwd ? '🙈' : '👁️'}
                  </button>
                </div>

                {/* Meter */}
                <div className="chap-meter">
                  <div style={{ width: meterWidth(validations.score) }} />
                </div>
                <div className="chap-meter-label">
                  Fuerza: <strong>{meterLabel(validations.score)}</strong>
                </div>

                <ul className="chap-hint-list">
                  <li className={validations.vPwLen ? 'ok' : 'bad'}>
                    {validations.vPwLen ? '✔' : '✖'} Mínimo 8 caracteres
                  </li>
                  <li className={validations.vPwNum ? 'ok' : 'bad'}>
                    {validations.vPwNum ? '✔' : '✖'} Al menos 1 número
                  </li>
                </ul>

                {touched.password && !validations.vPwOk && (
                  <div className="chap-help is-error">
                    La contraseña debe tener 8+ caracteres y al menos 1 número.
                  </div>
                )}
              </div>

              {/* Confirm */}
              <div className="mb-2">
                <label className="form-label">Confirmar contraseña</label>
                <div className="input-group chap-input">
                  <span className="input-group-text">✅</span>
                  <input
                    className={`form-control ${inputClass(validations.vConfirm, 'confirm')}`}
                    type={showPwd ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                  />
                </div>
                {touched.confirm && (
                  <div className={`chap-help ${validations.vConfirm ? 'is-ok' : 'is-error'}`}>
                    {validations.vConfirm ? 'Coinciden.' : 'Las contraseñas no coinciden.'}
                  </div>
                )}
              </div>

              <button
                className="btn btn-chapacar w-100 mt-3 chap-auth-btn"
                type="submit"
                disabled={!validations.canSubmit}
              >
                {loading ? 'Creando…' : 'Crear cuenta'}
              </button>

              <div className="chap-divider my-4">
                <span>o</span>
              </div>

              <Link
                className="btn btn-outline-dark w-100"
                to={`/signin?redirect=${encodeURIComponent(redirect)}`}
              >
                Ya tengo cuenta — Iniciar sesión
              </Link>

              <div className="text-center mt-3" style={{ fontSize: 13 }}>
                <Link to="/" className="chap-link">← Volver a la tienda</Link>
              </div>
            </form>
          </div>
        </div>
      </Container>
    </div>
  );
}
