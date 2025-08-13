import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/PatientProfileStyling.css';
import {
  User, Cake, MapPin, Phone, Mail, Droplet,
  Syringe, Stethoscope, BriefcaseMedical, Edit, Trash2, CalendarDays, Info, Pill,
  HeartPulse // For chronic conditions
} from 'lucide-react';
import MedicalHistoryTab from './components/patient-details/MedicalHistoryTab';
import ExamsTab from './components/patient-details/ExamsTab';

function PatientProfile() {
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPatientProfile = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/connexion');
          return;
        }

        const response = await fetch('http://localhost:8000/api/patient/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 403) {
            setError('Accès refusé. Vous n\'êtes pas autorisé à voir ce profil.');
          } else {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        }

        const data = await response.json();
        setPatient(data);
        setLoading(false);
      } catch (err) {
        console.error("Erreur lors de la récupération du profil patient:", err);
        setError(`Échec du chargement du profil: ${err.message}`);
        setLoading(false);
      }
    };

    fetchPatientProfile();
  }, [navigate]);

  const handleDeleteProfile = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer votre profil? Cette action est irréversible.')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8000/api/patient/delete-profile', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        localStorage.removeItem('token');
        alert('Votre profil a été supprimé avec succès.');
        navigate('/connexion');
      } catch (error) {
        console.error("Erreur lors de la suppression du profil:", error);
        alert(`Échec de la suppression du profil: ${error.message}`);
      }
    }
  };

  const handleEditProfile = () => {
    navigate('/edit-patient-profile');
  };

  if (loading) {
    return (
      <div className="patient-profile-wrapper">
        <div className="patient-profile-loading">
          <div className="patient-profile-spinner"></div>
          <p>Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="patient-profile-wrapper">
        <div className="patient-profile-error">
          <p>Erreur: {error}</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (

      <div className="patient-profile-wrapper">
        <div className="patient-profile-error">
          <p>Aucune donnée de patient disponible.</p>
        </div>
      </div>
    );
  }

  // Fonction utilitaire pour formatter la date de naissance
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('fr-FR', options);
    } catch (e) {
      return 'Date invalide';
    }
  };

  // Fonction pour obtenir les initiales du nom
  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <div className="patient-profile-wrapper">
      <div className="patient-profile-container">
        {/* Header avec nom et avatar */}
        <div className="patient-profile-header">
          <div className="patient-profile-avatar">
            {getInitials(patient.firstName, patient.lastName)}
          </div>
          <div className="patient-profile-title">
            <h1>{patient.firstName} {patient.lastName}</h1>
            <p>Profil Patient</p>
          </div>
          <div className="patient-profile-header-actions">
            <button 
              className="patient-profile-btn patient-profile-btn-edit" 
              onClick={handleEditProfile}
            >
              <Edit size={18} />
              Modifier
            </button>
          </div>
        </div>

        {/* Grille des informations */}
        <div className="patient-profile-grid">
          {/* Informations Personnelles */}
          <div className="patient-profile-card">
            <div className="patient-profile-card-header">
              <Info size={20} />
              <h3>Informations Personnelles</h3>
            </div>
            <div className="patient-profile-card-content">
              <div className="patient-profile-info-item">
                <div className="patient-profile-info-label">
                  <Cake size={16} />
                  Date de Naissance
                </div>
                <div className="patient-profile-info-value">
                  {formatDate(patient.dateOfBirth)}
                </div>
              </div>
              <div className="patient-profile-info-item">
                <div className="patient-profile-info-label">
                  <User size={16} />
                  Sexe
                </div>
                <div className="patient-profile-info-value">
                  {patient.gender || 'Non spécifié'}
                </div>
              </div>
              <div className="patient-profile-info-item">
                <div className="patient-profile-info-label">
                  <MapPin size={16} />
                  Adresse
                </div>
                <div className="patient-profile-info-value">
                  {patient.address || 'Non spécifiée'}
                </div>
              </div>
              <div className="patient-profile-info-item">
                <div className="patient-profile-info-label">
                  <Phone size={16} />
                  Téléphone
                </div>
                <div className="patient-profile-info-value">
                  {patient.phone || 'Non spécifié'}
                </div>
              </div>
              <div className="patient-profile-info-item">
                <div className="patient-profile-info-label">
                  <Mail size={16} />
                  Email
                </div>
                <div className="patient-profile-info-value">
                  {patient.email || 'Non spécifié'}
                </div>
              </div>
            </div>
          </div>

          {/* Informations Médicales */}
          <div className="patient-profile-card">
            <div className="patient-profile-card-header">
              <BriefcaseMedical size={20} />
              <h3>Informations Médicales</h3>
            </div>
            <div className="patient-profile-card-content">
              <div className="patient-profile-info-item">
                <div className="patient-profile-info-label">
                  <Droplet size={16} />
                  Groupe Sanguin
                </div>
                <div className="patient-profile-info-value">
                  {patient.bloodType || 'Non spécifié'}
                </div>
              </div>
              <div className="patient-profile-info-item">
                <div className="patient-profile-info-label">
                  <Syringe size={16} />
                  Allergies
                </div>
                <div className="patient-profile-info-value">
                  {patient.allergies || 'Aucune'}
                </div>
              </div>
              <div className="patient-profile-info-item">
                <div className="patient-profile-info-label">
                  <HeartPulse size={16} />
                  Conditions Chroniques
                </div>
                <div className="patient-profile-info-value">
                  {patient.chronicConditions || 'Aucune'}
                </div>
              </div>
              <div className="patient-profile-info-item">
                <div className="patient-profile-info-label">
                  <Pill size={16} />
                  Médicaments Actuels
                </div>
                <div className="patient-profile-info-value">
                  {patient.currentMedications && patient.currentMedications.length > 0
                    ? patient.currentMedications.join(', ')
                    : 'Aucun'}
                </div>
              </div>
            </div>
          </div>

          {/* Rendez-vous */}
          <div className="patient-profile-card patient-profile-card-full">
            <div className="patient-profile-card-header">
              <CalendarDays size={20} />
              <h3>Rendez-vous</h3>
            </div>
            <div className="patient-profile-card-content">
              <div className="patient-profile-appointments">
                <div className="patient-profile-appointment-item">
                  <div className="patient-profile-info-label">
                    <CalendarDays size={16} />
                    Dernière Visite
                  </div>
                  <div className="patient-profile-info-value">
                    {patient.lastVisit ? (
                      <div>
                        <div>Le {patient.lastVisit.date} à {patient.lastVisit.time}</div>
                        <div className="patient-profile-appointment-details">
                          Dr. {patient.lastVisit.doctor} - {patient.lastVisit.reason || 'Non spécifié'}
                        </div>
                      </div>
                    ) : (
                      'Aucune'
                    )}
                  </div>
                </div>
                <div className="patient-profile-appointment-item">
                  <div className="patient-profile-info-label">
                    <CalendarDays size={16} />
                    Prochain Rendez-vous
                  </div>
                  <div className="patient-profile-info-value">
                    {patient.nextAppointment ? (
                      <div>
                        <div>Le {patient.nextAppointment.date} à {patient.nextAppointment.time}</div>
                        <div className="patient-profile-appointment-details">
                          Dr. {patient.nextAppointment.doctor} - {patient.nextAppointment.type}
                        </div>
                        <div className="patient-profile-appointment-status">
                          Statut: {patient.nextAppointment.status}
                        </div>
                      </div>
                    ) : (
                      'Aucun'
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Intégration des nouveaux onglets d'affichage */}
        <div className="patient-profile-tabs">
          <MedicalHistoryTab medicalHistory={patient.medicalHistory} />
          <ExamsTab exams={patient.exams} />
        </div>

        {/* Actions */}
        <div className="patient-profile-actions">
          <button 
            className="patient-profile-btn patient-profile-btn-delete" 
            onClick={handleDeleteProfile}
          >
            <Trash2 size={18} />
            Supprimer le Profil
          </button>
        </div>
      </div>
    </div>

  );
}

export default PatientProfile;