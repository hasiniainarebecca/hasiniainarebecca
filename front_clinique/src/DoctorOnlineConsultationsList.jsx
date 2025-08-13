import React, { useState, useEffect } from 'react';
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import moment from 'moment'; // Assurez-vous que moment.js est bien installé et importé
import './styles/DoctorOnlineConsultationsList.css';

const DoctorOnlineConsultationsList = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:8000/api/doctor/appointments/video/today');
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
        // Rafraîchir les rendez-vous toutes les 30 secondes
        const intervalId = setInterval(fetchAppointments, 10000);
        return () => clearInterval(intervalId); // Nettoyage de l'intervalle
    }, []);

    const handleStartCall = async (appointmentId, conferenceId) => {
        try {
            // Envoyer une requête pour marquer l'appel comme démarré (si nécessaire)
            await axios.post(`http://localhost:8000/api/appointments/${appointmentId}/start-call`);
            navigate(`/doctor/consultation-video/${conferenceId}`);
        } catch (err) {
            setError("Erreur lors du démarrage de l'appel vidéo.");
            console.error(err);
        }
    };

    if (loading) return <div>Chargement des rendez-vous...</div>;
    if (error) return <div>Erreur: {error}</div>;

    const currentTime = moment();

    return (
        <div className="doc-online-consultations-main">
            <div className="doc-online-consultations-container">
                <div className="doc-online-consultations-header">
                    <h1 className="doc-online-consultations-title">Mes Consultations Vidéo du Jour</h1>
                </div>
                
                {appointments.length === 0 ? (
                    <div className="doc-online-consultations-empty">
                        <p className="doc-online-consultations-empty-text">Aucun rendez-vous vidéo confirmé pour aujourd'hui.</p>
                    </div>
                ) : (
                    <div className="doc-online-consultations-grid">
                        {appointments.map(appointment => {
                            const appointmentDateTime = moment(`${appointment.date} ${appointment.time}`, 'YYYY-MM-DD HH:mm');
                            const isTimeForAppointment = currentTime.isSameOrAfter(appointmentDateTime);
                            const patientName = appointment.patient_name || 'Patient inconnu';

                            return (
                                <div key={appointment.id} className="doc-online-consultation-card">
                                    <div className="doc-online-consultation-header">
                                        <div className="doc-online-consultation-avatar">
                                            {patientName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="doc-online-consultation-info">
                                            <h2 className="doc-online-consultation-patient-name">Rendez-vous avec {patientName}</h2>
                                            <p className="doc-online-consultation-type">Consultation vidéo</p>
                                        </div>
                                    </div>

                                    <div className="doc-online-consultation-details">
                                        <div className="doc-online-consultation-detail-item">
                                            <span className="doc-online-consultation-detail-label">Date:</span>
                                            <span className="doc-online-consultation-detail-value">
                                                {moment(appointment.date).format('DD/MM/YYYY')} {moment(appointment.time, 'HH:mm').format('HH:mm')}
                                            </span>
                                        </div>
                                        <div className="doc-online-consultation-detail-item">
                                            <span className="doc-online-consultation-detail-label">Motif:</span>
                                            <span className="doc-online-consultation-detail-value">{appointment.reason}</span>
                                        </div>
                                    </div>

                                    <div className="doc-online-consultation-status">
                                        <span className={`doc-online-consultation-status-badge ${
                                            appointment.status === 'confirmé' ? 'doc-online-consultation-status-prévue' :
                                            appointment.status === 'terminé' ? 'doc-online-consultation-status-terminée' :
                                            'doc-online-consultation-status-annulée'
                                        }`}>
                                            {appointment.status}
                                        </span>
                                    </div>

                                    <div className="doc-online-consultation-actions">
                                        {isTimeForAppointment && appointment.status === 'confirmé' ? (
                                            !appointment.call_started ? (
                                                <button
                                                    onClick={() => handleStartCall(appointment.id, appointment.conference_id)}
                                                    className="doc-online-consultation-btn doc-online-consultation-btn-start"
                                                >
                                                    Démarrer
                                                </button>
                                            ) : (
                                                <span className="doc-online-consultation-btn doc-online-consultation-btn-completed">
                                                    Appel en cours...
                                                </span>
                                            )
                                        ) : (
                                            <button
                                                disabled
                                                className="doc-online-consultation-btn doc-online-consultation-btn-completed"
                                            >
                                                Disponible à {moment(appointment.time, 'HH:mm').format('HH:mm')}
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

export default DoctorOnlineConsultationsList;