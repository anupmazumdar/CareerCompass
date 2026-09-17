// Central Frontend Configuration
const isProduction = process.env.NODE_ENV === 'production';
let apiUrl = (process.env.REACT_APP_API_URL || '').trim();
if (apiUrl === '""' || apiUrl === "''" || apiUrl === '/') {
  apiUrl = '';
}
if (!apiUrl && !isProduction) {
  apiUrl = 'http://localhost:5000';
}
export const API_BASE_URL = apiUrl;

export const THEME_KEY = 'careercompass_theme';
export const AUTH_STORAGE_KEY = 'careercompass_auth';

export const ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin'
};
