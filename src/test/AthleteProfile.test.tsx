import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import type { Goalkeeper } from '../types';

// Mock all heavy dependencies to keep tests fast and focused on the header logic

vi.mock('../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'en',
    setLanguage: vi.fn(),
  }),
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'test-user' } }),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => Promise.resolve({ data: [] }),
          }),
        }),
        order: () => ({
          limit: () => Promise.resolve({ data: [] }),
        }),
      }),
    }),
  },
}));

vi.mock('../hooks/useWellness', () => ({
  useWellness: () => ({
    wellnessLogs: [],
    addWellnessLog: vi.fn(),
    updateWellnessLog: vi.fn(),
    deleteWellnessLog: vi.fn(),
    loading: false,
  }),
}));

// Mock child components to avoid deep dependency trees
vi.mock('../components/athletes/AthleteOverview', () => ({
  AthleteOverview: () => <div data-testid="athlete-overview" />,
}));
vi.mock('../components/athletes/AthleteWellness', () => ({
  AthleteWellness: () => <div data-testid="athlete-wellness" />,
}));
vi.mock('../components/athletes/AthleteLoad', () => ({
  AthleteLoad: () => <div data-testid="athlete-load" />,
}));
vi.mock('../components/athletes/AthleteTrainingHistory', () => ({
  AthleteTrainingHistory: () => <div data-testid="athlete-history" />,
}));
vi.mock('../components/athletes/AthleteNotes', () => ({
  AthleteNotes: () => <div data-testid="athlete-notes" />,
}));
vi.mock('../components/athletes/AthleteAssessment', () => ({
  AthleteAssessment: () => <div data-testid="athlete-assessment" />,
}));
vi.mock('../components/athletes/AthleteInjuries', () => ({
  AthleteInjuries: () => <div data-testid="athlete-injuries" />,
}));
vi.mock('../components/athletes/AthletePhysicalTests', () => ({
  AthletePhysicalTests: () => <div data-testid="athlete-tests" />,
}));

// Import component after mocks are set up
import { AthleteProfile } from '../components/athletes/AthleteProfile';

function makeGoalkeeper(overrides: Partial<Goalkeeper> = {}): Goalkeeper {
  return {
    id: 'gk-1',
    name: 'Test Keeper',
    category: 'firstTeam',
    status: 'Ready',
    form: 85,
    recovery: 90,
    load: 70,
    imageUrl: '',
    ...overrides,
  };
}

describe('AthleteProfile header', () => {
  const onBack = vi.fn();
  const onUpdate = vi.fn();

  it('calculates and displays age from birthDate', () => {
    // Set birthDate to exactly 25 years ago (roughly)
    const birthYear = new Date().getFullYear() - 25;
    const birthDate = `${birthYear}-01-15`;
    const gk = makeGoalkeeper({ birthDate });

    render(<AthleteProfile goalkeeper={gk} onBack={onBack} onUpdate={onUpdate} />);

    // The age calculation: Math.floor((Date.now() - Date) / (365.25 * 24 * 60 * 60 * 1000))
    const expectedAge = Math.floor(
      (Date.now() - new Date(birthDate + 'T00:00:00').getTime()) / (365.25 * 24 * 60 * 60 * 1000),
    );

    // The component renders the age number followed by t('years') which returns 'years'
    expect(screen.getByText(`${expectedAge} years`)).toBeInTheDocument();
  });

  it('does not show age when birthDate is missing', () => {
    const gk = makeGoalkeeper({ birthDate: undefined });

    render(<AthleteProfile goalkeeper={gk} onBack={onBack} onUpdate={onUpdate} />);

    expect(screen.queryByText(/years/)).not.toBeInTheDocument();
  });

  it('shows missing data banner when height is missing', () => {
    const gk = makeGoalkeeper({ height: undefined });

    render(<AthleteProfile goalkeeper={gk} onBack={onBack} onUpdate={onUpdate} />);

    expect(screen.getByText('incompleteProfile')).toBeInTheDocument();
  });

  it('does not show missing data banner when all essential data present', () => {
    const gk = makeGoalkeeper({ birthDate: '2000-01-01', height: 192, weight: 85, wingspan: 195 });

    render(<AthleteProfile goalkeeper={gk} onBack={onBack} onUpdate={onUpdate} />);

    expect(screen.queryByText('incompleteProfile')).not.toBeInTheDocument();
  });

  it('displays goalkeeper name', () => {
    const gk = makeGoalkeeper({ name: 'Diogo Costa' });

    render(<AthleteProfile goalkeeper={gk} onBack={onBack} onUpdate={onUpdate} />);

    expect(screen.getByText('Diogo Costa')).toBeInTheDocument();
  });
});
