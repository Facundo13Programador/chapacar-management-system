import React, { useMemo, useState } from 'react';
import Container from 'react-bootstrap/Container';
import { toast } from 'react-toastify';
import { forgotPassword } from '../../services/auth.service';
import { Link } from 'react-router-dom';

import logoCompleto from '../../logos/logoFunciona.png';
import '../../components/css/header.css';
import '../../components/css/signin.css';


const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const vEmail = useMemo(() => emailRegex.test(email.trim()), [email]);

  const submitHandler = async (e) => {
    e.preventDefault();
    setTouched(true);

    try {
      if (!vEmail) throw new Error('Ingresá un email válido');

      setLoading(true);
      const data = await forgotPassword(email.trim());
      toast.info(data.message || 'Si el email existe, enviaremos un enlace');
      setEmail('');
      setTouched(false);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Error al solicitar recuperación';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputStateClass = touched ? (vEmail ? 'is-valid' : 'is-invalid') : '';

  return (
    <div className="chap-auth-page">
      <Container className="py-5">
        <div className="chap-auth-card mx-auto">
          <div className="chap-auth-brand text-center">
            <Link to="/" className="d-inline-block">
              <img src={logoCompleto} alt="Chapacar" className="chap-auth-logo" />
            </Link>
            <p className="chap-auth-subtitle mb-0">Recuperar acceso</p>
          </div>

          <div className="chap-auth-body">
            <h4 className="mb-1">Recuperar contraseña</h4>
            <p className="text-muted mb-4" style={{ fontSize: 14 }}>
              Ingresá tu email y te enviamos un enlace.
            </p>

            <form onSubmit={submitHandler}>
              <div className="mb-3">
                <label className="form-label">Correo electrónico</label>
                <div className="input-group chap-input">
                  <span className="input-group-text">✉️</span>
                  <input
                    className={`form-control ${inputStateClass}`}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched(true)}
                    placeholder="tu@email.com"
                    autoComplete="email"
                    required
                  />
                </div>

                {touched && (
                  <div className={`chap-help ${vEmail ? 'is-ok' : 'is-error'}`}>
                    {vEmail ? 'Email válido.' : 'Ingresá un email válido.'}
                  </div>
                )}
              </div>

              <button
                className="btn btn-chapacar w-100 chap-auth-btn"
                type="submit"
                disabled={!vEmail || loading}
              >
                {loading ? 'Enviando…' : 'Enviar enlace de recuperación'}
              </button>

              <div className="chap-divider my-4">
                <span>o</span>
              </div>

              <Link className="btn btn-outline-dark w-100" to="/signin">
                Volver a iniciar sesión
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
