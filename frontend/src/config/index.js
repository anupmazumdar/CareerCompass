// Central Frontend Configuration
const isProduction = process.env.NODE_ENV === 'production';
export const API_BASE_URL = process.env.REACT_APP_API_URL || (isProduction ? '' : 'http://localhost:3001');

export const THEME_KEY = 'talentai_theme';
export const AUTH_STORAGE_KEY = 'talentai_auth';

export const ROLES = {
  STUDENT: 'student',
  RECRUITER: 'recruiter',
  ADMIN: 'admin'
};
