// Central Frontend Configuration
const isProduction = process.env.NODE_ENV === 'production';
let apiUrl = (process.env.REACT_APP_API_URL || '').trim();
if (apiUrl === '""' || apiUrl === "''" || apiUrl === '/') {
  apiUrl = '';
}
if (!apiUrl && !isProduction) {
  apiUrl = 'http://localhost:3001';
}
export const API_BASE_URL = apiUrl;

export const THEME_KEY = 'talentai_theme';
export const AUTH_STORAGE_KEY = 'talentai_auth';

export const ROLES = {
  STUDENT: 'student',
  RECRUITER: 'recruiter',
  ADMIN: 'admin'
};
