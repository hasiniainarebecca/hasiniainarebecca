import { useState, useEffect } from "react"
import axios from "axios"
import {
  Calendar,
  AlertCircle,
  Plus,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  XCircle,
  Clock,
  Users,
  MapPin,
  Loader2,
  CheckCircle,
  RefreshCw,
  Check,
  X,
} from "lucide-react"
import "./styles/EdtDocteur.css"

const EmploitDuTempsDocteurPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showExchangeModal, setShowExchangeModal] = useState(false)
  const [viewMode, setViewMode] = useState("month")
  const [filterService, setFilterService] = useState("all")

  // États pour les données
  const [gardes, setGardes] = useState([])
  const [demandesEchange, setDemandesEchange] = useState([])
  const [infirmiers, setInfirmiers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Données statiques
  const services = ["Urgences", "Réanimation", "Chirurgie", "Pédiatrie", "Cardiologie"]
  const etablissements = ["CHU Nord", "CHU Sud", "Clinique Central"]

  // Fonction pour récupérer les gardes
    const fetchGardes = async () => {
      try {
          setLoading(true);
          const res = await axios.get("http://localhost:8000/api/gardes", {
              headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
          });

          // Utilisez res.data.gardes au lieu de res.data
          const filteredGardes = res.data;

          // Transformation des données
          const transformedGardes = filteredGardes.map((garde) => ({
              id: garde.id,
              infirmier: garde.infirmier 
                  ? `${garde.infirmier.nom} ${garde.infirmier.prenom}`
                  : `Infirmier ${garde.infirmier_id}`,
              infirmier_id: garde.infirmier_id,
              service: garde.service,
              etablissement: garde.etablissement?.name || garde.etablissement,
              date: garde.date,
              heure_debut: garde.heure_debut,
              heure_fin: garde.heure_fin,
              statut: garde.statut,
              type: garde.type,
          }));

          setGardes(transformedGardes);
          setError(null);
      } catch (err) {
          console.error("Erreur lors de la récupération des gardes:", err);
          setError("Impossible de charger les gardes. Vérifiez votre connexion.");
      } finally {
          setLoading(false);
      }
  };

  // Fonction pour récupérer les demandes d'échange
  const fetchEchanges = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/echanges", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      // Transformation des données
      const transformedEchanges = res.data.map((echange) => ({
        id: echange.id,
        demandeur:
          echange.demandeur?.nom && echange.demandeur?.prenom
            ? `${echange.demandeur.nom} ${echange.demandeur.prenom}`
            : `Utilisateur ${echange.demandeur_id}`,
        cible:
          echange.cible?.nom && echange.cible?.prenom
            ? `${echange.cible.nom} ${echange.cible.prenom}`
            : `Utilisateur ${echange.cible_id}`,
        dateOrigine: echange.date_origine,
        dateCible: echange.date_cible,
        motif: echange.motif,
        statut: echange.statut.replace(" ", "_"),
      }))

      setDemandesEchange(transformedEchanges)
    } catch (err) {
      console.error("Erreur lors de la récupération des échanges:", err)
    }
  }

  // Fonction pour récupérer la liste des infirmiers - CORRIGÉE
  const fetchInfirmiers = async () => {
      try {
          const userRes = await axios.get("http://localhost:8000/api/user", {
              headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
          });
          
          const etablissementId = userRes.data.etablissement_id;
          let url = "http://localhost:8000/api/infirmiers";
          
          if (etablissementId) {
              url += `?etablissement_id=${etablissementId}`;
          }

          const res = await axios.get(url, {
              headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
          });

          setInfirmiers(res.data);
      } catch (err) {
          console.error("Erreur lors de la récupération des infirmiers:", err);
          setInfirmiers([]);
      }
  };

  // Fonction pour ajouter une garde
  const ajouterGarde = async (formData) => {
    try {
      setLoading(true)

      const gardeData = {
        infirmier_id: Number.parseInt(formData.get("infirmier_id")),
        service: formData.get("service"),
        etablissement: formData.get("etablissement"),
        date: formData.get("date"),
        heure_debut: formData.get("heure_debut"),
        heure_fin: formData.get("heure_fin"),
      }

      await axios.post("http://localhost:8000/api/gardes", gardeData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      await fetchGardes() // Recharger les gardes
      setSuccess("Garde ajoutée avec succès !")
      setShowAddModal(false)

      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error("Erreur lors de l'ajout de la garde:", err)
      setError(err.response?.data?.message || "Erreur lors de l'ajout de la garde")
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour valider un échange
  const validerEchange = async (echangeId) => {
    try {
      await axios.put(
        `http://localhost:8000/api/echanges/${echangeId}/valider`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      )

      await fetchEchanges() // Recharger les échanges
      setSuccess("Échange approuvé avec succès !")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error("Erreur lors de la validation de l'échange:", err)
      setError("Erreur lors de la validation de l'échange")
      setTimeout(() => setError(null), 5000)
    }
  }

  // Fonction pour refuser un échange
  const refuserEchange = async (echangeId) => {
    try {
      await axios.put(
        `http://localhost:8000/api/echanges/${echangeId}/refuser`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      )

      await fetchEchanges() // Recharger les échanges
      setSuccess("Échange refusé !")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error("Erreur lors du refus de l'échange:", err)
      setError("Erreur lors du refus de l'échange")
      setTimeout(() => setError(null), 5000)
    }
  }

  // Charger les données au montage du composant
  useEffect(() => {
    fetchGardes()
    fetchEchanges()
    fetchInfirmiers()
  }, [])

  // Fonctions utilitaires
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i)
      days.push({ date: prevDate, isCurrentMonth: false })
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      days.push({ date, isCurrentMonth: true })
    }

    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day)
      days.push({ date: nextDate, isCurrentMonth: false })
    }

    return days
  }

  const getGardesForDate = (date) => {
    const dateStr = date.toISOString().split("T")[0]
    return gardes.filter((garde) => garde.date === dateStr)
  }

  const getStatusColor = (statut) => {
    switch (statut) {
      case "confirmee":
      case "confirmée":
        return "status-confirmed"
      case "en_attente":
        return "status-pending"
      case "annulee":
      case "annulée":
        return "status-cancelled"
      case "approuvee":
      case "approuvée":
        return "status-confirmed"
      case "refusee":
      case "refusée":
        return "status-cancelled"
      default:
        return "status-default"
    }
  }

  const formatMonth = (date) => {
    return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
  }

  // Composant Modal d'ajout de garde
  const AddGardeModal = () => {
    const handleSubmit = async (e) => {
      e.preventDefault()
      const formData = new FormData(e.target)
      await ajouterGarde(formData)
    }

    return (
      <div className="modal-overlay">
        <div className="modal-content add-garde-modal">
          <div className="modal-header">
            <h3 className="modal-title">
              <Plus className="modal-icon" />
              Ajouter une garde
            </h3>
            <button onClick={() => setShowAddModal(false)} className="modal-close-btn" disabled={loading}>
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <form className="modal-form" onSubmit={handleSubmit}>
            <div className="form-group-edt">
              <label className="form-label">
                <Users className="form-icon" />
                Infirmier/Anesthésiste
              </label>
              <select name="infirmier_id" className="form-select" required disabled={loading}>
                <option value="">Sélectionner un infirmier</option>
                {infirmiers.map((infirmier) => (
                  <option key={infirmier.id} value={infirmier.id}>
                    {infirmier.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                <MapPin className="form-icon" />
                Service
              </label>
              <select name="service" className="form-select" required disabled={loading}>
                <option value="">Sélectionner un service</option>
                {services.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                <MapPin className="form-icon" />
                Établissement
              </label>
              <select name="etablissement" className="form-select" required disabled={loading}>
                <option value="">Sélectionner un établissement</option>
                {etablissements.map((etablissement) => (
                  <option key={etablissement} value={etablissement}>
                    {etablissement}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                <Calendar className="form-icon" />
                Date
              </label>
              <input
                type="date"
                name="date"
                className="form-input"
                required
                disabled={loading}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <Clock className="form-icon" />
                  Heure début
                </label>
                <input
                  type="time"
                  name="heure_debut"
                  defaultValue="20:00"
                  className="form-input"
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  <Clock className="form-icon" />
                  Heure fin
                </label>
                <input
                  type="time"
                  name="heure_fin"
                  defaultValue="08:00"
                  className="form-input"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="btn btn-secondary"
                disabled={loading}
              >
                Annuler
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="btn-icon-edt animate-spin" />
                    Ajout en cours...
                  </>
                ) : (
                  <>
                    <Plus className="btn-icon-edt" />
                    Ajouter la garde
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // Composant Modal des échanges
  const ExchangeModal = () => (
    <div className="modal-overlay">
      <div className="modal-content exchange-modal">
        <div className="modal-header">
          <h3 className="modal-title">
            <AlertCircle className="modal-icon" />
            Demandes d'échange de gardes
          </h3>
          <button onClick={() => setShowExchangeModal(false)} className="modal-close-btn">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="exchange-list">
          {demandesEchange.length === 0 ? (
            <div className="no-exchanges">
              <p>Aucune demande d'échange en cours</p>
            </div>
          ) : (
            demandesEchange.map((demande) => (
              <div key={demande.id} className="exchange-item">
                <div className="exchange-header">
                  <div className="exchange-info">
                    <h4 className="exchange-title">
                      {demande.demandeur} → {demande.cible}
                    </h4>
                    <p className="exchange-dates">
                      Échange: {demande.dateOrigine} ↔ {demande.dateCible}
                    </p>
                  </div>
                  <span className={`status-badge ${getStatusColor(demande.statut)}`}>
                    {demande.statut.replace("_", " ")}
                  </span>
                </div>

                <p className="exchange-motif">
                  <strong>Motif:</strong> {demande.motif}
                </p>

                {demande.statut === "en_attente" && (
                  <div className="exchange-actions">
                    <button className="btn btn-success btn-sm" onClick={() => validerEchange(demande.id)}>
                      <Check className="w-4 h-4" />
                      Approuver
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => refuserEchange(demande.id)}>
                      <X className="w-4 h-4" />
                      Refuser
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )

  return (
          <div className="planning-page">
            {/* Messages d'erreur et de succès */}
            {error && (
              <div className="alert alert-error">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                <CheckCircle className="w-5 h-5" />
                {success}
              </div>
            )}

            {/* Header */}
            <header className="page-header-edt">
              <div className="header-content-edt">
                <div className="header-left-edt">
                  <div className="header-icon-edt">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <h1 className="page-title">Gestion des Emplois du Temps</h1>
                </div>

                <div className="header-actions">
                  {/* <button onClick={() => setShowExchangeModal(true)} className="notification-btn">
                    <Bell className="w-6 h-6" />
                    {demandesEchange.filter((d) => d.statut === "en_attente").length > 0 && (
                      <span className="notification-badge">
                        {demandesEchange.filter((d) => d.statut === "en_attente").length}
                      </span>
                    )}
                  </button>
                  <button className="settings-btn">
                    <Settings className="w-6 h-6" />
                  </button> */}
                  <button
                    onClick={() => {
                      fetchGardes()
                      fetchEchanges()
                    }}
                    className="settings-btn"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <RefreshCw className="w-6 h-6" />}
                  </button>
                </div>
              </div>
            </header>

            <div className="page-content-edt">
              <div className="content-grid">
                {/* Panel de contrôle */}
                <div className="sidebar-panel">
                  {/* Actions rapides */}
                  <div className="panel-card">
                    <h3 className="panel-title">Actions rapides</h3>
                    <div className="quick-actions">
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="btn btn-primary btn-full"
                        disabled={loading}
                      >
                        <Plus className="btn-icon-edt" />
                        Ajouter une garde
                      </button>
                      <button onClick={() => setShowExchangeModal(true)} className="btn btn-success btn-full">
                        <AlertCircle className="btn-icon" />
                        Demandes d'échange
                        {demandesEchange.filter((d) => d.statut === "en_attente").length > 0 && (
                          <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            {demandesEchange.filter((d) => d.statut === "en_attente").length}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Filtres */}
                  <div className="panel-card">
                    <h3 className="panel-title">Filtres</h3>
                    <div className="filters">
                      <div className="filter-group">
                        <label className="filter-label">Service</label>
                        <select
                          value={filterService}
                          onChange={(e) => setFilterService(e.target.value)}
                          className="filter-select"
                        >
                          <option value="all">Tous les services</option>
                          {services.map((service) => (
                            <option key={service} value={service}>
                              {service}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="filter-group">
                        <label className="filter-label">Vue</label>
                        <div className="view-toggle">
                          {["month", "week", "day"].map((mode) => (
                            <button
                              key={mode}
                              onClick={() => setViewMode(mode)}
                              className={`view-btn ${viewMode === mode ? "active" : ""}`}
                            >
                              {mode === "month" ? "Mois" : mode === "week" ? "Semaine" : "Jour"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Prochaines gardes */}
                  <div className="panel-card">
                    <h3 className="panel-title">Prochaines gardes</h3>
                    <div className="upcoming-guards">
                      {loading ? (
                        <div className="loading-state">
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span>Chargement...</span>
                        </div>
                      ) : gardes.length === 0 ? (
                        <div className="no-data">
                          <p>Aucune garde planifiée</p>
                        </div>
                      ) : (
                        gardes.slice(0, 3).map((garde) => (
                          <div key={garde.id} className="guard-item">
                            <div className="guard-info">
                              <p className="guard-name">{garde.infirmier}</p>
                              <p className="guard-service">{garde.service}</p>
                              <p className="guard-date">{garde.date}</p>
                            </div>
                            <span className={`status-badge ${getStatusColor(garde.statut)}`}>
                              {garde.statut === "confirmée" || garde.statut === "confirmee"
                                ? "Confirmée"
                                : garde.statut === "refusée" || garde.statut === "refusee"
                                ? "Refusée"
                                : "En attente"}
                            </span>

                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Calendrier principal */}
                <div className="calendar-section">
                  <div className="calendar-container">
                    {/* En-tête du calendrier */}
                    <div className="calendar-header">
                      <div className="calendar-nav">
                        <button
                          onClick={() =>
                            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
                          }
                          className="nav-btn"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h2 className="calendar-title">{formatMonth(currentDate)}</h2>
                        <button
                          onClick={() =>
                            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
                          }
                          className="nav-btn"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>

                      <button onClick={() => setCurrentDate(new Date())} className="btn btn-outline">
                        Aujourd'hui
                      </button>
                    </div>

                    {/* Grille du calendrier */}
                    <div className="calendar-grid">
                      {/* Jours de la semaine */}
                      <div className="weekdays">
                        {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map((day) => (
                          <div key={day} className="weekday">
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Grille des jours */}
                      <div className="days-grid">
                        {getDaysInMonth(currentDate).map((day, index) => {
                          const gardesOfDay = getGardesForDate(day.date)
                          const isToday = day.date.toDateString() === new Date().toDateString()

                          return (
                            <div
                              key={index}
                              className={`calendar-day ${
                                day.isCurrentMonth ? "current-month" : "other-month"
                              } ${isToday ? "today" : ""}`}
                              onClick={() => setSelectedDate(day.date)}
                            >
                              <div className="day-number">{day.date.getDate()}</div>

                              <div className="day-guards">
                                {gardesOfDay
                                  .filter((garde) => {
                                    if (filterService === "all") return true
                                    return garde.service === filterService
                                  })
                                  .map((garde) => (
                                    <div
                                      key={garde.id}
                                      className={`guard-badge ${getStatusColor(garde.statut)}`}
                                      title={`${garde.infirmier} - ${garde.service} (${garde.heureDebut}-${garde.heureFin})`}
                                    >
                                      <div className="guard-name">{garde.infirmier}</div>
                                      <div className="guard-service">{garde.service}</div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modals */}
            {showAddModal && <AddGardeModal />}
            {showExchangeModal && <ExchangeModal />}
          </div>
  )
}

export default EmploitDuTempsDocteurPage
