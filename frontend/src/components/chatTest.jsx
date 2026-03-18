// src/components/ChatTest.jsx
import React, { useState } from 'react';

export default function ChatTest({ onClose }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]); 
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { from: 'user', text: input };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();
      const botMsg = { from: 'bot', text: data.answer || 'Sin respuesta' };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Error en fetch /api/chat:', err);

      setMessages((prev) => [
        ...prev,
        { from: 'bot', text: 'Error hablando con el bot' },
      ]);
    }

    setInput('');
    setLoading(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '80px', 
        right: '20px',
        width: '300px',
        height: '420px',
        background: 'white',
        borderRadius: '14px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1999,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: '#c51221',
          color: 'white',
          padding: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            flex: 1,
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '16px',
          }}
        >
          Chat CHAPACAR
        </span>
      </div>

      {/* Mensajes */}
      <div
        style={{
          flex: 1,
          padding: '10px',
          overflowY: 'auto',
          background: '#f7f7f7',
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              marginBottom: '10px',
              textAlign: msg.from === 'user' ? 'right' : 'left',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                padding: '8px 12px',
                borderRadius: '12px',
                maxWidth: '80%',
                background: msg.from === 'user' ? '#c51221' : '#e0e0e0',
                color: msg.from === 'user' ? 'white' : 'black',
              }}
            >
              {msg.text}
            </span>
          </div>
        ))}

        {loading && (
          <div style={{ textAlign: 'left', color: '#888' }}>⏳ Pensando...</div>
        )}
      </div>

      {/* Input */}
      <div
        style={{
          padding: '10px',
          display: 'flex',
          gap: '5px',
          background: 'white',
          borderTop: '1px solid #ddd', 
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Escribí tu mensaje..."
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '8px',
            border: '1px solid #ccc',
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading}
          style={{
            background: '#c51221',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 12px',
            cursor: 'pointer',
          }}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
