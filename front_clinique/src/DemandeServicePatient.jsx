// src/DemandeServicePatient.jsx
import React, { useState, useEffect } from 'react';
import './styles/DemandeServicePatient.css';
import { Calendar, MessageSquare, CircleCheck, X, History, Clock, User, FileText } from 'lucide-react';
import axios from 'axios';

function DemandeServicePatient() {
  const [activeTab, setActiveTab] = useState('en-attente');
  const [allPatientDemands, setAllPatientDemands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPatientDemands();
  }, [activeTab]); // Refetch when activeTab changes

  const fetchPatientDemands = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      let statusParam = '';

      if (activeTab === 'en-attente') {
        statusParam = 'pending,rejected'; // Patient sees pending and rejected in 'en-attente'
      } else if (activeTab === 'confirmées') {
        statusParam = 'accepted'; // Patient sees only accepted in 'confirmées'
      } else if (activeTab === 'historique') {
        statusParam = 'completed,cancelled'; // Patient sees completed and cancelled in 'historique'
      }

      const response = await axios.get(`http://localhost:8000/api/patient/service-requests?status=${statusParam}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setAllPatientDemands(response.data);
    } catch (err) {
      console.error("Error fetching patient demands:", err);
      setError("Erreur lors du chargement de vos demandes.");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredPatientDemands = () => {
    // With the backend now filtering by multiple statuses,
    // we can simply return allPatientDemands as they will already be relevant to the activeTab.
    // However, the original code had explicit client-side filtering based on French status.
    // Let's keep the client-side filtering for robustness with French statuses,
    // assuming backend returns them.
    if (activeTab === 'en-attente') {
      return allPatientDemands.filter(demand => demand.status === 'En Attente' || demand.status === 'Rejetée');
    } else if (activeTab === 'confirmées') {
      return allPatientDemands.filter(demand => demand.status === 'Confirmé');
    } else if (activeTab === 'historique') {
      return allPatientDemands.filter(demand => demand.status === 'Terminé' || demand.status === 'Annulé');
    }
    return [];
  };

  const handleCancelDemand = async (id) => {
    const token = localStorage.getItem('token');
    if (window.confirm("Êtes-vous sûr de vouloir annuler cette demande ?")) {
      try {
        await axios.post(`http://localhost:8000/api/patient/service-requests/${id}/cancel`, {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        alert('Demande annulée avec succès!');
        fetchPatientDemands(); // Refresh demands
      } catch (err) {
        console.error("Error cancelling demand:", err.response ? err.response.data : err);
        alert('Erreur lors de l\'annulation: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleViewDetails = (id) => {
    // Implement logic to view details of a service request
    console.log("Viewing details for demand ID:", id);
    alert(`Détails de la demande ${id} (À implémenter)`);
  };

  if (loading) return <div className="demande-service-loading">Chargement des demandes...</div>;
  if (error) return <div className="demande-service-error">{error}</div>;

  const currentPatientDemands = getFilteredPatientDemands();

  return (

          <div className="demande-service-patient-wrapper">
            <div className="demande-service-patient-header">
              <h1 className="demande-service-main-title">Mes Demandes de Service</h1>
            </div>
            
            <div className="demande-service-patient-content">
              <div className="demande-service-tab-navigation">
                <button
                  className={`demande-service-tab-button ${activeTab === 'confirmées' ? 'demande-service-tab-active' : ''}`}
                  onClick={() => setActiveTab('confirmées')}
                >
                  <CircleCheck size={18} />
                  Confirmées
                </button>
                <button
                  className={`demande-service-tab-button ${activeTab === 'en-attente' ? 'demande-service-tab-active' : ''}`}
                  onClick={() => setActiveTab('en-attente')}
                >
                  <Clock size={18} />
                  En Attente
                </button>
                <button
                  className={`demande-service-tab-button ${activeTab === 'historique' ? 'demande-service-tab-active' : ''}`}
                  onClick={() => setActiveTab('historique')}
                >
                  <History size={18} />
                  Historique
                </button>
              </div>

              <div className="demande-service-section">
                <div className="demande-service-section-header">
                  <h2 className="demande-service-section-title">{
                    activeTab === 'en-attente' ? 'Mes Demandes en Attente' :
                    activeTab === 'confirmées' ? 'Mes Demandes Confirmées' :
                    'Historique de mes Demandes'
                  }</h2>
                </div>
                
                <div className="demande-service-demands-container">
                  {currentPatientDemands.length > 0 ? (
                    currentPatientDemands.map((demand) => (
                      <div key={demand.id} className="demande-service-demand-card">
                        <div className="demande-service-card-header">
                          <div className="demande-service-card-title-section">
                            <h3 className="demande-service-card-title">{demand.serviceName}</h3>
                            <p className="demande-service-card-subtitle">{demand.professionalType}</p>
                          </div>
                          <span className={`demande-service-status-badge demande-service-status-${demand.status.toLowerCase().replace(' ', '-').replace('é', 'e').replace('è', 'e')}`}>
                            {demand.status}
                          </span>
                        </div>
                        
                        <div className="demande-service-card-content">
                          <div className="demande-service-card-info-row">
                            <User size={16} className="demande-service-icon" />
                            <span className="demande-service-info-label">Professionnel:</span>
                            <span className="demande-service-info-value">{demand.provider}</span>
                          </div>
                          
                          <div className="demande-service-card-info-row">
                            <Calendar size={16} className="demande-service-icon" />
                            <span className="demande-service-info-label">Date prévue:</span>
                            <span className="demande-service-info-value">{demand.scheduledDate}</span>
                          </div>
                          
                          {demand.notes && (
                            <div className="demande-service-card-notes">
                              <FileText size={16} className="demande-service-icon" />
                              <span className="demande-service-notes-content">{demand.notes}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="demande-service-card-actions">
                          {demand.original_status === 'pending' && (
                            <button 
                              className="demande-service-btn demande-service-btn-cancel" 
                              onClick={() => handleCancelDemand(demand.id)}
                            >
                              <X size={16} />
                              Annuler la demande
                            </button>
                          )}
                          {demand.original_status === 'accepted' && (
                            <button 
                              className="demande-service-btn demande-service-btn-details" 
                              onClick={() => handleViewDetails(demand.id)}
                            >
                              <MessageSquare size={16} />
                              Voir détails
                            </button>
                          )}
                          {demand.original_status === 'completed' && (
                            <button 
                              className="demande-service-btn demande-service-btn-completed" 
                              onClick={() => handleViewDetails(demand.id)}
                            >
                              <CircleCheck size={16} />
                              Terminé
                            </button>
                          )}
                          {(demand.original_status === 'cancelled' || demand.original_status === 'rejected') && (
                            <button 
                              className="demande-service-btn demande-service-btn-disabled" 
                              onClick={() => handleViewDetails(demand.id)}
                            >
                              <X size={16} />
                              {demand.status}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="demande-service-empty-state">
                      <div className="demande-service-empty-icon">
                        <History size={64} />
                      </div>
                      <h3 className="demande-service-empty-title">Aucune demande trouvée</h3>
                      <p className="demande-service-empty-subtitle">
                        Vous n'avez aucune demande dans cette catégorie pour le moment.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
  );
}

export default DemandeServicePatient;