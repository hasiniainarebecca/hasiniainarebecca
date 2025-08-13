// src/ServiceCatalogPatient.jsx
import React, { useState, useEffect } from 'react';
import './styles/ServiceCatalogPatient.css';
import { Calendar, DollarSign, Rocket, Search, User, Clock,CreditCard } from 'lucide-react';
import axios from 'axios';

// Modal pour faire une demande de service
function RequestServiceModal({ service, onClose, onSubmitRequest }) {
  const [requestedDate, setRequestedDate] = useState('');
  const [requestedTime, setRequestedTime] = useState('');
  const [reason, setReason] = useState('');

  // Obtenir la date d'aujourd'hui au format YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitRequest(service.id, { requestedDate, requestedTime, reason });
  };

  return (
    <div className="service-catalog-modal-overlay">
      <div className="service-catalog-modal-content">
        <div className="service-catalog-modal-header">
          <h2>Demander le service</h2>
          <button 
            className="service-catalog-modal-close" 
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="service-catalog-modal-body">
          <div className="service-catalog-selected-service">
            <h3>{service.title}</h3>
            <p className="service-catalog-selected-professional">
              {service.nurse ? `${service.nurse.nom} ${service.nurse.prenom} (${service.type_professional})` : service.professional}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="service-catalog-request-form">
            <div className="service-catalog-form-row">
              <div className="service-catalog-form-group">
                <label htmlFor="date">Date souhaitée *</label>
                <input
                  type="date"
                  id="date"
                  value={requestedDate}
                  onChange={(e) => setRequestedDate(e.target.value)}
                  className="service-catalog-form-input"
                  min={today} // <-- Ajout de l'attribut min ici
                  required
                />
              </div>
              <div className="service-catalog-form-group">
                <label htmlFor="time">Heure souhaitée *</label>
                <input
                  type="time"
                  id="time"
                  value={requestedTime}
                  onChange={(e) => setRequestedTime(e.target.value)}
                  className="service-catalog-form-input"
                  required
                />
              </div>
            </div>
            <div className="service-catalog-form-group">
              <label htmlFor="reason">Motif de la visite (optionnel)</label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="service-catalog-form-textarea"
                placeholder="Décrivez brièvement le motif de votre demande..."
                rows="3"
              ></textarea>
            </div>
            <div className="service-catalog-modal-actions">
              <button type="button" className="service-catalog-btn-secondary" onClick={onClose}>
                Annuler
              </button>
              <button type="submit" className="service-catalog-btn-primary">
                <Rocket size={16} />
                Envoyer la demande
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function ServiceCatalogPatient() {
  const [searchTerm, setSearchTerm] = useState('');
  const [availableServices, setAvailableServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    fetchAllServices();
  }, []);

  const fetchAllServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/services/catalog', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setAvailableServices(response.data);
    } catch (err) {
      console.error("Error fetching all services:", err);
      setError("Erreur lors du chargement des services disponibles.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestService = (service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedService(null);
  };

  const handleSubmitRequest = async (serviceId, requestData) => {
    const token = localStorage.getItem('token');
    try {
      await axios.post('http://localhost:8000/api/patient/service-requests', {
        service_id: serviceId,
        requested_date: requestData.requestedDate,
        requested_time: requestData.requestedTime,
        reason: requestData.reason,
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      alert('Demande soumise avec succès!');
      handleCloseModal();
    } catch (err) {
      console.error("Error submitting service request:", err.response ? err.response.data : err);
      alert('Erreur lors de la soumission de la demande: ' + (err.response?.data?.message || err.message));
    }
  };

  const filteredServices = availableServices.filter((service) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    // Safely access properties for filtering
    const titleMatch = service.title && service.title.toLowerCase().includes(lowerCaseSearchTerm);
    const descriptionMatch = service.description && service.description.toLowerCase().includes(lowerCaseSearchTerm);
    
    // Check if service.nurse exists, then if its properties exist, otherwise fall back to service.professional
    const professionalMatch = (service.nurse && 
      (service.nurse.nom + ' ' + service.nurse.prenom).toLowerCase().includes(lowerCaseSearchTerm)) ||
      (service.professional && service.professional.toLowerCase().includes(lowerCaseSearchTerm));
      
    // Include type_professional in the search
    const typeProfessionalMatch = service.type_professional && service.type_professional.toLowerCase().includes(lowerCaseSearchTerm);


    return titleMatch || descriptionMatch || professionalMatch || typeProfessionalMatch;
  });

  if (loading) {
    return (
      
            <div className="service-catalog-loading">
              <div className="service-catalog-loading-spinner"></div>
              <p>Chargement du catalogue des services...</p>
            </div>
          
    );
  }

  if (error) {
    return (
      
            <div className="service-catalog-error">
              <p>{error}</p>
              <button onClick={fetchAllServices} className="service-catalog-btn-primary">
                Réessayer
              </button>
            </div>
          
    );
  }

  return (

          <div className="service-catalog-page">
            <div className="service-catalog-page-header">
              <h1 className="service-catalog-page-title">Catalogue des Services Médicaux</h1>
              <p className="service-catalog-page-subtitle">
                Découvrez et demandez les services médicaux disponibles
              </p>
            </div>

            <div className="service-catalog-search-section">
              <div className="service-catalog-search-container">
                <Search size={20} className="service-catalog-search-icon" />
                <input
                  type="text"
                  placeholder="Rechercher un service, professionnel..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="service-catalog-search-input"
                />
              </div>
            </div>

            <div className="service-catalog-services-section">
              {filteredServices.length > 0 ? (
                <div className="service-catalog-services-grid">
                  {filteredServices.map((service) => (
                    <div key={service.id} className="service-catalog-service-card">
                      <div className="service-catalog-service-header">
                        <h3 className="service-catalog-service-title">{service.title}</h3>
                        <div className="service-catalog-service-professional">
                          <User size={16} />
                          <span>
                            {service.nurse 
                              ? `${service.nurse.nom} ${service.nurse.prenom} (${service.type_professional})` 
                              : service.professional
                            }
                          </span>
                        </div>
                      </div>

                      <div className="service-catalog-service-body">
                        <p className="service-catalog-service-description">
                          {service.description}
                        </p>
                        
                        <div className="service-catalog-service-details">
                          <div className="service-catalog-service-detail">
                            <Clock size={16} />
                            <span>{service.availability}</span>
                          </div>
                          <div className="service-catalog-service-detail">
                            <CreditCard size={16} />
                            <span className="service-catalog-service-price">{service.price}</span>
                          </div>
                        </div>
                      </div>

                      <div className="service-catalog-service-footer">
                        <button
                          className="service-catalog-request-btn"
                          onClick={() => handleRequestService(service)}
                        >
                          <Rocket size={16} />
                          Faire une demande
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="service-catalog-no-results">
                  <div className="service-catalog-no-results-icon">
                    <Search size={48} />
                  </div>
                  <h3>Aucun service trouvé</h3>
                  <p>
                    {searchTerm 
                      ? `Aucun service ne correspond à votre recherche "${searchTerm}".`
                      : "Aucun service n'est disponible pour le moment."
                    }
                  </p>
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="service-catalog-btn-secondary"
                    >
                      Voir tous les services
                    </button>
                  )}
                </div>
              )}
            </div>

            {isModalOpen && selectedService && (
              <RequestServiceModal
                service={selectedService}
                onClose={handleCloseModal}
                onSubmitRequest={handleSubmitRequest}
              />
            )}
          </div>
        
  );
}

export default ServiceCatalogPatient;