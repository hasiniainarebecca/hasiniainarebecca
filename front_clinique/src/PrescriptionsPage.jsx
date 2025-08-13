// PrescriptionsPage.jsx
import { useState, useEffect } from 'react'
import axios from 'axios';
import { Download, FileText, Calendar } from 'lucide-react'
import PrescriptionCard from './components/PrescriptionCard';
import "./styles/PrescriptionsPage.css"

function PrescriptionsPage() {
  const [activeTab, setActiveTab] = useState('actives');
  const [prescriptions, setPrescriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    if (!storedUser || !token) {
      console.error("Utilisateur non connecté");
      setIsLoading(false);
      return;
    }

    const patientId = storedUser.id;

    axios.get(`http://localhost:8000/api/prescriptions/patient/${patientId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    })
    .then(response => {
      setPrescriptions(response.data);
      setIsLoading(false);
    })
    .catch(error => {
      console.error('Erreur lors de la récupération des ordonnances :', error);
      setIsLoading(false);
    });
  }, []);

  function getExpiryDate(prescription) {
    const createdAt = new Date(prescription.created_at);
    const durations = prescription.medications
      .map(m => parseInt(m.duration))
      .filter(d => !isNaN(d));
    const duration = durations.length > 0 ? Math.max(...durations) : 0;
    return new Date(createdAt.getTime() + duration * 24 * 60 * 60 * 1000);
  }

  const now = new Date();

  const activePrescriptions = prescriptions.filter(p => {
    const expiry = getExpiryDate(p);
    return p.status !== 'brouillon' && expiry >= now;
  });
  
  const expiredPrescriptions = prescriptions.filter(p => {
    const expiry = getExpiryDate(p);
    return p.status !== 'brouillon' && expiry < now;
  });
  
  return (
    <div className="patient-prescriptions-container">
      <div className="patient-prescriptions-header">
        <h1 className="patient-prescriptions-title">Mes Ordonnances</h1>
        
        <div className="patient-prescriptions-tabs">
          <button 
            className={`patient-prescriptions-tab ${activeTab === 'actives' ? 'active' : ''}`}
            onClick={() => setActiveTab('actives')}
          >
            Actives
          </button>
          <button 
            className={`patient-prescriptions-tab ${activeTab === 'expired' ? 'active' : ''}`}
            onClick={() => setActiveTab('expired')}
          >
            Expirées
          </button>
        </div>
      </div>
      
      <div className="patient-prescriptions-content-wrapper">
        {isLoading ? (
          <div className="patient-prescriptions-loading">
            <div className="patient-prescriptions-spinner"></div>
            <p>Chargement des ordonnances...</p>
          </div>
        ) : (
          <>
            {activeTab === 'actives' && (
              <div className="patient-prescriptions-section">
                <h2 className="patient-prescriptions-subtitle">Ordonnances actives</h2>
                <p className="patient-prescriptions-count">Vous avez {activePrescriptions.length} ordonnances actives.</p>
                {activePrescriptions.length > 0 ? (
                  <div className="patient-prescriptions-list">
                    {activePrescriptions.map(prescription => (
                      <PrescriptionCard key={prescription.id} prescription={prescription} />
                    ))}
                  </div>
                ) : (
                  <div className="patient-prescriptions-empty">
                    <FileText size={48} className="patient-prescriptions-empty-icon" />
                    <p>Aucune ordonnance active</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'expired' && (
              <div className="patient-prescriptions-section">
                <h2 className="patient-prescriptions-subtitle">Ordonnances expirées</h2>
                <p className="patient-prescriptions-count">Vous avez {expiredPrescriptions.length} ordonnances expirées.</p>
                {expiredPrescriptions.length > 0 ? (
                  <div className="patient-prescriptions-list">
                    {expiredPrescriptions.map(prescription => (
                      <PrescriptionCard key={prescription.id} prescription={prescription} />
                    ))}
                  </div>
                ) : (
                  <div className="patient-prescriptions-empty">
                    <FileText size={48} className="patient-prescriptions-empty-icon" />
                    <p>Aucune ordonnance expirée</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default PrescriptionsPage;