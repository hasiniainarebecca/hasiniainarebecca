import api from "./axios";

export const getUsers = async () => {
  try {
    const response = await api.get("/api/users");
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs", error);
    throw error;
  }
};