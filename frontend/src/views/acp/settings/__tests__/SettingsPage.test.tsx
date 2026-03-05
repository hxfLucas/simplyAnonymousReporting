import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import SettingsPage from '../index';

vi.mock('../../../../hooks/modules/useSettings');

import { useSettings } from '../../../../hooks/modules/useSettings';

const mockUseSettings = vi.mocked(useSettings);

function makeDefaultHook(overrides: Partial<ReturnType<typeof useSettings>> = {}): ReturnType<typeof useSettings> {
  return {
    changePassword: vi.fn().mockResolvedValue(undefined),
    changePasswordState: { isLoading: false, error: null },
    signOutAllDevices: vi.fn().mockResolvedValue(undefined),
    signOutAllDevicesState: { isLoading: false, error: null },
    ...overrides,
  } as unknown as ReturnType<typeof useSettings>;
}

describe('SettingsPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders Settings and Change Password headings', () => {
    mockUseSettings.mockReturnValue(makeDefaultHook());

    render(<SettingsPage />);

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Change Password')).toBeInTheDocument();
  });

  it('renders the Sign Out All Devices section heading', () => {
    mockUseSettings.mockReturnValue(makeDefaultHook());

    render(<SettingsPage />);

    expect(screen.getByRole('heading', { name: 'Sign Out All Devices' })).toBeInTheDocument();
  });

  it('shows error alert when changePasswordState.error is set', () => {
    mockUseSettings.mockReturnValue(
      makeDefaultHook({
        changePasswordState: { isLoading: false, error: 'Current password is incorrect' },
      }),
    );

    render(<SettingsPage />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Current password is incorrect')).toBeInTheDocument();
  });

  it('Save button is present and not disabled when not loading', () => {
    mockUseSettings.mockReturnValue(makeDefaultHook());

    render(<SettingsPage />);

    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toBeInTheDocument();
    expect(saveButton).not.toBeDisabled();
  });

  it('Save button shows "Saving..." and is disabled when changePasswordState.isLoading is true', () => {
    mockUseSettings.mockReturnValue(
      makeDefaultHook({
        changePasswordState: { isLoading: true, error: null },
      }),
    );

    render(<SettingsPage />);

    const saveButton = screen.getByRole('button', { name: /saving/i });
    expect(saveButton).toBeInTheDocument();
    expect(saveButton).toBeDisabled();
  });

  it('shows signOutAllDevicesState error when set', () => {
    mockUseSettings.mockReturnValue(
      makeDefaultHook({
        signOutAllDevicesState: { isLoading: false, error: 'Could not sign out' },
      }),
    );

    render(<SettingsPage />);

    expect(screen.getByText('Could not sign out')).toBeInTheDocument();
  });
});
