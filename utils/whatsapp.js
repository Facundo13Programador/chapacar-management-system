export function buildWhatsAppLink(phone, message) {
    const cleanPhone = String(phone || "").replace(/[^\d]/g, "");
    const text = encodeURIComponent(message || "");
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`;
  }
  