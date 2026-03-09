import axios from 'axios';

const API_BASE_URL = 'https://backend-complete-l3hp.onrender.com/api';

const api = axios.create({ baseURL: API_BASE_URL, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use((r) => r, (error) => {
  if (error.response?.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
  return Promise.reject(error);
});

export const authService = {
  login: async (username, password) => {
    const r = await api.post('/users/login/', { username, password });
    if (r.data.token) {
      localStorage.setItem('token', r.data.token);
      localStorage.setItem('user', JSON.stringify(r.data.user));
    }
    return r.data;
  },
  logout: async () => {
    try { await api.post('/users/logout/'); } catch (_) {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getCurrentUser: () => { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; },
  getMe: async () => (await api.get('/users/me/')).data,
  updateMe: async (data) => (await api.patch('/users/me/', data)).data,
  changePassword: async (ancien, nouveau) => (await api.post('/users/me/change-password/', { ancien_mot_de_passe: ancien, nouveau_mot_de_passe: nouveau })).data,
};

export const userService = {
  getAll: async (p = {}) => (await api.get('/users/', { params: p })).data,
  create: async (d) => (await api.post('/users/', d)).data,
  update: async (id, d) => (await api.patch(`/users/${id}/`, d)).data,
  delete: async (id) => { await api.delete(`/users/${id}/`); },
  setRoles: async (id, roles) => (await api.post(`/users/${id}/set-roles/`, { roles })).data,
};

export const espaceVertService = {
  getAll: async (p = {}) => (await api.get('/espaces/', { params: p })).data,
  getById: async (id) => (await api.get(`/espaces/${id}/`)).data,
  create: async (d) => (await api.post('/espaces/', d)).data,
  update: async (id, d) => (await api.put(`/espaces/${id}/`, d)).data,
  delete: async (id) => { await api.delete(`/espaces/${id}/`); },
};

export const equipementService = {
  getAll: async (p = {}) => (await api.get('/equipements/', { params: p })).data,
  create: async (d) => (await api.post('/equipements/', d)).data,
  update: async (id, d) => (await api.patch(`/equipements/${id}/`, d)).data,
  delete: async (id) => { await api.delete(`/equipements/${id}/`); },
};

export const interventionService = {
  getAll: async (p = {}) => (await api.get('/interventions/', { params: p })).data,
  create: async (d) => (await api.post('/interventions/', d)).data,
  update: async (id, d) => (await api.put(`/interventions/${id}/`, d)).data,
  marquerEffectuee: async (id, notes = '') => (await api.post(`/interventions/${id}/marquer-effectuee/`, { notes })).data,
  delete: async (id) => { await api.delete(`/interventions/${id}/`); },
};

export const signalementService = {
  getAll: async (p = {}) => (await api.get('/signalements/', { params: p })).data,
  create: async (d) => (await api.post('/signalements/', d)).data,
  changerStatut: async (id, statut) => (await api.post(`/signalements/${id}/changer-statut/`, { statut })).data,
};

export const equipeService = {
  getAll: async (p = {}) => (await api.get('/equipes/', { params: p })).data,
  create: async (d) => (await api.post('/equipes/', d)).data,
  update: async (id, d) => (await api.put(`/equipes/${id}/`, d)).data,
  delete: async (id) => { await api.delete(`/equipes/${id}/`); },
};

export const materielService = {
  getAll: async (p = {}) => (await api.get('/materiels/', { params: p })).data,
  create: async (d) => (await api.post('/materiels/', d)).data,
  update: async (id, d) => (await api.put(`/materiels/${id}/`, d)).data,
  delete: async (id) => { await api.delete(`/materiels/${id}/`); },
};

export const articleStockService = {
  getAll: async (p = {}) => (await api.get('/articles-stock/', { params: p })).data,
  create: async (d) => (await api.post('/articles-stock/', d)).data,
  update: async (id, d) => (await api.put(`/articles-stock/${id}/`, d)).data,
};

export const mouvementStockService = {
  getAll: async (p = {}) => (await api.get('/mouvements-stock/', { params: p })).data,
  create: async (d) => (await api.post('/mouvements-stock/', d)).data,
};

export const notificationService = {
  getAll: async (p = {}) => (await api.get('/notifications/', { params: p })).data,
  marquerLue: async (id) => (await api.post(`/notifications/${id}/marquer-lue/`)).data,
  marquerToutesLues: async () => (await api.post('/notifications/marquer-toutes-lues/')).data,
};

export const statistiqueService = {
  get: async (p = {}) => (await api.get('/statistiques/', { params: p })).data,
};

export const activiteService = {
  getAll: async (p = {}) => (await api.get('/activites/', { params: p })).data,
};

export default api;
