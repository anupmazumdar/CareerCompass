// frontend/tests/unit/components.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MatchScoreBadge } from '../../src/matching/MatchScoreBadge';
import { ApplicationTracker } from '../../src/applications/ApplicationTracker';

describe('Frontend Unit Tests', () => {
  test('MatchScoreBadge renders label for partial match correctly', () => {
    render(<MatchScoreBadge score={45} />);
    expect(screen.getByText(/45%/i)).toBeInTheDocument();
    expect(screen.getByText(/Partial Match/i)).toBeInTheDocument();
  });

  test('ApplicationTracker renders empty state gracefully', () => {
    render(<ApplicationTracker applications={[]} />);
    expect(screen.getByText(/No active applications submitted yet/i)).toBeInTheDocument();
  });

  test('ApplicationTracker renders application card with status badge', () => {
    const apps = [
      { id: 1, job_title: 'Software Engineer', company_name: 'TechCorp', status: 'applied', match_score: 88 }
    ];
    render(<ApplicationTracker applications={apps} />);
    expect(screen.getByText(/Software Engineer/i)).toBeInTheDocument();
    expect(screen.getByText(/TechCorp/i)).toBeInTheDocument();
    expect(screen.getByText(/88% Match/i)).toBeInTheDocument();
  });
});
