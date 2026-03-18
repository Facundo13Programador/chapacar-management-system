// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import '../components/css/footer.css';

export default function Footer() {
  return (
    <footer className="chap-footer border-top">
      <div className="container py-4 d-flex justify-content-between flex-wrap gap-3">
        <div>
          <h6 className="fw-bold mb-1">CHAPACAR</h6>
          <small>© {new Date().getFullYear()} — Todos los derechos reservados</small>
        </div>

        <div className="text-end">
          <small className="d-flex gap-2 justify-content-end flex-wrap">
            <Link to="/faq" className="footer-link">Soporte</Link>
            <span className="text-muted">•</span>
            <Link to="/terminos" className="footer-link">Términos</Link>
            <span className="text-muted">•</span>
            <Link to="/privacidad" className="footer-link">Privacidad</Link>
          </small>
        </div>
      </div>
    </footer>
  );
}
