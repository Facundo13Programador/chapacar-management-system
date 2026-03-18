// src/screens/checkout/CheckoutPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import Header from '../../components/Header.jsx';
import Footer from '../../components/Footer.jsx';
import { getUser, onAuthChange, clearAuth } from '../../utils/authUtils.js';
import { logout as apiLogout } from '../../services/auth.service.js';
import { buildWhatsAppLink } from '../../utils/whatsapp';

import {
  getCart,
  clearCart,
  updateItemQty,
  removeFromCart,
} from '../../utils/cartUtils.js';

import { createOrder } from '../../services/orders.service.js';
import { getMyProfile, updateMyProfile } from '../../services/users.service.js';
import { getPublicProduct } from '../../services/products.service.js';
import '../../components/css/header.css';

export default function CheckoutPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(getUser());

  useEffect(() => {
    const off = onAuthChange(() => setUser(getUser()));
    return off;
  }, []);

  useEffect(() => {
    if (!user) {
      toast.info('Inicia sesión para finalizar la compra');
      navigate('/signin');
    }
  }, [user, navigate]);

  const onLogout = async () => {
    try {
      await apiLogout();
    } catch {}
    clearAuth();
    setUser(null);
    navigate('/signin');
  };

  const [items, setItems] = useState(() => getCart());

  useEffect(() => {
    const current = getCart();
    if (!current.length) {
      toast.info('Tu carrito está vacío');
      navigate('/cart');
    } else {
      setItems(current);
    }
  }, [navigate]);

  const subtotal = items.reduce(
    (acc, it) => acc + (Number(it.price) || 0) * (Number(it.qty) || 1),
    0
  );

  const [paymentMethod, setPaymentMethod] = useState('transferencia');
  const [deliveryMethod, setDeliveryMethod] = useState('local');

  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        const profile = await getMyProfile(); 
        setPhone(profile.phone || '');
      } catch (e) {
        console.error('No se pudo cargar el perfil en checkout', e);
      }
    })();
  }, [user]);

  const validateCartBeforeOrder = async () => {
    const currentItems = getCart();

    if (!currentItems.length) {
      toast.error('Tu carrito está vacío.');
      navigate('/cart');
      return false;
    }

    try {
      const results = await Promise.all(
        currentItems.map(async (item) => {
          try {
            const product = await getPublicProduct(item.id);
            return { item, product };
          } catch (e) {
            return { item, product: null, error: e };
          }
        })
      );

      let hasIssues = false;

      for (const { item, product } of results) {
        const stock = product?.countInStock ?? 0;

        if (!product || !product.isActive || stock <= 0) {
          hasIssues = true;
          removeFromCart(item.id);
        } else if (item.qty > stock) {
          hasIssues = true;
          updateItemQty(item.id, stock);
        }
      }

      const updated = getCart();
      setItems(updated);

      if (hasIssues) {
        toast.error(
          'Se ajustó el carrito porque cambió el stock de algunos productos. Revisalo antes de confirmar la compra.'
        );
        return false;
      }

      return true;
    } catch (e) {
      console.error(e);
      toast.error('No se pudo validar el stock antes de confirmar la compra.');
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!phone.trim()) {
      toast.error('El teléfono es obligatorio');
      return;
    }

    if (deliveryMethod === 'envio' && !address.trim()) {
      toast.error('La dirección es obligatoria para envíos');
      return;
    }

    const isValid = await validateCartBeforeOrder();
    if (!isValid) return;

    const currentItems = getCart();
    if (!currentItems.length) {
      toast.error('Tu carrito está vacío.');
      navigate('/cart');
      return;
    }

    const localSubtotal = currentItems.reduce(
      (acc, it) => acc + (Number(it.price) || 0) * (Number(it.qty) || 1),
      0
    );

    const payload = {
      userId: user?._id, 
      items: currentItems.map((it) => ({
        productId: it.id,
        name: it.name,
        price: Number(it.price) || 0,
        qty: Number(it.qty) || 1,
      })),
      paymentMethod,   
      deliveryMethod,  
      phone,
      address: deliveryMethod === 'envio' ? address : null,
      notes: notes || null,
      subtotal: localSubtotal,
      total: localSubtotal,
    };

    try {
      setSaving(true);

      const order = await createOrder(payload);

      try {
        if (phone) {
          await updateMyProfile({ phone });
        }
      } catch (e) {
        console.warn('No se pudo actualizar el teléfono en el perfil', e);
      }

      const lineItems = currentItems
        .map(
          (it) =>
            `- ${it.qty} x ${it.name} ($${Number(it.price || 0).toFixed(2)} c/u)`
        )
        .join('\n');

      const msg = [
        '🛒 Nueva compra desde la web de Chapacar',
        '',
        `Cliente: ${user?.name || ''}`,
        `Email: ${user?.email || ''}`,
        `Teléfono: ${phone}`,
        '',
        `Forma de pago: ${
          paymentMethod === 'transferencia' ? 'Transferencia bancaria' : 'Efectivo'
        }`,
        `Forma de retiro: ${
          deliveryMethod === 'local' ? 'Retiro en local' : 'Envío a domicilio'
        }`,
        deliveryMethod === 'envio' && address
          ? `Dirección: ${address}`
          : null,
        notes ? `Notas del cliente: ${notes}` : null,
        '',
        `Total: $ ${localSubtotal.toFixed(2)}`,
        '',
        'Detalle de productos:',
        lineItems,
        '',
        order?._id ? `ID de orden: ${order._id}` : null,
      ]
        .filter(Boolean) 
        .join('\n');

      const waUrl = buildWhatsAppLink(msg);

      window.open(waUrl, '_blank', 'noopener,noreferrer');

      clearCart();

      toast.success('Compra realizada con éxito');

      navigate('/');
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.message ||
        e.message ||
        'No se pudo completar la compra';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header
        user={user}
        onLogout={onLogout}
        onCartOpen={null}
      />

      <main className="container my-4 flex-grow-1">
        <div className="row g-4">
          {/* Columna izquierda: formulario */}
          <div className="col-12 col-lg-8">
            <div className="card">
              <div className="card-body">
                <h4 className="mb-3">Datos para finalizar la compra</h4>

                <form onSubmit={handleSubmit}>
                  {/* Datos del usuario */}
                  <div className="mb-3">
                    <label className="form-label">Nombre</label>
                    <input
                      type="text"
                      className="form-control"
                      value={user?.name || ''}
                      disabled
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={user?.email || ''}
                      disabled
                    />
                  </div>

                  {/* Teléfono */}
                  <div className="mb-3">
                    <label className="form-label">Teléfono de contacto *</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ej: 09X XXX XXX"
                      required
                    />
                  </div>

                  {/* Forma de pago */}
                  <div className="mb-3">
                    <label className="form-label d-block">
                      Forma de pago *
                    </label>
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="radio"
                        id="pago-transferencia"
                        value="transferencia"
                        checked={paymentMethod === 'transferencia'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <label
                        className="form-check-label"
                        htmlFor="pago-transferencia"
                      >
                        Transferencia bancaria
                      </label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="radio"
                        id="pago-efectivo"
                        value="efectivo"
                        checked={paymentMethod === 'efectivo'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <label
                        className="form-check-label"
                        htmlFor="pago-efectivo"
                      >
                        Efectivo
                      </label>
                    </div>
                  </div>

                  {/* Forma de retiro */}
                  <div className="mb-3">
                    <label className="form-label d-block">
                      Forma de retiro *
                    </label>
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="radio"
                        id="retiro-local"
                        value="local"
                        checked={deliveryMethod === 'local'}
                        onChange={(e) => setDeliveryMethod(e.target.value)}
                      />
                      <label
                        className="form-check-label"
                        htmlFor="retiro-local"
                      >
                        Retiro en local
                      </label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="radio"
                        id="retiro-envio"
                        value="envio"
                        checked={deliveryMethod === 'envio'}
                        onChange={(e) => setDeliveryMethod(e.target.value)}
                      />
                      <label
                        className="form-check-label"
                        htmlFor="retiro-envio"
                      >
                        Envío a domicilio
                      </label>
                    </div>
                  </div>

                  {/* Dirección solo si es envío */}
                  {deliveryMethod === 'envio' && (
                    <div className="mb-3">
                      <label className="form-label">
                        Dirección para el envío *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Calle, número, ciudad"
                        required={deliveryMethod === 'envio'}
                      />
                    </div>
                  )}

                  {/* Notas */}
                  <div className="mb-3">
                    <label className="form-label">
                      Comentarios / indicaciones (opcional)
                    </label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-chapacar"
                    disabled={saving}
                  >
                    {saving ? 'Procesando...' : 'Confirmar compra'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Columna derecha: resumen simple */}
          <div className="col-12 col-lg-4">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title mb-3">Resumen</h5>

                <ul className="list-unstyled mb-3">
                  {items.map((it) => (
                    <li
                      key={it.id}
                      className="d-flex justify-content-between small mb-1"
                    >
                      <span>
                        {it.name} x {it.qty}
                      </span>
                      <span>
                        $
                        {(
                          (Number(it.price) || 0) *
                          (Number(it.qty) || 1)
                        ).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>

                <hr />

                <div className="d-flex justify-content-between mb-2">
                  <span>Subtotal</span>
                  <span>$ {subtotal.toFixed(2)}</span>
                </div>

                <div className="d-flex justify-content-between mb-3">
                  <strong>Total</strong>
                  <strong>$ {subtotal.toFixed(2)}</strong>
                </div>

                <p className="text-muted small mb-0">
                  Confirmarás el pago y el retiro en este paso.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
