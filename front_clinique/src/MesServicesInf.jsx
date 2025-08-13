// src/MesServicesInf.jsx
import React, { useState, useEffect } from 'react';
import "./styles/MesServicesInf.css";
import AddServiceModal from './AjoutNouvServiceInf'; // Make sure this path is correct
import { Plus, Clock, DollarSign, Edit, Trash2, Settings, Users, Calendar,CreditCard } from 'lucide-react'; // Import Lucide icons
import axios from 'axios'; // Import axios for API calls

function MesServicesInf() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState(null);
  const [services, setServices] = useState([]); // Initialize with empty array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token'); // Get token from local storage
      const response = await axios.get('http://localhost:8000/api/nurse/services', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setServices(response.data);
    } catch (err) {
      console.error("Error fetching services:", err);
      setError("Erreur lors du chargement des services.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (service = null) => {
    setServiceToEdit(service);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setServiceToEdit(null);
  };

  const handleSaveService = async (serviceData) => {
    const token = localStorage.getItem('token');
    try {
      if (serviceData.id) {
        // Update existing service
        await axios.put(`http://localhost:8000/api/nurse/services/${serviceData.id}`, serviceData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        alert('Service mis à jour avec succès!');
      } else {
        // Add new service
        await axios.post('http://localhost:8000/api/nurse/services', serviceData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        alert('Service ajouté avec succès!');
      }
      fetchServices(); // Refresh the list
      handleCloseModal();
    } catch (err) {
      console.error("Error saving service:", err.response ? err.response.data : err);
      alert('Erreur lors de l\'enregistrement du service: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteService = async (id) => {
    const token = localStorage.getItem('token');
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce service ?")) {
      try {
        await axios.delete(`http://localhost:8000/api/nurse/services/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        alert('Service supprimé avec succès!');
        fetchServices(); // Refresh the list
      } catch (err) {
        console.error("Error deleting service:", err.response ? err.response.data : err);
        alert('Erreur lors de la suppression du service: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  if (loading) return <div className="mes-services-loading">Chargement des services...</div>;
  if (error) return <div className="mes-services-error">{error}</div>;

  return (
          <div className="mes-services-container">
            {/* Header avec statistiques */}
            <div className="mes-services-header">
              <h1 className="mes-services-title">Mes Services Proposés</h1>
              <div className="mes-services-stats">
                <div className="mes-services-stat-card">
                  <div className="mes-services-stat-icon">
                    <Settings size={24} />
                  </div>
                  <div className="mes-services-stat-info">
                    <span className="mes-services-stat-number">{services.length}</span>
                    <span className="mes-services-stat-label">Services Actifs</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section principale */}
            <div className="mes-services-main-section">
              <div className="mes-services-section-header">
                <div className="mes-services-section-title">
                  <h2>Services Actuels</h2>
                  <p className="mes-services-section-subtitle">Gérez et organisez vos services proposés</p>
                </div>
                <button className="mes-services-add-btn" onClick={() => handleOpenModal()}>
                  <Plus size={20} />
                  Ajouter un nouveau service
                </button>
              </div>

              {/* Grille des services */}
              <div className="mes-services-grid">
                {services.length > 0 ? (
                  services.map((service) => (
                    <div key={service.id} className="mes-services-card">
                      <div className="mes-services-card-header">
                        <h3 className="mes-services-card-title">{service.title}</h3>
                        <div className="mes-services-card-actions">
                          <button 
                            className="mes-services-edit-btn" 
                            onClick={() => handleOpenModal(service)}
                            title="Modifier"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            className="mes-services-delete-btn" 
                            onClick={() => handleDeleteService(service.id)}
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="mes-services-card-content">
                        <p className="mes-services-card-professional">
                          <Users size={16} />
                          {service.professional}
                        </p>
                        <p className="mes-services-card-description">{service.description}</p>
                        
                        <div className="mes-services-card-details">
                          <div className="mes-services-card-detail">
                            <Clock size={16} />
                            <span>{service.availability}</span>
                          </div>
                          <div className="mes-services-card-detail mes-services-price">
                            <CreditCard size={16} />
                            <span>{service.price}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="mes-services-empty-state">
                    <div className="mes-services-empty-icon">
                      <Settings size={48} />
                    </div>
                    <h3>Aucun service proposé</h3>
                    <p>Commencez par ajouter votre premier service pour attirer des patients.</p>
                    <button className="mes-services-empty-btn" onClick={() => handleOpenModal()}>
                      <Plus size={20} />
                      Ajouter votre premier service
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
              <AddServiceModal
                onClose={handleCloseModal}
                onSaveService={handleSaveService}
                initialServiceData={serviceToEdit}
              />
            )}
          </div>
  );
}

export default MesServicesInf;