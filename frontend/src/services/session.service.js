import api from './api';

const sessionService = {
  createSession: async (exerciseId = null) => {
    const res = await api.post('/sessions', { exerciseId });
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