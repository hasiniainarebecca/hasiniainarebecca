import { NavLink, useNavigate } from "react-router-dom";
import axios from 'axios';
import React, { useEffect, useState } from "react";
import {
    LayoutDashboard,
    CalendarCheck, // Remplacé de FaCalendarCheck
    ClipboardList,  // Remplacé de FaFilePrescription pour Ordonnances
    Video,          // Remplacé de FaVideo
    Bell,       
    User,           // Remplacé de FaUser
    LogOut,         // Remplacé de FaSignOutAlt
    Settings,  // Remplacé de FaCapsules pour Messages
    Stethoscope,    // Nouvelle icône pour Service Infirmier/Anesthésiste
    Building2       // Nouvelle icône pour Pharmacies
} from "lucide-react"; // Importez les icônes de lucide-react
import "../styles/sidebardoctor.css";
import { Shield } from "./Icons";
import { useUnreadCount } from '../contexts/UnreadCountContext';

const SidebarAdmin = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const { unreadCount } = useUnreadCount();

    // const fetchUserData = async () => {
    //     try {
    //         const token = localStorage.getItem('token');
    //         if (!token) {
    //             navigate('/connexion');
    //             return;
    //         }
    //         const response = await axios.get('http://localhost:8000/api/user', {
    //             headers: {
    //                 Authorization: `Bearer ${token}`
    //             }
    //         });
    //         setUser(response.data);
    //         // La récupération initiale du unreadCount est déjà gérée par le UnreadCountProvider
    //     } catch (error) {
    //         console.error('Erreur lors de la récupération des données utilisateur:', error);
    //         localStorage.removeItem('token');
    //         localStorage.removeItem('user');
    //         navigate('/connexion');
    //     }
    // };


    // useEffect(() => {
    //         const userData = localStorage.getItem('user');
    //         if (userData) {
    //             try {
    //                 setUser(JSON.parse(userData));
    //             } catch (error) {
    //                 console.error('Erreur parsing user data:', error);
    //                 fetchUserData();
    //             }
    //         } else {
    //             fetchUserData();
    //         }
    
    //         // SUPPRIMEZ ICI L'ANCIENNE LOGIQUE DE POLLING OU DE FETCH INITIAL
    //         // Exemple de ce qui DOIT ÊTRE SUPPRIMÉ ou MODIFIÉ :
    //         // fetchUnreadNotificationsCount(); // Cette fonction n'est plus nécessaire ici
    //         // const interval = setInterval(fetchUnreadNotificationsCount, 10000); // Cet intervalle doit être supprimé
    //         // return () => clearInterval(interval); // Ce nettoyage n'est plus nécessaire pour le polling des notifications
    
    //     }, []); // Les dépendances devraient être réduites si unreadCount vient du contexte
    
        

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('token');

            if (!token) {
                console.error('Token manquant - déconnexion locale');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('pharmacy_id');
                navigate('/connexion');
                return;
            }

            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            };

            console.log('Tentative de déconnexion avec token:', token.substring(0, 20) + '...');

            const response = await axios.post('http://localhost:8000/api/logout', {}, config);

            console.log("Réponse déconnexion:", response.data);

            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('pharmacy_id');

            navigate('/connexion');
        } catch (error) {
            console.error('Erreur déconnexion:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });

            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('pharmacy_id');

            navigate('/connexion');
        }
    };

    const confirmLogout = () => {
        const confirmation = window.confirm("Voulez-vous vraiment vous déconnecter ?");
        if (confirmation) {
            handleLogout();
        }
    };

    return (
        <div className="sidebar-doctor"> {/* Modification ici */}
            <div className="sidebar-doctor-header"> {/* Modification ici */}
                <h2><Shield className="login-icon"/>GISS Admin</h2>
            </div>
            <ul className="sidebar-doctor-menu">
                <li>
                    <NavLink to="/dashboard/Admin" className={({ isActive }) => isActive ? "active" : ""}><LayoutDashboard className="icon" /> Tableau de bord</NavLink>
                </li>
                <li>
                    <NavLink to="/Admin/gestion/utilisateur" className={({ isActive }) => isActive ? "active" : ""}><CalendarCheck className="icon" /> Gestion Utilisateurs</NavLink>
                </li>
                <li>
                    <NavLink to="/Admin/etablissement" className={({ isActive }) => isActive ? "active" : ""}><CalendarCheck className="icon" /> Gestion Etablissements</NavLink>
                </li>
                <li>
                    <NavLink to="/Admin/pharmacie" className={({ isActive }) => isActive ? "active" : ""}><CalendarCheck className="icon" /> Gestion Pharmacies</NavLink>
                </li>
                <li>
                    <NavLink to="/Admin/rapport" className={({ isActive }) => isActive ? "active" : ""}><Building2 className="icon" /> Rapports</NavLink>
                </li>
                <li>
                    <NavLink to="/Admin/parametre" className={({ isActive }) => isActive ? "active" : ""}><Settings className="icon" /> Paramètres</NavLink>
                </li>
                <li>
                    <NavLink to="/Admin-notification" className={({ isActive }) => isActive ? "active" : ""}>
                        <div className="notification-menu-item">
                            <Bell className="icon" /> Notifications
                            {unreadCount > 0 && (
                                <span className="notification-badge">{unreadCount}</span>
                            )}
                        </div>
                    </NavLink>
                </li>
            </ul>
            <div className="sidebar-doctor-footer">
                {user ? (
                    <p>{user.nom} {user.prenom}</p>
                ) : (
                    <p>Chargement...</p>
                )}
                <button onClick={confirmLogout} className="sidebar-doctor-logout-button">
                    <LogOut className="icon" /> Déconnexion
                </button>
            </div>
        </div>
    );
};
export default SidebarAdmin;