import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfileForm from '../ProfileForm';
import * as api from '../../services/api';

vi.mock('../../services/api');

describe('ProfileForm', () => {
  beforeEach(() => {
    vi.mocked(api.fetchUserProfile).mockResolvedValue(null);
  });

  it('renders the form title for a new user', async () => {
    render(<ProfileForm userId="test-user" />);
    expect(await screen.findByText('Your Dietary Profile')).toBeInTheDocument();
  });
});
