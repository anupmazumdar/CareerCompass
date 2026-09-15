'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const matchingEngine = require('../../app/ai/matching_engine/matchingEngine');

test('MatchingEngine - Test 1: Exact Match (High Score >= 90)', async () => {
  const candidate = {
    id: 1,
    skills: [
      { canonical_name: 'Python' },
      { canonical_name: 'FastAPI' },
      { canonical_name: 'Docker' },
      { canonical_name: 'Git' }
    ],
    experience: [{ start_date: '2022-01-01', end_date: '2024-01-01' }], // 2 years
    education: [{ degree: 'Master of Computer Applications (MCA)' }],
    projects: [{ technologies: ['Python', 'FastAPI', 'Docker'] }],
    location: 'Bangalore'
  };

  const job = {
    id: 10,
    title: 'Python Backend Engineer',
    skills: [
      { canonical_name: 'Python', is_required: 1 },
      { canonical_name: 'FastAPI', is_required: 1 },
      { canonical_name: 'Docker', is_required: 1 },
      { canonical_name: 'Git', is_required: 0 }
    ],
    min_experience_years: 1,
    min_education: 'Bachelor',
    location: 'Bangalore'
  };

  const result = await matchingEngine.computeMatch(candidate, job);
  assert.ok(result.final_score >= 90, `Expected final score >= 90, got ${result.final_score}`);
  assert.equal(result.grade, 'A');
  assert.equal(result.missing_skills.length, 0);
  assert.ok(result.explanation.includes('Overall fit'));
});

test('MatchingEngine - Test 2: Missing Required Skill Penalization', async () => {
  const candidate = {
    id: 2,
    skills: [
      { canonical_name: 'Python' },
      { canonical_name: 'FastAPI' }
      // missing AWS and Docker
    ],
    experience: [{ start_date: '2023-01-01', end_date: '2024-01-01' }],
    education: [{ degree: 'Bachelor of Computer Applications (BCA)' }],
    location: 'Delhi'
  };

  const job = {
    id: 11,
    title: 'Cloud Python Engineer',
    skills: [
      { canonical_name: 'Python', is_required: 1 },
      { canonical_name: 'FastAPI', is_required: 1 },
      { canonical_name: 'AWS', is_required: 1 },
      { canonical_name: 'Docker', is_required: 1 }
    ],
    min_experience_years: 2,
    min_education: 'Bachelor',
    location: 'Bangalore'
  };

  const result = await matchingEngine.computeMatch(candidate, job);
  assert.ok(result.final_score < 75, `Expected final score < 75, got ${result.final_score}`);
  assert.equal(result.missing_skills.length, 2);
  const missingNames = result.missing_skills.map(s => s.skill);
  assert.ok(missingNames.includes('AWS'));
  assert.ok(missingNames.includes('Docker'));
});

test('MatchingEngine - Test 3: Partial and Derived Skill Evaluation', async () => {
  const candidate = {
    id: 3,
    skills: [
      { canonical_name: 'React' }, // Derived child of JavaScript
      { canonical_name: 'SQL' }    // Parent of PostgreSQL
    ],
    experience: [],
    education: [{ degree: 'B.Tech' }],
    location: 'Remote'
  };

  const job = {
    id: 12,
    title: 'Full Stack Web Developer',
    skills: [
      { canonical_name: 'JavaScript', is_required: 1 },
      { canonical_name: 'PostgreSQL', is_required: 1 }
    ],
    min_experience_years: 0,
    min_education: 'Bachelor',
    location: 'Remote'
  };

  const result = await matchingEngine.computeMatch(candidate, job);
  assert.ok(result.breakdown.skill_score > 0, 'Derived/partial skills should score points');
  assert.ok(result.matched_skills.some(s => s.type === 'derived' || s.type === 'exact'));
});

test('MatchingEngine - Test 4: Empty Profile Graceful Degradation', async () => {
  const candidate = { id: 4, skills: [], experience: [], education: [] };
  const job = {
    id: 13,
    title: 'Software Developer',
    skills: [{ canonical_name: 'Java', is_required: 1 }],
    min_experience_years: 2,
    min_education: 'Bachelor',
    location: 'Mumbai'
  };

  const result = await matchingEngine.computeMatch(candidate, job);
  assert.equal(result.breakdown.skill_score, 0);
  assert.ok(result.final_score < 40);
  assert.equal(result.grade, 'F');
});
