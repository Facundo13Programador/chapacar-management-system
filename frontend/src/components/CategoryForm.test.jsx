import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoryForm from './CategoryForm';

const getInputs = () => {
  const inputs = screen.getAllByRole('textbox');
  return { nameInput: inputs[0], slugInput: inputs[1] };
};

describe('CategoryForm', () => {
  it('renderiza campos nombre y slug y botón Guardar', () => {
    render(<CategoryForm />);
    const { nameInput, slugInput } = getInputs();
    expect(nameInput).toBeInTheDocument();
    expect(slugInput).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Guardar categoría/i })).toBeInTheDocument();
  });

  it('muestra slug sugerido cuando se escribe un nombre', () => {
    render(<CategoryForm />);
    const { nameInput } = getInputs();
    fireEvent.change(nameInput, { target: { value: 'Filtros de aceite' } });
    expect(screen.getByText(/filtros-de-aceite/)).toBeInTheDocument();
  });

  it('llama onSubmit con nombre y slug al enviar el formulario', async () => {
    const onSubmit = jest.fn();
    render(<CategoryForm onSubmit={onSubmit} />);
    const { nameInput } = getInputs();
    await userEvent.type(nameInput, 'Embragues');
    fireEvent.click(screen.getByRole('button', { name: /Guardar categoría/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Embragues',
        slug: 'embragues',
      })
    );
  });

  it('usa initialValue para edición', () => {
    render(
      <CategoryForm
        initialValue={{ name: 'Pastillas de freno', slug: 'pastillas-freno' }}
      />
    );
    const { nameInput, slugInput } = getInputs();
    expect(nameInput).toHaveValue('Pastillas de freno');
    expect(slugInput).toHaveValue('pastillas-freno');
  });

  it('deshabilita el botón cuando submitting es true', () => {
    render(<CategoryForm submitting={true} />);
    expect(screen.getByRole('button', { name: /Guardando/i })).toBeDisabled();
  });
});
