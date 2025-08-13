import { useState, useEffect } from "react";
import axios from "axios";
import dayjs from "dayjs";
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Configuration des plugins DayJS
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

import { useNavigate } from "react-router-dom";
import "./styles/AppointmentList.css";
import { UserIcon } from "./components/Icons";

const AppointmentList = () => {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fonction pour extraire l'heure sans conversion de fuseau
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

  // Fonction pour parser les dates en UTC
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
    const fetchAppointments = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/appointments/liste", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            Accept: "application/json"
          },
        });

        // Debug: Afficher les premières données reçues
        if (res.data.length > 0) {
          console.log('Données reçues:', {
            id: res.data[0].id,
            original_time: res.data[0].appointment_time,
            extracted_time: extractTimeFromString(res.data[0].appointment_time)
          });
        }

        setAppointments(res.data);
      } catch (err) {
        console.error("Erreur de récupération des rendez-vous :", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const now = dayjs().utc();

  const upcomingAppointments = appointments.filter((appt) => {
    const appointmentDateTime = parseAppointmentDateTime(appt);
    return appointmentDateTime.isValid() && 
           appointmentDateTime.isSameOrAfter(now, 'minute');
  });

  const pastAppointments = appointments.filter((appt) => {
    const appointmentDateTime = parseAppointmentDateTime(appt);
    return appointmentDateTime.isValid() && 
           appointmentDateTime.isBefore(now, 'minute');
  });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleJoinMeeting = (id) => {
    console.log(`Joining video meeting for appointment ${id}`);
  };

  const handleSendMessage = (id) => {
    console.log(`Sending message for appointment ${id}`);
  };

  const handleNewAppointmentClick = () => {
    navigate("/appointments");
  };

  const renderAppointmentType = (type) => (
    <div className={`appointment-type ${type === "video" ? "video" : "in-person"}`}>
      <span>{type === "video" ? "Vidéo" : "En personne"}</span>
    </div>
  );

  const formatDate = (dateInput) => {
    const parsedDate = dayjs(dateInput);
    return parsedDate.isValid() ? parsedDate.format('DD/MM/YYYY') : 'Date invalide';
  };

  const renderAppointments = () => {
    const filteredAppointments = activeTab === "upcoming"
      ? upcomingAppointments
      : pastAppointments;

    if (loading) return <div>Chargement des rendez-vous...</div>;
    if (filteredAppointments.length === 0) {
      return (
        <div className="no-appointments">
          <p>Aucun rendez-vous {activeTab === "upcoming" ? "à venir" : "passé"}</p>
        </div>
      );
    }

    return filteredAppointments.map((appointment) => (
      <div className="appointment-card" key={appointment.id}>
        <div className="appointment-left">
          <div className="doctor-avatar">
            <UserIcon />
          </div>
          <div className="appointment-details">
            <h3 className="doctor-name">
              Dr {appointment.doctor?.nom && appointment.doctor?.prenom
                ? `${appointment.doctor.nom} ${appointment.doctor.prenom}`
                : "Docteur inconnu"}
            </h3>
            <p className="doctor-specialty">
              {appointment.doctor?.speciality || "Spécialité inconnue"}
            </p>
            {renderAppointmentType(appointment.type)}
          </div>
        </div>
        <div className="appointment-right">
          <div className="appointment-datetime">
            <div className="appointment-date">
              <span>{formatDate(appointment.appointment_date)}</span>
            </div>
            <div className="appointment-time">
              {/* Utilisation de la fonction extractTimeFromString */}
              <span>{extractTimeFromString(appointment.appointment_time)}</span>
            </div>
            <div className="appointment-status">
              <span className={`status ${appointment.status}`}>
                {appointment.status}
              </span>
            </div>
          </div>
          <div className="appointment-actions">
            {/* {appointment.type === "video" && activeTab === "upcoming" && (
              <button className="join-button" onClick={() => handleJoinMeeting(appointment.id)}>
                Rejoindre
              </button>
            )} */}
            <button className="message-button" onClick={() => handleSendMessage(appointment.id)}>
              Message
            </button>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="appointments-container">
      <div className="appointments-header">
        <h1>Mes Rendez-vous</h1>
        <button className="new-appointment-button" onClick={handleNewAppointmentClick}>
          <span className="plus-icon">+</span>
          Nouveau rendez-vous
        </button>
      </div>

      <div className="appointments-tabs">
        <button
          className={`tab-button ${activeTab === "upcoming" ? "active" : ""}`}
          onClick={() => handleTabChange("upcoming")}
        >
          À venir
        </button>
        <button
          className={`tab-button ${activeTab === "past" ? "active" : ""}`}
          onClick={() => handleTabChange("past")}
        >
          Passés
        </button>
      </div>

      <div className="appointments-list-container">
        <h2 className="appointments-section-title">
          Rendez-vous {activeTab === "upcoming" ? "à venir" : "passés"}
        </h2>
        
        <div className="appointments-list">{renderAppointments()}</div>
      </div>
    </div>
  );
};

export default AppointmentList;