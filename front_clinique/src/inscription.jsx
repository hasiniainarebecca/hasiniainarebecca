import { useState, useEffect } from "react"
import axios from "axios"
import { useNavigate, Link } from "react-router-dom"
import { Shield } from "./components/Icons"
import "./styles/Register.css"

const Register = () => {
  const [pharmacies, setPharmacies] = useState([])
  const [etablissementId, setEtablissementId] = useState("")
  const [etablissements, setEtablissements] = useState([])
  const [nouvelEtablissement, setNouvelEtablissement] = useState(false)
  const [etablissementData, setEtablissementData] = useState({
    name: "",
    address: "",
  })
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    sexe: "",
    email: "",
    phone: "",
    photo: "",
    password: "",
    confirmPassword: "",
    role: "",
  })

  const [additionalData, setAdditionalData] = useState({
    date_naissance: "",
    medical_id: "",
    medical_history: "",
    emergency_contact: "",
    speciality: "",
    licence_number: "",
    annee_experience: "",
    cv: null,
    disponibilite: "",
    poste: "",
    experience_year: "",
    skills: "",
    horaire: "",
    // Champs pour pharmacien
    diplome: "",
    certification: null,
    pharmacie_existante: "",
    nouvelle_pharmacie: false,
    nom_pharmacie: "",
    adresse_pharmacie: "",
    horaires_pharmacie: "",
    type_pharmacie: "",
  })

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/establishments")
      .then((response) => {
        console.log("Établissements récupérés:", response.data)
        if (response.data && Array.isArray(response.data)) {
          setEtablissements(response.data)
        }
      })
      .catch((error) => {
        console.error("Erreur API établissements:", error)
        setEtablissements([])
      })
  }, [])

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/pharmacies")
      .then((response) => {
        setPharmacies(response.data)
      })
      .catch((error) => {
        console.error("Erreur lors de la récupération des pharmacies :", error)
      })
  }, [])

  const handleChange = (e) => {
    const { name, value, files } = e.target
    if (files) {
      setFormData((prevState) => ({
        ...prevState,
        [name]: files[0],
      }))
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [name]: value,
      }))
    }
  }

  const handleSexeChange = (e) => {
    const sexe = e.target.value
    setFormData((prevState) => ({
      ...prevState,
      sexe,
    }))
  }

  const handleRoleChange = (e) => {
    const role = e.target.value
    setFormData((prevState) => ({
      ...prevState,
      role,
    }))

    // Réinitialisation des champs additionnels selon le rôle
    setAdditionalData({
      date_naissance: "",
      medical_id: "",
      medical_history: "",
      emergency_contact: "",
      speciality: "",
      licence_number: "",
      annee_experience: "",
      cv: null,
      disponibilite: "",
      poste: "",
      experience_year: "",
      skills: "",
      horaire: "",
      // Champs pour pharmacien
      diplome: "",
      certification: "",
      pharmacie_existante: "",
      nouvelle_pharmacie: false,
      nom_pharmacie: "",
      adresse_pharmacie: "",
      horaires_pharmacie: "",
      type_pharmacie: "",
    })

    // Réinitialiser les champs d'établissement
    setEtablissementId("")
    setNouvelEtablissement(false)
    setEtablissementData({ name: "", address: "" })
  }

  const handleAdditionalChange = (e) => {
    const { name, value, files, type, checked } = e.target
    setAdditionalData((prevState) => ({
      ...prevState,
      [name]: type === "checkbox" ? checked : files ? files[0] : value,
    }))
  }

  const handleEtablissementChange = (e) => {
    const { name, value } = e.target
    setEtablissementData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation côté client pour les établissements
    if (formData.role === "infirmier" || formData.role === "docteur") {
      if (!etablissementId && !nouvelEtablissement) {
        alert("Veuillez sélectionner un établissement ou créer un nouveau")
        return
      }

      if (nouvelEtablissement && !etablissementData.name.trim()) {
        alert("Veuillez remplir le nom de l'établissement")
        return
      }
    }

    // Vérifier qu'on n'a pas les deux à la fois
      if (etablissementId && nouvelEtablissement) {
        alert("Veuillez choisir soit un établissement existant, soit créer un nouveau")
        return
      }


    // Création du FormData
    const form = new FormData()
    const dataToSend = { ...formData }
    dataToSend.password_confirmation = formData.confirmPassword
    delete dataToSend.confirmPassword

    // Gestion des établissements pour docteurs/infirmiers
    if (formData.role === "infirmier" || formData.role === "docteur") {
      if (nouvelEtablissement) {
        form.append("nouvel_etablissement", "1")
        form.append("nom_etablissement", etablissementData.name)
        if (etablissementData.address) {
          form.append("adresse_etablissement", etablissementData.address)
        }
      } else {
        form.append("etablissement_id", etablissementId)
      }
    }

    // Ajout des champs principaux dans FormData
    Object.entries(dataToSend).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        form.append(key, value)
      }
    })

    // Ajout des champs additionnels
    Object.entries(additionalData).forEach(([key, value]) => {
      if (formData.role !== "pharmacien" && (key.startsWith("pharmacie_") || key === "nouvelle_pharmacie")) return

      if (value !== null && value !== undefined) {
        if (value instanceof File) {
          if (value.name) {
            form.append(key, value)
          }
        } else {
          form.append(key, typeof value === "boolean" ? (value ? "1" : "0") : value)
        }
      }
    })

    // Debug: Afficher ce qui est envoyé
    console.log("Données envoyées:")
    for (const [key, value] of form.entries()) {
      console.log(key, value)
    }

    try {
      const response = await axios.post("http://127.0.0.1:8000/api/inscription", form, {
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
      })

      alert("Inscription réussie !")

      if (response.data?.user?.role) {
        navigate("/connexion")
        // navigate(`/dashboard/${response.data.user.role}`)
      } else {
        navigate("/")
      }
    } catch (error) {
      if (error.response) {
        console.log("Erreur Laravel :", error.response.data)
        alert("Erreur lors de l'inscription : " + JSON.stringify(error.response.data))
      } else {
        console.log("Erreur inconnue :", error.message)
        alert("Erreur inconnue lors de l'inscription")
      }
    }
  }

return (
  <div className="div">
    <header className="giss-header">
                        <div className="giss-logo">
                            <Shield />
                            <span className="giss-logo-text">GISS</span>
                        </div>
                        <nav className="giss-nav-links">
                            <Link to="/" className="giss-login-btn">
                                Page d'accueil
                            </Link>
                            <Link to="/connexion" className="giss-register-btn">
                                Connexion
                            </Link>
                        </nav>
                    </header>
 
    <div className="auth-container">
      <div className="login-card-description"></div>
      <div className="auth-card">
        <h1>Créer un compte</h1>
        <div className="login-icon-container">
                                        <Shield className="login-icon" />
                                    </div>
        <p className="auth-subtitle">Inscrivez-vous pour accéder à la plateforme GISS</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <div className="input-flex">
              <div className="form-group">
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  placeholder="Nom"
                  required
                />
              </div>

              <div className="form-group">
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  placeholder="Prénom"
                  required
                />
              </div>
            </div>

            <div className="input-flex">
              <div className="form-group">
                <select name="sexe" value={formData.sexe} onChange={handleSexeChange} required>
                  <option value="">Sexe</option>
                  <option value="Homme">Homme</option>
                  <option value="Femme">Femme</option>
                </select>
              </div>

              <div className="form-group">
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Téléphone"
                  required
                />
              </div>
            </div>

            <div className="input-flex">
              <div className="form-group">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              required
            />
            </div>
            </div>

            <div className="input-flex">
              <div className="form-group">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Mot de passe"
              required
            />
            </div>

            <div className="form-group">
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirmer le mot de passe"
              required
            />
            </div>
            </div>

            <div className="form-group">
              <label>Photo d'identité</label>
              <input type="file" name="photo" onChange={handleChange} />
            </div>

            <select name="role" value={formData.role} onChange={handleRoleChange} required>
              <option value="">Type de compte</option>
              <option value="patient">Patient</option>
              <option value="docteur">Docteur</option>
              <option value="infirmier">Infirmier/Anesthésiste</option>
              <option value="pharmacien">Pharmacien</option>
            </select>
              

              {/* Sections spécifiques par rôle */}
              {formData.role === "patient" && (
                <div className="additional-fields">
                  <h3>Informations supplémentaires</h3>

                  <div className="input-flex">
                    <div className="form-group">
                      <label htmlFor="date_naissance">Date de naissance</label>
                      <input
                        type="date"
                        name="date_naissance"
                        value={additionalData.date_naissance}
                        onChange={handleAdditionalChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="medical_id">ID médical</label>
                      <input
                        type="text"
                        name="medical_id"
                        value={additionalData.medical_id}
                        onChange={handleAdditionalChange}
                        placeholder="ID médical"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="medical_history">Antécédents médicaux</label>
                    <textarea
                      name="medical_history"
                      value={additionalData.medical_history}
                      onChange={handleAdditionalChange}
                      placeholder="Antécédents médicaux"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="emergency_contact">Contact d'urgence</label>
                    <input
                      type="text"
                      name="emergency_contact"
                      value={additionalData.emergency_contact}
                      onChange={handleAdditionalChange}
                      placeholder="Contact d'urgence"
                      required
                    />
                  </div>
                </div>
              )}

              {formData.role === "docteur" && (
                <div className="additional-fields">
                  <h3>Informations professionnelles</h3>

                  <div className="input-flex">
                    <div className="form-group">
                      <label htmlFor="speciality">Spécialité</label>
                      <select
                        name="speciality"
                        value={additionalData.speciality}
                        onChange={handleAdditionalChange}
                        required
                      >
                        <option value="">Sélectionner une spécialité</option>
                        <option value="Cardiologie">Cardiologie</option>
                        <option value="Dermatologie">Dermatologie</option>
                        <option value="Médecine générale">Médecine générale</option>
                        <option value="Ophtalmologie">Ophtalmologie</option>
                        <option value="Pédiatrie">Pédiatrie</option>
                        <option value="Psychiatrie">Psychiatrie</option>
                        <option value="Radiologie">Radiologie</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="licence_number">Numéro de licence</label>
                      <input
                        className="licence_number"
                        type="text"
                        name="licence_number"
                        value={additionalData.licence_number}
                        onChange={handleAdditionalChange}
                        placeholder="Numéro de licence"
                        required
                      />
                    </div>
                  </div>

                  <div className="input-flex">
                    <div className="form-group">
                      <label htmlFor="annee_experience">Années d'expérience</label>
                      <input
                        type="number"
                        name="annee_experience"
                        value={additionalData.annee_experience}
                        onChange={handleAdditionalChange}
                        placeholder="Années d'expérience"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="cv">CV</label>
                      <input type="file" name="cv" onChange={handleAdditionalChange} required />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="disponibilite">Disponibilité</label>
                    <input
                      type="text"
                      name="disponibilite"
                      value={additionalData.disponibilite}
                      onChange={handleAdditionalChange}
                      placeholder="Disponibilité"
                      required
                    />
                  </div>
                </div>
              )}

              {formData.role === "infirmier" && (
                <div className="additional-fields">
                  <h3>Informations professionnelles</h3>

                  <div className="input-flex">
                    <div className="form-group">
                      <label htmlFor="poste">Poste</label>
                      <input
                        type="text"
                        name="poste"
                        value={additionalData.poste}
                        onChange={handleAdditionalChange}
                        placeholder="Poste"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="experience_year">Années d'expérience</label>
                      <input
                        type="number"
                        name="experience_year"
                        value={additionalData.experience_year}
                        onChange={handleAdditionalChange}
                        placeholder="Années d'expérience"
                        required
                      />
                    </div>
                  </div>

                  <div className="input-flex">
                    <div className="form-group">
                      <label htmlFor="skills">Compétences</label>
                      <input
                        type="text"
                        name="skills"
                        value={additionalData.skills}
                        onChange={handleAdditionalChange}
                        placeholder="Compétences"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="horaire">Horaires</label>
                      <input
                        type="text"
                        name="horaire"
                        value={additionalData.horaire}
                        onChange={handleAdditionalChange}
                        placeholder="Horaires"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.role === "pharmacien" && (
                <div className="additional-fields pharmacist-fields">
                  <h3>Informations professionnelles</h3>

                  <div className="input-flex">
                    <div className="form-group">
                      <label htmlFor="diplome">Diplôme</label>
                      <input
                        type="text"
                        name="diplome"
                        value={additionalData.diplome}
                        onChange={handleAdditionalChange}
                        placeholder="Diplôme de pharmacien"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="certification">Votre certificat</label>
                      <input type="file" name="certification" onChange={handleAdditionalChange} required />
                    </div>
                  </div>

                  <div className="input-flex">
                    <div className="form-group">
                      <label htmlFor="licence_number">Numéro de licence</label>
                      <input
                        type="text"
                        name="licence_number"
                        value={additionalData.licence_number}
                        onChange={handleAdditionalChange}
                        placeholder="Numéro de licence"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="annee_experience">Années d'expérience</label>
                      <input
                        type="number"
                        name="annee_experience"
                        value={additionalData.annee_experience}
                        onChange={handleAdditionalChange}
                        placeholder="Années d'expérience"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="pharmacie_existante">Sélectionner une pharmacie existante</label>
                    <select
                      name="pharmacie_existante"
                      value={additionalData.pharmacie_existante}
                      onChange={handleAdditionalChange}
                    >
                      <option value="">Sélectionner une pharmacie</option>
                      {pharmacies.map((pharmacie) => (
                        <option key={pharmacie.id} value={pharmacie.id}>
                          {pharmacie.nom}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group pharmacy-creation">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="nouvelle_pharmacie"
                        checked={additionalData.nouvelle_pharmacie}
                        onChange={handleAdditionalChange}
                      />
                      Inscrire une nouvelle pharmacie
                    </label>
                  </div>

                  {additionalData.nouvelle_pharmacie && (
                    <div className="new-pharmacy-section">
                      <h4>Informations de la nouvelle pharmacie</h4>

                      <div className="input-flex">
                        <div className="form-group">
                          <label htmlFor="nom_pharmacie">Nom de la pharmacie</label>
                          <input
                            type="text"
                            name="nom_pharmacie"
                            value={additionalData.nom_pharmacie}
                            onChange={handleAdditionalChange}
                            placeholder="Nom de la pharmacie"
                            required={additionalData.nouvelle_pharmacie}
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="type_pharmacie">Type de pharmacie</label>
                          <select
                            className="type_pharmacie"
                            name="type_pharmacie"
                            value={additionalData.type_pharmacie}
                            onChange={handleAdditionalChange}
                            required={additionalData.nouvelle_pharmacie}
                          >
                            <option value="">Sélectionner un type</option>
                            <option value="publique">Publique</option>
                            <option value="privee">Privée</option>
                            <option value="specialisee">Spécialisée</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="adresse_pharmacie">Adresse complète</label>
                        <input
                          type="text"
                          name="adresse_pharmacie"
                          value={additionalData.adresse_pharmacie}
                          onChange={handleAdditionalChange}
                          placeholder="Adresse de la pharmacie"
                          required={additionalData.nouvelle_pharmacie}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="horaires_pharmacie">Horaires d'ouverture</label>
                        <input
                          type="text"
                          name="horaires_pharmacie"
                          value={additionalData.horaires_pharmacie}
                          onChange={handleAdditionalChange}
                          placeholder="Ex: Lun-Ven: 8h-19h, Sam: 9h-17h"
                          required={additionalData.nouvelle_pharmacie}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Section établissement pour docteurs et infirmiers */}
              {(formData.role === "infirmier" || formData.role === "docteur") && (
                <div className="additional-fields">
                  <h3>Établissement</h3>

                  <div className="form-group">
                    <label>Sélectionner un établissement</label>
                    <select
                      value={etablissementId}
                      onChange={(e) => setEtablissementId(e.target.value)}
                      required={!nouvelEtablissement}
                      disabled={nouvelEtablissement}
                    >
                      <option value="">-- Sélectionner un établissement --</option>
                      {Array.isArray(etablissements) &&
                        etablissements.map((est) => (
                          <option key={est.id} value={est.id}>
                            {est.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={nouvelEtablissement}
                        onChange={(e) => {
                          setNouvelEtablissement(e.target.checked)
                          if (e.target.checked) {
                            setEtablissementId("")
                          }
                        }}
                      />
                      Créer un nouvel établissement
                    </label>
                  </div>

                  {nouvelEtablissement && (
                    <div className="new-establishment-section">
                      <h4>Informations du nouvel établissement</h4>

                      <div className="form-group">
                        <label htmlFor="establishment_name">Nom de l'établissement *</label>
                        <input
                          type="text"
                          name="name"
                          value={etablissementData.name}
                          onChange={handleEtablissementChange}
                          placeholder="Nom de l'établissement"
                          required={nouvelEtablissement}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="establishment_address">Adresse de l'établissement</label>
                        <input
                          type="text"
                          name="address"
                          value={etablissementData.address}
                          onChange={handleEtablissementChange}
                          placeholder="Adresse de l'établissement"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
              </div>

          <button type="submit" className="login-button">
            S'inscrire
          </button>
        </form>

        <div className="auth-footer">
          Vous avez déjà un compte? <Link to="/connexion">Se connecter</Link>
        </div>
      </div>
    </div>
     </div>
  )
}

export default Register