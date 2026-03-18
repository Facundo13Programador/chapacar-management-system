import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getAdminSiteSettings, updateSiteSettings } from "../../services/siteSettings.service.js";
import ChatTest from '../../components/chatTest.jsx';

export default function SiteSettingsScreen({ canEdit = true }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [data, setData] = useState({
    company: { name: "", about: "", hours: "", logoUrl: "" },
    contact: { phone: "", whatsapp: "", email: "", address: "", instagram: "", facebook: "" },
    location: { mapsUrl: "", lat: "", lng: "" },
    carousel: [],
    faqs: [],
  });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const doc = await getAdminSiteSettings();
        setData({
          company: doc.company || data.company,
          contact: doc.contact || data.contact,
          location: doc.location || data.location,
          carousel: doc.carousel || [],
          faqs: doc.faqs || [],
        });
      } catch (e) {
        console.error(e);
        toast.error(e?.response?.data?.message || "No se pudo cargar la configuración");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSave = async () => {
    if (!canEdit) return;

    try {
      setSaving(true);
      const saved = await updateSiteSettings(data);
      toast.success("Configuración guardada");
      setData({
        company: saved.company || data.company,
        contact: saved.contact || data.contact,
        location: saved.location || data.location,
        carousel: saved.carousel || [],
        faqs: saved.faqs || [],
      });
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const setCompany = (patch) => setData((p) => ({ ...p, company: { ...p.company, ...patch } }));
  const setContact = (patch) => setData((p) => ({ ...p, contact: { ...p.contact, ...patch } }));
  const setLocation = (patch) => setData((p) => ({ ...p, location: { ...p.location, ...patch } }));

  const addSlide = () =>
    setData((p) => ({
      ...p,
      carousel: [
        ...p.carousel,
        { image: "", title: "", subtitle: "", link: "", order: p.carousel.length, isActive: true },
      ],
    }));

  const updateSlide = (idx, patch) =>
    setData((p) => ({
      ...p,
      carousel: p.carousel.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    }));

  const removeSlide = (idx) =>
    setData((p) => ({
      ...p,
      carousel: p.carousel.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i })),
    }));

  const addFaq = () =>
    setData((p) => ({
      ...p,
      faqs: [...p.faqs, { question: "", answer: "", order: p.faqs.length, isActive: true }],
    }));

  const updateFaq = (idx, patch) =>
    setData((p) => ({
      ...p,
      faqs: p.faqs.map((f, i) => (i === idx ? { ...f, ...patch } : f)),
    }));

  const removeFaq = (idx) =>
    setData((p) => ({
      ...p,
      faqs: p.faqs.filter((_, i) => i !== idx).map((f, i) => ({ ...f, order: i })),
    }));

  if (loading) return <div className="card"><div className="card-body">Cargando…</div></div>;

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
          <div>
            <h4 className="mb-1">Configuración del sitio</h4>
            <div className="text-muted small">Carousel, empresa, contacto, ubicación y FAQ</div>
          </div>

          <button className="btn btn-chapacar" onClick={onSave} disabled={!canEdit || saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>

        <hr />

        {/* EMPRESA */}
        <h5 className="mb-3">Empresa</h5>
        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <label className="form-label">Nombre</label>
            <input className="form-control" value={data.company.name || ""} onChange={(e) => setCompany({ name: e.target.value })} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Logo URL</label>
            <input className="form-control" value={data.company.logoUrl || ""} onChange={(e) => setCompany({ logoUrl: e.target.value })} />
          </div>
          <div className="col-12">
            <label className="form-label">Sobre la empresa (texto)</label>
            <textarea className="form-control" rows={5} value={data.company.about || ""} onChange={(e) => setCompany({ about: e.target.value })} />
          </div>
          <div className="col-12">
            <label className="form-label">Horarios</label>
            <textarea className="form-control" rows={2} value={data.company.hours || ""} onChange={(e) => setCompany({ hours: e.target.value })} />
          </div>
        </div>

        {/* CONTACTO */}
        <h5 className="mb-3">Contacto</h5>
        <div className="row g-3 mb-4">
          {["phone","whatsapp","email","address","instagram","facebook"].map((k) => (
            <div className="col-md-6" key={k}>
              <label className="form-label">{k}</label>
              <input className="form-control" value={data.contact[k] || ""} onChange={(e) => setContact({ [k]: e.target.value })} />
            </div>
          ))}
        </div>

        {/* UBICACIÓN */}
        <h5 className="mb-3">Ubicación</h5>
        <div className="row g-3 mb-4">
          <div className="col-12">
            <label className="form-label">Google Maps Embed (src)</label>
            <input className="form-control" value={data.location.mapsUrl || ""} onChange={(e) => setLocation({ mapsUrl: e.target.value })} />
            <div className="form-text">Pegá el src del iframe de Google Maps (embed).</div>
          </div>
          <div className="col-md-6">
            <label className="form-label">Lat</label>
            <input className="form-control" value={data.location.lat ?? ""} onChange={(e) => setLocation({ lat: e.target.value })} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Lng</label>
            <input className="form-control" value={data.location.lng ?? ""} onChange={(e) => setLocation({ lng: e.target.value })} />
          </div>
        </div>

        {/* CAROUSEL */}
        <div className="d-flex align-items-center justify-content-between">
          <h5 className="mb-3">Carousel (Home)</h5>
          <button className="btn btn-outline-secondary btn-sm" type="button" onClick={addSlide} disabled={!canEdit}>
            + Agregar slide
          </button>
        </div>

        {data.carousel.length === 0 ? (
          <div className="text-muted small mb-4">No hay slides cargados.</div>
        ) : (
          <div className="mb-4">
            {data.carousel.map((s, idx) => (
              <div key={idx} className="border rounded p-3 mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong>Slide #{idx + 1}</strong>
                  <button className="btn btn-outline-danger btn-sm" type="button" onClick={() => removeSlide(idx)} disabled={!canEdit}>
                    Eliminar
                  </button>
                </div>

                <div className="row g-2">
                  <div className="col-md-6">
                    <label className="form-label">Imagen (URL)</label>
                    <input className="form-control" value={s.image || ""} onChange={(e) => updateSlide(idx, { image: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Link (opcional)</label>
                    <input className="form-control" value={s.link || ""} onChange={(e) => updateSlide(idx, { link: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Título</label>
                    <input className="form-control" value={s.title || ""} onChange={(e) => updateSlide(idx, { title: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Subtítulo</label>
                    <input className="form-control" value={s.subtitle || ""} onChange={(e) => updateSlide(idx, { subtitle: e.target.value })} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Orden</label>
                    <input
                      type="number"
                      className="form-control"
                      value={Number(s.order ?? idx)}
                      onChange={(e) => updateSlide(idx, { order: Number(e.target.value) })}
                    />
                  </div>
                  <div className="col-md-3 d-flex align-items-end">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={s.isActive !== false}
                        onChange={(e) => updateSlide(idx, { isActive: e.target.checked })}
                      />
                      <label className="form-check-label">Activo</label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FAQ */}
        <div className="d-flex align-items-center justify-content-between">
          <h5 className="mb-3">Preguntas frecuentes (FAQ)</h5>
          <button className="btn btn-outline-secondary btn-sm" type="button" onClick={addFaq} disabled={!canEdit}>
            + Agregar FAQ
          </button>
        </div>

        {data.faqs.length === 0 ? (
          <div className="text-muted small">No hay FAQs cargadas.</div>
        ) : (
          data.faqs.map((f, idx) => (
            <div key={idx} className="border rounded p-3 mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <strong>FAQ #{idx + 1}</strong>
                <button className="btn btn-outline-danger btn-sm" type="button" onClick={() => removeFaq(idx)} disabled={!canEdit}>
                  Eliminar
                </button>
              </div>

              <div className="row g-2">
                <div className="col-md-6">
                  <label className="form-label">Pregunta</label>
                  <input className="form-control" value={f.question || ""} onChange={(e) => updateFaq(idx, { question: e.target.value })} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Orden</label>
                  <input type="number" className="form-control" value={Number(f.order ?? idx)} onChange={(e) => updateFaq(idx, { order: Number(e.target.value) })} />
                </div>
                <div className="col-12">
                  <label className="form-label">Respuesta</label>
                  <textarea className="form-control" rows={3} value={f.answer || ""} onChange={(e) => updateFaq(idx, { answer: e.target.value })} />
                </div>
                <div className="col-md-3">
                  <div className="form-check mt-2">
                    <input className="form-check-input" type="checkbox" checked={f.isActive !== false} onChange={(e) => updateFaq(idx, { isActive: e.target.checked })} />
                    <label className="form-check-label">Activo</label>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
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
    </div>
  );
}
