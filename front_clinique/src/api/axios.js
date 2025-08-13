import axios from "axios";

const API_URL = import.meta.env.VITE_BACKEND_URL;

const api = axios.create({
  baseURL:'http://localhost:8000/api',
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export default api;