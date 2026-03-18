// src/components/Carousel.jsx
import React from 'react';

const slides = [
  {
    url: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1200',
    title: 'Mecánica de precisión',
    caption: 'Diagnóstico y reparación profesional',
  },
  {
    url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200',
    title: 'Repuestos originales y alternativos',
    caption: 'Stock para las marcas más comunes',
  },
  {
    url: 'https://www.bse.com.uy/wps/wcm/connect/17e4a502-a584-49f4-b135-69b803edc67b/shutterstock_1714213732+%281%29.jpg?MOD=AJPERES',
    title: 'Servicio rápido',
    caption: 'Mantenimiento preventivo y correctivo',
  },
];

export default function Carousel() {
  return (
    <div
      id="hero"
      className="carousel slide carousel-fade mb-4"
      data-bs-ride="carousel"
      data-bs-interval="5000"
      data-bs-pause="hover"
    >
      <div className="carousel-indicators">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            data-bs-target="#hero"
            data-bs-slide-to={i}
            className={i === 0 ? 'active' : ''}
            aria-current={i === 0 ? 'true' : undefined}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      <div className="carousel-inner rounded-3 overflow-hidden">
        {slides.map((s, i) => (
          <div key={i} className={`carousel-item ${i === 0 ? 'active' : ''}`}>
            <img
              src={s.url}
              alt={s.title}
              className="d-block w-100"
              style={{
                objectFit: 'cover',
                maxHeight: 360,
                height: 360,
              }}
            />
            <div className="carousel-caption text-start">
              <h3 className="fw-bold">{s.title}</h3>
              <p>{s.caption}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        className="carousel-control-prev"
        type="button"
        data-bs-target="#hero"
        data-bs-slide="prev"
      >
        <span className="carousel-control-prev-icon" aria-hidden="true" />
        <span className="visually-hidden">Anterior</span>
      </button>

      <button
        className="carousel-control-next"
        type="button"
        data-bs-target="#hero"
        data-bs-slide="next"
      >
        <span className="carousel-control-next-icon" aria-hidden="true" />
        <span className="visually-hidden">Siguiente</span>
      </button>
    </div>
  );
}
