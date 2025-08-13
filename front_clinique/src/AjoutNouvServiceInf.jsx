// src/AjoutNouvServiceInf.jsx
import React, { useState, useEffect } from 'react';
import './styles/AddServiceModal.css'; // You might need to create this CSS file

function AddServiceModal({ onClose, onSaveService, initialServiceData }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [availability, setAvailability] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => {
    if (initialServiceData) {
      setTitle(initialServiceData.title || '');
      setDescription(initialServiceData.description || '');
      setAvailability(initialServiceData.availability || '');
      setPrice(initialServiceData.price || '');
    }
  }, [initialServiceData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const serviceData = {
      id: initialServiceData ? initialServiceData.id : null,
      title,
      description,
      availability,
      price,
    };
    onSaveService(serviceData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{initialServiceData ? 'Modifier le service' : 'Ajouter un nouveau service'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Titre du service:</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description:</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="availability">Disponibilité:</label>
            <input
              type="text"
              id="availability"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="price">Prix:</label>
            <input
              type="text"
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div className="modal-actions">
            <button type="submit" className="mes-services-add-btn">
              {initialServiceData ? 'Enregistrer les modifications' : 'Ajouter le service'}
            </button>
            <button type="button" className="cancel-button" onClick={onClose}>
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddServiceModal;