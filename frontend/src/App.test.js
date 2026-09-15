import React from 'react';
import { render, screen } from '@testing-library/react';
import { MatchScoreBadge } from './matching/MatchScoreBadge';
import { SkillBadgeList } from './skills/SkillBadgeList';

test('renders MatchScoreBadge with score and appropriate color class', () => {
  render(<MatchScoreBadge score={92} />);
  const scoreElement = screen.getByText(/92%/i);
  expect(scoreElement).toBeInTheDocument();
  expect(screen.getByText(/Strong Match/i)).toBeInTheDocument();
});

test('renders SkillBadgeList displaying skills correctly', () => {
  const skills = ['React', 'Node.js', 'Python'];
  render(<SkillBadgeList skills={skills} />);
  expect(screen.getByText(/React/i)).toBeInTheDocument();
  expect(screen.getByText(/Node\.js/i)).toBeInTheDocument();
  expect(screen.getByText(/Python/i)).toBeInTheDocument();
});
