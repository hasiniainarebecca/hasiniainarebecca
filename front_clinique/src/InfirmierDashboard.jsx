import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Importez useNavigate
import {
  Users,
  Calendar,
  Bell,
  Settings,
  FileText,
  Activity,
  Eye,
  Plus
} from 'lucide-react';
import './styles/InfirmierDashboard.css';

const InfirmierDashboard = () => {
  const [activeServices, setActiveServices] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Initialisez useNavigate

  useEffect(() => {
    const fetchDashboardData = async () => {
      // 1. Récupérer l'utilisateur et le jeton depuis le localStorage
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");

      if (!storedUser || !storedToken) {
        console.error("Aucun utilisateur ou token trouvé dans le localStorage ! Redirection vers la page de connexion.");
        navigate('/connexion'); // Redirigez l'utilisateur si non authentifié
        setLoading(false);
        return;
      }

      // Analyser l'utilisateur pour obtenir l'ID si nécessaire (bien que /user endpoint le gère déjà)
      const parsedUser = JSON.parse(storedUser);
      // Optionnel: Vérifier que l'utilisateur est bien un 'infirmier' si cette logique n'est pas déjà gérée par votre RequireAuth
      if (parsedUser.role !== 'infirmier') {
        console.error("L'utilisateur n'est pas un infirmier. Redirection non autorisée.");
        // Gérer la redirection ou l'affichage d'un message d'erreur
        navigate('/'); // Ou une autre page appropriée
        setLoading(false);
        return;
      }


      // 2. Définir l'en-tête d'autorisation par défaut pour toutes les requêtes Axios
      // C'est la partie cruciale pour l'authentification avec Laravel Sanctum
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

      try {
        // Récupérer les informations de l'utilisateur connecté via l'API (pour confirmation ou détails supplémentaires)
        // Le chemin est maintenant '/user' (sans '/api') car axiosConfig.js doit déjà gérer la base URL
        const userResponse = await axios.get('/user');
        const userId = userResponse.data.id; // Utilisez l'ID de l'utilisateur authentifié

        // 3. Récupérer les services actifs de l'infirmier
        const servicesResponse = await axios.get(`/nurse/services`);
        setActiveServices(servicesResponse.data);

        // 4. Récupérer les demandes de service en attente (pending ou accepted)
        const requestsResponse = await axios.get(`/nurse/service-requests/?status=pending,accepted`);
        setPendingRequests(requestsResponse.data);

        setLoading(false);
      } catch (err) {
        console.error("Erreur lors de la récupération des données du tableau de bord :", err);
        // Gérer les erreurs spécifiques, par exemple 401 Unauthorized
        if (err.response && err.response.status === 401) {
            setError("Session expirée ou non authentifié. Veuillez vous reconnecter.");
            navigate('/connexion'); // Rediriger en cas de 401
        } else {
            setError("Impossible de charger les données du tableau de bord. Erreur: " + (err.response?.data?.message || err.message));
        }
        setLoading(false);
      }
      finally {
        // Mettez loading à false une fois que toutes les données sont chargées (succès ou échec)
        setLoading(false); 
      }
    };

    fetchDashboardData();
  }, []); // Le tableau vide [] assure que useEffect ne s'exécute qu'une seule fois au montage du composant

  if (loading) {
    return (
      <div className="inf-dashboard-wrapper">
        <div className="with-sidebar">
          <div className="dashboard-container">
            <div className="main-content">
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Chargement des données du tableau de bord...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="with-sidebar">
        <div className="dashboard-container">
          <div className="main-content">
            <div className="inf-dashboard-wrapper" style={{ color: 'red' }}>{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="inf-dashboard-wrapper">
            <div className="inf-main-content">
              <div className="inf-header">
                <h1 className="inf-title">Tableau de Bord Professionnel</h1>
              </div>

              {/* Stats Cards */}
              <div className="inf-stats-grid">
                <div className="inf-stat-card">
                  <div className="inf-stat-header">
                    <span className="inf-stat-label">Services Actifs</span>
                    <Settings className="inf-stat-icon" size={16} />
                  </div>
                  <div className="inf-stat-value">{activeServices.length}</div>
                  <div className="inf-stat-subtitle">Total des services que vous proposez</div>
                </div>

                <div className="inf-stat-card">
                  <div className="inf-stat-header">
                    <span className="inf-stat-label">Demandes en Attente</span>
                    <Bell className="inf-stat-icon" size={16} />
                  </div>
                  <div className="inf-stat-value">{pendingRequests.length}</div>
                  <div className="inf-stat-subtitle">Nouvelles demandes de patients</div>
                </div>

                <div className="inf-new-service-card">
                  <div className="inf-new-service-content">
                    <Users className="inf-new-service-icon" size={24} />
                    <div className="inf-new-service-text">
                      <h3>Nouveau Service?</h3>
                      <p>Ajoutez ou mettez à jour les services que vous offrez.</p>
                    </div>
                  </div>
                  <button className="inf-btn-primary" onClick={() => navigate("/infirmier-service")}>Gérer mes services</button>
                </div>
              </div>

              {/* Content Grid */}
              <div className="inf-content-grid">
                {/* Recent Requests */}
                <div className="inf-content-card">
                  <div className="inf-card-header">
                    <h2>Demandes Récentes</h2>
                    <p className="inf-card-subtitle">Vos dernières demandes de service des patients.</p>
                  </div>
                  <div className="inf-requests-list">
                    {pendingRequests.length > 0 ? (
                      pendingRequests.slice(0, 3).map((request) => (
                        <div key={request.id} className="inf-request-item">
                          <div className="inf-request-avatar">
                            {request.patientName ? request.patientName.charAt(0) : '?'}
                          </div>
                          <div className="inf-request-info">
                            <p className="inf-request-name">
                              {request.patientName} - {request.serviceName}
                            </p>
                            <p className="inf-request-date">
                              Demandé pour le: {request.requested_date} à {request.requested_time}
                            </p>
                            <p className="inf-request-status">
                              Statut: <span className={`inf-status-${request.original_status}`}>{request.status}</span>
                            </p>
                          </div>
                          <button className="inf-btn-details" onClick={() => navigate("/infirmier-demande-service")}>Détails</button>
                        </div>
                      ))
                    ) : (
                      <p>Aucune demande de service en attente ou acceptée pour le moment.</p>
                    )}
                  </div>
                  <button className="inf-btn-link" onClick={() => navigate("/infirmier-demande-service")}>Voir toutes les demandes</button>
                </div>

                {/* Quick Actions */}
                <div className="inf-content-card">
                  <div className="inf-card-header">
                    <h2>Actions Rapides</h2>
                    <p className="inf-card-subtitle">Gérez votre planning et vos services.</p>
                  </div>

                  <div className="inf-actions-list">
                    <button className="inf-action-btn">
                      <Settings className="inf-action-icon" size={18} />
                      <span onClick={() => navigate("/infirmier-service")}>Gérer mes Offres de Service</span>
                    </button>

                    <button className="inf-action-btn">
                      <Calendar className="inf-action-icon" size={18} />
                      <span onClick={() => navigate("/emploisDuTemps")}>Consulter mon Planning</span>
                    </button>

                    <button className="inf-action-btn">
                      <Bell className="inf-action-icon" size={18} />
                      <span onClick={() => navigate("/gestion-materiel-medical")}>Gérer les matériels médicaux</span>
                    </button>
                    <button className="inf-action-btn">
                      <Bell className="inf-action-icon" size={18} />
                      <span onClick={() => navigate("/infirmier-demande-service")}>Voir les Demandes de Patients</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        
  );
};

export default InfirmierDashboard;