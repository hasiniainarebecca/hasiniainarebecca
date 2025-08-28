import React, { useEffect, useRef } from 'react';
import './styles/AdminRapport.css';

const AdminRapport = () => {
  const userChartRef = useRef(null);
  const appointmentChartRef = useRef(null);

  useEffect(() => {
    // Simulation des graphiques avec Chart.js
    const loadCharts = async () => {
      const ChartJS = await import('chart.js/auto');
      const Chart = ChartJS.default;

      // Graphique de répartition des utilisateurs
      if (userChartRef.current) {
        new Chart(userChartRef.current, {
          type: 'bar',
          data: {
            labels: ['Patients', 'Docteurs', 'Professionnels'],
            datasets: [{
              label: 'Nombre d\'utilisateurs',
              data: [5, 2.25, 1.5],
              backgroundColor: [
                'var(--sl-color-primary)',
                'var(--sl-color-secondary)',
                'var(--sl-color-tertiary)'
              ],
              borderWidth: 0,
              borderRadius: 4
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  color: 'var(--sl-border-color)'
                },
                ticks: {
                  color: 'var(--sl-text-color)'
                }
              },
              x: {
                grid: {
                  display: false
                },
                ticks: {
                  color: 'var(--sl-text-color)'
                }
              }
            }
          }
        });
      }

      // Graphique d'activité des rendez-vous
      if (appointmentChartRef.current) {
        new Chart(appointmentChartRef.current, {
          type: 'line',
          data: {
            labels: ['1 août', '2 août', '3 août', '4 août', '5 août', '6 août', '7 août'],
            datasets: [{
              label: 'Rendez-vous',
              data: [8, 12, 6, 10, 14, 8, 16],
              borderColor: 'var(--sl-color-primary)',
              backgroundColor: 'rgba(74, 144, 226, 0.1)',
              tension: 0.4,
              fill: true,
              pointBackgroundColor: 'var(--sl-color-primary)',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 4
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  color: 'var(--sl-border-color)'
                },
                ticks: {
                  color: 'var(--sl-text-color)',
                  stepSize: 4
                }
              },
              x: {
                grid: {
                  color: 'var(--sl-border-color)'
                },
                ticks: {
                  color: 'var(--sl-text-color)'
                }
              }
            }
          }
        });
      }
    };

    loadCharts();
  }, []);

  return (
    <div className="admin-rapport-container">
      <header className="admin-rapport-header">
        <h2>Rapports et Statistiques</h2>
      </header>

      <div className="admin-rapport-content">
        <main className="admin-rapport-main">
          <div className="admin-rapport-stats">
            <div className="admin-rapport-stat-card">
              <h3>Utilisateurs Totaux</h3>
              <p className="stat-number">1,248</p>
            </div>
            <div className="admin-rapport-stat-card">
              <h3>Rendez-vous Totaux</h3>
              <p className="stat-number">3,756</p>
            </div>
            <div className="admin-rapport-stat-card">
              <h3>Docteurs Inscrits</h3>
              <p className="stat-number">327</p>
            </div>
            
            <div className="admin-rapport-stat-card">
              <h3>Médecins actifs</h3>
              <p className="stat-number">285</p>
            </div>
            <div className="admin-rapport-stat-card">
              <h3>Services Infirmiers</h3>
              <p className="stat-number">18</p>
            </div>
          </div>

          <div className="admin-rapport-charts">
            <div className="admin-rapport-chart-card">
              <h3>Répartition des Utilisateurs</h3>
              <p className="chart-description">Visualisation du nombre d'utilisateurs par rôle.</p>
              <div className="chart-container">
                <canvas ref={userChartRef}></canvas>
              </div>
            </div>

            <div className="admin-rapport-chart-card">
              <h3>Activité des Rendez-vous (7 derniers jours)</h3>
              <p className="chart-description">Evolution du nombre de rendez-vous pris.</p>
              <div className="chart-container">
                <canvas ref={appointmentChartRef}></canvas>
              </div>
            </div>
          </div>

          <div className="admin-rapport-download">
            <h3>Télécharger des Rapports</h3>
            <p className="download-description">Générer et télécharger des rapports détaillés au format CSV ou PDF.</p>
            
            <div className="download-options">
              <div className="download-option">
                <input type="checkbox" id="user-activity" />
                <label htmlFor="user-activity">Rapport d'activité des utilisateurs (CSV)</label>
              </div>
              
              <div className="download-option">
                <input type="checkbox" id="financial-report" defaultChecked />
                <label htmlFor="financial-report">Rapport financier des services (PDF)</label>
              </div>
              
              <div className="download-option">
                <input type="checkbox" id="appointment-report" />
                <label htmlFor="appointment-report">Rapport complet des rendez-vous (CSV)</label>
              </div>
            </div>
            
            <button className="download-button">Télécharger les rapports sélectionnés</button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminRapport;