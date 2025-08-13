import { useState, useEffect } from "react";
import axios from "axios";
import dayjs from "dayjs";
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

import "./styles/DoctorAppointments.css";
import { UserIcon } from "./components/Icons";

const DoctorAppointments = () => {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDetails, setShowDetails] = useState(null);

  const DATE_FORMAT_BACKEND = "YYYY-MM-DD";

  const extractTimeFromString = (timeString) => {
    if (!timeString) return '00:00';
    
    try {
      // Format simple HH:mm
      if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeString)) {
        return timeString;
      }
      
      // Format ISO avec fuseau horaire
      if (timeString.includes('T')) {
        const date = new Date(timeString);
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      }
      
      return '00:00';
    } catch (e) {
      console.error("Erreur de formatage de l'heure:", e);
      return '00:00';
    }
  };

  const parseAppointmentDateTime = (appointment) => {
    try {
      if (appointment.date_time) {
        return dayjs.utc(appointment.date_time);
      }
      
      const datePart = dayjs(appointment.appointment_date).format('YYYY-MM-DD');
      const timePart = appointment.appointment_time 
        ? extractTimeFromString(appointment.appointment_time)
        : '00:00';
      
      return dayjs.utc(`${datePart}T${timePart}:00Z`);
    } catch (e) {
      console.error("Erreur de parsing date/heure:", e);
      return dayjs(null);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
  
    const fetchAppointments = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/appointments/doctor", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json"
          }
        });
        
        if (res.data.length > 0) {
          console.log('Données reçues:', {
            id: res.data[0].id,
            original_time: res.data[0].appointment_time,
            extracted_time: extractTimeFromString(res.data[0].appointment_time)
          });
        }
        
        return res.data;
      } catch (err) {
        console.error("Erreur axios :", err.response?.status, err.response?.data);
        setLoading(false);
        return [];
      }
    };

    const autoCancelAppointments = async (appointmentsToProcess, currentAppointmentsState) => {
      const now = dayjs().utc();
      
      const toCancel = appointmentsToProcess.filter(app => {
        const status = app.status?.trim().toLowerCase();
        const appointmentDateTime = parseAppointmentDateTime(app);
        return appointmentDateTime.isValid() && 
               status === "en attente" && 
               appointmentDateTime.isBefore(now);
      });

      await Promise.all(toCancel.map(async (app) => {
        try {
          await axios.put(`http://localhost:8000/api/appointments/${app.id}/decline`, {}, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json"
            }
          });
          const index = currentAppointmentsState.findIndex(a => a.id === app.id);
          if (index !== -1) {
            currentAppointmentsState[index].status = "annulé";
          }
        } catch (err) {
          console.error(`Erreur lors de l'annulation automatique du RDV ${app.id}:`, err);
        }
      }));
    };

    const autoCompleteAppointments = async (appointmentsToProcess, currentAppointmentsState) => {
      const now = dayjs().utc();
      
      const toComplete = appointmentsToProcess.filter(app => {
        const status = app.status?.trim().toLowerCase();
        const appointmentDateTime = parseAppointmentDateTime(app);
        const appointmentEndTime = appointmentDateTime.add(1, 'hour');
        return status === "confirmé" && appointmentEndTime.isBefore(now);
      });

      await Promise.all(toComplete.map(async (app) => {
        try {
          await axios.put(`http://localhost:8000/api/appointments/${app.id}/complete`, {}, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json"
            }
          });
          const index = currentAppointmentsState.findIndex(a => a.id === app.id);
          if (index !== -1) {
            currentAppointmentsState[index].status = "terminé";
          }
        } catch (err) {
          console.error(`Erreur lors du passage automatique en terminé du RDV ${app.id}:`, err);
        }
      }));
    };
  
    const updateAppointmentsStatus = async () => {
      setLoading(true);
      const appointmentsData = await fetchAppointments();
      const updatedAppointments = [...appointmentsData];
      
      await autoCancelAppointments(appointmentsData, updatedAppointments);
      await autoCompleteAppointments(appointmentsData, updatedAppointments);
      
      setAppointments(updatedAppointments);
      setLoading(false);
    };
  
    updateAppointmentsStatus();
  }, []);
  
  const formatDate = (dateInput) => {
    const parsedDate = dayjs(dateInput);
    return parsedDate.isValid() ? parsedDate.format('DD/MM/YYYY') : 'Non disponible';
  };

  const getLastVisit = (patientId) => {
    const completedAppointments = appointments
      .filter(appt => appt.patient?.id === patientId && appt.status?.trim().toLowerCase() === 'terminé');
  
    if (completedAppointments.length === 0) return 'Non disponible';
  
    const sortedAppointments = completedAppointments.sort(
      (a, b) => parseAppointmentDateTime(b).valueOf() - parseAppointmentDateTime(a).valueOf()
    );
  
    return formatDate(sortedAppointments[0].appointment_date);
  };
  
  const now = dayjs().utc();

  const upcomingAppointments = appointments.filter((appt) => {
    const status = appt.status?.trim().toLowerCase();
    const appointmentDateTime = parseAppointmentDateTime(appt);
    return appointmentDateTime.isValid() && 
           status === "confirmé" && 
           appointmentDateTime.isSameOrAfter(now);
  });

  const pastAppointments = appointments.filter((appt) => {
    const status = appt.status?.trim().toLowerCase();
    const appointmentDateTime = parseAppointmentDateTime(appt);
    return appointmentDateTime.isValid() && 
           appointmentDateTime.isBefore(now) && 
           ["terminé", "annulé", "confirmé"].includes(status);
  });

  const pendingAppointments = appointments.filter((appt) => {
    const status = appt.status?.trim().toLowerCase();
    return status === "en attente";
  });

  const calculateAge = (birthDateString) => {
    const birthDate = dayjs(birthDateString, DATE_FORMAT_BACKEND);
    return dayjs().diff(birthDate, 'year');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setShowDetails(null);
  };

  const handleAccept = (id) => {
    axios.put(`http://localhost:8000/api/appointments/${id}/accept`, {}, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        Accept: "application/json"
      }
    }).then(() => {
      setAppointments(prev => prev.map(appt => 
        appt.id === id ? { ...appt, status: "confirmé" } : appt
      ));
    }).catch(console.error);
  };

  const handleDecline = (id) => {
    axios.put(`http://localhost:8000/api/appointments/${id}/decline`, {}, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        Accept: "application/json"
      }
    }).then(() => {
      setAppointments(prev => prev.map(appt => 
        appt.id === id ? { ...appt, status: "annulé" } : appt
      ));
    }).catch(console.error);
  };
  
  const handleReschedule = (id) => {
    axios.put(`http://localhost:8000/api/appointments/${id}/reschedule`, {}, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        Accept: "application/json"
      }
    }).then(() => {
      setAppointments(prev => prev.map(appt => 
        appt.id === id ? { ...appt, status: "en attente" } : appt
      ));
    }).catch(console.error);
  };

  const handleComplete = (id) => {
    axios.put(`http://localhost:8000/api/appointments/${id}/complete`, {}, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        Accept: "application/json"
      }
    }).then(() => {
      setAppointments(prev => prev.map(appt => 
        appt.id === id ? { ...appt, status: "terminé" } : appt
      ));
    }).catch(console.error);
  };

  const handleSendMessage = (id) => {
    console.log(`Envoyer un message au patient du rendez-vous ${id}`);
  };

  const toggleDetails = (id) => {
    setShowDetails(showDetails === id ? null : id);
  };

  const renderAppointmentType = (type) => (
    <div className={`appointment-type ${type === "video" ? "video" : "in-person"}`}>
      <span>{type === "video" ? "Vidéo" : "En personne"}</span>
    </div>
  );

  const renderAppointmentStatus = (status) => {
    const statusMap = {
      "confirmé": { class: "confirmed", text: "Confirmé" },
      "en attente": { class: "pending", text: "En attente" },
      "terminé": { class: "completed", text: "Terminé" },
      "annulé": { class: "cancelled", text: "Annulé" }
    };
    
    const statusInfo = statusMap[status?.trim().toLowerCase()];
    return statusInfo ? <span className={`status ${statusInfo.class}`}>{statusInfo.text}</span> : null;
  };

  const renderAppointments = () => {
    const filteredAppointments = 
      activeTab === "upcoming" ? upcomingAppointments :
      activeTab === "past" ? pastAppointments :
      activeTab === "en attente" ? pendingAppointments : [];

    if (loading) return <div>Chargement des rendez-vous...</div>;
    if (filteredAppointments.length === 0) return <div className="no-appointments">Aucun rendez-vous trouvé.</div>;

    return filteredAppointments.map((appointment) => (
      <div className="appointment-card" key={appointment.id}>
        <div className="appointment-main" onClick={() => toggleDetails(appointment.id)}>
          <div className="appointment-left">
            <div className="patient-avatar">
              <UserIcon />
            </div>
            <div className="appointment-details">
              <div className="appointment-header">
                <h3 className="patient-name">
                  {appointment.patient?.nom} {appointment.patient?.prenom}
                </h3>
                {renderAppointmentStatus(appointment.status)}
              </div>
              <p className="patient-info">
                {appointment.patient?.date_naissance 
                  ? `${calculateAge(appointment.patient.date_naissance)} ans` 
                  : "Âge inconnu"}
              </p>
              {renderAppointmentType(appointment.type)}
              <p className="appointment-location">{appointment.location}</p>
              <p className="appointment-reason">{appointment.reason}</p>
            </div>
          </div>
          <div className="appointment-right">
            <div className="appointment-datetime">
              <div className="appointment-date">
                <span>{formatDate(appointment.appointment_date)}</span>
              </div>
              <div className="appointment-time">
                <span>{extractTimeFromString(appointment.appointment_time)}</span>
              </div>
            </div>
          </div>
        </div>

        {showDetails === appointment.id && (
          <div className="appointment-details-expanded">
            <div className="details-section">
              <h4>Informations patient</h4>
              <div className="details-row">
                <span className="details-label">Antécédents médicaux:</span>
                <span className="details-value">{appointment.patient?.medical_history || 'Non renseigné'}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Dernière visite:</span>
                <span className="details-value">{getLastVisit(appointment.patient?.id)}</span>
              </div>
              {appointment.notes && (
                <div className="details-row">
                  <span className="details-label">Notes:</span>
                  <span className="details-value">{appointment.notes}</span>
                </div>
              )}
            </div>

            <div className="appointment-actions">
              {appointment.status === "en attente" && activeTab === "en attente" && (
                <>
                  <button className="action-button accept" onClick={() => handleAccept(appointment.id)}>
                    Accepter
                  </button>
                  <button className="action-button decline" onClick={() => handleDecline(appointment.id)}>
                    Refuser
                  </button>
                </>
              )}

              {appointment.status === "confirmé" && activeTab === "upcoming" && (
                <>
                  <button className="action-button reschedule" onClick={() => handleReschedule(appointment.id)}>
                    Reprogrammer
                  </button>
                  {appointment.type === "video" && (
                    <button className="action-button join">Rejoindre</button>
                  )}
                  <button className="action-button message" onClick={() => handleSendMessage(appointment.id)}>
                    Message
                  </button>
                  <button className="action-button complete" onClick={() => handleComplete(appointment.id)}>
                    Terminer
                  </button>
                </>
              )}

              {["terminé", "annulé"].includes(appointment.status) && activeTab === "past" && (
                <>
                  <button className="action-button view-record">
                    <UserIcon /> Dossier médical
                  </button>
                  <button className="action-button message" onClick={() => handleSendMessage(appointment.id)}>
                    Message
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="dashboard-doctor-main-content">
      <div className="appointments-container">
        <div className="appointments-header">
          <h1>Mes Rendez-vous</h1>
          <div className="header-actions">
            {/* Boutons optionnels */}
          </div>
        </div>

        <div className="appointments-tabs">
          <button
            className={`tab-button ${activeTab === "upcoming" ? "active" : ""}`}
            onClick={() => handleTabChange("upcoming")}
          >
            À venir
          </button>
          <button 
            className={`tab-button ${activeTab === "en attente" ? "active" : ""}`} 
            onClick={() => handleTabChange("en attente")}
          >
            En attente
          </button>
          <button
            className={`tab-button ${activeTab === "past" ? "active" : ""}`}
            onClick={() => handleTabChange("past")}
          >
            Passés
          </button>
        </div>

        <div className="appointments-list-container">
          <div className="appointments-list-header">
            <h2 className="appointments-section-title">
              {activeTab === "upcoming" ? "Rendez-vous à venir confirmés" : 
               activeTab === "past" ? "Rendez-vous passés" : 
               "Rendez-vous en attente"}
            </h2>
            <p className="appointments-count">
              {`Vous avez ${activeTab === "upcoming" ? upcomingAppointments.length :
                activeTab === "past" ? pastAppointments.length :
                pendingAppointments.length} rendez-vous ${activeTab === "upcoming" ? "à venir" : 
                activeTab === "en attente" ? "en attente" : "passés"}.`}
            </p>
          </div>

          <div className="appointments-list">
            {renderAppointments()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorAppointments;