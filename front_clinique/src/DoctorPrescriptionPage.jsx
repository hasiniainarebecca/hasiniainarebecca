import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { Plus, X, Save, Send, Search, User } from 'lucide-react';
import "./styles/DoctorPrescriptionPage.css";

function DoctorPrescriptionPage() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [medications, setMedications] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [notes, setNotes] = useState("");
  const [renewals, setRenewals] = useState(0);
  const [availableMedications, setAvailableMedications] = useState([]);
  const [newMedication, setNewMedication] = useState({
    name: "",
    dosage: "",
    frequency: "",
    duration: "",
  });
  const navigate = useNavigate();

  const [doctorId, setDoctorId] = useState(null); 
  const [doctor, setDoctor] = useState(null); 

  useEffect(() => {
    const fetchAvailableMedications = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/medications/available', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setAvailableMedications(response.data);
      } catch (error) {
        console.error("Erreur lors du chargement des médicaments disponibles :", error);
      }
    };

    fetchAvailableMedications();
  }, []);

  useEffect(() => {
    const fetchDoctorId = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/doctor-id', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setDoctorId(response.data.doctor_id);
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'ID du docteur:', error);
      }
    };

    fetchDoctorId();
  }, []);

  useEffect(() => {
    const fetchDoctorInfo = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/doctor/${doctorId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setDoctor(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des informations du docteur:', error);
      }
    };

    if (doctorId) {
      fetchDoctorInfo();
    }
  }, [doctorId]);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/doctor/${doctorId}/patients`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setPatients(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des patients:', error);
      }
    };

    if (doctorId) {
      fetchPatients();
    }
  }, [doctorId]);

  const sendPrescription = async () => {
    try {
      await axios.post('http://localhost:8000/api/prescriptions', {
        patient_id: selectedPatient.id,
        doctor_id: doctorId,
        notes: notes,
        renewals: renewals,
        status: "envoyé",
        medications: medications.map(med => ({
          medication_name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
        })),
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      alert("Ordonnance envoyée !");
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'ordonnance :", error);
      alert("Erreur lors de l'envoi de l'ordonnance.");
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
  
    axios.get("http://localhost:8000/api/appointments/doctor", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
      }
    })
      .then((res) => {
        setAppointments(res.data);
      })
      .catch((err) => {
        console.error("Erreur axios :", err.response?.status, err.response?.data);
      });
  }, []);

  const formatDate = (date) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString(undefined, options);
  };

  const getLastVisit = (patientId) => {
    const completedAppointments = appointments
      .filter(appt => 
        appt.patient.id === patientId &&
        appt.status?.trim().toLowerCase() === 'terminé' &&
        new Date(appt.appointment_date) < new Date()
      );
  
    if (completedAppointments.length === 0) return 'Non disponible';
  
    const sortedAppointments = completedAppointments.sort(
      (a, b) => new Date(b.appointment_date) - new Date(a.appointment_date)
    );
  
    return sortedAppointments[0].completed_at
      ? formatDate(sortedAppointments[0].completed_at)
      : formatDate(sortedAppointments[0].appointment_date);
  };

  const calculateAge = (birthDateString) => {
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setMedications([]);
  };

  const handleSaveDraft = async () => {
    if (!selectedPatient) {
      alert("Veuillez sélectionner un patient.");
      return;
    }
  
    try {
      await axios.post('http://localhost:8000/api/prescriptions', {
        patient_id: selectedPatient.id,
        doctor_id: doctorId,
        notes: notes,
        renewals: renewals,
        status: "brouillon",
        medications: medications.map(med => ({
          medication_name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
        })),
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
  
      alert("Ordonnance enregistrée comme brouillon !");
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du brouillon :", error);
      alert("Erreur lors de l'enregistrement du brouillon.");
    }
  };

  const handleAddMedication = () => {
    if (newMedication.name && newMedication.dosage) {
      setMedications([...medications, { ...newMedication, id: Date.now() }]);
      setNewMedication({
        name: "",
        dosage: "",
        frequency: "",
        duration: "",
      });
    }
  };

  const handleRemoveMedication = (id) => {
    setMedications(medications.filter(med => med.id !== id));
  };

  const filteredPatients = patients.filter(patient => 
    patient.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.prenom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="prescription-container">
      <div className="prescription-sidebar">
        <div className="search-container">
          <div className="search-input">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Rechercher un patient..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="patients-section">
          <h3>Patients</h3>
          <div className="patients-list">
            {filteredPatients.length > 0 ? (
              filteredPatients.map(patient => (
                <div 
                  key={patient.id} 
                  className={`patient-item ${selectedPatient?.id === patient.id ? 'selected' : ''}`}
                  onClick={() => handlePatientSelect(patient)}
                >
                  <div className="patient-avatar">
                    <User size={20} />
                  </div>
                  <div className="patient-info">
                    <h4>{patient.nom} {patient.prenom}</h4>
                    <p>{patient.date_naissance ? `${calculateAge(patient.date_naissance)} ans` : "Âge inconnu"}</p>
                    <p>Dernière visite : {getLastVisit(patient.id)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p>Aucun patient trouvé.</p>
            )}
          </div>
        </div>
      </div>

      <div className="prescription-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: '30px' }}>Prescription d'ordonnance</h1>
            <button 
              onClick={() => navigate('/docteur/brouillons')} 
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                marginLeft:'200px',
                transition: 'backgroundColor 0.2s',
              }}
            >
              Voir les brouillons
            </button>
            <button 
              onClick={() => navigate('/page-renouvellement-ordonnance')} 
              style={{
                marginLeft:'0px',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'white',
                color: '#4b5563',
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'backgroundColor 0.2s',
              }}
            >
              Voir la liste des renouvellement
            </button>
          </div>
        {selectedPatient ? (
          <div className="prescription-form-wrapper">
            <div className="prescription-header">
              <h1>Nouvelle ordonnance pour <br /> {selectedPatient.nom} {selectedPatient.prenom}</h1>
              <div className="prescription-meta">
                <p>Date: {new Date().toLocaleDateString()}</p>
                <p>{doctor ? `Dr. ${doctor.nom} ${doctor.prenom} • ${doctor.speciality}` : "Chargement..."}</p>
              </div>
            </div>

            <div className="prescription-form">
              <div className="medications-section">
                <h3>Médicaments prescrits</h3>

                <div className="medications-list">
                  {medications.map(med => (
                    <div key={med.id} className="medication-item">
                      <div className="medication-details">
                        <h4>{med.name} - {med.dosage}</h4>
                        <p>{med.frequency}</p>
                        <p>Durée: {med.duration}</p>
                      </div>
                      <button 
                        className="remove-medication" 
                        onClick={() => handleRemoveMedication(med.id)}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="add-medication-form">
                  <h4>Ajouter un médicament</h4>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Médicament</label>
                      <input
                        list="medication-options"
                        value={newMedication.name}
                        onChange={(e) => {
                          const [name, dosage] = e.target.value.split(" ");
                          setNewMedication({ ...newMedication, name: name || "", dosage: dosage || "" });
                        }}
                        placeholder="Choisissez ou entrez un médicament"
                      />
                      <datalist id="medication-options">
                        {availableMedications.map((med, index) => (
                          <option key={index} value={`${med.name} `} />
                        ))}
                      </datalist>
                    </div>

                    <div className="form-group">
                      <label>Dosage</label>
                      <input 
                        type="text" 
                        placeholder="ex: 250mg, 500mg, 1g"
                        value={newMedication.dosage}
                        onChange={(e) => setNewMedication({...newMedication, dosage: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Fréquence</label>
                      <input 
                        type="text" 
                        placeholder="ex: 3 fois par jour"
                        value={newMedication.frequency}
                        onChange={(e) => setNewMedication({...newMedication, frequency: e.target.value})}
                      />
                    </div>

                    <div className="form-group">
                      <label>Durée</label>
                      <input 
                        type="text" 
                        placeholder="ex: 7 jours"
                        value={newMedication.duration}
                        onChange={(e) => setNewMedication({...newMedication, duration: e.target.value})}
                      />
                    </div>
                  </div>

                  <button className="add-medication-btn" onClick={handleAddMedication}>
                    <Plus size={18} />
                    Ajouter
                  </button>
                </div>
              </div>

              <div className="prescription-options">
                <div className="form-group">
                  <label htmlFor="renewals">Nombre de renouvellements</label>
                  <select
                    type="number"
                    id="renewals"
                    value={renewals}
                    onChange={(e) => setRenewals(parseInt(e.target.value))}
                    min="0"
                  >
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Notes pour le pharmacien</label>
                  <textarea 
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ajouter des instructions spéciales pour le pharmacien..."
                  ></textarea>
                </div>
              </div>

              <div className="prescription-actions">
                <button className="action-button save" onClick={handleSaveDraft}>
                  <Save size={18} />
                  Enregistrer comme brouillon
                </button>
                <button className="action-button primary" onClick={sendPrescription}>
                  <Send size={18} />
                  Envoyer l'ordonnance
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="no-patient-selected">
            <div className="empty-state">
              <User size={48} />
              <h3>Sélectionnez un patient</h3>
              <p>Veuillez sélectionner un patient dans la liste pour créer une ordonnance.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DoctorPrescriptionPage;