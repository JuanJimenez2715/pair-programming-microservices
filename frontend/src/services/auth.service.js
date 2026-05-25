import api from './api';

const authService = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.tokens) {
      localStorage.setItem('token', res.data.tokens.access.token);
    }
    return res.data;
  },

  register: async ({ email, password, firstName, lastName, role }) => {
    const res = await api.post('/auth/register', { email, password, firstName, lastName, role });
    // Token is no longer saved automatically upon registration
    return res.data;
  },

  getCurrentUser: async () => {
    const res = await api.get('/auth/me');
    return res.data.user;
  },

  logout: () => {
    localStorage.removeItem('token');
  }
};

export default authService;