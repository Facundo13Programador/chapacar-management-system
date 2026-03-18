
import React, { useState } from 'react';
import { Form, Button, InputGroup } from 'react-bootstrap';
import { BsFillEyeFill, BsFillEyeSlashFill } from 'react-icons/bs';

export default function LoginPrompt({
  submitHandler,
  buttonCaption = 'Ingresar',
  caption = 'Inicia sesión',
  className = '',
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    submitHandler(email, password);
  };

  return (
    <div className={`p-4 ${className}`}>
      <h3 className="mb-3 text-center">{caption}</h3>
      <Form onSubmit={onSubmit}>
        <Form.Group className="mb-3" controlId="email">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com" required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="password">
          <Form.Label>Contraseña</Form.Label>
          <InputGroup>
            <Form.Control
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" required
            />
            <Button variant="outline-secondary" onClick={() => setShowPwd((s) => !s)} type="button">
              {showPwd ? <BsFillEyeSlashFill /> : <BsFillEyeFill />}
            </Button>
          </InputGroup>
        </Form.Group>

        <div className="d-grid">
          <Button type="submit">{buttonCaption}</Button>
        </div>
      </Form>
    </div>
  );
}