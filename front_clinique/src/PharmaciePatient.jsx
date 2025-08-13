import { useState, useEffect } from "react"
import axios from 'axios'
import { useNavigate } from "react-router-dom"
import { Search, MapPin, Clock, Star, ShoppingBag, Filter, ChevronDown, ChevronUp, Info } from "lucide-react"
import './styles/PharmaciePatient.css'

function PharmaciePatient() {
  const navigate = useNavigate()
  const [pharmacies, setPharmacies] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    location: "",
    openNow: false,
    hasDelivery: false,
    minRating: 0,
  })
  const [expandedPharmacy, setExpandedPharmacy] = useState(null)
  const [expandedFilters, setExpandedFilters] = useState(false)
  const [selectedMedication, setSelectedMedication] = useState(null)
  const [showMedicationModal, setShowMedicationModal] = useState(false)
  const [medicationQuantity, setMedicationQuantity] = useState(1)

  // Simuler le chargement des données des pharmacies
  useEffect(() => {
    const fetchPharmacies = async () => {
      const token = localStorage.getItem('token')
      try {
        const { data } = await axios.get(
          'http://localhost:8000/api/pharmacies/medicament',
          { headers: { Authorization: `Bearer ${token}` } }
        )
        setPharmacies(data)
      } catch (error) {
        console.error('Erreur lors du chargement des pharmacies:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPharmacies()
  }, [])

  // Filtrer les pharmacies en fonction de la recherche et des filtres
  const filteredPharmacies = pharmacies
    .map((pharmacie) => {
      const nomMatch = pharmacie.nom.toLowerCase().includes(searchTerm.toLowerCase());

      const matchingMedications = pharmacie.medications.filter((med) =>
        med.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      const hasMatchingMedication = matchingMedications.length > 0;

      // On retourne les médicaments filtrés si pertinents
      if (nomMatch || hasMatchingMedication) {
        return {
          ...pharmacie,
          medications: hasMatchingMedication ? matchingMedications : pharmacie.medications,
        };
      }

      return null;
    })
    .filter((pharmacy) => pharmacy !== null);


  // Obtenir les emplacements uniques pour le filtre
  const locations = [...new Set(pharmacies.map((pharmacy) => pharmacy.adresse))]

  // Gérer l'expansion des détails de la pharmacie
  const togglePharmacyDetails = (id) => {
    setExpandedPharmacy(expandedPharmacy === id ? null : id)
  }

  // Gérer l'ouverture du modal de médicament
  const openMedicationModal = (medication, pharmacyId) => {
    setSelectedMedication({ ...medication, pharmacyId })
    setShowMedicationModal(true)
  }

  // Gérer la commande d'un médicament
  const handleOrderMedication = async () => {
    const token = localStorage.getItem("token");

    if (!token || !selectedMedication) {
      alert("Veuillez vous connecter pour commander.");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:8000/api/commandes",
        {
          pharmacy_id: selectedMedication.pharmacyId,
          medication_id: selectedMedication.id,
          quantity: medicationQuantity,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Commande effectuée avec succès !");
    } catch (error) {
      console.error("Erreur lors de la commande :", error.response?.data || error.message);
      alert("Échec de la commande. Veuillez réessayer.");
    }

    // Réinitialiser et fermer le modal
    setMedicationQuantity(1);
    setShowMedicationModal(false);
  };

  return (
    <> {/* Fragment React ajouté ici pour envelopper tous les éléments de niveau supérieur */}
      <div className="pharmacies-container">
        <div className="pharmacies-header">
          <h1>Pharmacies</h1>
          <p>Trouvez une pharmacie et commandez vos médicaments</p>
        </div>

        <div className="search-filter-container">
          <div className="search-container">
            <Search size={18} />
            <input
              type="text"
              placeholder="Rechercher une pharmacie ou un médicament..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* <button className="filter-toggle-btn" onClick={() => setExpandedFilters(!expandedFilters)}>
            <Filter size={18} />
            Filtres
            {expandedFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button> */}
        </div>

        {expandedFilters && (
          <div className="filters-panel">
            <div className="filter-group">
              <label>Emplacement</label>
              <select value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })}>
                <option value="">Tous les emplacements</option>
                {locations.map((location, index) => (
                  <option key={index} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group checkbox">
              <input
                type="checkbox"
                id="openNow"
                checked={filters.openNow}
                onChange={(e) => setFilters({ ...filters, openNow: e.target.checked })}
              />
              <label htmlFor="openNow">Ouvert maintenant</label>
            </div>

            <div className="filter-group checkbox">
              <input
                type="checkbox"
                id="hasDelivery"
                checked={filters.hasDelivery}
                onChange={(e) => setFilters({ ...filters, hasDelivery: e.target.checked })}
              />
              <label htmlFor="hasDelivery">Livraison disponible</label>
            </div>

            <div className="filter-group">
              <label>Note minimale</label>
              <div className="rating-filter">
                {[0, 1, 2, 3, 4].map((rating) => (
                  <button
                    key={rating}
                    className={filters.minRating >= rating + 1 ? "active" : ""}
                    onClick={() => setFilters({ ...filters, minRating: rating + 1 })}
                  >
                    <Star size={16} fill={filters.minRating >= rating + 1 ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
            </div>

            <button
              className="reset-filters-btn"
              onClick={() =>
                setFilters({
                  location: "",
                  openNow: false,
                  hasDelivery: false,
                  minRating: 0,
                })
              }
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}

        <div className="medication-match-info">
          {searchTerm.trim() !== "" && (
            filteredPharmacies.length > 0 ? (
              <p>
                {filteredPharmacies.length} pharmacie{filteredPharmacies.length > 1 ? "s" : ""} contien{filteredPharmacies.length > 1 ? "nent" : "t"} le médicament "<strong>{searchTerm}</strong>"
              </p>
            ) : (
              <p>
                Médicament "<strong>{searchTerm}</strong>" introuvable dans les pharmacies disponibles.
              </p>
            )
          )}
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Chargement des pharmacies...</p>
          </div>
        ) : filteredPharmacies.length === 0 ? (
          <div className="no-results">
            <Info size={48} />
            <h3>Aucune pharmacie trouvée</h3>
            <p>Essayez de modifier vos critères de recherche</p>
          </div>
        ) : (
          <div className="pharmacies-list">
            {filteredPharmacies.map((pharmacy) => (
              <div key={pharmacy.id} className="pharmacy-card">
                <div className="pharmacy-main-info">
                  <div className="pharmacy-image">
                    <img src={"/logo-pharmacie.png"} alt={pharmacy.nom} />
                  </div>
                  <div className="pharmacy-details">
                    <h3>{pharmacy.nom}</h3>
                    <div className="pharmacy-address">
                      <MapPin size={16} />
                      <span>{pharmacy.adresse}</span>
                      {/* <span className="distance">({pharmacy.distance})</span> */}
                    </div>
                    <div className="pharmacy-hours">
                      <Clock size={16} />
                      <span>{pharmacy.horaires}</span>
                      <span className={`status ${pharmacy.isOpen ? "open" : "closed"}`}>
                        {pharmacy.isOpen ? "Ouvert" : "Fermé"}
                      </span>
                    </div>
                    <div className="pharmacy-rating">
                      <Star size={16} fill="currentColor" />
                      <span>{pharmacy.type}</span>
                    </div>
                  </div>
                  <div className="pharmacy-actions">
                    <button className="view-details-btn" onClick={() => togglePharmacyDetails(pharmacy.id)}>
                      {expandedPharmacy === pharmacy.id ? "Masquer les détails" : "Voir les médicaments"}
                    </button>
                    {/* MODIFICATION ICI pour afficher l'état de la livraison */}
                    {pharmacy.has_delivery ? (
                      <div className="delivery-badge">
                        <ShoppingBag size={14} />
                        <span>Livraison</span>
                      </div>
                    ) : (
                      <div className="delivery-status-not-available">
                        <span>Livraison non disponible</span>
                      </div>
                    )}
                  </div>
                </div>

                {expandedPharmacy === pharmacy.id && (
                  <div className="pharmacy-medications">
                    <h4>Médicaments disponibles</h4>
                    <div className="medications-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Nom</th>
                            <th>Prix</th>
                            <th>Disponibilité</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pharmacy.medications.map((medication) => (
                            <tr key={medication.id}>
                              <td>{medication.name}</td>
                              <td>{medication.price.toLocaleString()} Ar</td>
                              <td className={medication.stock > 0 ? "in-stock" : "out-of-stock"}>
                                {medication.stock > 0 ? `En stock (${medication.stock})` : "Rupture de stock"}
                              </td>
                              <td>
                                <button
                                  className="order-btn"
                                  disabled={medication.stock <= 0}
                                  onClick={() => openMedicationModal(medication, pharmacy.id)}
                                >
                                  Commander
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal pour commander un médicament */}
      {showMedicationModal && selectedMedication && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Commander un médicament</h2>
            <div className="medication-details">
              <h3>{selectedMedication.name}</h3>
              <p className="medication-price">{selectedMedication.price.toLocaleString()} Ar par unité</p>
              <p className="stock-info">En stock: {selectedMedication.stock} unités</p>

              <div className="quantity-selector">
                <label htmlFor="quantity">Quantité:</label>
                <div className="quantity-controls">
                  <button
                    onClick={() => setMedicationQuantity(Math.max(1, medicationQuantity - 1))}
                    disabled={medicationQuantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    className="input-number"
                    id="quantity"
                    min="1"
                    max={selectedMedication.stock}
                    value={medicationQuantity}
                    onChange={(e) => {
                      const value = Number.parseInt(e.target.value)
                      if (!isNaN(value) && value >= 1 && value <= selectedMedication.stock) {
                        setMedicationQuantity(value)
                      }
                    }}
                  />
                  <button
                    onClick={() => setMedicationQuantity(Math.min(selectedMedication.stock, medicationQuantity + 1))}
                    disabled={medicationQuantity >= selectedMedication.stock}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="total-price">
                <p>
                  Prix total: <span>{(selectedMedication.price * medicationQuantity).toLocaleString()} Ar</span>
                </p>
              </div>

              <div className="order-note">
                <label htmlFor="note">Note pour la pharmacie (optionnel):</label>
                <textarea id="note" rows="3" placeholder="Instructions spéciales ou questions..."></textarea>
              </div>
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowMedicationModal(false)}>
                Annuler
              </button>
              <button className="confirm-btn" onClick={handleOrderMedication}>
                Confirmer la commande
              </button>
            </div>
          </div>
        </div>
      )}
    </> /* Fin du fragment React */
  )
}

export default PharmaciePatient