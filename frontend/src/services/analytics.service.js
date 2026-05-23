import api from './api';

const analyticsService = {
  getAiStats: async () => {
    const res = await api.get('/analytics/ai-stats');
    return res.data;
  }
};

export default analyticsService;