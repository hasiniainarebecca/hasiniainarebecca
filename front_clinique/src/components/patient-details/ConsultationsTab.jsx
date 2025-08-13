// src/components/patient-details/ConsultationsTab.jsx
import React, { useState } from 'react';
import { Calendar, Stethoscope, FileText, XCircle } from 'lucide-react';
import ConsultationDetailModal from './ConsultationDetailModal'; // Import the new modal component

function ConsultationsTab({ consultations }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState(null);

  const handleDetailsClick = (consultation) => {
    setSelectedConsultation(consultation);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedConsultation(null);
  };

  if (!consultations || consultations.length === 0) {
    return (
      <div className="consultations-tab-container">
        <div className="dpd-no-data-message">
          <Stethoscope size={48} />
          <p>Aucune consultation enregistrée pour ce patient.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="consultations-tab-container">
      <h3 className="dpd-section-header">
        <Stethoscope size={24} /> Consultations
      </h3>
      <table className="dpd-tab-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Motif</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {consultations.map((consultation, index) => (
            <tr key={index}> 
              <td>
                <Calendar size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> 
                {consultation.date}
              </td>
              <td className="ct-text-truncate" title={consultation.reason}>
                {consultation.reason}
              </td>
              <td className="ct-text-truncate" title={consultation.notes || 'N/A'}>
                {consultation.notes || 'N/A'}
              </td> 
              <td>
                <button 
                  className="dpd-action-button-sm ct-tooltip"
                  data-tooltip="Voir les détails de la consultation"
                  onClick={() => handleDetailsClick(consultation)}
                >
                  <FileText size={16} /> Détails
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && (
        <ConsultationDetailModal 
          consultation={selectedConsultation} 
          onClose={handleCloseModal} 
        />
      )}
    </div>
  );
}

export default ConsultationsTab;