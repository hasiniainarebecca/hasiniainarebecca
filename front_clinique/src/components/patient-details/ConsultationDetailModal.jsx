// src/components/patient-details/ConsultationDetailModal.jsx
import React from 'react';
 // Re-using the same modal styles
import { X, Calendar, Info, NotepadText, Lightbulb } from 'lucide-react';

function ConsultationDetailModal({ consultation, onClose }) {
  if (!consultation) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Détails de la Consultation</h2>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="section">
            <h3><Calendar size={18} /> Date de la Consultation</h3>
            <p>{consultation.date}</p>
          </div>

          <div className="section">
            <h3><Info size={18} /> Motif de la Consultation</h3>
            <p>{consultation.reason || 'Non spécifié'}</p>
          </div>

          <div className="section">
            <h3><Lightbulb size={18} /> Diagnostic</h3>
            <p>{consultation.diagnosis || 'Aucun diagnostic enregistré'}</p>
          </div>

          <div className="section">
            <h3><NotepadText size={18} /> Notes du Docteur</h3>
            <p>{consultation.notes || 'Aucune note enregistrée'}</p>
          </div>

          {/* You can add more consultation details here if available, e.g., prescriptions linked to this consultation */}
        </div>
      </div>
    </div>
  );
}

export default ConsultationDetailModal;