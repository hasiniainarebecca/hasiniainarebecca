import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import moment from 'moment'; // Assurez-vous que moment.js est bien installé et importé
import './styles/PatientOnlineConsultationsList.css'

const PatientOnlineConsultationsList = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:8000/api/patient/appointments/video/today');
            setAppointments(response.data);
        } catch (err) {
            setError('Erreur lors du chargement des rendez-vous vidéo du jour.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
        // Rafraîchir les rendez-vous toutes les 10 secondes
        const intervalId = setInterval(fetchAppointments, 10000);
        return () => clearInterval(intervalId); // Nettoyage de l'intervalle
    }, []);

    const handleJoinCall = (conferenceId) => {
        navigate(`/patient/consultation-video/${conferenceId}`);
    };

    if (loading) return <div>Chargement des rendez-vous...</div>;
    if (error) return <div>Erreur: {error}</div>;

    const currentTime = moment();

    return (
        <div className="consultation-online-wrapper dashboard-doctor-main-content">
            <div className="consultation-online-container">
                <div className="consultation-online-header">
                    <h1>Mes Consultations Vidéo du Jour</h1>
                </div>
                
                {appointments.length === 0 ? (
                    <div className="consultation-no-data-message">
                        <p>Aucun rendez-vous vidéo confirmé pour aujourd'hui.</p>
                    </div>
                ) : (
                    <div className="consultation-online-grid">
                        {appointments.map(appointment => {
                            const appointmentDateTime = moment(`${appointment.date} ${appointment.time}`, 'YYYY-MM-DD HH:mm');
                            const isTimeForAppointment = currentTime.isSameOrAfter(appointmentDateTime);
                            const doctorName = appointment.doctor_name || 'Docteur inconnu';
                            const speciality = appointment.speciality || 'Spécialité inconnue';

                            return (
                                <div key={appointment.id} className="consultation-online-card">
                                    <div className="consultation-card-header">
                                        <div className="consultation-doctor-avatar">
                                            {doctorName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="consultation-doctor-info">
                                            <h3>Rendez-vous avec {doctorName}</h3>
                                            <span className="consultation-doctor-specialty">{speciality}</span>
                                        </div>
                                    </div>

                                    <div className="consultation-card-body">
                                        <div className="consultation-info-item">
                                            <strong>Date et Heure:</strong> 
                                            <span>
                                                {moment(appointment.date).format('DD/MM/YYYY')} {moment(appointment.time, 'HH:mm').format('HH:mm')}
                                            </span>
                                        </div>
                                        <div className="consultation-info-item">
                                            <strong>Type:</strong> 
                                            <span>Consultation vidéo</span>
                                        </div>
                                        <div className="consultation-reason">
                                            <strong>Motif:</strong> {appointment.reason}
                                        </div>
                                    </div>

                                    <div className={`consultation-status-badge ${
                                        appointment.status === 'confirmé' ? 'consultation-status-upcoming' :
                                        appointment.status === 'en retard' ? 'consultation-status-late' :
                                        appointment.status === 'manqué' ? 'consultation-status-missed' :
                                        'consultation-status-completed'
                                    }`}>
                                        {appointment.status}
                                    </div>

                                    <div className="consultation-card-actions">
                                        {isTimeForAppointment && appointment.call_started ? (
                                            <button
                                                onClick={() => handleJoinCall(appointment.conference_id)}
                                                className="consultation-action-button consultation-accept-call"
                                            >
                                                Rejoindre l'appel
                                            </button>
                                        ) : (
                                            <button
                                                disabled
                                                className={`consultation-action-button ${
                                                    isTimeForAppointment ? 'consultation-late-call' : 'consultation-completed-status'
                                                }`}
                                            >
                                                {isTimeForAppointment ? 'En attente du docteur...' : `Disponible à ${moment(appointment.time, 'HH:mm').format('HH:mm')}`}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientOnlineConsultationsList;