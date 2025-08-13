import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./styles/NewAppointment.css";
import { UserIcon } from "./components/Icons";

const AppointmentForm = ({ onClose = () => {} }) => {
  const [step, setStep] = useState(1);
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    doctor_id: "",
    doctor_name: "",
    specialty: "",
    appointmentType: "in-person",
    date: "",
    time: "",
    reason: "",
  });

  const fetchAvailableDoctors = async () => {
    const res = await axios.get('http://127.0.0.1:8000/api/doctors/available');
    console.log(res.data);
    setDoctors(res.data);
  };

  const specialties = [
    "Cardiologie",
    "Dermatologie",
    "Médecine générale",
    "Ophtalmologie",
    "Pédiatrie",
    "Psychiatrie",
    "Radiologie",
  ];

  useEffect(() => {
    const fetchDoctors = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Aucun token trouvé, veuillez vous connecter.");
        return;
      }
      try {
        const response = await axios.get("http://127.0.0.1:8000/api/doctors", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log(response.data);
        setDoctors(response.data);
      } catch (error) {
        console.error("Erreur lors de la récupération des docteurs :", error);
      }
    };

    fetchDoctors();
  }, []);

  // Fonction pour aller à la page des rendez-vous
  const goToAppointmentList = () => {
    navigate("/patient/rendez-vous");
  };


  const handleDoctorSelect = (doctor) => {
    setFormData((prev) => ({
      ...prev,
      doctor_id: doctor.id,
      doctor_name: `${doctor.nom} ${doctor.prenom}`,
      specialty: doctor.speciality,
    }));
    setStep(2);
  };

  const handleSpecialtySelect = (specialty) => {
    setFormData((prev) => ({
      ...prev,
      specialty: specialty,
      doctor_id: "",
      doctor_name: "",
    }));
    setStep(2);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      await axios.post(
        "http://127.0.0.1:8000/api/appointments",
        {
          doctor_id: formData.doctor_id,
          appointment_date: formData.date,
          appointment_time: formData.time,
          type: formData.appointmentType,
          reason: formData.reason,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("Rendez-vous pris avec succès !");
      // Réinitialisation du formulaire
      setFormData({
        doctor_id: "",
        doctor_name: "",
        specialty: "",
        appointmentType: "in-person",
        date: "",
        time: "",
        reason: "",
      });
      setStep(1);
    } catch (error) {
      console.error("Erreur lors de la prise de rendez-vous :", error);
      alert("Erreur lors de la prise de rendez-vous");
    }
  };

  const filteredDoctors = doctors.filter((doctor) => {
    const fullName = `${doctor.nom} ${doctor.prenom}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  // Ajoute ceci dans ton renderStep1 ou directement dans le JSX de step 1
  const renderStep1 = () => (
    <div className="appointment-step">
      <h2>Choisissez un médecin</h2>

      <div className="search-container">
        <input
          type="text"
          placeholder="Rechercher un médecin"
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="appointment-actions">
        <button className="button-secondary" onClick={goToAppointmentList}>
          Voir mes rendez-vous
        </button>
      </div>

      <div className="selection-container">
        <div className="selection-column">
          <h3>Médecins</h3>
          <div className="selection-list">
          {filteredDoctors.map((doctor) => (
            <div
              key={doctor.id}
              className={`selection-item ${!doctor.is_available ? "disabled" : ""}`}
              onClick={() => doctor.is_available && handleDoctorSelect(doctor)}
            >
              <div className="doctor-avatar">
                <UserIcon />
              </div>
              <div className="selection-details">
                <div className="selection-name">
                  {doctor.nom} {doctor.prenom}
                </div>
                <div className="selection-info">{doctor.speciality}</div>
                <div className="selection-unavailable" style={{ color: doctor.is_available ? 'green' : 'red' }}>
                  {doctor.is_available ? 'Disponible' : 'Non disponible'}
                </div>
              </div>
            </div>
          ))}
            
          </div>
        </div>

        <div className="selection-column">
          <h3>Spécialités</h3>
          <div className="selection-list">
            {specialties.map((specialty) => (
              <div
                key={specialty}
                className="selection-item"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    specialty: specialty,
                    doctor_id: "",
                    doctor_name: "",
                  })) || setStep(2)
                }
              >
                <div className="selection-details">
                  <div className="selection-name">{specialty}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );


  const renderStep2 = () => {
    const filteredDoctors = doctors.filter(
      (doctor) => doctor.speciality === formData.specialty
    );

    // Obtenir la date d'aujourd'hui au format YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    return (
      <div className="appointment-step">
        <h2>Détails du rendez-vous</h2>

        <form onSubmit={handleSubmit} className="appointment-form">
          {formData.specialty && (
            <div className="form-group">
              <label htmlFor="doctor_id">Choisir un médecin</label>
              <select
                name="doctor_id"
                value={formData.doctor_id}
                onChange={(e) => {
                  const selectedDoctor = doctors.find(
                    (doc) => doc.id.toString() === e.target.value
                  );
                  setFormData((prev) => ({
                    ...prev,
                    doctor_id: selectedDoctor.id,
                    doctor_name: `${selectedDoctor.nom} ${selectedDoctor.prenom}`,
                  }));
                }}
                required
              >
                <option value="">-- Sélectionner un médecin --</option>
                {filteredDoctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.nom} {doctor.prenom}{" "}
                    {doctor.is_available ? "(Disponible)" : "(Non disponible)"}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Type de consultation</label>
            <div className="appointment-type-options">
              <label
                className={`type-option ${
                  formData.appointmentType === "in-person" ? "selected" : ""
                }`}
              >
                <input
                  type="radio"
                  name="appointmentType"
                  value="in-person"
                  checked={formData.appointmentType === "in-person"}
                  onChange={handleChange}
                />
                <span>En personne</span>
              </label>
              <label
                className={`type-option ${
                  formData.appointmentType === "video" ? "selected" : ""
                }`}
              >
                <input
                  type="radio"
                  name="appointmentType"
                  value="video"
                  checked={formData.appointmentType === "video"}
                  onChange={handleChange}
                />
                <span>Vidéo</span>
              </label>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                min={today} 
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="time">Heure</label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reason">Motif de la consultation</label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="Décrivez brièvement la raison de votre consultation"
              rows="3"
            ></textarea>
          </div>

          <div className="appointment-summary">
            <h3>Résumé</h3>
            <div className="summary-details">
              <div className="summary-row">
                <span className="summary-label">Médecin:</span>
                <span className="summary-value-nom">
                  Dr {formData.doctor_name || "Non sélectionné"}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Spécialité:</span>
                <span className="summary-value-nom">
                  {formData.specialty || "Non sélectionnée"}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Type:</span>
                <span className="summary-value-nom">
                  {formData.appointmentType === "in-person"
                    ? "En personne"
                    : "Vidéo"}
                </span>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="button-secondary" onClick={handleBack}>
              Retour
            </button>
            <button type="submit" className="button-primary">
              Confirmer le rendez-vous
            </button>
          </div>
        </form>
      </div>
    );
  };

  return (
        <div className="new-appointment-modal">
          <div className="modal-header">
            <h1>Nouveau rendez-vous</h1>
            <button className="close-button" onClick={onClose}>
              ×
            </button>
          </div>

          <div className="modal-content-modal">
            <div className="steps-indicator">
              <div className={`step ${step >= 1 ? "active" : ""}`}>
                <div className="step-number">1</div>
                <div className="step-label">Médecin</div>
              </div>
              <div className="step-connector"></div>
              <div className={`step ${step >= 2 ? "active" : ""}`}>
                <div className="step-number">2</div>
                <div className="step-label">Détails</div>
              </div>
            </div>

            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
          </div>
        </div>
        
  );
};

export default AppointmentForm;