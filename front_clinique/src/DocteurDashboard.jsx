import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    BarChart3,
    Calendar,
    Users,
    FileText,
    MessageCircle,
    User,
    CalendarDays,
    ClipboardList,
    Video,
    UserCheck,
    Stethoscope,
    ClipboardPen,
    UserCog,
    MonitorPlay
} from 'lucide-react';
import './styles/DocteurDashboard.css';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

dayjs.locale('fr');

function DocteurDashboard() {
    const [doctor, setDoctor] = useState(null);
    const [isAvailable, setIsAvailable] = useState(false);
    const [upcomingConsultationsCount, setUpcomingConsultationsCount] = useState(0);
    const [activePatientsCount, setActivePatientsCount] = useState(0);
    const [prescriptionsIssuedCount, setPrescriptionsIssuedCount] = useState(0);
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);

    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("token");

        if (!storedUser || !storedToken) {
            console.error("Aucun utilisateur ou token trouvé dans le localStorage !");
            navigate('/connexion');
            return;
        }

        const parsedUser = JSON.parse(storedUser);

        if (parsedUser && parsedUser.id && parsedUser.role === 'docteur') {
            setDoctor(parsedUser);
            setIsAvailable(parsedUser.is_available || false);
            fetchDoctorStats(parsedUser.id, storedToken);
            fetchUpcomingAppointments(parsedUser.id, storedToken);
        } else {
            console.error("L'utilisateur n'est pas un docteur ou n'a pas d'ID valide !");
            navigate('/connexion');
        }
    }, [navigate]);

    const fetchDoctorStats = async (doctorId, token) => {
        try {
            const response = await axios.get(
                `http://127.0.0.1:8000/api/doctor/${doctorId}/stats`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            const data = response.data;
            setUpcomingConsultationsCount(data.upcoming_consultations_count);
            setActivePatientsCount(data.active_patients_count);
            setPrescriptionsIssuedCount(data.prescriptions_issued_count);
        } catch (error) {
            console.error("Erreur lors de la récupération des statistiques du docteur :", error);
        }
    };

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

    const fetchUpcomingAppointments = async (doctorId, token) => {
        try {
            const response = await axios.get(
                `http://127.0.0.1:8000/api/doctor/${doctorId}/appointments`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            
            // Debug: Afficher les données brutes
            console.log("Données brutes des rendez-vous:", response.data);
            
            const formattedAppointments = response.data.map(appt => {
                // Formater la date
                const dateObj = dayjs(appt.date);
                const formattedDate = dateObj.isValid() 
                    ? dateObj.format('dddd D MMMM YYYY') 
                    : 'Date invalide';
                
                // Extraire l'heure
                const formattedTime = extractTimeFromString(appt.time || appt.date);
                
                // Debug: Afficher le formatage
                console.log("Rendez-vous formaté:", {
                    originalDate: appt.date,
                    originalTime: appt.time,
                    formattedDate,
                    formattedTime
                });
                
                return {
                    ...appt,
                    formattedDate,
                    formattedTime
                };
            });
            
            setUpcomingAppointments(formattedAppointments);
        } catch (error) {
            console.error("Erreur lors de la récupération des prochains rendez-vous :", error);
        }
    };

    const toggleAvailability = async () => {
        if (!doctor || !doctor.id) {
            console.error("L'utilisateur n'est pas chargé ou l'ID est manquant");
            return;
        }

        try {
            const response = await axios.post(
                `http://127.0.0.1:8000/api/doctors/${doctor.id}/toggle-availability`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            const updatedAvailability = response.data.is_available;
            setIsAvailable(updatedAvailability);

            const updatedDoctor = { ...doctor, is_available: updatedAvailability };
            localStorage.setItem("user", JSON.stringify(updatedDoctor));
            setDoctor(updatedDoctor);
        } catch (error) {
            console.error("Erreur lors du changement de disponibilité :", error);
        }
    };

    if (!doctor) {
        return null;
    }

    return (
        <div className="dashboard-doctor-main-content">
            <div className="doctor-dashboard-content">
                <div className="doctor-dashboard-inner">
                    <div className="doctor-main-content">
                        <div className="doctor-dashboard-header">
                            <h2 className="doctor-dashboard-title">Tableau de Bord Docteur</h2>
                            <div className="doctor-availability-toggle">
                                <span className="doctor-availability-label">
                                    Statut: <span className={isAvailable ? "doctor-status-available" : "doctor-status-unavailable"}>
                                        {isAvailable ? "Disponible" : "Indisponible"}
                                    </span>
                                </span>
                                <button className="doctor-toggle-button" onClick={toggleAvailability}>
                                    {isAvailable ? "Se rendre indisponible" : "Se rendre disponible"}
                                </button>
                            </div>
                        </div>

                        <div className="doctor-stats-grid">
                            <div className="doctor-stat-card">
                                <CalendarDays className="doctor-stat-icon" size={24} />
                                <div className="doctor-stat-content">
                                    <div className="doctor-stat-number">{upcomingConsultationsCount}</div>
                                    <div className="doctor-stat-label">Consultations à venir</div>
                                    <div className="doctor-stat-description">Prochaines consultations planifiées</div>
                                </div>
                            </div>

                            <div className="doctor-stat-card">
                                <Users className="doctor-stat-icon" size={24} />
                                <div className="doctor-stat-content">
                                    <div className="doctor-stat-number">{activePatientsCount}</div>
                                    <div className="doctor-stat-label">Patients Actifs</div>
                                    <div className="doctor-stat-description">Nombre total de patients suivis</div>
                                </div>
                            </div>

                            <div className="doctor-stat-card">
                                <FileText className="doctor-stat-icon" size={24} />
                                <div className="doctor-stat-content">
                                    <div className="doctor-stat-number">{prescriptionsIssuedCount}</div>
                                    <div className="doctor-stat-label">Ordonnances Émises</div>
                                    <div className="doctor-stat-description">Total des ordonnances ce mois-ci</div>
                                </div>
                            </div>

                            <div className="doctor-stat-card doctor-consultation-card">
                                <div className="doctor-consultation-content">
                                    <Video className="doctor-consultation-icon" size={24} />
                                    <div className="doctor-consultation-text">
                                        <h3>Consultation en ligne</h3>
                                        <p>Gérez vos consultations vidéo et chat.</p>
                                    </div>
                                    <button className="doctor-consultation-button" onClick={() => navigate("/liste-consultations-docteur")}>
                                        Accéder aux téléconsultations
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="doctor-bottom-section">
                            <div className="doctor-consultations-panel">
                                <h3 className="doctor-panel-title">Prochaines Consultations</h3>
                                <p className="doctor-panel-subtitle">Vos rendez-vous et téléconsultations à venir.</p>

                                {upcomingAppointments.length > 0 ? (
                                    upcomingAppointments.map((appointment) => (
                                        <div key={appointment.id} className="doctor-consultation-item">
                                            <div className="doctor-consultation-info">
                                                <h4>Patient: {appointment.patient_name}</h4>
                                                <p className="doctor-consultation-date">
                                                    {appointment.formattedDate} à {appointment.formattedTime}
                                                </p>
                                                <p className="doctor-consultation-type">
                                                    Type: {appointment.type === 'video' ? 'Vidéo' : 'En personne'} • 
                                                    Motif: {appointment.reason || 'Non spécifié'}
                                                </p>
                                            </div>
                                            <button 
                                                className="doctor-view-agenda-btn" 
                                                onClick={() => navigate("/docteur/rendez-vous")}
                                            >
                                                Voir Agenda
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p>Aucune consultation à venir.</p>
                                )}

                                <button className="doctor-manage-agenda-link" onClick={() => navigate("/docteur/rendez-vous")}>Gérer l'agenda</button>
                            </div>

                            <div className="doctor-quick-actions-panel">
                                <h3 className="doctor-panel-title">Actions Rapides</h3>
                                <p className="doctor-panel-subtitle">Accès direct aux fonctionnalités clés.</p>

                                <div className="doctor-quick-actions">
                                    <div className="doctor-quick-action">
                                        <ClipboardPen className="doctor-action-icon" size={20} />
                                        <span className="doctor-action-text" onClick={() => navigate("/docteur/prescription")}>Nouvelle Ordonnance</span>
                                    </div>
                                    <div className="doctor-quick-action">
                                        <UserCog className="doctor-action-icon" size={20} />
                                        <span className="doctor-action-text" onClick={() => navigate("/dossier-patient-docteur")}>Voir Dossiers Patients</span>
                                    </div>
                                    <div className="doctor-quick-action">
                                        <MonitorPlay className="doctor-action-icon" size={20} />
                                        <span className="doctor-action-text" onClick={() => navigate("/liste-consultations-docteur")}>Démarrer une Téléconsultation</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DocteurDashboard;