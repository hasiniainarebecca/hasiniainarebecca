// PrescriptionCard.jsx
import { useState, useEffect } from "react";
import { Download, FileText, Calendar } from 'lucide-react';
import axios from "axios";

function PrescriptionCard({ prescription }) {
  const [pharmacies, setPharmacies] = useState([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState("");
  const [isSendingOrder, setIsSendingOrder] = useState(false);
  const [isSendingRenewal, setIsSendingRenewal] = useState(false);
  const [isOrdered, setIsOrdered] = useState(false); // <-- Nouvel état pour suivre la commande

  const createdAt = new Date(prescription.created_at);
  const duration = Math.max(
    ...prescription.medications.map(m => parseInt(m.duration)).filter(d => !isNaN(d)),
    0
  );
  const expiry = new Date(createdAt.getTime() + duration * 24 * 60 * 60 * 1000);
  const isExpired = expiry < new Date();

  useEffect(() => {
    const fetchPharmacies = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/pharmacies");
        setPharmacies(res.data);
      } catch (error) {
        console.error("Erreur lors de la récupération des pharmacies", error);
      }
    };
    fetchPharmacies();
  }, []);

  function handleDownload(id) {
    const token = localStorage.getItem('token');
    fetch(`http://localhost:8000/api/prescriptions/${id}/get-pdf`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ordonnance_${id}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch(err => {
        console.error("Erreur lors du téléchargement :", err);
      });
  }

  const handleOrderPrescription = async (prescriptionId) => {
    if (!selectedPharmacy) {
      alert("Veuillez sélectionner une pharmacie avant de commander.");
      return;
    }
    
    try {
      setIsSendingOrder(true);
      const currentUser = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('token');

      const response = await axios.post(
        'http://localhost:8000/api/prescription-orders',
        {
          prescription_id: prescriptionId,
          patient_id: currentUser.id,
          pharmacy_id: selectedPharmacy.id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      alert("Commande envoyée avec succès !");
      setIsOrdered(true); // <-- Mettre à jour l'état après une commande réussie
    } catch (error) {
      console.error('Erreur lors de la commande', error.response?.data || error.message);
      alert("Erreur lors de la commande : " + (error.response?.data?.message || error.message));
    } finally {
      setIsSendingOrder(false);
    }
  };

  const demanderRenouvellement = async (prescriptionId) => {
    try {
      setIsSendingRenewal(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:8000/api/demande-renouvellement',
        { prescription_id: prescriptionId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(response.data.message);
    } catch (error) {
      if (error.response) {
        alert(error.response.data.message || 'Erreur lors de la demande.');
      } else {
        alert('Erreur réseau ou serveur.');
      }
    } finally {
      setIsSendingRenewal(false);
    }
  };

  return (
    <div className={`patient-prescription-card ${isExpired ? 'expired' : ''}`}>
      <div className="patient-prescription-header">
        <div className="patient-prescription-doctor-info">
          <FileText className="patient-prescription-file-icon" size={20} />
          <div>
            <h3 className="patient-prescription-doctor-name">Dr {prescription.doctor.nom} {prescription.doctor.prenom}</h3>
            <p className="patient-prescription-doctor-specialty">{prescription.doctor.speciality}</p>
          </div>
        </div>
        <div className="patient-prescription-dates">
          <div className="patient-prescription-date-item">
            <FileText size={16} className="patient-prescription-date-icon" />
            <span>Délivrée le: {createdAt.toLocaleDateString('fr-FR', {
              day: '2-digit', month: 'long', year: 'numeric'
            })}</span>
          </div>
          <div className="patient-prescription-date-item">
            <Calendar size={16} className="patient-prescription-date-icon" />
            <span>Expire le: {expiry.toLocaleDateString('fr-FR', {
              day: '2-digit', month: 'long', year: 'numeric'
            })}</span>
          </div>
          <div className="patient-prescription-renewals">
            <span>{prescription.renewals} renouvellement(s) restant(s)</span>
          </div>
        </div>
      </div>

      <div className="patient-prescription-medications">
        <h4 className="patient-prescription-medications-title">Médicaments prescrits</h4>
        {prescription.medications.map((med, idx) => (
          <div key={idx} className="patient-prescription-medication">
            <h5 className="patient-prescription-medication-name">{med.medication_name} - {med.dosage}</h5>
            <p className="patient-prescription-medication-detail">{med.frequency} par jour</p>
            <p className="patient-prescription-medication-detail">pendant {med.duration} jours</p>
          </div>
        ))}
      </div>

      {/* Le sélecteur de pharmacie s'affiche si non expirée et non encore commandée */}
      {!isExpired && !isOrdered && ( // <-- Ajout de la condition !isOrdered
        <div className="patient-prescription-pharmacy-selector">
          <label className="patient-prescription-pharmacy-label">
            <strong>Choisissez une pharmacie : </strong>
          </label>
          <select 
            className="patient-prescription-pharmacy-select"
            onChange={(e) => {
              const selectedId = parseInt(e.target.value);
              const selected = pharmacies.find(pharm => pharm.id === selectedId);
              setSelectedPharmacy(selected);
            }}
          >
            <option value="">Choisir une pharmacie</option>
            {pharmacies.map((pharmacy) => (
              <option key={pharmacy.id} value={pharmacy.id}>
                {pharmacy.nom}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="patient-prescription-actions">
        <button 
          className="patient-prescription-action patient-prescription-download"
          onClick={() => handleDownload(prescription.id)}
        >
          <Download size={18} className="patient-prescription-action-icon" />
          <span>Télécharger PDF</span>
        </button>

        {/* Le bouton "Commander" s'affiche si non expirée ET non encore commandée */}
        {!isExpired && !isOrdered && ( // <-- Modification de la condition d'affichage
          <button
            className="patient-prescription-action patient-prescription-order"
            onClick={() => handleOrderPrescription(prescription.id)}
            disabled={isSendingOrder}
          >
            {isSendingOrder ? (
              <span>Envoi en cours...</span>
            ) : (
              <>
                <FileText size={18} className="patient-prescription-action-icon" />
                <span>Commander</span>
              </>
            )}
          </button>
        )}

        {/* Le bouton "Demander renouvellement" s'affiche si renouvellements > 0 ET (expirée OU déjà commandée) */}
        {prescription.renewals > 0 && (isExpired || isOrdered) && ( // <-- Modification de la condition d'affichage
          <button 
            className="patient-prescription-action patient-prescription-renew"
            onClick={() => demanderRenouvellement(prescription.id)}
            disabled={isSendingRenewal}
          >
            {isSendingRenewal ? (
              <span>Envoi en cours...</span>
            ) : (
              <span>Demander renouvellement</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default PrescriptionCard;