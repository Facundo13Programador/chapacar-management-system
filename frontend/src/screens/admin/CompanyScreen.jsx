// src/screens/company/CompanyScreen.jsx
import React, { useEffect, useState } from "react";
import Header from "../../components/Header.jsx";
import Footer from "../../components/Footer.jsx";
import { getPublicSiteSettings } from "../../services/siteSettings.service.js";

export default function CompanyScreen({ user, onLogout, onCartOpen }) {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getPublicSiteSettings();
        setSettings(data || null);
      } catch (e) {
        console.error("CompanyScreen settings error:", e);
        setSettings(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const company = settings?.company || {};
  const contact = settings?.contact || {};
  const about =
    company?.about?.trim() ||
    "Chapacar es una empresa familiar radicada en Maldonado, Uruguay, con más de 30 años de trayectoria en el mercado automotriz.";

  const hours =
    company?.hours?.trim() ||
    "Lunes a viernes de 8:30 a 18:00 hs\nSábados de 9:00 a 13:00 hs";

  return (
    <>
      <Header user={user} onLogout={onLogout} onCartOpen={onCartOpen} />

      <main className="bg-light">
        <div className="container py-5">
          {/* Hero / Presentación */}
          <div className="row align-items-center mb-5">
            <div className="col-lg-7">
              <h1 className="mb-3">Sobre {company?.name || "Chapacar"}</h1>

              {/* Mantengo tu UI; solo reemplazo textos */}
              <p className="lead text-muted">
                {loading ? "Cargando información..." : about}
              </p>

              <p className="text-muted mb-0">
                {loading
                  ? ""
                  : "Nuestro foco está puesto en la atención personalizada, la calidad técnica y la construcción de relaciones de largo plazo."}
              </p>

              {/* bloque contacto (opcional, sin cambiar el layout demasiado) */}
              {!loading && (contact.phone || contact.email) && (
                <div className="mt-3 small text-muted">
                  {contact.phone && (
                    <div>
                      <strong>Tel:</strong> {contact.phone}
                    </div>
                  )}
                  {contact.email && (
                    <div>
                      <strong>Email:</strong> {contact.email}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="col-lg-5 mt-4 mt-lg-0">
              <div className="row g-3">
                <div className="col-6">
                  <div className="card h-100 shadow-sm">
                    <div className="card-body text-center">
                      <h3 className="fw-bold mb-1">30+</h3>
                      <p className="mb-1 small text-muted">Años en el rubro</p>
                      <p className="small text-muted">
                        Experiencia en mecánica, chapa y pintura.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="col-6">
                  <div className="card h-100 shadow-sm">
                    <div className="card-body text-center">
                      <h3 className="fw-bold mb-1">27+</h3>
                      <p className="mb-1 small text-muted">Años en repuestos</p>
                      <p className="small text-muted">
                        Casa de repuestos para talleres y clientes finales.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="col-12">
                  <div className="card h-100 shadow-sm">
                    <div className="card-body text-center">
                      <p className="small text-muted mb-1">Horario de atención</p>
                      <p className="fw-semibold mb-0" style={{ whiteSpace: "pre-line" }}>
                        {loading ? "Cargando..." : hours}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Qué hacemos (lo dejo tal cual, porque hoy no lo estás administrando) */}
          <div className="row mb-5">
            <div className="col-lg-4 mb-3">
              <h2 className="h4">Qué hacemos</h2>
              <p className="text-muted mb-0">
                Integramos servicios de taller y venta de repuestos en un único
                equipo, para dar una solución completa a nuestros clientes:
              </p>
            </div>

            <div className="col-lg-8">
              <div className="row g-3">
                <div className="col-md-4">
                  <div className="card h-100 shadow-sm">
                    <div className="card-body">
                      <h3 className="h6 fw-bold mb-2">Taller mecánico</h3>
                      <p className="small text-muted mb-0">
                        Diagnóstico y reparación mecánica con personal
                        calificado y equipamiento actualizado.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="card h-100 shadow-sm">
                    <div className="card-body">
                      <h3 className="h6 fw-bold mb-2">Chapa y pintura</h3>
                      <p className="small text-muted mb-0">
                        Reparación estructural y estética, cuidando los detalles
                        y el valor de cada vehículo.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="card h-100 shadow-sm">
                    <div className="card-body">
                      <h3 className="h6 fw-bold mb-2">Repuestos y logística</h3>
                      <p className="small text-muted mb-0">
                        Amplio catálogo de repuestos en constante rotación,
                        orientado a talleres y particulares, con procesos
                        estandarizados de inventario.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Valores y forma de trabajo (igual, sin tocar) */}
          <div className="row mb-5">
            <div className="col-lg-6 mb-3">
              <h2 className="h4">Nuestra forma de trabajo</h2>
              <ul className="list-group list-group-flush">
                <li className="list-group-item px-0">
                  <strong>Atención personalizada:</strong> escuchamos la necesidad
                  de cada cliente y proponemos la solución más adecuada.
                </li>
                <li className="list-group-item px-0">
                  <strong>Relaciones de largo plazo:</strong> priorizamos la confianza
                  y el vínculo con clientes y talleres.
                </li>
                <li className="list-group-item px-0">
                  <strong>Calidad técnica:</strong> combinamos experiencia, capacitación
                  constante y herramientas actuales.
                </li>
                <li className="list-group-item px-0">
                  <strong>Mejora continua:</strong> revisamos y optimizamos procesos
                  para ser más ágiles y eficientes.
                </li>
              </ul>
            </div>

            <div className="col-lg-6">
              <h2 className="h4">Transformación digital</h2>
              <p className="text-muted">
                En la actualidad, {company?.name || "Chapacar"} se encuentra en un proceso de
                profesionalización y digitalización de su gestión, que incluye:
              </p>
              <ul className="small text-muted">
                <li>Gestión integrada del taller (reservas, OT, seguimiento).</li>
                <li>Control de inventario y stock en tiempo real.</li>
                <li>Soporte a ventas físicas y en línea, con catálogo actualizado.</li>
                <li>Indicadores de gestión para decisiones basadas en datos.</li>
              </ul>
              <p className="text-muted mb-0">
                Este proyecto apunta a sostener el crecimiento de la empresa y
                reforzar su liderazgo regional.
              </p>
            </div>
          </div>

          {/* Llamado final */}
          <div className="row">
            <div className="col-lg-8">
              <div className="alert alert-primary mb-0">
                <h2 className="h5 mb-2">
                  {company?.name || "Chapacar"}, 30 años acompañando a los vehículos de Maldonado
                </h2>
                <p className="mb-0 small">
                  Somos un equipo que combina tradición, experiencia y tecnología
                  para ofrecer un servicio confiable y cercano.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
