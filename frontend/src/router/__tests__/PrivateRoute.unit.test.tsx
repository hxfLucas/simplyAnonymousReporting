import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import PrivateRoute from '../PrivateRoute';

vi.mock('../../contexts/AuthContext', () => ({
  useAuthContext: vi.fn(),
}));

import { useAuthContext } from '../../contexts/AuthContext';

function renderPrivateRoute(user: any, isLoading: boolean) {
  (useAuthContext as ReturnType<typeof vi.fn>).mockReturnValue({ user, isLoading });
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route element={<PrivateRoute />}>
          <Route path="/protected" element={<div>Protected Content</div>} />
        </Route>
        <Route path="/sign-in" element={<div>Sign In Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PrivateRoute', () => {
  it('shows spinner (role="progressbar") when isLoading is true', () => {
    renderPrivateRoute(null, true);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('does not show protected content when loading', () => {
    renderPrivateRoute(null, true);
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to /sign-in when not loading and user is null', () => {
    renderPrivateRoute(null, false);
    expect(screen.getByText('Sign In Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('shows protected content when user is present and not loading', () => {
    renderPrivateRoute({ id: 1, email: 'test@test.com' }, false);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('does not show spinner when user is present and not loading', () => {
    renderPrivateRoute({ id: 1, email: 'test@test.com' }, false);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
