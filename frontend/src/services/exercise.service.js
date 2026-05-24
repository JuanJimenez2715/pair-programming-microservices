const API_URL = '/api/exercises';

const getExercises = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(API_URL, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Failed to fetch exercises');
  return response.json();
};

const getExerciseById = async (id) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Failed to fetch exercise');
  return response.json();
};

const createExercise = async (data) => {
  const token = localStorage.getItem('token');
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to create exercise');
  return response.json();
};

const deleteExercise = async (id) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Failed to delete exercise');
  return response.json();
};

export default {
  getExercises,
  getExerciseById,
  createExercise,
  deleteExercise
};
