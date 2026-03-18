// src/utils/whatsapp.js

// Podés cambiar estos valores cuando quieras:
const WPP_PHONE = '59896228550'; // Uruguay: 598 + 96228550 (sin el 0)
const DEFAULT_MESSAGE =
  'Hola! Vengo desde la web de Chapacar. Quiero hacer una consulta.';

export function buildWhatsAppLink(message = DEFAULT_MESSAGE) {
  if (!WPP_PHONE) {
    console.error('No se configuró el WhatsApp del negocio.');
    return '#';
  }

  const encodedMsg = encodeURIComponent(message || DEFAULT_MESSAGE);
  return `https://wa.me/${WPP_PHONE}?text=${encodedMsg}`;
}
