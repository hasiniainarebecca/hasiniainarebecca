// src/utils/axiosConfig.js
import axios from 'axios';

// Configuration de base d'axios
axios.defaults.baseURL = 'http://localhost:8000/api';
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

// Intercepteur pour ajouter automatiquement le token à toutes les requêtes
axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Intercepteur pour gérer les réponses d'erreur
axios.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Si token expiré ou invalide, rediriger vers login
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('pharmacy_id');
            window.location.href = '/connexion';
        }
        return Promise.reject(error);
    }
);

export default axios;