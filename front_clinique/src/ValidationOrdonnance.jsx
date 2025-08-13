import { useState, useEffect } from "react"
import axios from "axios";
import { Search, Filter, Eye, CheckCircle, XCircle, Clock, ShoppingCart, FileText, AlertCircle } from "lucide-react"
import "./styles/ValidationOrdonnance.css"

const ValidationOrdonnance = () => {
  // États pour les ordonnances
  const [prescriptions, setPrescriptions] = useState([])
  const [selectedPrescription, setSelectedPrescription] = useState(null)
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false)

  // États pour les commandes sans ordonnance
  const [directOrders, setDirectOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showOrderModal, setShowOrderModal] = useState(false)

  // États communs
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [activeTab, setActiveTab] = useState("prescriptions") // "prescriptions" ou "directOrders"

  const calculateExpirationDate = (createdAt) => {
    const creationDate = new Date(createdAt);
    creationDate.setMonth(creationDate.getMonth() + 3); // Ajoute 3 mois
    return creationDate.toLocaleDateString(); // Retourne une date formatée
  };

  // Fonction pour formater la date au format JJ/MM/AAAA
  const formatDate = (dateString) => {
    if (!dateString) return 'Non spécifié';
    
    const date = new Date(dateString);
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) return 'Non spécifié';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  };

    // Fonction pour calculer l'âge à partir d'une date de naissance
  const calculateAge = (dateNaissance) => {
    if (!dateNaissance) return 'Non spécifié';
    
    const birthDate = new Date(dateNaissance);
    const today = new Date();
    
    // Vérifier si la date est valide
    if (isNaN(birthDate.getTime())) return 'Non spécifié';
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Ajuster si l'anniversaire n'est pas encore passé cette année
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };
  
  useEffect(() => {
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/pharmacies/commandes', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Formater les données pour correspondre à la structure attendue
      const formattedOrders = response.data.map(cmd => ({
      id: cmd.id,
      patient: {
        id: cmd.patient.id,
        name: cmd.patient.nom || 'Non spécifié',
        prenom: cmd.patient.prenom || 'Non spécifié',
        age: calculateAge(cmd.patient.date_naissance),
        phone: cmd.patient.phone || "Non spécifié",
        date_naissance: cmd.patient.date_naissance
      },
      date: new Date(cmd.created_at).toLocaleDateString(),
      status: cmd.status,
      totalAmount: Number(cmd.prix_total), // Convertir en nombre
      requiresPrescription: false,
      medications: [
        {
          id: cmd.medication.id,
          name: cmd.medication.name,
          quantity: cmd.quantity,
          price: Number(cmd.medication.price), // Convertir en nombre
          requiresPrescription: false
        }
      ]
    }));

      setDirectOrders(formattedOrders);
      setLoading(false);
    } catch (error) {
      console.error("Erreur lors du chargement des commandes :", error);
      setLoading(false);
    }
  };

  fetchData();
}, []);

 useEffect(() => {
  const token = localStorage.getItem('token');
  axios.get('http://localhost:8000/api/prescription-orders-list', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  .then(res => {
    const safePrescriptions = res.data.map(p => ({
      ...p,
      id: p.id, // ID de la commande
      prescription_id: p.prescription?.id, // ID de l'ordonnance
      patient: {
        nom: p.prescription?.patient?.nom || "Nom inconnu",
        prenom: p.prescription?.patient?.prenom || "Prénom inconnu",
        date_naissance: p.prescription?.patient?.date_naissance || null,
        phone: p.prescription?.patient?.phone || "Non spécifié"
      },
      doctor: {
        nom: p.prescription?.doctor?.nom || "Nom inconnu",
        prenom: p.prescription?.doctor?.prenom || "Prénom inconnu",
        speciality: p.prescription?.doctor?.speciality || "Non spécifiée"
      },
      medications: p.prescription?.medications?.map(m => ({
        id: m.id,
        name: m.name || m.medication_name || "Médicament inconnu",
        dosage: m.pivot?.dosage || m.dosage || "Non spécifiée",
        duration: m.pivot?.duration || m.duration || "Non spécifiée",
        frequency: m.pivot?.frequency || m.frequency || "Non spécifiée",
        quantity: m.pivot?.quantity || m.quantity || 1
      })) || [],
      date: new Date(p.created_at).toLocaleDateString(),
      created_at: p.prescription?.created_at,
      expirationDate: calculateExpirationDate(p.prescription?.created_at),
      notes: p.prescription?.notes || null,
      status: p.status || "en attente"
    }));
    
    console.log("Prescriptions avec médicaments:", safePrescriptions);
    setPrescriptions(safePrescriptions);
  })
  .catch(err => console.error("Erreur lors du chargement des prescriptions:", err));
}, []);



  // Filtrer les ordonnances en fonction de la recherche et du statut
  const filteredPrescriptions = prescriptions.filter((prescription) => {
  const fullPatientName = `${prescription.patient?.prenom ?? ''} ${prescription.patient?.nom ?? ''}`.toLowerCase();
  const fullDoctorName = `${prescription.doctor?.prenom ?? ''} ${prescription.doctor?.nom ?? ''}`.toLowerCase();

  const matchesSearch =
    fullPatientName.includes(searchTerm.toLowerCase()) ||
    fullDoctorName.includes(searchTerm.toLowerCase());

  const matchesStatus = filterStatus === "all" || prescription.status === filterStatus;

  return matchesSearch && matchesStatus;
});


  // Filtrer les commandes sans ordonnance
  const filteredDirectOrders = directOrders.filter((order) => {
  const matchesSearch =
    order.patient &&
    order.patient.name &&
    order.patient.name.toLowerCase().includes(searchTerm.toLowerCase());

  const matchesStatus = filterStatus === "all" || 
    (filterStatus === "en attente" && order.status === "en attente") ||
    (filterStatus === "acceptée" && order.status === "acceptée") ||
    (filterStatus === "refusée" && order.status === "refusée") ||
    (filterStatus === "envoyée" && order.status === "envoyée");
    
  return matchesSearch && matchesStatus;
});


  // Voir les détails d'une ordonnance
  const viewPrescription = (prescription) => {
    setSelectedPrescription(prescription)
    setShowPrescriptionModal(true)
  }

  // Voir les détails d'une commande sans ordonnance
  const viewOrder = (order) => {
    setSelectedOrder(order)
    setShowOrderModal(true)
  }

  // Changer le statut d'une ordonnance
  const updatePrescriptionStatus = async (id, newStatus) => {
    const token = localStorage.getItem('token');
  try {
    const response = await axios.put(`http://localhost:8000/api/prescription-orders/${id}/status`, {
      status: newStatus,
    }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      // Mise à jour locale du tableau
    setPrescriptions(prevPrescriptions =>
      prevPrescriptions.map(p =>
        p.id === id ? { ...p, status: newStatus } : p
      )
    );
    alert(response.data.message || "Statut mis à jour avec succès");
  } catch (error) {
    const message = error.response?.data?.message || error.response?.data?.messages?.join('\n') || "Une Erreur est survenue";
    console.error("Erreur :", message);
    alert(message);
  }
};

  // Changer le statut d'une commande sans ordonnance
  const updateOrderStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8000/api/commandes/${id}/status`, {
        status: newStatus
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Mettre à jour l'état local
      setDirectOrders(directOrders.map(order => 
        order.id === id ? { ...order, status: newStatus } : order
      ));

      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
    }
  };

  // Obtenir la classe CSS en fonction du statut
const getStatusClass = (status) => {
  switch (status) {
    case "en attente": return "status-pending"
    case "acceptée": return "status-completed"
    case "refusée": return "status-rejected"
    case "envoyée": return "status-sent"
    default: return ""
  }
}

const getStatusText = (status) => {
  switch (status) {
    case "en attente": return "En attente"
    case "acceptée": return "Acceptée"
    case "refusée": return "Refusée"
    case "envoyée": return "Envoyée"
    default: return status
  }
}

const getStatusIcon = (status) => {
  switch (status) {
    case "en attente": return <Clock size={16} />
    case "acceptée": return <CheckCircle size={16} />
    case "refusée": return <XCircle size={16} />
    case "envoyée": return <AlertCircle size={16} />
    default: return null
  }
}

  return (
          <div className="commands-container">
            <div className="commands-header">
              <h1>Gestion des commandes</h1>

              {/* Onglets pour basculer entre ordonnances et commandes directes */}
              <div className="commands-tabs">
                <button
                  className={`tab-btn ${activeTab === "prescriptions" ? "active" : ""}`}
                  onClick={() => setActiveTab("prescriptions")}
                >
                  <FileText size={16} />
                  Ordonnances
                </button>
                <button
                  className={`tab-btn ${activeTab === "directOrders" ? "active" : ""}`}
                  onClick={() => setActiveTab("directOrders")}
                >
                  <ShoppingCart size={16} />
                  Commandes sans ordonnance
                </button>
              </div>
            </div>

            <div className="commands-filters">
              <div className="search-container-ord">
                <Search size={18} />
                <input
                  type="text"
                  placeholder={
                    activeTab === "prescriptions"
                      ? "Rechercher un patient ou un médecin..."
                      : "Rechercher un patient..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="filter-container-ord">
                <Filter size={18} />
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="all">Tous les statuts</option>
                  <option value="en attente">En attente</option>
                  <option value="acceptée">Acceptée</option>
                  <option value="refusée">Refusée</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="loading">Chargement des données...</div>
            ) : (
              <>
                {/* Tableau des ordonnances */}
                {activeTab === "prescriptions" && (
                  <div className="commands-table">
                    <table>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Patient</th>
                          <th>Médecin</th>
                          <th>Date</th>
                          <th>Expiration</th>
                          <th>Statut</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPrescriptions.map((prescription) => (
                          <tr key={prescription.id}>
                            <td>#{prescription.id}</td>
                            <td>{prescription.patient.nom} {prescription.patient.prenom}</td>
                            <td>{prescription.doctor.nom} {prescription.doctor.prenom}</td>
                            <td>{prescription.date}</td>
                            <td>{prescription.expirationDate}</td>
                            <td>
                              <span className={`status-badge ${getStatusClass(prescription.status)}`}>
                                {getStatusIcon(prescription.status)}
                                {getStatusText(prescription.status)}
                              </span>
                            </td>
                            <td className="actions-cell">
                              <button className="view-btn" onClick={() => viewPrescription(prescription)}>
                                <Eye size={16} />
                                Voir
                              </button>
                              {prescription.status === "en attente" && (
                                <>
                                  <button
                                    className="approve-btn"
                                    onClick={() => updatePrescriptionStatus(prescription.id, "acceptée")}
                                  >
                                    <CheckCircle size={16} />
                                    Valider
                                  </button>
                                  <button
                                    className="reject-btn"
                                    onClick={() => updatePrescriptionStatus(prescription.id, "refusée")}
                                  >
                                    <XCircle size={16} />
                                    Rejeter
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Tableau des commandes sans ordonnance */}
                {activeTab === "directOrders" && (
                  <div className="commands-table">
                    <table>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Patient</th>
                          <th>Date</th>
                          <th>Montant</th>
                          <th>Ordonnance requise</th>
                          <th>Statut</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDirectOrders.map((order) => (
                          <tr key={order.id}>
                            <td>#{order.id}</td>
                            <td>{order.patient.name} {order.patient.prenom}</td>
                            <td>{order.date}</td>
                            <td>{typeof order.totalAmount === 'number' ? order.totalAmount.toFixed(2) : '0.00'} Ar</td>
                            <td>
                              {order.requiresPrescription ? (
                                <span className="prescription-required">
                                  <AlertCircle size={16} />
                                  Requise
                                </span>
                              ) : (
                                <span className="prescription-not-required">Non requise</span>
                              )}
                            </td>
                            <td>
                              <span className={`status-badge ${getStatusClass(order.status)}`}>
                                {getStatusIcon(order.status)}
                                {getStatusText(order.status)}
                              </span>
                            </td>
                            <td className="actions-cell">
                              <button className="view-btn" onClick={() => viewOrder(order)}>
                                <Eye size={16} />
                                Voir
                              </button>
                              {order.status === "en attente" && (
                                <>
                                  <button
                                    className="approve-btn"
                                    onClick={() => updateOrderStatus(order.id, "acceptée")}
                                  >
                                    <CheckCircle size={16} />
                                    Valider
                                  </button>
                                  <button
                                    className="reject-btn"
                                    onClick={() => updateOrderStatus(order.id, "refusée")}
                                  >
                                    <XCircle size={16} />
                                    Rejeter
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* Modal pour afficher les détails d'une ordonnance */}
            {showPrescriptionModal && selectedPrescription && (
              <div className="modal-overlay">
                <div className="modal-content prescription-modal">
                  <div className="modal-header">
                    <h2>Ordonnance #{selectedPrescription.id}</h2>
                    <span className={`status-badge ${getStatusClass(selectedPrescription.status)}`}>
                      {getStatusIcon(selectedPrescription.status)}
                      {getStatusText(selectedPrescription.status)}
                    </span>
                  </div>

                  <div className="prescription-details">
                    <div className="detail-section">
                      <h3>Informations du patient</h3>
                      <p>
                        <strong>Nom:</strong> {selectedPrescription.patient.nom} {selectedPrescription.patient.prenom}
                      </p>
                      <p>
                        <strong>Âge:</strong> {calculateAge(selectedPrescription.patient.date_naissance)} ans
                      </p>
                      <p>
                        <strong>Téléphone:</strong> {selectedPrescription.patient.phone}
                      </p>
                    </div>

                    <div className="detail-section">
                      <h3>Informations du médecin</h3>
                      <p>
                        <strong>Nom:</strong>Dr {selectedPrescription.doctor.nom} {selectedPrescription.doctor.prenom}
                      </p>
                      <p>
                        <strong>Spécialité:</strong> {selectedPrescription.doctor.speciality}
                      </p>
                    </div>

                    <div className="detail-section">
                      <h3>Dates</h3>
                      <p>
                        <strong>Date de prescription:</strong> {formatDate(selectedPrescription.created_at)}
                      </p>
                      <p>
                        <strong>Date d'expiration:</strong> {selectedPrescription?.expirationDate}
                      </p>
                    </div>

                    <div className="detail-section medications-list">
                      <h3>Médicaments prescrits</h3>
                      {selectedPrescription.medications && selectedPrescription.medications.length > 0 ? (
                        <table>
                          <thead>
                            <tr>
                              <th>Médicament</th>
                              <th>Posologie</th>
                              <th>Durée</th>
                              <th>Quantité</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedPrescription.medications.map((med, index) => (
                              <tr key={med.id || index}>
                                <td>{med.name}</td>
                                <td>{med.dosage}</td>
                                <td>{med.duration}</td>
                                <td>{med.frequency && med.duration ? med.frequency * med.duration : 1}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p>Aucun médicament prescrit dans cette ordonnance</p>
                      )}
                    </div>

                    {selectedPrescription.notes && (
                      <div className="detail-section">
                        <h3>Notes du médecin</h3>
                        <p>{selectedPrescription.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="modal-actions">
                    <button className="close-btn" onClick={() => setShowPrescriptionModal(false)}>
                      Fermer
                    </button>

                    {selectedPrescription.status === "en attente" && (
                      <>
                        <button
                          className="approve-btn"
                          onClick={() => {
                            updatePrescriptionStatus(selectedPrescription.id, "acceptée")
                          }}
                        >
                          <CheckCircle size={16} />
                          Valider l'ordonnance
                        </button>
                        <button
                          className="reject-btn"
                          onClick={() => {
                            updatePrescriptionStatus(selectedPrescription.id, "refusée")
                          }}
                        >
                          <XCircle size={16} />
                          Rejeter l'ordonnance
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Modal pour afficher les détails d'une commande sans ordonnance */}
            {showOrderModal && selectedOrder && (
              <div className="modal-overlay">
                <div className="modal-content order-modal">
                  <div className="modal-header">
                    <h2>Commande #{selectedOrder.id}</h2>
                    <span className={`status-badge ${getStatusClass(selectedOrder.status)}`}>
                      {getStatusIcon(selectedOrder.status)}
                      {getStatusText(selectedOrder.status)}
                    </span>
                  </div>

                  <div className="order-details">
                    <div className="detail-section">
                      <h3>Informations du patient</h3>
                      <p>
                        <strong>Nom:</strong> {selectedOrder.patient.name} {selectedOrder.patient.prenom}
                      </p>
                      <p>
                        <strong>Âge:</strong> {calculateAge(selectedOrder.patient.date_naissance)} ans
                      </p>
                      <p>
                        <strong>Téléphone:</strong> {selectedOrder.patient.phone}
                      </p>
                    </div>

                    <div className="detail-section">
                      <h3>Informations de la commande</h3>
                      <p>
                        <strong>Date de commande:</strong> {selectedOrder.date}
                      </p>
                      <p>
                        <strong>Montant total:</strong> {typeof selectedOrder.totalAmount === 'number' ? selectedOrder.totalAmount.toFixed(2) : '0.00'} Ar
                      </p>
                      <p>
                        <strong>Ordonnance requise:</strong> {selectedOrder.requiresPrescription ? "Oui" : "Non"}
                      </p>
                    </div>

                    <div className="detail-section medications-list">
                      <h3>Médicaments commandés</h3>
                      <table>
                        <thead>
                          <tr>
                            <th>Médicament</th>
                            <th>Quantité</th>
                            <th>Prix unitaire</th>
                            <th>Total</th>
                            <th>Ordonnance requise</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.medications.map((med) => (
                            <tr key={med.id}>
                              <td>{med.name}</td>
                              <td>{med.quantity}</td>
                              <td>{med.price.toFixed(2)} Ar</td>
                              <td>{(med.price * med.quantity).toFixed(2)} Ar</td>
                              <td>
                                {med.requiresPrescription ? (
                                  <span className="prescription-required">
                                    <AlertCircle size={16} />
                                    Oui
                                  </span>
                                ) : (
                                  <span className="prescription-not-required">Non</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {selectedOrder.notes && (
                      <div className="detail-section">
                        <h3>Notes du patient</h3>
                        <p>{selectedOrder.notes}</p>
                      </div>
                    )}

                    {selectedOrder.requiresPrescription && selectedOrder.status === "en attente" && (
                      <div className="detail-section warning-section">
                        <h3>Attention</h3>
                        <p className="warning-text">
                          <AlertCircle size={16} />
                          Cette commande contient des médicaments nécessitant une ordonnance. Veuillez vérifier si le
                          patient a fourni une ordonnance valide avant de valider la commande.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="modal-actions">
                    <button className="close-btn" onClick={() => setShowOrderModal(false)}>
                      Fermer
                    </button>

                    {selectedOrder.status === "en attente" && (
                      <>
                        <button
                          className="approve-btn"
                          onClick={() => {
                            updateOrderStatus(selectedOrder.id, "acceptée")
                          }}
                        >
                          <CheckCircle size={16} />
                          Valider la commande
                        </button>
                        <button
                          className="reject-btn"
                          onClick={() => {
                            updateOrderStatus(selectedOrder.id, "refusée")
                          }}
                        >
                          <XCircle size={16} />
                          Rejeter la commande
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
  )
}


export default ValidationOrdonnance
