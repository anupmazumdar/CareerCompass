import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CareerPathDashboard } from '../CareerPathDashboard';
import { CareerPathOpportunities } from '../CareerPathOpportunities';
import { CareerPathApplications } from '../CareerPathApplications';
import { CareerPathSkills } from '../CareerPathSkills';
import { CareerPathProfile } from '../CareerPathProfile';
import { CareerPathAssistant, NormalTextRenderer } from '../CareerPathAssistant';

// Mock scrollIntoView in jsdom
if (typeof window !== 'undefined' && window.HTMLElement) {
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
}

// Helper to mock successful fetch returning backend envelope
function mockFetchSuccess(routerMap) {
  global.fetch = jest.fn((url, options) => {
    const urlString = typeof url === 'string' ? url : url.url || '';
    for (const [key, responseData] of Object.entries(routerMap)) {
      if (urlString.includes(key)) {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve(JSON.stringify(responseData))
        });
      }
    }
    // Default success fallback
    return Promise.resolve({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ success: true, data: [] }))
    });
  });
}

// Helper to mock failed fetch returning backend error envelope
function mockFetchFailure(errorMessage = 'Internal Server Error', status = 500) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: false,
      status,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            success: false,
            error: errorMessage,
            message: errorMessage
          })
        )
    })
  );
}

describe('CareerPath API Response Contract Tests', () => {
  const originalFetch = global.fetch;

  beforeAll(() => {
    if (window.HTMLElement) {
      window.HTMLElement.prototype.scrollIntoView = jest.fn();
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe('CareerPathDashboard', () => {
    test('renders non-empty list of applications and opportunities from backend envelopes', async () => {
      mockFetchSuccess({
        '/api/students/me': {
          success: true,
          message: 'Student retrieved',
          data: {
            id: 1,
            full_name: 'Alex Johnson',
            preferred_role: 'Full Stack Engineer',
            skills: ['React', 'Node.js']
          }
        },
        '/api/applications/my-applications': {
          success: true,
          count: 1,
          data: [
            {
              id: 'app-1',
              company_name: 'Apex Systems',
              role_title: 'Full Stack Developer',
              status: 'interview'
            }
          ]
        },
        '/api/opportunities': {
          success: true,
          count: 1,
          data: [
            {
              id: 'opp-1',
              title: 'Senior Cloud Engineer',
              company_name: 'CloudOps',
              match_score: 92,
              match_category: 'strong'
            }
          ]
        },
        '/api/skills/gap-analysis': {
          success: true,
          message: 'Analysis complete',
          data: {
            targetRole: { id: 'fullstack', title: 'Full Stack Engineer' },
            readiness_percentage: 85,
            missingCount: 1,
            matched_skills: ['React'],
            missing_skills: ['Docker']
          }
        }
      });

      render(
        <MemoryRouter>
          <CareerPathDashboard />
        </MemoryRouter>
      );

      // Verify dashboard data is rendered from the envelopes
      await waitFor(() => {
        expect(screen.getByText(/Alex/i)).toBeInTheDocument();
        expect(screen.getByText(/Senior Cloud Engineer/i)).toBeInTheDocument();
        expect(screen.getByText(/CloudOps/i)).toBeInTheDocument();
      });
    });

    test('renders error state on failed response', async () => {
      mockFetchFailure('Failed to load dashboard data');

      render(
        <MemoryRouter>
          <CareerPathDashboard />
        </MemoryRouter>
      );

      await waitFor(() => {
        const errorAlert = screen.getByTestId('dashboard-error-alert');
        expect(errorAlert).toBeInTheDocument();
      });
    });
  });

  describe('CareerPathOpportunities', () => {
    test('renders non-empty opportunities list from paginated backend envelope', async () => {
      mockFetchSuccess({
        '/api/students/me/resumes': {
          success: true,
          data: [{ id: 'res-1', file_name: 'resume.pdf', is_primary: true }]
        },
        '/api/students/me': {
          success: true,
          data: { id: 1, full_name: 'Alex Johnson', preferred_role: 'Frontend' }
        },
        '/api/opportunities/closing-soon': {
          success: true,
          data: [{ id: 'close-1', title: 'Urgent Role', company_name: 'Speedy Corp' }]
        },
        '/api/applications/my-applications': {
          success: true,
          data: []
        },
        '/api/opportunities': {
          success: true,
          total: 1,
          totalPages: 1,
          count: 1,
          hasStudentProfile: true,
          data: [
            {
              id: 'opp-101',
              title: 'Frontend Specialist',
              company_name: 'DesignCorp',
              location: 'San Francisco, CA',
              job_type: 'Full-time',
              match_score: 88,
              match_category: 'strong',
              skills_required: ['React', 'CSS']
            }
          ]
        }
      });

      render(
        <MemoryRouter>
          <CareerPathOpportunities />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Frontend Specialist')).toBeInTheDocument();
        expect(screen.getByText('DesignCorp')).toBeInTheDocument();
      });
    });

    test('renders error state on failed response', async () => {
      mockFetchFailure('Opportunities service error');

      render(
        <MemoryRouter>
          <CareerPathOpportunities />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('opportunities-error-alert')).toBeInTheDocument();
      });
    });
  });

  describe('CareerPathApplications', () => {
    test('renders non-empty application list from backend envelope', async () => {
      mockFetchSuccess({
        '/api/applications/my-applications': {
          success: true,
          total: 1,
          totalPages: 1,
          data: [
            {
              id: 'app-99',
              company_name: 'Stripe Global',
              job_title: 'Platform Infrastructure Engineer',
              role_title: 'Platform Infrastructure Engineer',
              stage: 'interview',
              status: 'interview',
              applied_date: '2026-03-01'
            }
          ]
        },
        '/api/applications/stats': {
          success: true,
          data: {
            total: 1,
            active: 1,
            interview: 1,
            offer: 0,
            rejected: 0
          }
        }
      });

      render(
        <MemoryRouter>
          <CareerPathApplications />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Stripe Global')).toBeInTheDocument();
        expect(screen.getByText('Platform Infrastructure Engineer')).toBeInTheDocument();
      });
    });

    test('renders error state on failed response', async () => {
      mockFetchFailure('Failed to fetch applications');

      render(
        <MemoryRouter>
          <CareerPathApplications />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('applications-error-alert')).toBeInTheDocument();
      });
    });
  });

  describe('CareerPathSkills', () => {
    test('renders non-empty skills list and gap diagnostics from backend envelope', async () => {
      mockFetchSuccess({
        '/api/skills/roles': {
          success: true,
          data: [
            {
              key: 'frontend',
              name: 'Frontend Engineer',
              required_skills: ['React', 'TypeScript']
            }
          ]
        },
        '/api/skills/gap-analysis': {
          success: true,
          data: {
            readiness_percentage: 75,
            matched_skills: ['React'],
            missing_skills: ['TypeScript']
          }
        },
        '/api/skills': {
          success: true,
          data: [
            { id: 1, name: 'React', category: 'frontend' },
            { id: 2, name: 'TypeScript', category: 'frontend' }
          ]
        },
        '/api/students/me': {
          success: true,
          data: {
            preferred_role: 'frontend',
            skills: [
              { id: 1, skill_name: 'React', proficiency_level: 'advanced' }
            ]
          }
        }
      });

      render(
        <MemoryRouter>
          <CareerPathSkills />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Skills Management & Gap Analysis/i)).toBeInTheDocument();
        expect(screen.getAllByText('React').length).toBeGreaterThan(0);
      });
    });

    test('renders error state on failed response', async () => {
      mockFetchFailure('Skills service failure');

      render(
        <MemoryRouter>
          <CareerPathSkills />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('skills-error-alert')).toBeInTheDocument();
      });
    });
  });

  describe('CareerPathProfile', () => {
    test('renders student profile information from backend envelope', async () => {
      mockFetchSuccess({
        '/api/students/me': {
          success: true,
          data: {
            id: 1,
            full_name: 'Sara Connor',
            headline: 'Security & Systems Specialist',
            email: 'sara@example.com',
            profile_completeness: 85,
            skills: [{ id: 1, skill_name: 'Linux', proficiency_level: 'expert' }]
          }
        },
        '/api/skills': {
          success: true,
          data: [{ id: 1, name: 'Linux' }]
        }
      });

      render(
        <MemoryRouter>
          <CareerPathProfile />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Sara Connor')).toBeInTheDocument();
        expect(screen.getByText('Security & Systems Specialist')).toBeInTheDocument();
      });
    });

    test('renders error state on failed response', async () => {
      mockFetchFailure('Profile service down');

      render(
        <MemoryRouter>
          <CareerPathProfile />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('profile-error-alert')).toBeInTheDocument();
      });
    });
  });

  describe('CareerPathAssistant', () => {
    test('renders assistant interface with student context', async () => {
      mockFetchSuccess({
        '/api/students/me': {
          success: true,
          data: {
            full_name: 'Neo Anderson',
            preferred_role: 'Full Stack'
          }
        },
        '/api/applications/my-applications': {
          success: true,
          data: []
        }
      });

      render(
        <MemoryRouter>
          <CareerPathAssistant />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/CareerPath AI Co-Pilot/i)).toBeInTheDocument();
      });
    });

    test('renders error state when chat request fails', async () => {
      mockFetchSuccess({
        '/api/students/me': {
          success: true,
          data: { full_name: 'Neo Anderson', preferred_role: 'Full Stack' }
        },
        '/api/applications/my-applications': {
          success: true,
          data: []
        }
      });

      render(
        <MemoryRouter>
          <CareerPathAssistant />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/CareerPath AI Co-Pilot/i)).toBeInTheDocument();
      });

      // Now mock chat API failure
      mockFetchFailure('AI Service unavailable');

      const input = screen.getByPlaceholderText(/Ask anything about your profile/i);
      fireEvent.change(input, { target: { value: 'How can I prepare for an interview?' } });

      const sendButton = screen.getByTitle('Send message');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByTestId('assistant-error-alert')).toBeInTheDocument();
      });
    });

    test('NormalTextRenderer formats raw markdown into clean normal text without raw ### or **', () => {
      const sampleRawMarkdown = `### Immediate Next Steps
1. **Polish Your Resume**
- Highlight the placement platform
**Hi Alex!** 👋 Normal conversational text.`;

      const { container } = render(<NormalTextRenderer content={sampleRawMarkdown} />);

      // Verify raw markdown tokens are NOT present in output text
      expect(container.textContent).not.toContain('###');
      expect(container.textContent).not.toContain('**');
      expect(container.textContent).toContain('Immediate Next Steps');
      expect(container.textContent).toContain('Polish Your Resume');
      expect(container.textContent).toContain('Hi Alex! 👋 Normal conversational text.');
      
      // Verify bold tags are created
      const strongs = container.querySelectorAll('strong');
      expect(strongs.length).toBeGreaterThanOrEqual(2);
      expect(strongs[0].textContent).toBe('Polish Your Resume');
      expect(strongs[1].textContent).toBe('Hi Alex!');
    });
  });
});
