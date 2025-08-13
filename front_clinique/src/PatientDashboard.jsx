import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Calendar, 
  CalendarCheck, 
  FileText, 
  Send, 
  Monitor,
  ChevronRight,
  Bell,
  User
} from 'lucide-react';
import axios from 'axios';
import './styles/PatientDashboard.css';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

dayjs.locale('fr');

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentPrescriptions, setRecentPrescriptions] = useState([]);
  const [patientId, setPatientId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const extractTimeFromString = (timeString) => {
    if (!timeString) return '00:00';
    
    try {
      // Format simple HH:mm
      if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeString)) {
        return timeString;
      }
      
      // Format ISO avec fuseau horaire
      if (timeString.includes('T')) {
        const timePart = timeString.split('T')[1] || '';
        return timePart.substring(0, 5); // HH:MM
      }
      
      return '00:00';
    } catch (e) {
      console.error("Erreur de formatage de l'heure:", e);
      return '00:00';
    }
  };

  const formatAppointmentDateTime = (dateStr, timeStr) => {
    if (!dateStr) return "Date non spécifiée";
    
    try {
      // Nettoyage des chaînes
      dateStr = dateStr.toString().trim();
      const extractedTime = extractTimeFromString(timeStr);
      
      // Création de la date avec dayjs
      const dateTimeStr = `${dateStr.split('T')[0]}T${extractedTime}`;
      const dateObj = dayjs(dateTimeStr);
      
      if (!dateObj.isValid()) {
        throw new Error('Date invalide');
      }
      
      return dateObj.format('dddd D MMMM YYYY [à] HH:mm');
    } catch (e) {
      console.error("Erreur de formatage:", e);
      // Solution de repli
      return `${dateStr}${timeStr ? ` à ${extractTimeFromString(timeStr)}` : ''}`;
    }
  };

  // Récupération de l'ID utilisateur
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/user');
        if (response.data && response.data.id) {
          setPatientId(response.data.id);
        } else {
          throw new Error('Données utilisateur invalides');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError("Impossible de charger les données utilisateur");
      }
    };

    fetchUser();
  }, []);

  // Récupération des rendez-vous et prescriptions
  useEffect(() => {
    if (!patientId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Récupération des rendez-vous
        const appointmentsResponse = await axios.get(
          `http://localhost:8000/api/patient/${patientId}/upcoming-appointments`
        );
        
        const formattedAppointments = appointmentsResponse.data.map(appointment => ({
          id: appointment.id,
          doctor: {
            prenom: appointment.doctor?.prenom || 'Prénom',
            nom: appointment.doctor?.nom || 'Nom',
            speciality: appointment.doctor?.speciality || 'Spécialité'
          },
          date: formatAppointmentDateTime(appointment.appointment_date, appointment.appointment_time),
          rawDate: appointment.appointment_date,
          rawTime: appointment.appointment_time,
          type: appointment.type || 'Non spécifié',
          reason: appointment.reason || 'Non spécifié'
        }));

        // Récupération des prescriptions
        const prescriptionsResponse = await axios.get(
          `http://localhost:8000/api/patient/${patientId}/recent-prescriptions`
        );

        const formattedPrescriptions = prescriptionsResponse.data.map(prescription => {
          let displayDate = 'Date inconnue';
          try {
            const dateObj = dayjs(prescription.date);
            if (dateObj.isValid()) {
              displayDate = dateObj.format('D MMMM YYYY');
            }
          } catch (e) {
            console.error("Erreur de parsing de date:", e);
          }

          return {
            id: prescription.id,
            doctor_name: prescription.doctor_name || 'Médecin non spécifié',
            date: displayDate,
            rawDate: prescription.date,
            status: prescription.status || 'Statut inconnu'
          };
        });

        setUpcomingAppointments(formattedAppointments);
        setRecentPrescriptions(formattedPrescriptions);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError("Une erreur est survenue lors du chargement des données");
        setUpcomingAppointments([]);
        setRecentPrescriptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [patientId]);

  if (loading) {
    return (
      <div className="pd-dashboard-container">
        <div className="pd-content-wrapper">
          <h1 className="pd-page-title">Tableau de Bord Patient</h1>
          <p>Chargement en cours...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pd-dashboard-container">
        <div className="pd-content-wrapper">
          <h1 className="pd-page-title">Tableau de Bord Patient</h1>
          <div className="pd-error-message">{error}</div>
          <button 
            className="pd-retry-button"
            onClick={() => window.location.reload()}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pd-dashboard-container">
      <div className="pd-content-wrapper">
        <h1 className="pd-page-title">Tableau de Bord Patient</h1>
        
        {/* Stats Cards */}
        <div className="pd-stats-grid">
          <div className="pd-stat-card">
            <div className="pd-stat-content">
              <h3 className="pd-stat-title">Rendez-vous à venir</h3>
              <div className="pd-stat-number">{upcomingAppointments.length}</div>
              <p className="pd-stat-subtitle">Total des RDV prévus</p>
            </div>
            <div className="pd-stat-icon">
              <Calendar size={24} />
            </div>
          </div>

          <div className="pd-stat-card">
            <div className="pd-stat-content">
              <h3 className="pd-stat-title">Ordonnances Actives</h3>
              <div className="pd-stat-number">{recentPrescriptions.length}</div>
              <p className="pd-stat-subtitle">Total des ordonnances actives</p>
            </div>
            <div className="pd-stat-icon">
              <FileText size={24} />
            </div>
          </div>

          <div className="pd-cta-card">
            <div className="pd-cta-content">
              <div className="pd-cta-icon">
                <Bell size={24} />
              </div>
              <h3 className="pd-cta-title">Nouvelle Consultation?</h3>
              <p className="pd-cta-subtitle">Prêt à planifier votre prochaine visite ou consultation en ligne?</p>
              <button 
                className="pd-cta-button" 
                onClick={() => navigate("/patient/rendez-vous")}
              >
                Prendre un rendez-vous
              </button>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="pd-content-grid">
          {/* Upcoming Appointments */}
          <div className="pd-content-card">
            <div className="pd-card-header">
              <h2 className="pd-card-title">Prochains Rendez-vous</h2>
              <p className="pd-card-subtitle">Vos consultations médicales à venir.</p>
            </div>
            <div className="pd-card-content">
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="pd-appointment-item">
                    <div className="pd-appointment-info">
                      <h4 className="pd-appointment-doctor">
                        Dr. {appointment.doctor.prenom} {appointment.doctor.nom} 
                        {appointment.doctor.speciality && ` (${appointment.doctor.speciality})`}
                      </h4>
                      <p className="pd-appointment-date">{appointment.date}</p>
                      <span className="pd-appointment-type">Type: {appointment.type}</span>
                      {appointment.reason && (
                        <p className="pd-appointment-type">Motif: {appointment.reason}</p>
                      )}
                    </div>
                    <button 
                      className="pd-details-button"
                      onClick={() => navigate(`/patient/rendez-vous/${appointment.id}`)}
                    >
                      Détails
                    </button>
                  </div>
                ))
              ) : (
                <p className="pd-no-data">Aucun rendez-vous à venir.</p>
              )}
            </div>
            <div className="pd-card-footer">
              <button 
                className="pd-view-all-button" 
                onClick={() => navigate("/patient/rendez-vous")}
              >
                Voir tous les rendez-vous
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Recent Prescriptions */}
          <div className="pd-content-card">
            <div className="pd-card-header">
              <h2 className="pd-card-title">Ordonnances Récentes</h2>
              <p className="pd-card-subtitle">Vos dernières prescriptions médicales.</p>
            </div>
            <div className="pd-card-content">
              {recentPrescriptions.length > 0 ? (
                recentPrescriptions.map((prescription) => (
                  <div key={prescription.id} className="pd-prescription-item">
                    <div className="pd-prescription-info">
                      <h4 className="pd-prescription-doctor">
                        Prescription du {prescription.doctor_name}
                      </h4>
                      <p className="pd-prescription-date">Émise le: {prescription.date}</p>
                      <span className="pd-prescription-status">Statut: {prescription.status}</span>
                    </div>
                    <button 
                      className="pd-details-button" 
                      onClick={() => navigate(`/patient/prescription/${prescription.id}`)}
                    >
                      Détails
                    </button>
                  </div>
                ))
              ) : (
                <p className="pd-no-data">Aucune ordonnance récente.</p>
              )}
            </div>
            <div className="pd-card-footer">
              <button 
                className="pd-view-all-button" 
                onClick={() => navigate("/patient/prescription")}
              >
                Voir toutes les ordonnances
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;