// src/components/patient-details/GeneralInfoTab.jsx
import React from 'react';
import { Cake, MapPin, Phone, Mail, Droplet, Syringe, Stethoscope, Pill } from 'lucide-react';

function GeneralInfoTab({ patient }) {
  if (!patient) return <p>Chargement des informations générales...</p>;

  return (
    <div className="dpd-tab-section">
      <div className="dpd-info-grid">
        <div className="dpd-info-item">
          <strong><Cake size={18} /> Date de Naissance:</strong>
          <span>{patient.dateOfBirth || 'N/A'}</span>
        </div>
        <div className="dpd-info-item">
          <strong><MapPin size={18} /> Adresse:</strong>
          <span>{patient.address || 'N/A'}</span>
        </div>
        <div className="dpd-info-item">
          <strong><Phone size={18} /> Téléphone:</strong>
          <span>{patient.phone || 'N/A'}</span>
        </div>
        <div className="dpd-info-item">
          <strong><Mail size={18} /> Email:</strong>
          <span>{patient.email || 'N/A'}</span>
        </div>
        <div className="dpd-info-item">
          <strong><Droplet size={18} /> Groupe Sanguin:</strong>
          <span>{patient.bloodType || 'N/A'}</span>
        </div>
        <div className="dpd-info-item">
          <strong><Syringe size={18} /> Allergies:</strong>
          <span>{(patient.allergies && patient.allergies.length > 0) ? patient.allergies.join(', ') : 'Aucune'}</span>
        </div>
        <div className="dpd-info-item">
          <strong><Stethoscope size={18} /> Maladies Chroniques:</strong>
          <span>{(patient.chronicConditions && patient.chronicConditions.length > 0) ? patient.chronicConditions.join(', ') : 'Aucune'}</span>
        </div>
        <div className="dpd-info-item">
          <strong><Pill size={18} /> Médicaments Actuels:</strong>
          {/* Affiche une liste de médicaments si c'est un tableau, sinon le texte brut */}
          {Array.isArray(patient.currentMedications) && patient.currentMedications.length > 0 ? (
            <ul>
              {patient.currentMedications.map((med, index) => (
                <li key={index}>{med}</li>
              ))}
            </ul>
          ) : (
            <span>{patient.currentMedications || 'Aucun'}</span>
          )}
        </div>
      </div>
      {/* Vous pouvez ajouter Dernière Visite et Prochain Rendez-vous ici aussi si nécessaire */}
       <div className="dpd-info-grid">
            <div className="dpd-info-item">
              <strong>Dernière Visite:</strong>
              <span>{patient.lastVisit || 'Aucun rendez-vous'}</span>
            </div>
            <div className="dpd-info-item">
              <strong>Prochain Rendez-vous:</strong>
              <span>{patient.nextAppointment || 'Aucun rendez-vous'}</span>
            </div>
        </div>
    </div>
  );
}

export default GeneralInfoTab;
