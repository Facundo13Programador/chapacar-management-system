/**
 * Polyfill de fetch para entornos Node donde no existe (p. ej. al cargar el cliente OpenAI en tests).
 * Debe importarse antes que cualquier módulo que use OpenAI.
 */
if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = function fetch() {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
    });
  };
}
