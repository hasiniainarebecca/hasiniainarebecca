// src/DemandeServiceInf.jsx
import React, { useState, useEffect } from 'react';
import './styles/DemandeServiceInf.css';
import { Calendar, X, Check, MessageSquare, CircleCheck, List, User, Clock, FileText } from 'lucide-react';
import axios from 'axios';

function DemandeServiceInf() {
  const [activeTab, setActiveTab] = useState('en-attente');
  const [allDemands, setAllDemands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDemands();
  }, [activeTab]); // Refetch when activeTab changes

  const fetchDemands = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      let statusParam = '';

      if (activeTab === 'en-attente') {
        statusParam = 'pending,accepted'; // Fetch pending and accepted for "En Attente" tab
      } else if (activeTab === 'historique') {
        statusParam = 'completed,cancelled,rejected'; // Fetch completed, cancelled, rejected for "Historique"
      }

      const response = await axios.get(`http://localhost:8000/api/nurse/service-requests?status=${statusParam}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setAllDemands(response.data);
    } catch (err) {
      console.error("Error fetching demands:", err);
      setError("Erreur lors du chargement des demandes.");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredDemands = () => {
    // With the backend now filtering by multiple statuses,
    // we can simply return allDemands as they will already be relevant to the activeTab.
    // However, the original code had explicit client-side filtering based on French status.
    // Let's keep the client-side filtering for robustness with French statuses,
    // assuming backend returns them.
    if (activeTab === 'en-attente') {
      return allDemands.filter(demand => demand.status === 'En Attente' || demand.status === 'Confirmé');
    } else if (activeTab === 'historique') {
      return allDemands.filter(demand => demand.status === 'Terminé' || demand.status === 'Annulé' || demand.status === 'Rejetée');
    }
    return [];
  };

  const handleConfirm = async (id) => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(`http://localhost:8000/api/nurse/service-requests/${id}/accept`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      alert('Demande confirmée!');
      fetchDemands(); // Refresh demands
    } catch (err) {
      console.error("Error confirming demand:", err.response ? err.response.data : err);
      alert('Erreur lors de la confirmation: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCancel = async (id) => {
    const token = localStorage.getItem('token');
    if (window.confirm("Êtes-vous sûr de vouloir annuler cette demande ?")) {
      try {
        // Nurse rejects the request, which maps to 'rejected' status
        await axios.post(`http://localhost:8000/api/nurse/service-requests/${id}/reject`, {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        alert('Demande rejetée!'); // Changed message to reflect 'rejetée'
        fetchDemands(); // Refresh demands
      } catch (err) {
        console.error("Error rejecting demand:", err.response ? err.response.data : err);
        alert('Erreur lors du rejet: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleContactPatient = (id) => {
    const demand = allDemands.find(d => d.id === id);
    if (demand && demand.patient_email) {
      window.location.href = `mailto:${demand.patient_email}`;
    } else {
      alert("Email du patient non disponible.");
    }
  };

  const handleMarkAsComplete = async (id) => {
    const token = localStorage.getItem('token');
    if (window.confirm("Marquer cette demande comme terminée ?")) {
      try {
        await axios.post(`http://localhost:8000/api/nurse/service-requests/${id}/complete`, {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        alert('Demande marquée comme terminée!');
        fetchDemands(); // Refresh demands
      } catch (err) {
        console.error("Error marking as complete:", err.response ? err.response.data : err);
        alert('Erreur lors du marquage comme terminé: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  if (loading) return <div className="demande-service-loading">Chargement des demandes...</div>;
  if (error) return <div className="demande-service-error">{error}</div>;

  const currentDemands = getFilteredDemands();

  return (
          <div className="demande-service-modern-container">
            {/* Header Section */}
            <div className="demande-service-modern-header">
              <h1 className="demande-service-modern-title">Demandes de Service</h1>
              <p className="demande-service-modern-subtitle">
                Gérez vos demandes de service et suivez leur progression
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="demande-service-modern-tabs">
              <button
                className={`demande-service-modern-tab ${activeTab === 'en-attente' ? 'demande-service-modern-tab-active' : ''}`}
                onClick={() => setActiveTab('en-attente')}
              >
                <Clock size={18} />
                En Attente
                <span className="demande-service-modern-tab-count">
                  {allDemands.filter(d => d.status === 'En Attente' || d.status === 'Confirmé').length}
                </span>
              </button>
              <button
                className={`demande-service-modern-tab ${activeTab === 'historique' ? 'demande-service-modern-tab-active' : ''}`}
                onClick={() => setActiveTab('historique')}
              >
                <FileText size={18} />
                Historique
                <span className="demande-service-modern-tab-count">
                  {allDemands.filter(d => d.status === 'Terminé' || d.status === 'Annulé' || d.status === 'Rejetée').length}
                </span>
              </button>
            </div>

            {/* Content Section */}
            <div className="demande-service-modern-content">
              <div className="demande-service-modern-section-header">
                <h2 className="demande-service-modern-section-title">
                  {activeTab === 'en-attente' ? 'Demandes Actuelles' : 'Historique des Demandes'}
                </h2>
                <div className="demande-service-modern-stats">
                  <span className="demande-service-modern-stats-text">
                    {currentDemands.length} demande{currentDemands.length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Demands List */}
              <div className="demande-service-modern-list">
                {currentDemands.length > 0 ? (
                  currentDemands.map((demand) => (
                    <div key={demand.id} className="demande-service-modern-card">
                      {/* Patient Info */}
                      <div className="demande-service-modern-patient">
                        <div className="demande-service-modern-avatar">
                          {demand.avatar || <User size={24} />}
                        </div>
                        <div className="demande-service-modern-patient-info">
                          <h3 className="demande-service-modern-patient-name">{demand.patientName}</h3>
                          <p className="demande-service-modern-patient-email">{demand.patient_email}</p>
                        </div>
                      </div>

                      {/* Service Details */}
                      <div className="demande-service-modern-details">
                        <div className="demande-service-modern-service-header">
                          <h4 className="demande-service-modern-service-name">{demand.serviceName}</h4>
                          <span className={`demande-service-modern-status demande-service-modern-status-${demand.status.toLowerCase().replace(/\s+/g, '-').replace('é', 'e')}`}>
                            {demand.status}
                          </span>
                        </div>
                        
                        <p className="demande-service-modern-professional">{demand.professionalType}</p>
                        
                        <div className="demande-service-modern-date-time">
                          <Calendar size={16} />
                          <span>{demand.requestedDate} à {demand.requestedTime}</span>
                        </div>
                        
                        {demand.reason && (
                          <div className="demande-service-modern-reason">
                            <p className="demande-service-modern-reason-text">{demand.reason}</p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="demande-service-modern-actions">
                        {demand.original_status === 'pending' && (
                          <>
                            <button 
                              className="demande-service-modern-btn demande-service-modern-btn-reject" 
                              onClick={() => handleCancel(demand.id)}
                            >
                              <X size={16} />
                              Rejeter
                            </button>
                            <button 
                              className="demande-service-modern-btn demande-service-modern-btn-confirm" 
                              onClick={() => handleConfirm(demand.id)}
                            >
                              <Check size={16} />
                              Confirmer
                            </button>
                          </>
                        )}
                        {demand.original_status === 'accepted' && (
                          <>
                            <button 
                              className="demande-service-modern-btn demande-service-modern-btn-contact" 
                              onClick={() => handleContactPatient(demand.id)}
                            >
                              <MessageSquare size={16} />
                              Contacter
                            </button>
                            <button 
                              className="demande-service-modern-btn demande-service-modern-btn-complete" 
                              onClick={() => handleMarkAsComplete(demand.id)}
                            >
                              <CircleCheck size={16} />
                              Terminer
                            </button>
                          </>
                        )}
                        {demand.original_status === 'completed' && (
                          <button className="demande-service-modern-btn demande-service-modern-btn-completed">
                            <CircleCheck size={16} />
                            Terminé
                          </button>
                        )}
                        {(demand.original_status === 'cancelled' || demand.original_status === 'rejected') && (
                          <button className="demande-service-modern-btn demande-service-modern-btn-cancelled">
                            <X size={16} />
                            {demand.status}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="demande-service-modern-empty">
                    <div className="demande-service-modern-empty-icon">
                      <List size={48} />
                    </div>
                    <h3 className="demande-service-modern-empty-title">Aucune demande</h3>
                    <p className="demande-service-modern-empty-text">
                      {activeTab === 'en-attente' 
                        ? 'Aucune demande en attente ou confirmée pour le moment.'
                        : 'Aucune demande terminée, annulée ou rejetée dans l\'historique.'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
  );
}

export default DemandeServiceInf;