// src/contexts/UnreadCountContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// 1. Créez le Contexte
const UnreadCountContext = createContext();

// 2. Créez un hook personnalisé pour utiliser le contexte facilement
// Cela rendra votre code plus propre dans les composants
export const useUnreadCount = () => useContext(UnreadCountContext);

// 3. Créez le Fournisseur de Contexte
// Ce composant va gérer l'état global du nombre de notifications non lues.
export const UnreadCountProvider = ({ children }) => {
    const [unreadCount, setUnreadCount] = useState(0);

    // Fonction pour récupérer le nombre de notifications non lues depuis l'API
    // Cette fonction sera appelée au chargement initial et via le polling.
    const fetchUnreadCount = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const response = await axios.get('http://localhost:8000/api/notifications/unread/count', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setUnreadCount(response.data.count);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération du nombre de notifications non lues via Context:', error);
            // Gérer les erreurs (ex: déconnexion si 401 Unauthorized)
            if (error.response && error.response.status === 401) {
                // Optionnel: Déconnecter l'utilisateur ou rediriger si le token est invalide
                // localStorage.removeItem('token');
                // localStorage.removeItem('user');
                // window.location.href = '/connexion';
            }
        }
    };

    // Fonction pour mettre à jour le compteur globalement
    // Cette fonction sera exposée via le contexte et appelée par les pages de notification.
    const updateUnreadCount = (newCount) => {
        setUnreadCount(newCount);
    };

    // Effectuer une récupération initiale au chargement du fournisseur
    useEffect(() => {
        fetchUnreadCount();

        // Garder un polling léger en plus de la mise à jour instantanée.
        // C'est utile si de nouvelles notifications arrivent du backend sans interaction utilisateur sur les pages de notification.
        // Un intervalle plus long (ex: 30 secondes ou 1 minute) est suffisant ici.
        const pollingInterval = setInterval(fetchUnreadCount, 30000); // Poll toutes les 30 secondes

        // Nettoyage de l'intervalle lorsque le composant est démonté
        return () => clearInterval(pollingInterval);
    }, []); // Le tableau de dépendances vide signifie que cet effet s'exécute une seule fois au montage.

    // Le `value` du contexte contiendra l'état actuel et la fonction de mise à jour.
    return (
        <UnreadCountContext.Provider value={{ unreadCount, updateUnreadCount, fetchUnreadCount }}>
            {children}
        </UnreadCountContext.Provider>
    );
};