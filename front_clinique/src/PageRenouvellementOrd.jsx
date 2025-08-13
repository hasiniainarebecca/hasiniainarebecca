import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { Search, Filter, Eye, CheckCircle, XCircle, Clock, User, FileText } from "lucide-react"
import "./styles/PageRenouvellementOrd.css"

const DemandeRenouvellement = () => {
  const navigate = useNavigate()
  const [renewalRequests, setRenewalRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [showRejectModal, setShowRejectModal] = useState(false)

  // Statistiques des demandes
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  })

  // Charger les données depuis l'API
  useEffect(() => {
    const fetchRenewalRequests = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await axios.post(
          "http://localhost:8000/api/liste-renouvellement",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          },
        )

        const data = response.data
        setRenewalRequests(data)

        // Calculer les statistiques
        const newStats = {
          pending: data.filter((req) => req.status === "en attente").length,
          approved: data.filter((req) => req.status === "approuvée").length,
          rejected: data.filter((req) => req.status === "refusée").length,
        }
        setStats(newStats)
        setLoading(false)
      } catch (error) {
        console.error("Erreur de récupération des demandes :", error)
        setLoading(false)
      }
    }

    fetchRenewalRequests()
  }, [])

  // Filtrer les demandes
  const filteredRequests = renewalRequests.filter((request) => {
    const matchesSearch =
      request.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.patient?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || request.status === filterStatus
    return matchesSearch && matchesStatus
  })

  // Voir les détails d'une demande
  const viewRequestDetails = (request) => {
    setSelectedRequest(request)
    setShowDetailsModal(true)
  }

  // Approuver une demande
  const approveRequest = async (requestId) => {
    try {
      const token = localStorage.getItem("token")
      await axios.put(
        `http://localhost:8000/api/demande-renouvellement/${requestId}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      )

      // Mettre à jour l'état local
      setRenewalRequests((prev) =>
        prev.map((req) =>
          req.id === requestId ? { ...req, status: "approuvée", updated_at: new Date().toISOString() } : req,
        ),
      )
      setShowDetailsModal(false)
      updateStats()
    } catch (error) {
      console.error("Erreur lors de l'approbation:", error)
    }
  }

  // Ouvrir le modal de rejet
  const openRejectModal = (request) => {
    setSelectedRequest(request)
    setShowRejectModal(true)
    setShowDetailsModal(false)
  }

  // Rejeter une demande
  const rejectRequest = async () => {
    try {
      const token = localStorage.getItem("token")
      await axios.put(
        `http://localhost:8000/api/demande-renouvellement/${selectedRequest.id}/reject`,
        { reason: rejectReason },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        },
      )

      setRenewalRequests((prev) =>
        prev.map((req) =>
          req.id === selectedRequest.id
            ? { ...req, status: "refusée", rejection_reason: rejectReason, updated_at: new Date().toISOString() }
            : req,
        ),
      )
      setShowRejectModal(false)
      setRejectReason("")
      updateStats()
    } catch (error) {
      console.error("Erreur lors du rejet:", error)
    }
  }

  // Mettre à jour les statistiques
  const updateStats = () => {
    setTimeout(() => {
      const newStats = {
        pending: renewalRequests.filter((req) => req.status === "en attente").length,
        approved: renewalRequests.filter((req) => req.status === "approuvée").length,
        rejected: renewalRequests.filter((req) => req.status === "refusée").length,
      }
      setStats(newStats)
    }, 100)
  }

  // Obtenir la classe CSS du statut
  const getStatusClass = (status) => {
    switch (status) {
      case "en attente":
        return "renouv-status-pending"
      case "approuvée":
        return "renouv-status-approved"
      case "refusée":
        return "renouv-status-rejected"
      default:
        return ""
    }
  }

  // Obtenir l'icône du statut
  const getStatusIcon = (status) => {
    switch (status) {
      case "en attente":
        return <Clock size={16} />
      case "approuvée":
        return <CheckCircle size={16} />
      case "refusée":
        return <XCircle size={16} />
      default:
        return null
    }
  }

  // Formater la date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR")
  }

  return (
    <div className="renouv-main-container">
      <div className="renouv-content-container">
        <div className="renouv-header">
          <h1 className="renouv-title">Gestion des Renouvellements d'Ordonnances</h1>
          <button
            onClick={() => navigate("/docteur/prescription")}
            className="renouv-prescription-btn"
          >
            Prescrire des ordonnances
          </button>
        </div>
        
        {/* Filtres et recherche */}
        <div className="renouv-filters-container">
          <div className="renouv-search-container">
            <Search size={18} className="renouv-search-icon" />
            <input
              type="text"
              placeholder="Rechercher un patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="renouv-search-input"
            />
          </div>
          <div className="renouv-filter-container">
            <Filter size={18} className="renouv-filter-icon" />
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="renouv-filter-select"
            >
              <option value="all">Tous les statuts</option>
              <option value="en attente">En attente</option>
              <option value="approuvée">Approuvées</option>
              <option value="refusée">Rejetées</option>
            </select>
          </div>
        </div>

        {/* Tableau des demandes */}
        {loading ? (
          <div className="renouv-loading">Chargement des demandes...</div>
        ) : (
          <div className="renouv-table-container">
            <table className="renouv-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Patient</th>
                  <th>Date de demande</th>
                  <th>Prescription ID</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="renouv-no-data">
                      Aucune demande trouvée
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => (
                    <tr key={request.id} className="renouv-table-row">
                      <td>#{request.id}</td>
                      <td>
                        <div className="renouv-patient-info">
                          <strong>{request.patient?.nom || "N/A"} {request.patient?.prenom || "N/A"}</strong>
                          <span>{request.patient?.email || ""}</span>
                        </div>
                      </td>
                      <td>{formatDate(request.created_at)}</td>
                      <td>#{request.prescription_id}</td>
                      <td>
                        <span className={`renouv-status-badge ${getStatusClass(request.status)}`}>
                          {getStatusIcon(request.status)}
                          {request.status}
                        </span>
                      </td>
                      <td className="renouv-actions-cell">
                        <button 
                          className="renouv-view-btn" 
                          onClick={() => viewRequestDetails(request)}
                        >
                          <Eye size={16} />
                          Voir
                        </button>
                        {request.status === "en attente" && (
                          <>
                            <button 
                              className="renouv-approve-btn" 
                              onClick={() => approveRequest(request.id)}
                            >
                              <CheckCircle size={16} />
                              Approuver
                            </button>
                            <button 
                              className="renouv-reject-btn" 
                              onClick={() => openRejectModal(request)}
                            >
                              <XCircle size={16} />
                              Rejeter
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal des détails */}
        {showDetailsModal && selectedRequest && (
          <div className="renouv-modal-overlay">
            <div className="renouv-modal-content renouv-details-modal">
              <div className="renouv-modal-header">
                <h2>Demande de Renouvellement #{selectedRequest.id}</h2>
                <span className={`renouv-status-badge ${getStatusClass(selectedRequest.status)}`}>
                  {getStatusIcon(selectedRequest.status)}
                  {selectedRequest.status}
                </span>
              </div>

              <div className="renouv-modal-body">
                <div className="renouv-details-grid">
                  {/* Informations patient */}
                  <div className="renouv-detail-section">
                    <h3 className="renouv-detail-title">
                      <User size={20} className="renouv-detail-icon" /> Informations du patient
                    </h3>
                    <div className="renouv-detail-content">
                      <p>
                        <strong>Nom:</strong> {selectedRequest.patient?.nom || "N/A"} {selectedRequest.patient?.prenom || "N/A"}
                      </p>
                      <p>
                        <strong>Email:</strong> {selectedRequest.patient?.email || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Informations de la demande */}
                  <div className="renouv-detail-section">
                    <h3 className="renouv-detail-title">
                      <FileText size={20} className="renouv-detail-icon" /> Informations de la demande
                    </h3>
                    <div className="renouv-detail-content">
                      <p>
                        <strong>Date de demande:</strong> {formatDate(selectedRequest.created_at)}
                      </p>
                      <p>
                        <strong>Prescription ID:</strong> #{selectedRequest.prescription_id}
                      </p>
                      <p>
                        <strong>Statut:</strong> {selectedRequest.status}
                      </p>
                      {selectedRequest.updated_at !== selectedRequest.created_at && (
                        <p>
                          <strong>Dernière mise à jour:</strong> {formatDate(selectedRequest.updated_at)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Informations de prescription si disponibles */}
                {selectedRequest.prescription && (
                  <div className="renouv-detail-section renouv-full-width">
                    <h3 className="renouv-detail-title">
                      <FileText size={20} className="renouv-detail-icon" /> Prescription originale
                    </h3>
                    <div className="renouv-detail-content">
                      <div className="renouv-prescription-info">
                        <p>
                          <strong>ID:</strong> #{selectedRequest.prescription.id}
                        </p>
                        <p>
                          <strong>Statut:</strong> {selectedRequest.prescription.status}
                        </p>
                        <p>
                          <strong>Nombre de renouvellements:</strong> {selectedRequest.prescription.renewals}
                        </p>
                        <p>
                          <strong>Date de création:</strong> {formatDate(selectedRequest.prescription.created_at)}
                        </p>
                        {selectedRequest.prescription.notes && (
                          <p>
                            <strong>Notes du médecin:</strong> {selectedRequest.prescription.notes}
                          </p>
                        )}
                        {selectedRequest.prescription.doctor && (
                          <p>
                            <strong>Médecin prescripteur:</strong> Dr. {selectedRequest.prescription.doctor.nom}{" "}
                            {selectedRequest.prescription.doctor.prenom}
                          </p>
                        )}
                      </div>

                      {/* Médicaments prescrits */}
                      {selectedRequest.prescription.medications &&
                        selectedRequest.prescription.medications.length > 0 && (
                          <div className="renouv-medications-section">
                            <h4 className="renouv-medications-title">
                              Médicaments prescrits ({selectedRequest.prescription.medications.length})
                            </h4>
                            <div className="renouv-medications-table">
                              <table className="renouv-medications-inner-table">
                                <thead>
                                  <tr>
                                    <th>Médicament</th>
                                    <th>Dosage</th>
                                    <th>Fréquence</th>
                                    <th>Durée</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {selectedRequest.prescription.medications.map((medication, index) => (
                                    <tr key={medication.id}>
                                      <td className="renouv-medication-name">{medication.medication_name}</td>
                                      <td>{medication.dosage}</td>
                                      <td>{medication.frequency || "Non spécifiée"}</td>
                                      <td>{medication.duration || "Non spécifiée"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                      {/* Message si aucun médicament */}
                      {(!selectedRequest.prescription.medications ||
                        selectedRequest.prescription.medications.length === 0) && (
                        <div className="renouv-no-medications">
                          <p>Aucun médicament trouvé pour cette prescription.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedRequest.rejection_reason && (
                  <div className="renouv-detail-section renouv-full-width renouv-rejection-reason">
                    <h3>Raison du rejet</h3>
                    <p>{selectedRequest.rejection_reason}</p>
                  </div>
                )}
              </div>

              <div className="renouv-modal-actions">
                <button 
                  className="renouv-close-btn" 
                  onClick={() => setShowDetailsModal(false)}
                >
                  Fermer
                </button>
                {selectedRequest.status === "en attente" && (
                  <>
                    <button 
                      className="renouv-approve-btn" 
                      onClick={() => approveRequest(selectedRequest.id)}
                    >
                      <CheckCircle size={16} />
                      Approuver
                    </button>
                    <button 
                      className="renouv-reject-btn" 
                      onClick={() => openRejectModal(selectedRequest)}
                    >
                      <XCircle size={16} />
                      Rejeter
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de rejet */}
        {showRejectModal && selectedRequest && (
          <div className="renouv-modal-overlay">
            <div className="renouv-modal-content renouv-reject-modal">
              <div className="renouv-modal-header">
                <h2>Rejeter la Demande</h2>
              </div>

              <div className="renouv-modal-body">
                <p className="renouv-reject-message">
                  Vous êtes sur le point de rejeter la demande de renouvellement de{" "}
                  <strong>{selectedRequest.patient?.name}</strong>.
                </p>

                <div className="renouv-field-group">
                  <label htmlFor="rejectReason">Raison du rejet *</label>
                  <textarea
                    id="rejectReason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Expliquez pourquoi cette demande est rejetée..."
                    rows={4}
                    className="renouv-reject-textarea"
                    required
                  />
                </div>
              </div>

              <div className="renouv-modal-actions">
                <button 
                  className="renouv-cancel-btn" 
                  onClick={() => setShowRejectModal(false)}
                >
                  Annuler
                </button>
                <button 
                  className="renouv-confirm-reject-btn" 
                  onClick={rejectRequest} 
                  disabled={!rejectReason.trim()}
                >
                  <XCircle size={16} />
                  Confirmer le Rejet
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DemandeRenouvellement