import { useState, useEffect } from "react"
import axios from "axios";
import { useNavigate } from "react-router-dom"
import { BarChart, Calendar, Package, FileText, AlertTriangle, DollarSign, Users, MessageSquare } from "lucide-react"
import './styles/PharmacieDashboard.css'

const PharmacierDashboard = () => {
  const navigate = useNavigate()
  const [pharmacy, setPharmacy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalMedicines: 0,
    lowStock: 0,
    pendingPrescriptions: 0,
    dailySales: 0,
    monthlyRevenue: 0,
    messages: 0, // Assuming messages would come from a separate API
  });
  const [salesData, setSalesData] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [pendingPrescriptions, setPendingPrescriptions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const headers = {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        };

        // Fetch pharmacy details
        const pharmacyResponse = await axios.get("http://localhost:8000/api/pharmacies/utilisateur", { headers });
        setPharmacy(pharmacyResponse.data);

        const pharmacyId = pharmacyResponse.data.id;

        // Fetch medications
        const medicationsResponse = await axios.get(`http://localhost:8000/api/pharmacy/${pharmacyId}/medications/liste`, { headers });
        const medications = medicationsResponse.data;

        // Calculate totalMedicines and lowStock
        const totalMedicines = medications.reduce((sum, med) => sum + med.stock, 0);
        const lowStock = medications.filter(med => med.stock <= med.threshold).length;
        const lowStockDetails = medications.filter(med => med.stock <= med.threshold).map(med => ({
          id: med.id,
          name: med.name,
          stock: med.stock,
          threshold: med.threshold
        }));
        setLowStockItems(lowStockDetails);

        // Fetch prescription orders
        const prescriptionOrdersResponse = await axios.get("http://localhost:8000/api/prescription-orders-list", { headers });
        const allPrescriptionOrders = prescriptionOrdersResponse.data;
        const pending = allPrescriptionOrders.filter(order => order.status === 'en attente');
        const pendingPrescriptionsDetails = pending.map(order => ({
          id: order.id,
          // Vérifiez si patient existe et a un nom, sinon 'N/A'
          patient: order.prescription && order.prescription.patient ? `${order.prescription.patient.nom} ${order.prescription.patient.prenom}` : 'N/A',
          // Vérifiez si prescription et doctor existent et ont un nom, sinon 'N/A'
          doctor: order.prescription && order.prescription.doctor ? `${order.prescription.doctor.nom} ${order.prescription.doctor.prenom}` : 'N/A',
          date: new Date(order.ordered_at).toLocaleDateString(),
          status: order.status
        }));
        setPendingPrescriptions(pendingPrescriptionsDetails);

        // Fetch sales data from new API endpoint
        const fetchSalesData = async () => {
          try {
            const salesResponse = await axios.get('http://localhost:8000/api/pharmacist/sales-data', { headers });
            const salesData = salesResponse.data;
            // Formatage pour le graphique
            const formattedSalesData = salesData.weeklyLabels.map((day, index) => ({
              day: day,
              sales: salesData.weeklySales[index] || 0
            }));
            setStats(prevStats => ({
              ...prevStats,
              dailySales: salesData.dailySales,
              monthlyRevenue: salesData.monthlyRevenue
            }));
            
            setSalesData(formattedSalesData);
          } catch (error) {
            console.error("Erreur récupération données ventes:", error);
          }
        };
        await fetchSalesData();

        setStats(prevStats => ({
          ...prevStats,
          totalMedicines: totalMedicines,
          lowStock: lowStock,
          pendingPrescriptions: pending.length,
          // dailySales and monthlyRevenue are now set in fetchSalesData
          // Messages would require a separate API
        }));

      } catch (err) {
        console.error("Erreur de récupération des données du tableau de bord :", err);
        setError("Impossible de récupérer les données du tableau de bord.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleDelivery = async (pharmacyId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.put(`http://localhost:8000/api/pharmacies/${pharmacyId}/toggle-delivery`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const updatedDeliveryStatus = response.data.has_delivery;
      setPharmacy((prev) => ({ ...prev, has_delivery: updatedDeliveryStatus }));
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la livraison :", error);
    }
  };

  if (loading) return (
    <div className="pharmacist-dashboard-wrapper">
      <div className="pharmacist-dashboard-container">
        <div className="pharmacist-loading-state">
          <div className="pharmacist-loading-spinner"></div>
          <p>Chargement de la pharmacie...</p>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="pharmacist-dashboard-wrapper">
      <div className="pharmacist-dashboard-container">
        <div className="pharmacist-error-state">
          <p>{error}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="pharmacist-dashboard-wrapper">
      <div className="pharmacist-dashboard-container">
        <div className="pharmacist-dashboard-header">
          <div className="pharmacist-header-content">
            <h1 className="pharmacist-dashboard-title">Tableau de bord de la {pharmacy.nom}</h1>
            <div className="pharmacist-header-actions">
              <span className="pharmacist-status-indicator">
                Status: <span className={pharmacy.has_delivery ? "pharmacist-status-text" : "pharmacist-status-text-un"}>{pharmacy.has_delivery ? "Livraison disponible" : "Livraison indisponible"}</span>
              </span>
              <button 
                className="pharmacist-delivery-toggle-btn"
                onClick={() => toggleDelivery(pharmacy.id)}
              >
                {pharmacy.has_delivery ? "Désactiver la livraison" : "Activer la livraison"}
              </button>
            </div>
          </div>
        </div>

        <div className="pharmacist-stats-section">
          <div className="pharmacist-stats-row">
            <div className="pharmacist-stat-card pharmacist-stat-primary">
              <div className="pharmacist-stat-icon">
                <Calendar size={20} />
              </div>
              <div className="pharmacist-stat-content">
                <div className="pharmacist-stat-number">{stats.pendingPrescriptions}</div>
                <div className="pharmacist-stat-label">Ordonnances</div>
                <div className="pharmacist-stat-sublabel">En attente</div>
              </div>
            </div>

            <div className="pharmacist-stat-card pharmacist-stat-secondary">
              <div className="pharmacist-stat-icon">
                <Users size={20} />
              </div>
              <div className="pharmacist-stat-content">
                <div className="pharmacist-stat-number">{stats.totalMedicines}</div>
                <div className="pharmacist-stat-label">Médicaments</div>
                <div className="pharmacist-stat-sublabel">Total en stock</div>
              </div>
            </div>

            <div className="pharmacist-stat-card pharmacist-stat-tertiary">
              <div className="pharmacist-stat-icon">
                <FileText size={20} />
              </div>
              <div className="pharmacist-stat-content">
                <div className="pharmacist-stat-number">{stats.lowStock}</div>
                <div className="pharmacist-stat-label">Stock faible</div>
                <div className="pharmacist-stat-sublabel">Produits à commander</div>
              </div>
            </div>
          </div>

          <div className="pharmacist-stats-row">
            <div className="pharmacist-stat-card pharmacist-stat-revenue">
              <div className="pharmacist-stat-icon">
                <DollarSign size={20} />
              </div>
              <div className="pharmacist-stat-content">
                <div className="pharmacist-stat-number">{stats.dailySales.toFixed(2)} Ar</div>
                <div className="pharmacist-stat-label">Ventes</div>
                <div className="pharmacist-stat-sublabel">Aujourd'hui</div>
              </div>
            </div>

            <div className="pharmacist-stat-card pharmacist-stat-monthly">
              <div className="pharmacist-stat-icon">
                <DollarSign size={20} />
              </div>
              <div className="pharmacist-stat-content">
                <div className="pharmacist-stat-number">{stats.monthlyRevenue.toFixed(2)} Ar</div>
                <div className="pharmacist-stat-label">Revenu Mensuel</div>
                <div className="pharmacist-stat-sublabel">Ce mois</div>
              </div>
            </div>
          </div>
        </div>

        <div className="pharmacist-dashboard-grid">
          <div className="pharmacist-dashboard-card">
            <div className="pharmacist-card-header">
              <h2>Ventes hebdomadaires</h2>
            </div>
            <div className="pharmacist-chart-container">
              <div className="pharmacist-chart-header">
                <span className="pharmacist-chart-subtitle">Suivez vos ventes hebdomadaires.</span>
                <span className="pharmacist-chart-max">max. 10000 Ar</span>
              </div>
              <div className="pharmacist-sales-chart">
                {salesData.length > 0 ? (
                  salesData.map((item, index) => (
                    <div key={index} className="pharmacist-chart-bar-group">
                      <div className="pharmacist-chart-bar-container">
                        <div 
                          className="pharmacist-chart-bar" 
                          style={{ height: `${Math.max((item.sales / 10000) * 100, 2)}%` }}
                          title={`${item.sales.toFixed(2)} Ar`}
                        ></div>
                      </div>
                      <span className="pharmacist-chart-label">{item.day}</span>
                      <span className="pharmacist-chart-value">{item.sales.toFixed(2)} Ar</span>
                    </div>
                  ))
                ) : (
                  <div className="pharmacist-no-data">
                    <p>Aucune donnée de vente disponible</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pharmacist-dashboard-card">
            <div className="pharmacist-card-header">
              <h2>Actions Rapides</h2>
              <span className="pharmacist-card-subtitle">Accès direct aux fonctionnalités clés.</span>
            </div>
            <div className="pharmacist-quick-actions">
              <div className="pharmacist-action-item" onClick={() => navigate("/gestion-stock")}>
                <Package size={20} />
                <span>Gestion de stock</span>
              </div>
              <div className="pharmacist-action-item" onClick={() => navigate("/validation-ordonnance")}>
                <FileText size={20} />
                <span>Ordonnances</span>
              </div>
              <div className="pharmacist-action-item" onClick={() => navigate("/suivi-ventes")}>
                <BarChart size={20} />
                <span>Suivi des ventes</span>
              </div>
              <div className="pharmacist-action-item" onClick={() => navigate("/message-pharmacie")}>
                <MessageSquare size={20} />
                <span>Messages</span>
              </div>
              <div className="pharmacist-action-item" onClick={() => navigate("/validation-ordonnance")}>
                <Users size={20} />
                <span>Patients</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pharmacist-dashboard-grid">
          <div className="pharmacist-dashboard-card">
            <div className="pharmacist-card-header">
              <h2>Médicaments à faible stock</h2>
              <button className="pharmacist-view-all-btn" onClick={() => navigate("/gestion-stock")}>
                Voir tout
              </button>
            </div>
            <div className="pharmacist-table-container">
              {lowStockItems.length > 0 ? (
                <table className="pharmacist-data-table">
                  <thead>
                    <tr>
                      <th>Médicament</th>
                      <th>Stock</th>
                      <th>Seuil</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockItems.slice(0, 5).map((item) => (
                      <tr key={item.id}>
                        <td className="pharmacist-medication-name">{item.name}</td>
                        <td className="pharmacist-stock-critical">{item.stock}</td>
                        <td>{item.threshold}</td>
                        <td>
                          <button className="pharmacist-action-btn" onClick={() => navigate("/gestion-stock")}>
                            Réapprovisionner
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="pharmacist-empty-state">
                  <p>Aucun médicament en stock faible</p>
                </div>
              )}
            </div>
          </div>

          <div className="pharmacist-dashboard-card">
            <div className="pharmacist-card-header">
              <h2>Ordonnances en attente</h2>
              <button className="pharmacist-view-all-btn" onClick={() => navigate("/validation-ordonnance")}>
                Voir tout
              </button>
            </div>
            <div className="pharmacist-table-container">
              {pendingPrescriptions.length > 0 ? (
                <table className="pharmacist-data-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Médecin</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingPrescriptions.slice(0, 5).map((prescription) => (
                      <tr key={prescription.id}>
                        <td className="pharmacist-patient-name">{prescription.patient}</td>
                        <td>Dr {prescription.doctor}</td>
                        <td>{prescription.date}</td>
                        <td>
                          <button className="pharmacist-action-btn" onClick={() => navigate("/validation-ordonnance")}>
                            Traiter
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="pharmacist-empty-state">
                  <p>Aucune ordonnance en attente</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacierDashboard;