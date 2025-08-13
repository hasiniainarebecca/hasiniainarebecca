import { useState, useEffect } from "react"
import axios from "axios"
import {
  Calendar,
  Clock,
  Plus,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  XCircle,
  User,
  MapPin,
  RefreshCw,
  CheckCircle,
  Send,
  Loader2,
  AlertCircle,
  Check,
  X,
} from "lucide-react"
import "./styles/EdtInfirmier.css"

const EmploiTempsInfirmierPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [showExchangeModal, setShowExchangeModal] = useState(false)
  const [showDisponibiliteModal, setShowDisponibiliteModal] = useState(false)
  const [showNotificationsModal, setShowNotificationsModal] = useState(false)
  const [showGardesEnAttenteModal, setShowGardesEnAttenteModal] = useState(false)
  const [viewMode, setViewMode] = useState("month")
  const [filterStatut, setFilterStatut] = useState("all")

  // États pour les données
  const [gardes, setGardes] = useState([])
  const [demandesEchange, setDemandesEchange] = useState([])
  const [infirmiers, setInfirmiers] = useState([])
  const [infirmierConnecte, setInfirmierConnecte] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Données statiques
  const services = ["Urgences", "Réanimation", "Chirurgie", "Pédiatrie", "Cardiologie"]
  const etablissements = ["CHU Nord", "CHU Sud", "Clinique Central"]

  // Notifications statiques (à remplacer par une API plus tard)
  const notifications = [
    {
      id: 1,
      type: "garde_confirmee",
      message: "Votre garde du 20/01/2024 a été confirmée",
      date: "2024-01-10",
      lu: false,
    },
    {
      id: 2,
      type: "echange_accepte",
      message: "Votre demande d'échange avec Jean Martin a été acceptée",
      date: "2024-01-09",
      lu: false,
    },
    {
      id: 3,
      type: "nouvelle_garde",
      message: "Une nouvelle garde vous a été assignée le 25/01/2024",
      date: "2024-01-08",
      lu: true,
    },
  ]

  // Fonction pour récupérer l'utilisateur connecté
  const fetchUserProfile = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/user", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      const user = res.data
      setInfirmierConnecte({
        id: user.id,
        nom: `${user.nom} ${user.prenom}`,
        role: user.role,
        service: user.speciality || "Service non défini",
        etablissement: "CHU Nord", // À adapter selon vos données
      })
    } catch (err) {
      console.error("Erreur lors de la récupération du profil:", err)
      // Fallback avec des données par défaut
      setInfirmierConnecte({
        id: 1,
        nom: "Infirmier Connecté",
        service: "Urgences",
        etablissement: "CHU Nord",
      })
    }
  }

  // Fonction pour récupérer les gardes
  const fetchGardes = async () => {
    try {
      setLoading(true)
      const res = await axios.get("http://localhost:8000/api/gardes", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

       // Filtrer les gardes par établissement de l'infirmier connecté
      const filteredGardes = infirmierConnecte?.etablissement_id
        ? res.data.filter(garde => garde.etablissement_id === infirmierConnecte.etablissement_id)
        : res.data;

      // Transformation des données
      const transformedGardes = filteredGardes.map((garde) => ({
        id: garde.id,
        infirmier:
          garde.infirmier?.nom && garde.infirmier?.prenom
            ? `${garde.infirmier.nom} ${garde.infirmier.prenom}`
            : `Infirmier ${garde.infirmier_id}`,
        infirmier_id: garde.infirmier_id,
        service: garde.service,
        etablissement: garde.etablissement,
        date: garde.date,
        heureDebut: garde.heure_debut,
        heureFin: garde.heure_fin,
        statut: garde.statut.replace("ée", "ee").replace(" ", "_"),
        type: garde.type.replace(" ", "_"),
        estMienne: infirmierConnecte ? garde.infirmier_id === infirmierConnecte.id : false,
        motif_refus: garde.motif_refus,
      }))

      setGardes(transformedGardes)
      setError(null)
    } catch (err) {
      console.error("Erreur lors de la récupération des gardes:", err)
      setError("Impossible de charger les gardes. Vérifiez votre connexion.")
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour récupérer les demandes d'échange
  const fetchEchanges = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/echanges", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
       // Filtrer les échanges impliquant l'infirmier connecté ou ses collègues du même établissement
      const filteredEchanges = infirmierConnecte?.etablissement_id
        ? res.data.filter(echange => {
            const demandeurEtablissement = echange.demandeur?.etablissement_id;
            const cibleEtablissement = echange.cible?.etablissement_id;
            return demandeurEtablissement === infirmierConnecte.etablissement_id || 
                  cibleEtablissement === infirmierConnecte.etablissement_id;
          })
        : res.data;

      // Transformation des données
      const transformedEchanges = filteredEchanges.map((echange) => ({
        id: echange.id,
        demandeur:
          echange.demandeur?.nom && echange.demandeur?.prenom
            ? `${echange.demandeur.nom} ${echange.demandeur.prenom}`
            : `Utilisateur ${echange.demandeur_id}`,
        cible:
          echange.cible?.nom && echange.cible?.prenom
            ? `${echange.cible.nom} ${echange.cible.prenom}`
            : `Utilisateur ${echange.cible_id}`,
        demandeur_id: echange.demandeur_id,
        cible_id: echange.cible_id,
        dateOrigine: echange.date_origine,
        dateCible: echange.date_cible,
        motif: echange.motif,
        statut: echange.statut.replace(" ", "_"),
        estMaDemande: infirmierConnecte ? echange.demandeur_id === infirmierConnecte.id : false,
      }))

      setDemandesEchange(transformedEchanges)
    } catch (err) {
      console.error("Erreur lors de la récupération des échanges:", err)
    }
  }

  // Fonction pour récupérer la liste des infirmiers
  const fetchInfirmiers = async () => {
    try {
    const user = await axios.get("http://localhost:8000/api/user", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const userEtablissement = user.data.etablissement_id;
    let url = "http://localhost:8000/api/users?role=infirmier";
    
    if (userEtablissement) {
      url += `&etablissement_id=${userEtablissement}`;
    }

    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
      setInfirmiers(res.data)
    } catch (err) {
      console.error("Erreur lors de la récupération des infirmiers:", err)
      // Fallback avec des données statiques
      setInfirmiers([
        { id: 1, name: "Marie Dubois" },
        { id: 2, name: "Jean Martin" },
        { id: 3, name: "Sophie Laurent" },
        { id: 4, name: "Pierre Moreau" },
      ])
    }
  }

  // Fonction pour accepter une garde
  const accepterGarde = async (gardeId) => {
    try {
      setLoading(true)
      await axios.put(
        `http://localhost:8000/api/gardes/${gardeId}/accepter`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      )

      await fetchGardes() // Recharger les gardes
      setSuccess("Garde acceptée avec succès !")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error("Erreur lors de l'acceptation de la garde:", err)
      setError(err.response?.data?.message || "Erreur lors de l'acceptation de la garde")
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour refuser une garde
  const refuserGarde = async (gardeId, motifRefus = "") => {
    try {
      setLoading(true)
      await axios.put(
      `http://localhost:8000/api/gardes/${gardeId}/refuser`,
      { motif_refus: motifRefus },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          'Content-Type': 'application/json',  // important !
        },
      }
    )

      await fetchGardes() // Recharger les gardes
      setSuccess("Garde refusée !")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error("Erreur lors du refus de la garde:", err)
      setError(err.response?.data?.message || "Erreur lors du refus de la garde")
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour créer une demande d'échange
  const creerDemandeEchange = async (formData) => {
    try {
      setLoading(true)

      const echangeData = {
        demandeur_id: infirmierConnecte.id,
        cible_id: Number.parseInt(formData.get("cible_id")),
        date_origine: formData.get("date_origine"),
        date_cible: formData.get("date_cible"),
        motif: formData.get("motif"),
      }

      await axios.post("http://localhost:8000/api/echanges", echangeData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      await fetchEchanges() // Recharger les échanges
      setSuccess("Demande d'échange envoyée avec succès !")
      setShowExchangeModal(false)

      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error("Erreur lors de la création de la demande d'échange:", err)
      setError(err.response?.data?.message || "Erreur lors de l'envoi de la demande d'échange")
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  // Charger les données au montage du composant
  useEffect(() => {
    fetchUserProfile()
  }, [])

  // Charger les autres données une fois que l'utilisateur est récupéré
  useEffect(() => {
    if (infirmierConnecte) {
      fetchGardes()
      fetchEchanges()
      fetchInfirmiers()
    }
  }, [infirmierConnecte])

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

  const getMesGardes = () => {
    return gardes.filter((garde) => garde.estMienne)
  }

  const getMesGardesEnAttente = () => {
    return gardes.filter((garde) => garde.estMienne && garde.statut === "en_attente")
  }

  const getStatusColor = (statut, estMienne = false) => {
    const baseClass = estMienne ? "status-mine" : "status-other"
    switch (statut) {
      case "confirmee":
      case "confirmée":
        return `${baseClass} status-confirmed`
      case "en_attente":
        return `${baseClass} status-pending`
      case "annulee":
      case "annulée":
      case "refusee":
      case "refusée":
        return `${baseClass} status-cancelled`
      default:
        return `${baseClass} status-default`
    }
  }

  const formatMonth = (date) => {
    return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
  }

  // Composant Modal des gardes en attente
  const GardesEnAttenteModal = () => {
    const gardesEnAttente = getMesGardesEnAttente()

    return (
      <div className="modal-overlay">
        <div className="modal-content exchange-modal">
          <div className="modal-header">
            <h3 className="modal-title">
              <AlertCircle className="modal-icon" />
              Gardes en attente de validation
            </h3>
            <button onClick={() => setShowGardesEnAttenteModal(false)} className="modal-close-btn" disabled={loading}>
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="exchange-list">
            {gardesEnAttente.length === 0 ? (
              <div className="no-exchanges">
                <p>Aucune garde en attente de validation</p>
              </div>
            ) : (
              gardesEnAttente.map((garde) => (
                <div key={garde.id} className="exchange-item garde-en-attente">
                  <div className="exchange-header">
                    <div className="exchange-info">
                      <h4 className="exchange-title">
                        {garde.service} - {garde.etablissement.name}
                      </h4>
                      <p className="exchange-dates">
                        Date: {garde.date} | {garde.heureDebut} - {garde.heureFin}
                      </p>
                    </div>
                    <span className={`status-badge ${getStatusColor(garde.statut, true)}`}>En attente</span>
                  </div>

                  <p className="exchange-motif">Cette garde vous a été assignée et nécessite votre validation.</p>

                  <div className="exchange-actions">
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => accepterGarde(garde.id)}
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Accepter
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => {
                        const motif = prompt("Motif du refus (optionnel):")
                        refuserGarde(garde.id, motif || "")
                      }}
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                      Refuser
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  // Composant Modal d'échange
  const ExchangeModal = () => {
    const handleSubmit = async (e) => {
      e.preventDefault()
      const formData = new FormData(e.target)
      await creerDemandeEchange(formData)
    }

    return (
      <div className="modal-overlay">
        <div className="modal-content exchange-modal">
          <div className="modal-header">
            <h3 className="modal-title">
              <RefreshCw className="modal-icon" />
              Demander un échange de garde
            </h3>
            <button onClick={() => setShowExchangeModal(false)} className="modal-close-btn" disabled={loading}>
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <form className="modal-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">
                <Calendar className="form-icon" />
                Ma garde à échanger
              </label>
              <select name="date_origine" className="form-select" required disabled={loading}>
                <option value="">Sélectionner une garde</option>
                {getMesGardes()
                  .filter((garde) => garde.statut === "confirmee" || garde.statut === "confirmée")
                  .map((garde) => (
                    <option key={garde.id} value={garde.date}>
                      {garde.date} - {garde.service} ({garde.heureDebut}-{garde.heureFin})
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                <User className="form-icon" />
                Échanger avec
              </label>
              <select name="cible_id" className="form-select" required disabled={loading}>
                <option value="">Sélectionner un collègue</option>
                {infirmiers
                  .filter((inf) => inf.id !== infirmierConnecte?.id)
                  .map((infirmier) => (
                    <option key={infirmier.id} value={infirmier.id}>
                      {infirmier.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                <Calendar className="form-icon" />
                Date souhaitée en échange
              </label>
              <input
                type="date"
                name="date_cible"
                className="form-input"
                required
                disabled={loading}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Motif de la demande</label>
              <textarea
                name="motif"
                className="form-textarea"
                rows="3"
                placeholder="Expliquez brièvement pourquoi vous souhaitez échanger cette garde..."
                required
                disabled={loading}
              ></textarea>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setShowExchangeModal(false)}
                className="btn btn-secondary"
                disabled={loading}
              >
                Annuler
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="btn-icon animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="btn-icon" />
                    Envoyer la demande
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // Composant Modal de disponibilité (statique pour l'instant)
  const DisponibiliteModal = () => (
    <div className="modal-overlay">
      <div className="modal-content disponibilite-modal">
        <div className="modal-header">
          <h3 className="modal-title">
            <CheckCircle className="modal-icon" />
            Indiquer mes disponibilités
          </h3>
          <button onClick={() => setShowDisponibiliteModal(false)} className="modal-close-btn">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <form className="modal-form">
          <div className="form-group">
            <label className="form-label">
              <Calendar className="form-icon" />
              Période de disponibilité
            </label>
            <div className="form-row">
              <input type="date" className="form-input" placeholder="Date début" />
              <input type="date" className="form-input" placeholder="Date fin" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <MapPin className="form-icon" />
              Services préférés
            </label>
            <div className="checkbox-group">
              {services.map((service) => (
                <label key={service} className="checkbox-label">
                  <input type="checkbox" className="checkbox-input" />
                  <span className="checkbox-text">{service}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Clock className="form-icon" />
              Types de garde
            </label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input type="checkbox" className="checkbox-input" defaultChecked />
                <span className="checkbox-text">Garde de nuit (20h-8h)</span>
              </label>
              <label className="checkbox-label">
                <input type="checkbox" className="checkbox-input" />
                <span className="checkbox-text">Garde de jour (8h-20h)</span>
              </label>
              <label className="checkbox-label">
                <input type="checkbox" className="checkbox-input" />
                <span className="checkbox-text">Garde de week-end</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Commentaires</label>
            <textarea
              className="form-textarea"
              rows="2"
              placeholder="Informations supplémentaires sur vos disponibilités..."
            ></textarea>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={() => setShowDisponibiliteModal(false)} className="btn btn-secondary">
              Annuler
            </button>
            <button type="submit" className="btn btn-primary">
              <CheckCircle className="btn-icon" />
              Confirmer mes disponibilités
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  // Composant Modal de notifications
  const NotificationsModal = () => (
    <div className="modal-overlay">
      <div className="modal-content notifications-modal">
        <div className="modal-header">
          <h3 className="modal-title">
            <Bell className="modal-icon" />
            Notifications
          </h3>
          <button onClick={() => setShowNotificationsModal(false)} className="modal-close-btn">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="notifications-list">
          {notifications.map((notification) => (
            <div key={notification.id} className={`notification-item ${notification.lu ? "read" : "unread"}`}>
              <div className="notification-content">
                <div className="notification-icon">
                  {notification.type === "garde_confirmee" && <CheckCircle className="w-5 h-5 text-green-600" />}
                  {notification.type === "echange_accepte" && <RefreshCw className="w-5 h-5 text-blue-600" />}
                  {notification.type === "nouvelle_garde" && <Plus className="w-5 h-5 text-orange-600" />}
                </div>
                <div className="notification-text">
                  <p className="notification-message">{notification.message}</p>
                  <p className="notification-date">{notification.date}</p>
                </div>
              </div>
              {!notification.lu && <div className="notification-badge"></div>}
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button className="btn btn-outline">Marquer tout comme lu</button>
        </div>
      </div>
    </div>
  )

  if (!infirmierConnecte) {
    return (
      <div className="loading-state">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span>Chargement du profil...</span>
      </div>
    )
  }

  return (
          <div className="planning-infirmier-page">
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
            <header className="page-header">
              <div className="header-content">
                <div className="header-left">
                  <div className="header-icon">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <div className="header-info">
                    <h1 className="page-title">Mon Planning</h1>
                    <p className="user-info">
                      {infirmierConnecte.nom} - {infirmierConnecte.role}
                    </p>
                  </div>
                </div>

                <div className="header-actions">
                  <button onClick={() => setShowGardesEnAttenteModal(true)} className="notification-btn">
                    <AlertCircle className="w-6 h-6" />
                    {getMesGardesEnAttente().length > 0 && (
                      <span className="notification-badge">{getMesGardesEnAttente().length}</span>
                    )}
                  </button>
                  {/* <button onClick={() => setShowNotificationsModal(true)} className="notification-btn">
                    <Bell className="w-6 h-6" />
                    {notifications.filter((n) => !n.lu).length > 0 && (
                      <span className="notification-badge">{notifications.filter((n) => !n.lu).length}</span>
                    )}
                  </button> */}
                  {/* <button className="settings-btn">
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

            <div className="page-content">
              <div className="content-grid">
                {/* Panel de contrôle */}
                <div className="sidebar-panel">
                  {/* Actions rapides */}
                  <div className="panel-card">
                    <h3 className="panel-title">Actions rapides</h3>
                    <div className="quick-actions">
                      <button onClick={() => setShowGardesEnAttenteModal(true)} className="btn btn-success btn-full">
                        <AlertCircle className="btn-icon" />
                        Gardes à valider
                        {getMesGardesEnAttente().length > 0 && (
                          <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            {getMesGardesEnAttente().length}
                          </span>
                        )}
                      </button>
                      <button onClick={() => setShowExchangeModal(true)} className="btn btn-primary btn-full">
                        <RefreshCw className="btn-icon" />
                        Demander un échange
                      </button>
                      {/* <button onClick={() => setShowDisponibiliteModal(true)} className="btn btn-success btn-full">
                        <CheckCircle className="btn-icon" />
                        Mes disponibilités
                      </button> */}
                    </div>
                  </div>

                  {/* Mes prochaines gardes */}
                  <div className="panel-card">
                    <h3 className="panel-title">Mes prochaines gardes</h3>
                    <div className="upcoming-guards">
                      {loading ? (
                        <div className="loading-state">
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span>Chargement...</span>
                        </div>
                      ) : getMesGardes().length === 0 ? (
                        <div className="no-data">
                          <p>Aucune garde planifiée</p>
                        </div>
                      ) : (
                        getMesGardes()
                          .slice(0, 3)
                          .map((garde) => (
                            <div key={garde.id} className="guard-item mine">
                              <div className="guard-info">
                                <p className="guard-service">{garde.service}</p>
                                <p className="guard-date">{garde.date}</p>
                                <p className="guard-time">
                                  {garde.heureDebut} - {garde.heureFin}
                                </p>
                              </div>
                              <span className={`status-badge ${getStatusColor(garde.statut, true)}`}>
                                {garde.statut === "confirmee" || garde.statut === "confirmée"
                                  ? "Confirmée"
                                  : garde.statut === "en_attente"
                                    ? "À valider"
                                    : garde.statut === "refusee" || garde.statut === "refusée"
                                      ? "Refusée"
                                      : "En attente"}
                              </span>
                            </div>
                          ))
                      )}
                    </div>
                  </div>

                  {/* Demandes d'échange */}
                  <div className="panel-card">
                    <h3 className="panel-title">Mes demandes d'échange</h3>
                    <div className="exchange-requests">
                      {demandesEchange
                        .filter((d) => d.estMaDemande)
                        .slice(0, 2)
                        .map((demande) => (
                          <div key={demande.id} className="exchange-item">
                            <div className="exchange-info">
                              <p className="exchange-target">→ {demande.cible}</p>
                              <p className="exchange-dates">
                                {demande.dateOrigine} ↔ {demande.dateCible}
                              </p>
                            </div>
                            <span className={`status-badge ${getStatusColor(demande.statut)}`}>
                              {demande.statut.replace("_", " ")}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Filtres */}
                  <div className="panel-card">
                    <h3 className="panel-title">Filtres</h3>
                    <div className="filters">
                      <div className="filter-group">
                        <label className="filter-label">Affichage</label>
                        <select
                          value={filterStatut}
                          onChange={(e) => setFilterStatut(e.target.value)}
                          className="filter-select"
                        >
                          <option value="all">Toutes les gardes</option>
                          <option value="mine">Mes gardes uniquement</option>
                          <option value="others">Gardes des collègues</option>
                        </select>
                      </div>

                      <div className="filter-group">
                        <label className="filter-label">Vue</label>
                        <div className="view-toggle">
                          {["month", "week"].map((mode) => (
                            <button
                              key={mode}
                              onClick={() => setViewMode(mode)}
                              className={`view-btn ${viewMode === mode ? "active" : ""}`}
                            >
                              {mode === "month" ? "Mois" : "Semaine"}
                            </button>
                          ))}
                        </div>
                      </div>
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
                          const mesGardesDuJour = gardesOfDay.filter((g) => g.estMienne)

                          return (
                            <div
                              key={index}
                              className={`calendar-day ${
                                day.isCurrentMonth ? "current-month" : "other-month"
                              } ${isToday ? "today" : ""} ${mesGardesDuJour.length > 0 ? "has-my-guard" : ""}`}
                              onClick={() => setSelectedDate(day.date)}
                            >
                              <div className="day-number">{day.date.getDate()}</div>

                              <div className="day-guards">
                                {gardesOfDay
                                  .filter((garde) => {
                                    if (filterStatut === "mine") return garde.estMienne
                                    if (filterStatut === "others") return !garde.estMienne
                                    return true
                                  })
                                  .map((garde) => (
                                    <div
                                      key={garde.id}
                                      className={`guard-badge ${getStatusColor(garde.statut, garde.estMienne)}`}
                                      title={`${garde.infirmier} - ${garde.service}`}
                                    >
                                      <div className="guard-name">{garde.estMienne ? "MOI" : garde.infirmier}</div>
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
            {showGardesEnAttenteModal && <GardesEnAttenteModal />}
            {showExchangeModal && <ExchangeModal />}
            {showDisponibiliteModal && <DisponibiliteModal />}
            {showNotificationsModal && <NotificationsModal />}
          </div>
        
  )
}

export default EmploiTempsInfirmierPage
