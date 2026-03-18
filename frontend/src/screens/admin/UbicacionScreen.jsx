// src/screens/company/UbicacionScreen.jsx
import React, { useEffect, useState } from "react";
import Header from "../../components/Header.jsx";
import Footer from "../../components/Footer.jsx";
import { getPublicSiteSettings } from "../../services/siteSettings.service.js";
import ChatTest from '../../components/chatTest.jsx';

export default function UbicacionScreen({ user, onLogout, onCartOpen }) {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getPublicSiteSettings();
        setSettings(data || null);
      } catch (e) {
        console.error("UbicacionScreen settings error:", e);
        setSettings(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const company = settings?.company || {};
  const contact = settings?.contact || {};
  const location = settings?.location || {};

  const address = contact?.address?.trim() || "Maldonado, Uruguay";
  const phone = contact?.phone?.trim() || "(+598) 0000 0000";
  const email = contact?.email?.trim() || "info@chapacar.com.uy";
  const hours =
    company?.hours?.trim() ||
    "Lunes a viernes de 8:30 a 18:00 hs\nSábados de 9:00 a 13:00 hs";
  const mapSrc =
    location?.mapsUrl?.trim() ||
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3272.1124368071282!2d-54.94637972340605!3d-34.90362777340043!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95751b9feb2fa405%3A0x9cbeb59a7c7b7d77!2sRepuestos%20y%20Taller%20Chapacar!5e0!3m2!1ses-419!2suy!4v1764364107181!5m2!1ses-419!2suy";

  return (
    <>
      <Header user={user} onLogout={onLogout} onCartOpen={onCartOpen} />

      <main className="bg-light">
        <div className="container py-5">
          <div className="row mb-4">
            <div className="col-lg-7">
              <h1 className="mb-3">Ubicación</h1>
              <p className="text-muted">
                {company?.name || "Chapacar"} se encuentra en la ciudad de Maldonado, Uruguay.
                Desde hace más de 30 años trabajamos en el rubro automotriz brindando servicios
                de taller, chapa y pintura, y venta de repuestos para clientes de toda la región.
              </p>
              <p className="text-muted mb-0">
                Podés encontrarnos en nuestro local físico para realizar consultas, coordinar
                trabajos en el taller o retirar repuestos.
              </p>
            </div>

            <div className="col-lg-5 mt-4 mt-lg-0">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h2 className="h5 mb-3">Datos de contacto</h2>

                  <p className="mb-1">
                    <strong>Dirección:</strong>
                    <br />
                    <span className="text-muted">
                      {loading ? "Cargando..." : address}
                    </span>
                  </p>

                  <p className="mb-1">
                    <strong>Teléfono:</strong>
                    <br />
                    <span className="text-muted">
                      {loading ? "Cargando..." : phone}
                    </span>
                  </p>

                  <p className="mb-1">
                    <strong>Correo electrónico:</strong>
                    <br />
                    <span className="text-muted">
                      {loading ? "Cargando..." : email}
                    </span>
                  </p>

                  <p className="mb-0">
                    <strong>Horario de atención:</strong>
                    <br />
                    <span className="text-muted" style={{ whiteSpace: "pre-line" }}>
                      {loading ? "Cargando..." : hours}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mapa de Google */}
          <div className="row">
            <div className="col-12 mb-3">
              <h2 className="h5 mb-3">Cómo llegar</h2>

              <div className="ratio ratio-16x9">
                <iframe
                  title="Mapa Chapacar"
                  src={mapSrc}
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              <p className="small text-muted mt-2 mb-0">
                Podés hacer zoom, mover el mapa o abrirlo en Google Maps para obtener
                indicaciones desde tu ubicación actual.
              </p>
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
