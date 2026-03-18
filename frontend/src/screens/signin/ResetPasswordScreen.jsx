import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import { toast } from 'react-toastify';
import { resetPassword } from '../../services/auth.service';

import logoCompleto from '../../logos/logoFunciona.png';
import '../../components/css/header.css';
import '../../components/css/signin.css';

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

export default function ResetPasswordScreen() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const [touched, setTouched] = useState({ password: false, confirm: false });

  const v = useMemo(() => {
    const vPwLen = password.length >= 8;
    const vPwNum = hasNumber(password);
    const vPwOk = vPwLen && vPwNum;
    const vConfirm = confirm.length > 0 && confirm === password;
    const score = passwordScore(password);

    return {
      vPwLen,
      vPwNum,
      vPwOk,
      vConfirm,
      score,
      canSubmit: vPwOk && vConfirm && !loading,
    };
  }, [password, confirm, loading]);

  const submitHandler = async (e) => {
    e.preventDefault();
    setTouched({ password: true, confirm: true });

    try {
      if (!v.canSubmit) throw new Error('Revisá los campos antes de continuar');

      setLoading(true);
      await resetPassword(token, password);
      toast.success('Contraseña actualizada, ya podés iniciar sesión');
      navigate('/signin');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Error';
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
            <p className="chap-auth-subtitle mb-0">Nueva contraseña</p>
          </div>

          <div className="chap-auth-body">
            <h4 className="mb-1">Restablecer contraseña</h4>
            <p className="text-muted mb-4" style={{ fontSize: 14 }}>
              Elegí una contraseña nueva y confirmala.
            </p>

            <form onSubmit={submitHandler}>
              <div className="mb-3">
                <label className="form-label">Nueva contraseña</label>
                <div className="input-group chap-input">
                  <span className="input-group-text">🔒</span>
                  <input
                    className={`form-control ${inputClass(v.vPwOk, 'password')}`}
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

                <div className="chap-meter">
                  <div style={{ width: meterWidth(v.score) }} />
                </div>
                <div className="chap-meter-label">
                  Fuerza: <strong>{meterLabel(v.score)}</strong>
                </div>

                <ul className="chap-hint-list">
                  <li className={v.vPwLen ? 'ok' : 'bad'}>
                    {v.vPwLen ? '✔' : '✖'} Mínimo 8 caracteres
                  </li>
                  <li className={v.vPwNum ? 'ok' : 'bad'}>
                    {v.vPwNum ? '✔' : '✖'} Al menos 1 número
                  </li>
                </ul>

                {touched.password && !v.vPwOk && (
                  <div className="chap-help is-error">
                    La contraseña debe tener 8+ caracteres y al menos 1 número.
                  </div>
                )}
              </div>

              <div className="mb-2">
                <label className="form-label">Confirmar contraseña</label>
                <div className="input-group chap-input">
                  <span className="input-group-text">✅</span>
                  <input
                    className={`form-control ${inputClass(v.vConfirm, 'confirm')}`}
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
                  <div className={`chap-help ${v.vConfirm ? 'is-ok' : 'is-error'}`}>
                    {v.vConfirm ? 'Coinciden.' : 'Las contraseñas no coinciden.'}
                  </div>
                )}
              </div>

              <button
                className="btn btn-chapacar w-100 mt-3 chap-auth-btn"
                type="submit"
                disabled={!v.canSubmit}
              >
                {loading ? 'Guardando…' : 'Guardar contraseña'}
              </button>

              <div className="text-center mt-3" style={{ fontSize: 13 }}>
                <Link to="/signin" className="chap-link">
                  ← Volver a iniciar sesión
                </Link>
              </div>
            </form>
          </div>
        </div>
      </Container>
    </div>
  );
}
