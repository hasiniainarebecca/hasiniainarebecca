import { useState, useEffect, useCallback, useRef } from "react";
import { Calendar, Download, CreditCard, TrendingUp, ShoppingCart } from "lucide-react";
import { Bar } from "react-chartjs-2"; // CHANGEMENT: Importez Bar au lieu de Line
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement, // CHANGEMENT: Importez BarElement au lieu de PointElement et LineElement
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "./styles/Ventes.css";

// Enregistrer les composants nécessaires de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement, // CHANGEMENT: Enregistrez BarElement
  Title,
  Tooltip,
  Legend
);

const Ventes = () => {
  const [salesData, setSalesData] = useState({
    daily: [],
    weekly: [],
    monthly: [],
    topProducts: [],
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("weekly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState(null);

  const fetchSalesData = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Dates de debug (à remplacer par vos dates réelles si nécessaire)
    const debugEndDate = new Date("2025-12-31");
    const debugStartDate = new Date("2025-01-01");

    const defaultEndDate = debugEndDate.toISOString().split("T")[0];
    const defaultStartDate = debugStartDate.toISOString().split("T")[0];

    const currentStartDate = startDate || defaultStartDate;
    const currentEndDate = endDate || defaultEndDate;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Jeton d'authentification manquant. Veuillez vous connecter.");
      }

      const response = await fetch(
        `http://localhost:8000/api/pharmacist/sales-data/suivis?timeRange=${timeRange}&startDate=${currentStartDate}&endDate=${currentEndDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Erreur HTTP: ${response.status} ${response.statusText}. Réponse: ${errorText}`
        );
        if (response.status === 401 || response.status === 403) {
          throw new Error("Authentification échouée. Veuillez vous reconnecter.");
        }
        throw new Error(
          `Erreur lors du chargement des données: ${response.status} ${response.statusText}. Réponse inattendue du serveur.`
        );
      }

      const data = await response.json();
      console.log("Données de vente reçues:", data);
      setSalesData({
        weekly: data.weeklySales || [],
        daily: data.dailySales || [],
        monthly: data.monthlySales || [],
        topProducts: data.topProducts || [],
      });
    } catch (err) {
      setError(err.message);
      console.error("Erreur lors du chargement des données de vente: ", err);
    } finally {
      setLoading(false);
    }
  }, [timeRange, startDate, endDate]);

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  const getTimeRangeData = () => {
    switch (timeRange) {
      case "daily":
        return salesData.daily;
      case "weekly":
        return salesData.weekly;
      case "monthly":
        return salesData.monthly;
      default:
        return salesData.weekly;
    }
  };

  const calculateTotals = () => {
    const data = getTimeRangeData();
    if (!data || data.length === 0) return { totalSales: 0, totalTransactions: 0 };

    return {
      totalSales: data.reduce(
        (sum, item) => sum + (item.sales || item.total_sales || 0),
        0
      ),
      totalTransactions: data.reduce(
        (sum, item) => sum + (item.transactions || item.number_of_transactions || 0),
        0
      ),
    };
  };

  const { totalSales, totalTransactions } = calculateTotals();

  const getXAxisKey = () => {
    switch (timeRange) {
      case "daily":
        return "date";
      case "weekly":
        return "week";
      case "monthly":
        return "month";
      default:
        return "period";
    }
  };

  const dataForChart = getTimeRangeData();

  const chartData = {
    labels: dataForChart.map((item) => item[getXAxisKey()]),
    datasets: [
      {
        label: "Ventes (Ar)",
        data: dataForChart.map((item) => item.sales || item.total_sales || 0),
        backgroundColor: "rgba(74, 144, 226, 0.8)", // Couleur bleue pour les barres de ventes
        borderColor: "rgba(74, 144, 226, 1)",
        borderWidth: 1,
        yAxisID: "y",
      },
      {
        label: "Transactions",
        data: dataForChart.map(
          (item) => item.transactions || item.number_of_transactions || 0
        ),
        backgroundColor: "rgba(245, 166, 35, 0.8)", // Couleur orange pour les barres de transactions
        borderColor: "rgba(245, 166, 35, 1)",
        borderWidth: 1,
        yAxisID: "y1",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Évolution des ventes et transactions",
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: getXAxisKey() === "date" ? "Date" : getXAxisKey() === "week" ? "Semaine" : "Mois",
        },
      },
      y: {
        type: "linear",
        display: true,
        position: "left",
        title: {
          display: true,
          text: "Ventes (Ar)",
        },
        grid: {
          drawOnChartArea: true,
        },
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        title: {
          display: true,
          text: "Transactions",
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div className="vente-med-main-content">
          <div className="sales-container">
            <div className="sales-header">
              <h1>Suivi des ventes</h1>
            </div>

            <div className="sales-summary">
              <div className="summary-card">
                <div className="summary-icon">
                  <CreditCard size={24} />
                </div>
                <div className="summary-content">
                  <h3>Ventes totales</h3>
                  <p className="summary-value">{totalSales.toFixed(2)} Ar</p>
                  <p className="summary-period">Période sélectionnée</p>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon">
                  <ShoppingCart size={24} />
                </div>
                <div className="summary-content">
                  <h3>Transactions</h3>
                  <p className="summary-value">{totalTransactions}</p>
                  <p className="summary-period">Période sélectionnée</p>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon">
                  <TrendingUp size={24} />
                </div>
                <div className="summary-content">
                  <h3>Panier moyen</h3>
                  <p className="summary-value">
                    {totalTransactions > 0
                      ? (totalSales / totalTransactions).toFixed(2)
                      : "0.00"}{" "}
                    Ar
                  </p>
                  <p className="summary-period">Période sélectionnée</p>
                </div>
              </div>
            </div>

            <div className="sales-filters">
              <div className="time-range-selector">
                <button
                  className={timeRange === "daily" ? "active" : ""}
                  onClick={() => setTimeRange("daily")}
                >
                  Quotidien
                </button>
                <button
                  className={timeRange === "weekly" ? "active" : ""}
                  onClick={() => setTimeRange("weekly")}
                >
                  Hebdomadaire
                </button>
                <button
                  className={timeRange === "monthly" ? "active" : ""}
                  onClick={() => setTimeRange("monthly")}
                >
                  Mensuel
                </button>
              </div>

              <div className="date-range-selector">
                <div className="date-input">
                  <Calendar size={16} />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <span>à</span>
                <div className="date-input">
                  <Calendar size={16} />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <button className="apply-btn" onClick={fetchSalesData}>
                  Appliquer
                </button>
              </div>
            </div>

            {loading ? (
              <div className="loading">Chargement des données de vente...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : (
              <>
                <div className="sales-chart-container">
                  <div className="chart-header">
                    <h2>Évolution des ventes</h2>
                    <div className="chart-legend">
                      <div className="legend-item">
                        <div className="legend-color sales-color"></div>
                        <span>Ventes (Ar)</span>
                      </div>
                      <div className="legend-item">
                        <div className="legend-color transactions-color"></div>
                        <span>Transactions</span>
                      </div>
                    </div>
                  </div>
                  <div className="sales-chart">
                    
                      <Bar data={chartData} options={chartOptions} /> 
                   
                  </div>
                </div>

                <div className="top-products">
                  <h2>Produits les plus vendus</h2>
                  <div className="products-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Produit</th>
                          <th>Quantité vendue</th>
                          <th>Chiffre d'affaires</th>
                          <th>% des ventes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesData.topProducts.map((product, index) => (
                          <tr key={index}>
                            <td>{product.name}</td>
                            <td>{product.sales} unités</td>
                            <td>{product.revenue.toFixed(2)} Ar</td>
                            <td>
                              {totalSales > 0
                                ? ((product.revenue / totalSales) * 100).toFixed(1)
                                : "0.0"}
                              %
                              <div className="percentage-bar">
                                <div
                                  className="percentage-fill"
                                  style={{
                                    width: `${
                                      totalSales > 0
                                        ? (product.revenue / totalSales) * 100
                                        : 0
                                    }%`,
                                  }}
                                ></div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
          </div>
  );
};

export default Ventes;