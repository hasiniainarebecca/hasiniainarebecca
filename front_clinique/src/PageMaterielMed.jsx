import React, { useState, useEffect, useCallback } from "react";
import { Search, Package, AlertTriangle, Plus, Download, RefreshCw, ChevronDown } from "lucide-react";
import "./styles/PageMaterielMed.css";
import axios from "axios";

// Composants personnalisés définis en dehors de GestionMaterielMed
const Button = ({ children, variant = "default", size = "default", className = "", disabled = false, onClick, ...props }) => {
  return (
    <button className={`btn btn-${variant} btn-${size} ${className}`} disabled={disabled} onClick={onClick} {...props}>
      {children}
    </button>
  );
};

const Card = ({ children, className = "" }) => <div className={`card ${className}`}>{children}</div>;

const CardContent = ({ children, className = "" }) => <div className={`card-content ${className}`}>{children}</div>;

const Input = ({ className = "", ...props }) => <input className={`input ${className}`} {...props} />;

const Badge = ({ children, variant = "default", className = "" }) => {
  return <span className={`badge badge-${variant} ${className}`}>{children}</span>;
};

const Select = ({ children, value, onValueChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);

  const handleSelect = (newValue) => {
    setSelectedValue(newValue);
    onValueChange(newValue);
    setIsOpen(false);
  };

  return (
    <div className="select-container">
      {React.Children.map(children, (child) => {
        if (child.type === SelectTrigger) {
          return React.cloneElement(child, {
            onClick: () => setIsOpen(!isOpen),
            isOpen,
            selectedValue,
          });
        }
        if (child.type === SelectContent) {
          return React.cloneElement(child, {
            isOpen,
            onSelect: handleSelect,
            selectedValue,
          });
        }
        return child;
      })}
    </div>
  );
};

const SelectTrigger = ({ children, className = "", onClick, isOpen, selectedValue }) => (
  <button type="button" className={`select-trigger ${className}`} onClick={onClick}>
    {children}
    <ChevronDown className={`select-chevron ${isOpen ? "rotate" : ""}`} />
  </button>
);

const SelectValue = ({ placeholder, selectedValue }) => {
  const getDisplayValue = () => {
    switch (selectedValue) {
      case "all":
        return "Toutes catégories";
      case "Consommables":
        return "Consommables";
      case "Équipements":
        return "Équipements";
      case "Protection":
        return "Protection";
      case "low":
        return "Stock faible";
      case "normal":
        return "Stock normal";
      case "high":
        return "Élevé";
      case "urgent":
        return "Urgent";
      default:
        return placeholder;
    }
  };

  return <span>{getDisplayValue()}</span>;
};

const SelectContent = ({ children, isOpen, onSelect, selectedValue }) => {
  if (!isOpen) return null;

  return (
    <div className="select-content">
      <div className="select-items">
        {React.Children.map(children, (child) => React.cloneElement(child, { onSelect, selectedValue }))}
      </div>
    </div>
  );
};

const SelectItem = ({ children, value, onSelect, selectedValue }) => (
  <button
    type="button"
    className={`select-item ${selectedValue === value ? "selected" : ""}`}
    onClick={() => onSelect(value)}
  >
    {children}
  </button>
);

const Dialog = ({ children, open, onOpenChange }) => {
  if (!open) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog-backdrop" onClick={() => onOpenChange(false)} />
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

const DialogContent = ({ children, className = "" }) => <div className={className}>{children}</div>;

const DialogHeader = ({ children }) => <div className="dialog-header">{children}</div>;

const DialogTitle = ({ children }) => <h2 className="dialog-title">{children}</h2>;

const DialogDescription = ({ children }) => <p className="dialog-description">{children}</p>;

const DialogFooter = ({ children }) => <div className="dialog-footer">{children}</div>;

const Label = ({ children, htmlFor, className = "" }) => (
  <label htmlFor={htmlFor} className={`label ${className}`}>
    {children}
  </label>
);

const Textarea = ({ className = "", ...props }) => <textarea className={`textarea ${className}`} {...props} />;

const Alert = ({ children, className = "" }) => <div className={`alert ${className}`}>{children}</div>;

const AlertDescription = ({ children, className = "" }) => (
  <div className={`alert-description ${className}`}>{children}</div>
);

const GestionMaterielMed = () => {
  const [equipment, setEquipment] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [requestForm, setRequestForm] = useState({
    quantity: "",
    urgency: "normal",
    notes: "",
  });
  const [useForm, setUseForm] = useState({
    quantity_used: "",
    reason: "",
  });
  const [isUseDialogOpen, setIsUseDialogOpen] = useState(false);
  const [selectedItemForUse, setSelectedItemForUse] = useState(null);
  const [isAddEquipmentDialogOpen, setIsAddEquipmentDialogOpen] = useState(false);
  const [newEquipmentForm, setNewEquipmentForm] = useState({
    name: "",
    category: "",
    currentStock: "",
    minStock: "",
    unit: "",
    location: "",
    expiryDate: "",
    supplier: "",
  });

  useEffect(() => {
    const fetchMateriels = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:8000/api/materiels", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Mapper les champs du backend vers le frontend
      const mappedData = response.data.map(item => ({
            ...item,
            currentStock: item.current_stock,
            minStock: item.min_stock,
            expiryDate: item.expiry_date
          }))

        setEquipment(mappedData);
      } catch (error) {
        console.error("Erreur lors du chargement des matériels:", error);
      }
    };

    fetchMateriels();
  }, []);

  const handleUseMaterial = async (id, quantity_used, reason) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:8000/api/materiels/${id}/use`,
        {
          quantity_used: parseInt(quantity_used),
          reason: reason,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setEquipment((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, currentStock: item.currentStock - parseInt(quantity_used) } : item
        )
      );

      alert(`${response.data.message}\nStock restant: ${response.data.remaining_stock}`);
      setIsUseDialogOpen(false);
      setUseForm({ quantity_used: "", reason: "" });
    } catch (error) {
      console.error("Erreur détaillée:", {
        error: error.response?.data,
        status: error.response?.status,
        config: error.config,
      });

      alert(`Erreur: ${error.response?.data?.message || "Échec de l'enregistrement"}`);
    }
  };

  const handleAddEquipment = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token d'authentification manquant");
      }

      const formData = {
        name: newEquipmentForm.name,
        category: newEquipmentForm.category,
        current_stock: parseInt(newEquipmentForm.currentStock),
        min_stock: parseInt(newEquipmentForm.minStock),
        unit: newEquipmentForm.unit,
        location: newEquipmentForm.location,
        expiry_date: newEquipmentForm.expiryDate || null,
        supplier: newEquipmentForm.supplier,
      };

      const response = await axios.post("http://localhost:8000/api/materiels", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setEquipment((prev) => [...prev, response.data.materiel]);
      alert(response.data.message);
      setIsAddEquipmentDialogOpen(false);
      setNewEquipmentForm({
        name: "",
        category: "",
        currentStock: "",
        minStock: "",
        unit: "",
        location: "",
        expiryDate: "",
        supplier: "",
      });
    } catch (error) {
      console.error("Erreur détaillée:", error.response?.data || error.message);
      alert(`Erreur lors de l'ajout du matériel: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleSubmitRequest = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!selectedItem || !selectedItem.id) {
        throw new Error("Aucun matériel sélectionné ou ID manquant");
      }

      const quantity = parseInt(requestForm.quantity);
      if (isNaN(quantity)) {
        alert("Veuillez entrer une quantité valide");
        return;
      }

      const newStock = selectedItem.currentStock + quantity;
      const response = await axios.put(
        `http://localhost:8000/api/materiels/${selectedItem.id}`,
        {
          current_stock: newStock,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setEquipment((prev) =>
        prev.map((item) => (item.id === selectedItem.id ? { ...item, currentStock: newStock } : item))
      );

      alert(response.data.message || "Stock mis à jour avec succès");
      setIsRequestDialogOpen(false);
      setSelectedItem(null);
      setRequestForm({
        quantity: "",
        urgency: "normal",
        notes: "",
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du stock:", error);
      alert(`Erreur lors du réapprovisionnement: ${error.response?.data?.message || error.message}`);
    }
  };

  const filteredEquipment = equipment.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "low" && item.currentStock <= item.minStock) ||
      (stockFilter === "normal" && item.currentStock > item.minStock);

    return matchesSearch && matchesCategory && matchesStock;
  });

  const getStockStatus = (current, min) => {
    if (current === 0) return { status: "rupture", color: "destructive" };
    if (current <= min * 0.5) return { status: "critique", color: "destructive" };
    if (current <= min) return { status: "faible", color: "warning" };
    return { status: "normal", color: "normal" };
  };

  const openRequestDialog = (item) => {
    setSelectedItem(item);
    setRequestForm({ quantity: "", urgency: "normal", notes: "" });
    setIsRequestDialogOpen(true);
  };

  const lowStockItems = equipment.filter((item) => item.currentStock <= item.minStock).length;
  const outOfStockItems = equipment.filter((item) => item.currentStock === 0).length;
  const totalItems = equipment.length;

  return (
          <div className="medical-equipment-container">
            <div className="header-materiel">
              <div className="header-content-materiel">
                <h1 className="main-title">Gestion du Matériel Médical</h1>
                <p className="subtitle">Suivi des stocks et demandes de réapprovisionnement</p>
              </div>
              <div className="header-actions">
                <Button size="sm" onClick={() => setIsAddEquipmentDialogOpen(true)}>
                  <Plus className="icon-sm" />
                  Ajouter matériel
                </Button>
              </div>
            </div>

            {(lowStockItems > 0 || outOfStockItems > 0) && (
              <Alert className="alert-warning">
                <div className="alert-content">
                  <AlertTriangle className="alert-icon" />
                  <AlertDescription className="alert-text">
                    <strong>Attention :</strong> {outOfStockItems} article(s) en rupture de stock et {lowStockItems}{" "}
                    article(s) avec un stock faible nécessitent votre attention.
                  </AlertDescription>
                </div>
              </Alert>
            )}

            <Card className="filters-card">
              <CardContent className="filters-content">
                <div className="filters-row">
                  <div className="search-container">
                    <div className="search-input-container">
                      <Search className="search-icon" />
                      <Input
                        id="recherchess"
                        placeholder="Rechercher un matériel..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                        name="recherchess"
                      />
                    </div>
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="filter-select">
                      <SelectValue placeholder="Catégorie" selectedValue={categoryFilter} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes catégories</SelectItem>
                      <SelectItem value="Consommables">Consommables</SelectItem>
                      <SelectItem value="Équipements">Équipements</SelectItem>
                      <SelectItem value="Protection">Protection</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={stockFilter} onValueChange={setStockFilter}>
                    <SelectTrigger className="filter-select">
                      <SelectValue placeholder="État du stock" selectedValue={stockFilter} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les stocks</SelectItem>
                      <SelectItem value="low">Stock faible</SelectItem>
                      <SelectItem value="normal">Stock normal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            {filteredEquipment.length === 0 && (
              
                <div className="medical-equipment-container">
            <Card className="filters-content">
              <CardContent className="filters-content">
                  <Package className="empty-icon" />
                  <h3 className="empty-title">Aucun matériel trouvé</h3>
                  <p className="empty-description">Essayez de modifier vos critères de recherche.</p>
                </CardContent>
            </Card>
              </div>
            )}

            <div className="equipment-list">
              {filteredEquipment.map((item) => {
                const stockStatus = getStockStatus(item.currentStock, item.minStock);

                
                return (
                  <Card key={item.id} className="equipment-card">
                    <CardContent className="equipment-content">
                      <div className="equipment-row">
                        <div className="equipment-info">
                          <div className="equipment-header">
                            <div className="equipment-title-section">
                              <h3 className="equipment-name">{item.name}</h3>
                              <p className="equipment-meta">
                                {item.category} • {item.location}
                              </p>
                            </div>
                            <Badge variant={stockStatus.color} className={`badge-${stockStatus.color}`}>
                              {stockStatus.status}
                            </Badge>
                          </div>

                          <div className="equipment-details">
                            <div className="detail-item">
                              <span className="detail-label">Stock actuel:</span>
                              <p className="detail-value">
                                {item.currentStock} {item.unit}
                              </p>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Stock minimum:</span>
                              <p className="detail-value">
                                {item.minStock} {item.unit}
                              </p>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Fournisseur:</span>
                              <p className="detail-value">{item.supplier}</p>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Expiration:</span>
                              <p className="detail-value">
                                {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString("fr-FR") : "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="equipment-actions">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedItemForUse(item);
                              setUseForm({ quantity_used: "", reason: "" });
                              setIsUseDialogOpen(true);
                            }}
                            disabled={item.currentStock === 0}
                          >
                            Utiliser
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openRequestDialog(item)}
                            disabled={item.currentStock > item.minStock}
                          >
                            <RefreshCw className="icon-sm" />
                            Réapprovisionner
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            

            <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Demande de réapprovisionnement</DialogTitle>
                  <DialogDescription>
                    {selectedItem && `Demander le réapprovisionnement de : ${selectedItem.name}`}
                  </DialogDescription>
                </DialogHeader>

                <div className="dialog-body">
                  <div className="form-group">
                    <Label htmlFor="quantity" className="form-label">
                      Quantité demandée
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="Entrez la quantité"
                      value={requestForm.quantity}
                      onChange={(e) => setRequestForm({ ...requestForm, quantity: e.target.value })}
                      autoFocus
                    />
                  </div>

                  <div className="form-group">
                    <Label htmlFor="urgency" className="form-label">
                      Niveau d'urgence
                    </Label>
                    <Select
                      value={requestForm.urgency}
                      onValueChange={(value) => setRequestForm({ ...requestForm, urgency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" selectedValue={requestForm.urgency} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Faible</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">Élevé</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="form-group">
                    <Label htmlFor="notes" className="form-label">
                      Notes (optionnel)
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder="Informations supplémentaires..."
                      value={requestForm.notes}
                      onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleSubmitRequest} disabled={!requestForm.quantity}>
                    Envoyer la demande
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddEquipmentDialogOpen} onOpenChange={setIsAddEquipmentDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter un nouveau matériel</DialogTitle>
                  <DialogDescription>
                    Remplissez les informations pour ajouter un nouveau matériel à l'inventaire
                  </DialogDescription>
                </DialogHeader>

                <div className="dialog-body">
                  <div className="form-group">
                    <Label htmlFor="name" className="form-label">
                      Nom du matériel
                    </Label>
                    <Input
                      id="name"
                      placeholder="Entrez le nom du matériel"
                      value={newEquipmentForm.name}
                      onChange={(e) => setNewEquipmentForm({ ...newEquipmentForm, name: e.target.value })}
                      autoFocus
                    />
                  </div>

                  <div className="form-group">
                    <Label htmlFor="category" className="form-label">
                      Catégorie
                    </Label>
                    <Select
                      value={newEquipmentForm.category}
                      onValueChange={(value) => setNewEquipmentForm({ ...newEquipmentForm, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" selectedValue={newEquipmentForm.category} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Consommables">Consommables</SelectItem>
                        <SelectItem value="Équipements">Équipements</SelectItem>
                        <SelectItem value="Protection">Protection</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="form-group">
                    <Label htmlFor="currentStock" className="form-label">
                      Stock actuel
                    </Label>
                    <Input
                      id="currentStock"
                      type="number"
                      placeholder="Quantité en stock"
                      value={newEquipmentForm.currentStock}
                      onChange={(e) => setNewEquipmentForm({ ...newEquipmentForm, currentStock: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <Label htmlFor="minStock" className="form-label">
                      Stock minimum
                    </Label>
                    <Input
                      id="minStock"
                      type="number"
                      placeholder="Quantité minimum"
                      value={newEquipmentForm.minStock}
                      onChange={(e) => setNewEquipmentForm({ ...newEquipmentForm, minStock: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <Label htmlFor="unit" className="form-label">
                      Unité
                    </Label>
                    <Input
                      id="unit"
                      placeholder="Ex: boîtes, unités, etc."
                      value={newEquipmentForm.unit}
                      onChange={(e) => setNewEquipmentForm({ ...newEquipmentForm, unit: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <Label htmlFor="location" className="form-label">
                      Emplacement
                    </Label>
                    <Input
                      id="location"
                      placeholder="Où est stocké le matériel"
                      value={newEquipmentForm.location}
                      onChange={(e) => setNewEquipmentForm({ ...newEquipmentForm, location: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <Label htmlFor="expiryDate" className="form-label">
                      Date d'expiration (optionnel)
                    </Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={newEquipmentForm.expiryDate}
                      onChange={(e) => setNewEquipmentForm({ ...newEquipmentForm, expiryDate: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <Label htmlFor="supplier" className="form-label">
                      Fournisseur
                    </Label>
                    <Input
                      id="supplier"
                      placeholder="Nom du fournisseur"
                      value={newEquipmentForm.supplier}
                      onChange={(e) => setNewEquipmentForm({ ...newEquipmentForm, supplier: e.target.value })}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddEquipmentDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button
                    onClick={handleAddEquipment}
                    disabled={
                      !newEquipmentForm.name ||
                      !newEquipmentForm.category ||
                      !newEquipmentForm.currentStock ||
                      !newEquipmentForm.minStock ||
                      !newEquipmentForm.unit ||
                      !newEquipmentForm.location ||
                      !newEquipmentForm.supplier
                    }
                  >
                    Ajouter le matériel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isUseDialogOpen} onOpenChange={setIsUseDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enregistrer une utilisation</DialogTitle>
                  <DialogDescription>
                    {selectedItemForUse && `Enregistrer l'utilisation de : ${selectedItemForUse.name}`}
                  </DialogDescription>
                </DialogHeader>

                <div className="dialog-body">
                  <div className="form-group">
                    <Label htmlFor="useQuantity">Quantité utilisée</Label>
                    <Input
                      id="useQuantity"
                      type="number"
                      max={selectedItemForUse?.currentStock}
                      placeholder={`Max: ${selectedItemForUse?.currentStock}`}
                      value={useForm.quantity_used}
                      onChange={(e) => setUseForm({ ...useForm, quantity_used: e.target.value })}
                      autoFocus
                    />
                  </div>
                  <div className="form-group">
                    <Label htmlFor="useReason">Motif</Label>
                    <Textarea
                      id="useReason"
                      placeholder="Raison de l'utilisation..."
                      value={useForm.reason}
                      onChange={(e) => setUseForm({ ...useForm, reason: e.target.value })}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsUseDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button
                    onClick={() => {
                      handleUseMaterial(selectedItemForUse.id, useForm.quantity_used, useForm.reason);
                    }}
                    disabled={!useForm.quantity_used || !useForm.reason}
                  >
                    Confirmer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
  );
};

export default GestionMaterielMed;