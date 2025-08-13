import { useEffect, useState } from 'react';
import { Bell, Calendar, FileText, Video, User, Package, MessageSquare, PlusCircle, CheckCircle, XCircle, RefreshCw, MinusCircle, AlertTriangle, Edit, Trash2, Pill, CalendarX } from 'lucide-react'; // Importer les nouvelles icônes
import axios from 'axios';
import "./styles/NotificationsPage.css"; // Assurez-vous que le chemin est correct
import { useUnreadCount } from './contexts/UnreadCountContext';

const NotificationsPharmaPage = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { unreadCount, updateUnreadCount, fetchUnreadCount } = useUnreadCount();

  // Fonction pour récupérer les notifications
  const recupererNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      // Récupérer le token depuis le localStorage
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Aucun token d'authentification trouvé. Veuillez vous connecter.");
        setLoading(false);
        return;
      }

      const reponse = await axios.get('http://localhost:8000/api/notifications', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json"
        }
      });
      setNotifications(reponse.data);
    } catch (erreur) {
      console.error('Erreur lors de la récupération des notifications:', erreur);
      if (erreur.response && erreur.response.status === 401) {
        setError('Session expirée ou non authentifié. Veuillez vous reconnecter.');
      } else {
        setError('Impossible de charger les notifications.');
      }
    } finally {
      setLoading(false);
    }
  };

  const marquerCommeLu = async (idNotification) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Aucun token d'authentification trouvé.");
        return;
      }
      await axios.post(`http://localhost:8000/api/notifications/${idNotification}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json"
        }
      });
      // Mettre à jour l'état local des notifications sur cette page
      setNotifications(prevNotifications => {
        const updatedNotifications = prevNotifications.map(notif =>
          notif.id === idNotification ? { ...notif, read_at: new Date().toISOString() } : notif
        );
        // Mettre à jour le compteur global du sidebar via le contexte
        // Compter les notifications non lues APRES la mise à jour locale
        const newUnreadCount = updatedNotifications.filter(notif => !notif.read_at).length;
        updateUnreadCount(newUnreadCount); // <-- Appelez la fonction du contexte pour la mise à jour instantanée
        return updatedNotifications;
      });
    } catch (erreur) {
      console.error('Erreur lors du marquage comme lu:', erreur);
      setError('Impossible de marquer la notification comme lue.');
    }
  };

  const marquerToutCommeLu = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Aucun token d'authentification trouvé.");
        return;
      }
      await axios.post('http://localhost:8000/api/notifications/mark-all-as-read', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json"
        }
      });
      setNotifications(notifications.map(notif => ({ ...notif, read_at: new Date().toISOString() })));
    } catch (erreur) {
      console.error('Erreur lors du marquage de toutes les notifications comme lues:', erreur);
      setError('Impossible de marquer toutes les notifications comme lues.');
    }
  };


  useEffect(() => {
    recupererNotifications();
  }, []);

  const notificationsFiltrees = notifications.filter(notif =>
    activeTab === 'all' || (activeTab === 'unread' && !notif.read_at)
  );

  const nombreNonLues = notifications.filter(notif => !notif.read_at).length;

  if (loading) {
    return <div className="soinlink-app"><div className="soinlink-main">Chargement des notifications...</div></div>;
  }

  if (error) {
    return <div className="soinlink-app"><div className="soinlink-main" style={{ color: 'red' }}>{error}</div></div>;
  }

  return (
    <div className="soinlink-app">
      <div className="soinlink-main">
        <div className="soinlink-header">
          <div className="soinlink-header-left">
            <h1 className="soinlink-page-title">Notifications</h1>
          </div>
          <div className="soinlink-header-right">
            <div className="soinlink-notification-badge">
              <Bell size={18} />
              {nombreNonLues > 0 && <span className="soinlink-badge">{nombreNonLues}</span>}
            </div>
            
          </div>
        </div>

        <div className="soinlink-content">
          <div className="soinlink-tabs">
            <button
              className={`soinlink-tab ${activeTab === 'all' ? 'soinlink-tab-active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              Toutes ({notifications.length})
            </button>
            <button
              className={`soinlink-tab ${activeTab === 'unread' ? 'soinlink-tab-active' : ''}`}
              onClick={() => setActiveTab('unread')}
            >
              Non Lues ({nombreNonLues})
            </button>
          </div>

          <div className="soinlink-notifications-list">
            {notificationsFiltrees.length === 0 ? (
              <p>Aucune notification à afficher.</p>
            ) : (
              notificationsFiltrees.map(notif => (
                <NotificationItem
                  key={notif.id}
                  notification={notif}
                  onMarkAsRead={marquerCommeLu}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationItem = ({ notification, onMarkAsRead }) => {
  const {
    type,
    message,
    statut_rendez_vous,
    nom_docteur,
    nom_patient,
    statut_ordonnance,
    date_ordonnance,
    statut_commande,
    nom_pharmacie,
    nom_pharmacien,
    type_commande,
    sender_name,
    sent_at,
    status_consultation,
    appointment_time,
    doctor_name,
    patient_name: updated_patient_name,
    event_type, // Pour les notifications de service et de schedule
    notifier_name,
    // NOUVEAU: pour les notifications de médicament
    medicament_name,
    quantity_change,
    current_stock,
    min_stock,
    expiry_date,
  } = notification.data;

  const getIcon = () => {
    switch(type) {
      case 'rendez_vous': return <Calendar size={16} />;
      case 'prescription': return <FileText size={16} />;
      case 'commande': return <Package size={16} />;
      case 'message': return <MessageSquare size={16} />;
      case 'consultation': return <Video size={16} />;
      case 'service_event':
        switch(event_type) {
          case 'nouveau_service': return <PlusCircle size={16} />;
          case 'demande_acceptee': return <CheckCircle size={16} />;
          case 'demande_refusee': return <XCircle size={16} />;
          case 'rappel_rdv_infirmier': return <Calendar size={16} />;
          case 'nouvelle_demande_infirmier': return <User size={16} />;
          default: return '✉️';
        }
      case 'patient_profile_update': return <FileText size={16} />;
      case 'schedule_event':
        switch(event_type) {
          case 'nouvelle_garde': return <Calendar size={16} />;
          case 'garde_confirmee': return <CheckCircle size={16} />;
          case 'garde_refusee': return <XCircle size={16} />;
          case 'demande_echange': return <RefreshCw size={16} />;
          case 'echange_accepte': return <CheckCircle size={16} />;
          case 'echange_refuse': return <XCircle size={16} />;
          default: return '✉️';
        }
      case 'materiel_event':
        switch(event_type) {
          case 'materiel_utilise': return <MinusCircle size={16} />;
          case 'materiel_supprime': return <Trash2 size={16} />;
          case 'materiel_modifie': return <Edit size={16} />;
          case 'materiel_ajoute': return <PlusCircle size={16} />;
          case 'stock_faible': return <AlertTriangle size={16} />;
          default: return <Package size={16} />;
        }
      case 'medicament_event': // NOUVEAU: pour les notifications de médicament
        switch(event_type) {
          case 'medicament_ajoute': return <PlusCircle size={16} />;
          case 'medicament_modifie': return <Edit size={16} />;
          case 'medicament_supprime': return <Trash2 size={16} />;
          case 'stock_faible': return <AlertTriangle size={16} />;
          case 'date_expiration_proche': return <CalendarX size={16} />;
          default: return <Pill size={16} />; // Icône par défaut pour les médicaments
        }
      default: return '✉️';
    }
  };

  let titreNotification = "Notification";
  let displayedMessage = message; // Utiliser le message par défaut du backend

  if (type === 'rendez_vous') {
    if (statut_rendez_vous === 'reserve') {
      titreNotification = `Nouvelle réservation de rendez-vous`;
    } else if (statut_rendez_vous === 'rappel') {
      titreNotification = `Rappel de rendez-vous`;
    } else if (statut_rendez_vous === 'accepte') {
      titreNotification = `Rendez-vous accepté`;
    }
  } else if (type === 'prescription') {
    if (statut_ordonnance === 'creee') {
      titreNotification = `Nouvelle Ordonnance`;
    } else if (statut_ordonnance === 'mise_a_jour') {
      titreNotification = `Ordonnance Mise à Jour`;
    } else if (statut_ordonnance === 'supprimee') {
      titreNotification = `Ordonnance Supprimée`;
    }
  } else if (type === 'commande') {
    titreNotification = notification.data.title || "Mise à jour de commande";
  } else if (type === 'message') {
    titreNotification = notification.data.title || "Nouveau message";
  } else if (type === 'consultation') {
    titreNotification = notification.data.title;
  } else if (type === 'service_event') {
    titreNotification = notification.data.title;
  } else if (type === 'patient_profile_update') {
    titreNotification = notification.data.title;
  } else if (type === 'schedule_event') {
    titreNotification = notification.data.title;
  } else if (type === 'materiel_event') {
    titreNotification = notification.data.title;
  } else if (type === 'medicament_event') { // NOUVEAU: pour les notifications de médicament
    titreNotification = notification.data.title; // Le titre est déjà formaté par le backend
    // Le message est aussi déjà formaté par le backend, donc pas besoin de le recréer ici
  }

  return (
    <div className={`soinlink-notification-item ${!notification.read_at ? 'soinlink-unread' : ''}`}>
      <div className="soinlink-notification-icon">
        <div className={`soinlink-icon-circle ${notification.read_at ? 'soinlink-read' : 'soinlink-unread-icon'}`}>
          {getIcon()}
        </div>
      </div>

      <div className="soinlink-notification-content">
        <h3 className="soinlink-notification-title">{titreNotification}</h3>
        <p className="soinlink-notification-message">{displayedMessage}</p>
        <div className="soinlink-notification-footer">
          <span className="soinlink-notification-time">
            {new Date(notification.created_at).toLocaleString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}
          </span>
          <button className="soinlink-details-btn">Voir détails</button>
        </div>
      </div>

      <div className="soinlink-notification-actions">
        {!notification.read_at && (
          <button
            className="soinlink-mark-read-btn"
            onClick={() => onMarkAsRead(notification.id)}
          >
            Marquer comme lu
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationsPharmaPage;
