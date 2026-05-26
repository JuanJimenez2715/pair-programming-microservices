import api from './api';

const exerciseService = {
  getExercises: async () => {
    const res = await api.get('/exercises');
    return res.data;
  },

  getExerciseById: async (id) => {
    const res = await api.get(`/exercises/${id}`);
    return res.data;
  },

  createExercise: async (data) => {
    const res = await api.post('/exercises', data);
    return res.data;
  },

  deleteExercise: async (id) => {
    const res = await api.delete(`/exercises/${id}`);
    return res.data;
  }
};

export default exerciseService;