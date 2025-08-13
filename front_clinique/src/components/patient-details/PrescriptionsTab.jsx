// src/components/patient-details/PrescriptionsTab.jsx
import React, { useState } from 'react';
import { FileText, Calendar, Pill, Clock, AlertCircle } from 'lucide-react';
import PrescriptionDetailModal from './PrescriptionDetailModal'; // Import the new modal component

function PrescriptionsTab({ prescriptions }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  const handleViewPrescriptionClick = (prescription) => {
    setSelectedPrescription(prescription);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPrescription(null);
  };

  if (!prescriptions || prescriptions.length === 0) {
    return (
      <div className="dpd-no-data-message">
        <FileText size={48} />
        <p>Aucune ordonnance enregistrée pour ce patient.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="dpd-section-header">
        <FileText size={24} /> Ordonnances
      </h3>
      <table className="dpd-tab-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Notes</th>
            <th>Statut</th>
            <th>Renouvellements</th>
            <th>Médicaments</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {prescriptions.map(prescription => (
            <tr key={prescription.id}>
              <td><Calendar size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> {prescription.date}</td>
              <td>{prescription.notes || 'N/A'}</td>
              <td>{prescription.status}</td>
              <td>{prescription.renewals !== null ? prescription.renewals : 'N/A'}</td>
              <td>
                {prescription.medications && prescription.medications.length > 0 ? (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {prescription.medications.map(medication => (
                      <li key={medication.id} style={{ marginBottom: '5px' }}>
                        <Pill size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                        {medication.medication_name} ({medication.dosage}, {medication.frequency}, {medication.duration})
                      </li>
                    ))}
                  </ul>
                ) : (
                  'Aucun médicament'
                )}
              </td>
              <td>
                <button 
                  className="dpd-action-button-sm"
                  onClick={() => handleViewPrescriptionClick(prescription)}
                >
                  <AlertCircle size={16} /> Voir Ordonnance
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && (
        <PrescriptionDetailModal 
          prescription={selectedPrescription} 
          onClose={handleCloseModal} 
        />
      )}
    </div>
  );
}

export default PrescriptionsTab;