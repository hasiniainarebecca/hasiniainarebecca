import { useState, useEffect } from "react"
import axios from "axios";
import { Search, Filter, Plus, Edit, Trash2, AlertTriangle, Download, Upload } from "lucide-react"
import './styles/MedicationManagementPage.css'

function MedicationManagementPage() {
  const [medications, setMedications] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [showAddModal, setShowAddModal] = useState(false)
  const [newMedication, setNewMedication] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    threshold: "",
    supplier: "",
    expiryDate: "",
  })
  const [showEditModal, setShowEditModal] = useState(false)
  const [editMedication, setEditMedication] = useState({
    id: null,
    name: "",
    category: "",
    price: "",
    stock: "",
    threshold: "",
    supplier: "",
    expiryDate: "",
  })

  useEffect(() => {
    const fetchMedications = async () => {
      const token = localStorage.getItem("token");
      const pharmacyId = localStorage.getItem("pharmacy_id");
      try {
        const response = await axios.get(`http://localhost:8000/api/pharmacy/${pharmacyId}/medications/liste`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setMedications(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Erreur de chargement :", err);
        setLoading(false);
      }
    };

    fetchMedications();
  }, []);

  // Obtenir les catégories uniques pour le filtre
  const categories = ["all", ...new Set(medications.map((med) => med.category))]

  // Filtrer les médicaments en fonction de la recherche et de la catégorie
  const filteredMedications = medications.filter((med) => {
    const matchesSearch =
      med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.expiry_date.includes(searchTerm)
    const matchesCategory = filterCategory === "all" || med.category === filterCategory
    return matchesSearch && matchesCategory
  })

  // Gérer l'ajout d'un nouveau médicament
  const handleAddMedication = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    const pharmacyId = localStorage.getItem("pharmacy_id");
    if (!pharmacyId) {
      console.error("Aucun ID de pharmacie trouvé dans le localStorage");
      return;
    }

    const medicationToAdd = {
      name: newMedication.name,
      category: newMedication.category,
      price: parseFloat(newMedication.price),
      stock: parseInt(newMedication.stock),
      threshold: parseInt(newMedication.threshold),
      supplier: newMedication.supplier,
      expiry_date: newMedication.expiryDate,
    };

    try {
      const response = await axios.post(
        `http://localhost:8000/api/pharmacy/${pharmacyId}/medications/store`,
        medicationToAdd,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setMedications([...medications, response.data]);
      setShowAddModal(false);
      setNewMedication({
        name: "",
        category: "",
        price: "",
        stock: "",
        threshold: "",
        supplier: "",
        expiryDate: "",
      });
    } catch (err) {
      console.error("Full error:", err.response); 
    }
  };

  // Gérer la suppression d'un médicament
  const handleDeleteMedication = async (id) => {
    const token = localStorage.getItem("token");
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce médicament ?")) {
      try {
        await axios.delete(`http://localhost:8000/api/medications/${id}/supprimer`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setMedications(medications.filter((med) => med.id !== id));
      } catch (err) {
        console.error("Erreur lors de la suppression :", err);
      }
    }
  };

  // Ouvrir le modal d'édition avec les données du médicament sélectionné
  const handleOpenEditModal = (medication) => {
    setEditMedication({
      id: medication.id,
      name: medication.name,
      category: medication.category,
      price: medication.price.toString(),
      stock: medication.stock.toString(),
      threshold: medication.threshold.toString(),
      supplier: medication.supplier,
      expiryDate: medication.expiry_date,
    })
    setShowEditModal(true)
  }

  const handleUpdateMedication = async (e) => {
    e.preventDefault()

    const token = localStorage.getItem("token")

    const medicationToUpdate = {
      name: editMedication.name,
      category: editMedication.category,
      price: Number.parseFloat(editMedication.price),
      stock: Number.parseInt(editMedication.stock),
      threshold: Number.parseInt(editMedication.threshold),
      supplier: editMedication.supplier,
      expiry_date: editMedication.expiryDate,
    }

    try {
      const response = await axios.put(
        `http://localhost:8000/api/medications/${editMedication.id}/modifier`,
        medicationToUpdate,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )
      setMedications(medications.map((med) => (med.id === editMedication.id ? response.data : med)))

      setShowEditModal(false)
      setEditMedication({
        id: null,
        name: "",
        category: "",
        price: "",
        stock: "",
        threshold: "",
        supplier: "",
        expiryDate: "",
      })
    } catch (err) {
      console.error("Erreur lors de la mise à jour :", err.response)
    }
  }

  return (
    <div className="med-mgmt-dashboard-main-content">
      <div className="med-mgmt-container">
        <div className="med-mgmt-header">
          <div className="med-mgmt-header-content">
            <h1 className="med-mgmt-header-title">Gestion des Médicaments</h1>
            <p className="med-mgmt-header-subtitle">
              Gérez votre inventaire pharmaceutique en temps réel
            </p>
          </div>
          <div className="med-mgmt-actions">
            <button className="med-mgmt-btn-add" onClick={() => setShowAddModal(true)}>
              <Plus size={16} />
              Nouveau médicament
            </button>
          </div>
        </div>

        <div className="med-mgmt-filters">
          <div className="med-mgmt-search">
            <div className="med-mgmt-search-icon">
              <Search size={18} />
            </div>
            <input
              type="text"
              className="med-mgmt-search-input"
              placeholder="Rechercher par nom, fournisseur ou date d'expiration..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="med-mgmt-filter">
            <div className="med-mgmt-filter-icon">
              <Filter size={16} />
            </div>
            <select 
              className="med-mgmt-filter-select"
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {categories.map((category, index) => (
                <option key={index} value={category}>
                  {category === "all" ? "Toutes les catégories" : category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="med-mgmt-loading">
            <div className="med-mgmt-loading-spinner"></div>
            <p>Chargement des données...</p>
          </div>
        ) : (
          <div className="med-mgmt-table-container">
            <div className="med-mgmt-table-wrapper">
              <table className="med-mgmt-table">
                <thead>
                  <tr>
                    <th className="med-mgmt-table-header">Nom du médicament</th>
                    <th className="med-mgmt-table-header">Catégorie</th>
                    <th className="med-mgmt-table-header">Prix (Ar)</th>
                    <th className="med-mgmt-table-header">Stock disponible</th>
                    <th className="med-mgmt-table-header">Seuil d'alerte</th>
                    <th className="med-mgmt-table-header">Fournisseur</th>
                    <th className="med-mgmt-table-header">Date d'expiration</th>
                    <th className="med-mgmt-table-header">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMedications.map((medication) => (
                    <tr 
                      key={medication.id} 
                      className={`med-mgmt-table-row ${medication.stock <= medication.threshold ? "med-mgmt-row-low-stock" : ""}`}
                    >
                      <td className="med-mgmt-table-data med-mgmt-table-data--name">
                        <div className="med-mgmt-medication-name">
                          {medication.name}
                        </div>
                      </td>
                      <td className="med-mgmt-table-data">
                        <span className="med-mgmt-category-badge">
                          {medication.category}
                        </span>
                      </td>
                      <td className="med-mgmt-table-data med-mgmt-table-data--price">
                        {Number(medication.price).toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })} Ar
                      </td>
                      <td className={`med-mgmt-table-data med-mgmt-stock-cell ${medication.stock <= medication.threshold ? "med-mgmt-stock-cell--low" : ""}`}>
                        <div className="med-mgmt-stock-content">
                          {medication.stock <= medication.threshold && (
                            <AlertTriangle size={16} className="med-mgmt-alert-icon" />
                          )}
                          <span className="med-mgmt-stock-value">{medication.stock}</span>
                        </div>
                      </td>
                      <td className="med-mgmt-table-data">{medication.threshold}</td>
                      <td className="med-mgmt-table-data">{medication.supplier}</td>
                      <td className="med-mgmt-table-data med-mgmt-table-data--date">
                        {new Date(medication.expiry_date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="med-mgmt-table-data med-mgmt-actions-cell">
                        <div className="med-mgmt-action-buttons">
                          <button 
                            className="med-mgmt-btn-edit" 
                            onClick={() => handleOpenEditModal(medication)}
                            aria-label="Modifier le médicament"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            className="med-mgmt-btn-delete" 
                            onClick={() => handleDeleteMedication(medication.id)}
                            aria-label="Supprimer le médicament"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal pour ajouter un médicament */}
        {showAddModal && (
          <div className="med-mgmt-modal-overlay">
            <div className="med-mgmt-modal-content">
              <div className="med-mgmt-modal-header">
                <h2 className="med-mgmt-modal-title">Ajouter un nouveau médicament</h2>
                <button 
                  className="med-mgmt-modal-close"
                  onClick={() => setShowAddModal(false)}
                  aria-label="Fermer"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleAddMedication} className="med-mgmt-form">
                <div className="med-mgmt-form-group">
                  <label htmlFor="name" className="med-mgmt-form-label">Nom du médicament *</label>
                  <input
                    type="text"
                    id="name"
                    className="med-mgmt-form-input"
                    value={newMedication.name}
                    onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
                    placeholder="Ex: Paracétamol 500mg"
                    required
                  />
                </div>
                <div className="med-mgmt-form-row">
                  <div className="med-mgmt-form-group">
                    <label htmlFor="category" className="med-mgmt-form-label">Catégorie *</label>
                    <input
                      type="text"
                      id="category"
                      className="med-mgmt-form-input"
                      value={newMedication.category}
                      onChange={(e) => setNewMedication({ ...newMedication, category: e.target.value })}
                      placeholder="Ex: Antalgique"
                      required
                    />
                  </div>
                  <div className="med-mgmt-form-group">
                    <label htmlFor="price" className="med-mgmt-form-label">Prix unitaire (Ar) *</label>
                    <input
                      type="number"
                      id="price"
                      className="med-mgmt-form-input"
                      step="0.01"
                      min="0"
                      value={newMedication.price}
                      onChange={(e) => setNewMedication({ ...newMedication, price: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                <div className="med-mgmt-form-row">
                  <div className="med-mgmt-form-group">
                    <label htmlFor="stock" className="med-mgmt-form-label">Stock initial *</label>
                    <input
                      type="number"
                      id="stock"
                      className="med-mgmt-form-input"
                      min="0"
                      value={newMedication.stock}
                      onChange={(e) => setNewMedication({ ...newMedication, stock: e.target.value })}
                      placeholder="0"
                      required
                    />
                  </div>
                  <div className="med-mgmt-form-group">
                    <label htmlFor="threshold" className="med-mgmt-form-label">Seuil d'alerte *</label>
                    <input
                      type="number"
                      id="threshold"
                      className="med-mgmt-form-input"
                      min="0"
                      value={newMedication.threshold}
                      onChange={(e) => setNewMedication({ ...newMedication, threshold: e.target.value })}
                      placeholder="0"
                      required
                    />
                  </div>
                </div>
                <div className="med-mgmt-form-row">
                  <div className="med-mgmt-form-group">
                    <label htmlFor="supplier" className="med-mgmt-form-label">Fournisseur *</label>
                    <input
                      type="text"
                      id="supplier"
                      className="med-mgmt-form-input"
                      value={newMedication.supplier}
                      onChange={(e) => setNewMedication({ ...newMedication, supplier: e.target.value })}
                      placeholder="Nom du fournisseur"
                      required
                    />
                  </div>
                  <div className="med-mgmt-form-group">
                    <label htmlFor="expiryDate" className="med-mgmt-form-label">Date d'expiration *</label>
                    <input
                      type="date"
                      id="expiryDate"
                      className="med-mgmt-form-input"
                      value={newMedication.expiryDate}
                      onChange={(e) => setNewMedication({ ...newMedication, expiryDate: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="med-mgmt-modal-actions">
                  <button type="button" className="med-mgmt-btn-cancel" onClick={() => setShowAddModal(false)}>
                    Annuler
                  </button>
                  <button type="submit" className="med-mgmt-btn-submit">
                    Ajouter le médicament
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal pour modifier un médicament */}
        {showEditModal && (
          <div className="med-mgmt-modal-overlay">
            <div className="med-mgmt-modal-content">
              <div className="med-mgmt-modal-header">
                <h2 className="med-mgmt-modal-title">Modifier le médicament</h2>
                <button 
                  className="med-mgmt-modal-close"
                  onClick={() => setShowEditModal(false)}
                  aria-label="Fermer"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleUpdateMedication} className="med-mgmt-form">
                <div className="med-mgmt-form-group">
                  <label htmlFor="edit-name" className="med-mgmt-form-label">Nom du médicament *</label>
                  <input
                    type="text"
                    id="edit-name"
                    className="med-mgmt-form-input"
                    value={editMedication.name}
                    onChange={(e) => setEditMedication({ ...editMedication, name: e.target.value })}
                    required
                  />
                </div>
                <div className="med-mgmt-form-row">
                  <div className="med-mgmt-form-group">
                    <label htmlFor="edit-category" className="med-mgmt-form-label">Catégorie *</label>
                    <input
                      type="text"
                      id="edit-category"
                      className="med-mgmt-form-input"
                      value={editMedication.category}
                      onChange={(e) => setEditMedication({ ...editMedication, category: e.target.value })}
                      required
                    />
                  </div>
                  <div className="med-mgmt-form-group">
                    <label htmlFor="edit-price" className="med-mgmt-form-label">Prix unitaire (Ar) *</label>
                    <input
                      type="number"
                      id="edit-price"
                      className="med-mgmt-form-input"
                      step="0.01"
                      min="0"
                      value={editMedication.price}
                      onChange={(e) => setEditMedication({ ...editMedication, price: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="med-mgmt-form-row">
                  <div className="med-mgmt-form-group">
                    <label htmlFor="edit-stock" className="med-mgmt-form-label">Stock *</label>
                    <input
                      type="number"
                      id="edit-stock"
                      className="med-mgmt-form-input"
                      min="0"
                      value={editMedication.stock}
                      onChange={(e) => setEditMedication({ ...editMedication, stock: e.target.value })}
                      required
                    />
                  </div>
                  <div className="med-mgmt-form-group">
                    <label htmlFor="edit-threshold" className="med-mgmt-form-label">Seuil d'alerte *</label>
                    <input
                      type="number"
                      id="edit-threshold"
                      className="med-mgmt-form-input"
                      min="0"
                      value={editMedication.threshold}
                      onChange={(e) => setEditMedication({ ...editMedication, threshold: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="med-mgmt-form-row">
                  <div className="med-mgmt-form-group">
                    <label htmlFor="edit-supplier" className="med-mgmt-form-label">Fournisseur *</label>
                    <input
                      type="text"
                      id="edit-supplier"
                      className="med-mgmt-form-input"
                      value={editMedication.supplier}
                      onChange={(e) => setEditMedication({ ...editMedication, supplier: e.target.value })}
                      required
                    />
                  </div>
                  <div className="med-mgmt-form-group">
                    <label htmlFor="edit-expiryDate" className="med-mgmt-form-label">Date d'expiration *</label>
                    <input
                      type="date"
                      id="edit-expiryDate"
                      className="med-mgmt-form-input"
                      value={editMedication.expiryDate}
                      onChange={(e) => setEditMedication({ ...editMedication, expiryDate: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="med-mgmt-modal-actions">
                  <button type="button" className="med-mgmt-btn-cancel" onClick={() => setShowEditModal(false)}>
                    Annuler
                  </button>
                  <button type="submit" className="med-mgmt-btn-submit">
                    Mettre à jour
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MedicationManagementPage