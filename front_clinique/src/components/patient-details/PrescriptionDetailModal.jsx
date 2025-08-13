// src/components/patient-details/PrescriptionDetailModal.jsx
import React from 'react'; // Re-using the same modal styles
import { X, Calendar, NotepadText, AlertCircle, Pill, Repeat } from 'lucide-react';

function PrescriptionDetailModal({ prescription, onClose }) {
  if (!prescription) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Détails de l'Ordonnance</h2>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="section">
            <h3><Calendar size={18} /> Date de l'Ordonnance</h3>
            <p>{prescription.date}</p>
          </div>

          <div className="section">
            <h3><NotepadText size={18} /> Notes Générales</h3>
            <p>{prescription.notes || 'Aucune note spécifique'}</p>
          </div>

          <div className="section">
            <h3><AlertCircle size={18} /> Statut</h3>
            <p>{prescription.status}</p>
          </div>

          <div className="section">
            <h3><Repeat size={18} /> Renouvellements</h3>
            <p>{prescription.renewals !== null ? prescription.renewals : 'N/A'}</p>
          </div>

          <div className="section">
            <h3><Pill size={18} /> Médicaments Prescrits</h3>
            {prescription.medications && prescription.medications.length > 0 ? (
              <ul className="dpd-data-list">
                {prescription.medications.map(medication => (
                  <li key={medication.id} className="medication-item">
                    <strong>{medication.medication_name}</strong>
                    <p>Dosage: {medication.dosage}</p>
                    <p>Fréquence: {medication.frequency}</p>
                    <p>Durée: {medication.duration}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Aucun médicament listé pour cette ordonnance.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrescriptionDetailModal;