import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './styles/DoctorPatientDetails.css';
import { User, Calendar, Stethoscope, FileText, FlaskConical, History, ArrowLeft, Info, Droplet, Syringe, Pill, MapPin, Phone, Mail } from 'lucide-react';
import dayjs from 'dayjs';

// Import des composants pour chaque onglet
import GeneralInfoTab from './components/patient-details/GeneralInfoTab';
import ConsultationsTab from './components/patient-details/ConsultationsTab';
import PrescriptionsTab from './components/patient-details/PrescriptionsTab';
import ExamsTab from './components/patient-details/ExamsTab';
import MedicalHistoryTab from './components/patient-details/MedicalHistoryTab';

function DoctorPatientDetails() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPatientDetails = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/connexion');
          return;
        }

        const response = await fetch(`http://localhost:8000/api/doctor/patients/${patientId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 403) {
            setError(errorData.message || 'Accès refusé. Ce patient n\'a pas de rendez-vous avec vous.');
          } else {
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
          }
        }

        const data = await response.json();
        setPatient(data);
        console.log("Données patient reçues:", data);
      } catch (error) {
        console.error("Failed to fetch patient details:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientDetails();
  }, [patientId, navigate]);

  const handleBack = () => {
    navigate('/dossier-patient-docteur');
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'N/A';
    return dayjs(dateString).format('DD/MM/YYYY');
  };

  if (loading) {
    return (
      <div className="patient-details-loading">
        <div className="patient-details-spinner"></div>
        <p>Chargement du dossier patient...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="patient-details-error">
        <div className="patient-details-error-content">
          <h3>Erreur</h3>
          <p>{error}</p>
          <button onClick={handleBack} className="patient-details-btn-secondary">
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="patient-details-error">
        <div className="patient-details-error-content">
          <h3>Aucun dossier trouvé</h3>
          <p>Aucun dossier patient trouvé.</p>
          <button onClick={handleBack} className="patient-details-btn-secondary">
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
          <div className="patient-details-wrapper">
            {/* Header avec bouton retour */}
            <div className="patient-details-header">
              <button className="patient-details-back-btn" onClick={handleBack}>
                <ArrowLeft size={18} />
                Retour
              </button>
              <h1 className="patient-details-page-title">Dossier Patient</h1>
            </div>

            {/* Card principale */}
            <div className="patient-details-main-card">
              {/* Header du patient */}
              <div className="patient-details-patient-header">
                <div className="patient-details-avatar-section">
                  <div className="patient-details-avatar">
                    <User size={40} />
                  </div>
                  <div className="patient-details-patient-info">
                    <h2 className="patient-details-patient-name">
                      {patient.firstName || patient.prenom} {patient.lastName || patient.nom}
                    </h2>
                    <div className="patient-details-patient-meta">
                      <span className="patient-details-meta-item">
                        <Calendar size={16} />
                        Né le: {formatDisplayDate(patient.dateOfBirth || patient.date_naissance)}
                      </span>
                      <span className="patient-details-meta-item">
                        <User size={16} />
                        Sexe: {patient.gender || patient.sexe || 'N/A'}
                      </span>
                    </div>
                    <div className="patient-details-contact-info">
                      {patient.address && (
                        <span className="patient-details-contact-item">
                          <MapPin size={14} />
                          {patient.address}
                        </span>
                      )}
                      {patient.phone && (
                        <span className="patient-details-contact-item">
                          <Phone size={14} />
                          {patient.phone}
                        </span>
                      )}
                      {patient.email && (
                        <span className="patient-details-contact-item">
                          <Mail size={14} />
                          {patient.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation des onglets */}
              <div className="patient-details-tabs-nav">
                <button
                  className={`patient-details-tab-btn ${activeTab === 'general' ? 'patient-details-tab-active' : ''}`}
                  onClick={() => setActiveTab('general')}
                >
                  <Info size={18} />
                  Général
                </button>
                <button
                  className={`patient-details-tab-btn ${activeTab === 'consultations' ? 'patient-details-tab-active' : ''}`}
                  onClick={() => setActiveTab('consultations')}
                >
                  <Stethoscope size={18} />
                  Consultations
                </button>
                <button
                  className={`patient-details-tab-btn ${activeTab === 'prescriptions' ? 'patient-details-tab-active' : ''}`}
                  onClick={() => setActiveTab('prescriptions')}
                >
                  <FileText size={18} />
                  Ordonnances
                </button>
                <button
                  className={`patient-details-tab-btn ${activeTab === 'exams' ? 'patient-details-tab-active' : ''}`}
                  onClick={() => setActiveTab('exams')}
                >
                  <FlaskConical size={18} />
                  Examens
                </button>
                <button
                  className={`patient-details-tab-btn ${activeTab === 'history' ? 'patient-details-tab-active' : ''}`}
                  onClick={() => setActiveTab('history')}
                >
                  <History size={18} />
                  Historique Médical
                </button>
              </div>

              {/* Contenu des onglets */}
              <div className="patient-details-tab-content">
                {activeTab === 'general' && <GeneralInfoTab patient={patient} />}
                {activeTab === 'consultations' && <ConsultationsTab consultations={patient.consultations} />}
                {activeTab === 'prescriptions' && <PrescriptionsTab prescriptions={patient.prescriptions} />}
                {activeTab === 'exams' && <ExamsTab exams={patient.exams} />}
                {activeTab === 'history' && <MedicalHistoryTab medicalHistory={patient.medicalHistory} />}
              </div>
            </div>
          </div>
  );
}

export default DoctorPatientDetails;