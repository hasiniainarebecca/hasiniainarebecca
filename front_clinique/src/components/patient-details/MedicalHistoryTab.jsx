// src/components/patient-details/MedicalHistoryTab.jsx
import React from 'react';
import { History, Calendar, FileWarning } from 'lucide-react';

function MedicalHistoryTab({ medicalHistory }) {
  if (!medicalHistory || medicalHistory.length === 0) {
    return (
      <div className="patient-details-no-data">
        <FileWarning size={48} />
        <p>Aucun historique médical enregistré pour ce patient.</p>
      </div>
    );
  }

  return (
    <div className="patient-details-tab-content">
      <h3 className="patient-details-section-title">
        <History size={20} /> Historique Médical
      </h3>
      <ul className="patient-details-data-list">
        {medicalHistory.map((item, index) => (
          <li key={index} className="patient-details-history-item">
            <div className="patient-details-history-header">
              <Calendar size={16} />
              <strong>Année: {item.year}</strong>
            </div>
            <p className="patient-details-history-content">{item.event}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MedicalHistoryTab;