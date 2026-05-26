import api from './api';

const sessionService = {
  createSession: async (exerciseId = null, options = {}) => {
    const res = await api.post('/sessions', {
      exerciseId,
      title: options.title || 'Nueva Sesión de Pair Programming',
      language: options.language || 'javascript',
      difficulty: options.difficulty || 'beginner',
      course: options.course || 'General'
    });
    return res.data;
  },

  getSessions: async () => {
    const res = await api.get('/sessions');
    return res.data;
  },

  getSessionById: async (id) => {
    const res = await api.get(`/sessions/${id}`);
    return res.data;
  },

  joinSession: async (id) => {
    const res = await api.post(`/sessions/${id}/join`);
    return res.data;
  }
};

export default sessionService;