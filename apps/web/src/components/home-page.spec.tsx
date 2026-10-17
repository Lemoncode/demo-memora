import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HomePage } from './home-page';

describe('HomePage', () => {
  it('muestra el saludo «Hola Mundo»', () => {
    render(<HomePage />);

    expect(screen.getByRole('heading', { name: 'Hola Mundo' })).toBeDefined();
  });

  it('renderiza el botón de shadcn', () => {
    render(<HomePage />);

    const button = screen.getByRole('button', { name: 'Empezar' });

    // `data-slot` is the marker shadcn's own components emit, so this asserts the
    // shadcn Button is in the tree rather than a bare <button>.
    expect(button.getAttribute('data-slot')).toBe('button');
  });
});
