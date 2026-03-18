// src/screens/company/FaqScreen.jsx
import React, { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header.jsx";
import Footer from "../../components/Footer.jsx";
import { getPublicSiteSettings } from "../../services/siteSettings.service.js";
import ChatTest from '../../components/chatTest.jsx';

export default function FaqScreen({ user, onLogout, onCartOpen }) {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getPublicSiteSettings();
        setSettings(data || null);
      } catch (e) {
        console.error("FaqScreen settings error:", e);
        setSettings(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const faqs = useMemo(() => {
    const list = settings?.faqs || [];
    const query = q.trim().toLowerCase();
    if (!query) return list;

    return list.filter((f) => {
      const qq = (f?.question || "").toLowerCase();
      const aa = (f?.answer || "").toLowerCase();
      return qq.includes(query) || aa.includes(query);
    });
  }, [settings, q]);

  return (
    <>
      <Header user={user} onLogout={onLogout} onCartOpen={onCartOpen} />

      <main className="bg-light">
        <div className="container py-5">
          <div className="row align-items-start g-4">
            <div className="col-lg-4">
              <h1 className="mb-2">Preguntas frecuentes</h1>
              <p className="text-muted mb-4">
                Encontrá respuestas rápidas sobre repuestos, taller, compras y
                coordinación.
              </p>

              <div className="card shadow-sm">
                <div className="card-body">
                  <label className="form-label">Buscar</label>
                  <input
                    className="form-control"
                    placeholder="Escribí una palabra clave…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                  <div className="form-text">
                    Tip: probá “envío”, “reserva”, “garantía”, “horarios”.
                  </div>

                  <hr />

                  <div className="small text-muted">
                    {loading
                      ? "Cargando preguntas..."
                      : `Mostrando ${faqs.length} de ${(settings?.faqs || []).length}`}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-8">
              {loading && (
                <div className="card shadow-sm">
                  <div className="card-body">Cargando…</div>
                </div>
              )}

              {!loading && faqs.length === 0 && (
                <div className="alert alert-secondary">
                  No hay preguntas para mostrar{q.trim() ? " con ese filtro" : ""}.
                </div>
              )}

              {!loading && faqs.length > 0 && (
                <div className="accordion" id="faqAccordion">
                  {faqs.map((f, idx) => {
                    const headingId = `faqHeading-${idx}`;
                    const collapseId = `faqCollapse-${idx}`;
                    return (
                      <div className="accordion-item" key={f?._id || idx}>
                        <h2 className="accordion-header" id={headingId}>
                          <button
                            className={`accordion-button ${idx === 0 && !q ? "" : "collapsed"}`}
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target={`#${collapseId}`}
                            aria-expanded={idx === 0 && !q ? "true" : "false"}
                            aria-controls={collapseId}
                          >
                            {f?.question || "Pregunta"}
                          </button>
                        </h2>

                        <div
                          id={collapseId}
                          className={`accordion-collapse collapse ${idx === 0 && !q ? "show" : ""}`}
                          aria-labelledby={headingId}
                          data-bs-parent="#faqAccordion"
                        >
                          <div className="accordion-body" style={{ whiteSpace: "pre-line" }}>
                            {f?.answer || ""}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!loading && (
                <div className="mt-4">
                  <div className="alert alert-primary mb-0">
                    <div className="fw-semibold mb-1">¿No encontraste tu respuesta?</div>
                    <div className="small">
                      Escribinos por WhatsApp o llamanos y te ayudamos.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {isChatOpen && <ChatTest onClose={() => setIsChatOpen(false)} />}
      <button
        type="button"
        onClick={() => setIsChatOpen((prev) => !prev)}
        className="chap-fab"
        aria-label={isChatOpen ? 'Cerrar chat' : 'Abrir chat'}
        title={isChatOpen ? 'Cerrar chat' : 'Abrir chat'}
      >
        {isChatOpen ? '×' : '💬'}
      </button>
      </main>

      <Footer />
    </>
  );
}
