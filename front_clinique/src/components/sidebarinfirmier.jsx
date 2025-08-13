import { NavLink, useNavigate } from "react-router-dom";
import axios from 'axios';
import React, { useEffect, useState } from "react";
import {
    LayoutDashboard,
    CalendarCheck,     // Remplacé de FaCalendarCheck
    ClipboardList,      // Remplacé de FaFilePrescription pour Gestion matériel médical et Messages
    Pill,           // Remplacé de FaCapsules pour Dossiers des patients et Services
    User, 
    Bell,              // Remplacé de FaUser
    LogOut,             // Remplacé de FaSignOutAlt
    MessageSquare,      // Nouvelle icône pour Messages
    Stethoscope,        // Nouvelle icône pour Services
    FolderKanban        // Nouvelle icône pour Gestion matériel médical
} from "lucide-react"; // Importez les icônes de lucide-react
import "../styles/sidebardoctor.css";
import { Shield } from "./Icons";
import { useUnreadCount } from '../contexts/UnreadCountContext';

const Sidebarinfirmier = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const { unreadCount } = useUnreadCount();

    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/connexion');
                return;
            }
            const response = await axios.get('http://localhost:8000/api/user', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setUser(response.data);
            // La récupération initiale du unreadCount est déjà gérée par le UnreadCountProvider
        } catch (error) {
            console.error('Erreur lors de la récupération des données utilisateur:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/connexion');
        }
    };


    useEffect(() => {
            const userData = localStorage.getItem('user');
            if (userData) {
                try {
                    setUser(JSON.parse(userData));
                } catch (error) {
                    console.error('Erreur parsing user data:', error);
                    fetchUserData();
                }
            } else {
                fetchUserData();
            }
    
            // SUPPRIMEZ ICI L'ANCIENNE LOGIQUE DE POLLING OU DE FETCH INITIAL
            // Exemple de ce qui DOIT ÊTRE SUPPRIMÉ ou MODIFIÉ :
            // fetchUnreadNotificationsCount(); // Cette fonction n'est plus nécessaire ici
            // const interval = setInterval(fetchUnreadNotificationsCount, 10000); // Cet intervalle doit être supprimé
            // return () => clearInterval(interval); // Ce nettoyage n'est plus nécessaire pour le polling des notifications
    
        }, []); // Les dépendances devraient être réduites si unreadCount vient du contexte
    

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
                <h2><Shield className="login-icon"/>GISS</h2>
            </div>
            <ul className="sidebar-doctor-menu">
                <li>
                    <NavLink to="/dashboard/infirmier" className={({ isActive }) => isActive ? "active" : ""}><LayoutDashboard className="icon" /> Tableau de bord</NavLink>
                </li>
                <li>
                    <NavLink to="/emploisDuTemps" className={({ isActive }) => isActive ? "active" : ""}><CalendarCheck className="icon" /> Emplois du temps</NavLink>
                </li>
                <li>
                    <NavLink to="/gestion-materiel-medical" className={({ isActive }) => isActive ? "active" : ""}><FolderKanban className="icon" /> Matériel médical</NavLink>
                </li>
                <li>
                    <NavLink to="/message-infirmier" className={({ isActive }) => isActive ? "active" : ""}><MessageSquare className="icon" /> Messages</NavLink>
                </li>
                <li>
                    <NavLink to="/infirmier-service" className={({ isActive }) => isActive ? "active" : ""}><Stethoscope className="icon" /> Services</NavLink>
                </li>
                <li>
                    <NavLink to="/infirmier-demande-service" className={({ isActive }) => isActive ? "active" : ""}><Stethoscope className="icon" /> Demandes de Service</NavLink>
                </li>
                <li>
                    <NavLink to="/dossier-patient-infirmier" className={({ isActive }) => isActive ? "active" : ""}><Pill className="icon" /> Dossiers des patients</NavLink>
                </li>
                <li>
                    <NavLink to="/infirmier-notification" className={({ isActive }) => isActive ? "active" : ""}>
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
export default Sidebarinfirmier;