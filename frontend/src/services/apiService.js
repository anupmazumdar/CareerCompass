// frontend/src/services/apiService.js
import apiClient from '../api/client';

export const jobService = {
  getAll: (params) => apiClient.get('/jobs', { params }),
  getById: (id) => apiClient.get(`/jobs/${id}`),
  create: (jobData) => apiClient.post('/jobs', jobData),
  update: (id, jobData) => apiClient.put(`/jobs/${id}`, jobData)
};

export const applicationService = {
  apply: (applicationData) => apiClient.post('/applications', applicationData),
  getMyApplications: () => apiClient.get('/applications/me'),
  updateStage: (id, status, notes) => apiClient.patch(`/applications/${id}/stage`, { status, notes })
};

export const resumeService = {
  analyze: (text, targetRole) => apiClient.post('/resumes/analyze', { text, targetRole })
};

export const matchingService = {
  getJobRecommendations: () => apiClient.get('/recommendations/jobs'),
  getRankedCandidates: (jobId) => apiClient.get(`/matching/jobs/${jobId}/candidates`)
};
