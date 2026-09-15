// frontend/src/services/storageService.js

const StorageKeys = {
  AUTH_TOKEN: 'talentai_auth_token',
  USER_DATA: 'talentai_user_data',
  THEME: 'talentai_theme'
};

export const storageService = {
  getToken: () => localStorage.getItem(StorageKeys.AUTH_TOKEN),
  setToken: (token) => localStorage.setItem(StorageKeys.AUTH_TOKEN, token),
  removeToken: () => localStorage.removeItem(StorageKeys.AUTH_TOKEN),

  getUser: () => {
    try {
      const data = localStorage.getItem(StorageKeys.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setUser: (user) => localStorage.setItem(StorageKeys.USER_DATA, JSON.stringify(user)),
  removeUser: () => localStorage.removeItem(StorageKeys.USER_DATA),

  clearAll: () => {
    localStorage.removeItem(StorageKeys.AUTH_TOKEN);
    localStorage.removeItem(StorageKeys.USER_DATA);
  }
};
