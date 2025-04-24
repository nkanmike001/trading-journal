body {
  font-family: 'Roboto', Arial, sans-serif;
  margin: 0;
  padding: 0;
  background-color: #e9ecef;
  color: #212529;
}
.container {
  max-width: 1400px;
  margin: 20px auto;
  padding: 20px;
}
h1 {
  text-align: center;
  color: #005f73;
  font-size: 2em;
  margin-bottom: 20px;
}
h2 {
  color: #005f73;
  font-size: 1.4em;
  margin: 0 0 10px;
}
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.card {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}
.card:hover {
  transform: translateY(-5px);
}
.daily-gain {
  text-align: center;
  background: #e9f5f9;
}
.daily-gain p {
  font-size: 1.8em;
  color: #005f73;
  margin: 0;
}
.metrics-section p {
  font-size: 1em;
  color: #495057;
}
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.metric {
  text-align: center;
}
.metric label {
  font-size: 0.9em;
  color: #6c757d;
  display: block;
}
.metric p {
  font-size: 1.2em;
  color: #005f73;
  margin: 5px 0 0;
}
meter {
  width: 100%;
  height: 15px;
  margin: 10px 0;
}
meter::-webkit-meter-optimum-value {
  background: #2b9348;
}
meter::-webkit-meter-suboptimum-value {
  background: #ffca3a;
}
meter::-webkit-meter-even-less-good-value {
  background: #ef233c;
}
.chart-section canvas {
  max-height: 250px;
}
.total-trades-section canvas {
  max-width: 200px;
  max-height: 200px;
  margin: 0 auto;
}
.calendar-section, .trade-log-section {
  position: relative;
}
.collapse-toggle {
  background: none;
  border: none;
  color: #005f73;
  font-size: 1.4em;
  cursor: pointer;
  padding: 0;
  width: 100%;
  text-align: left;
}
.collapse-toggle:hover {
  color: #003844;
}
.collapsible {
  transition: max-height 0.3s ease-out;
  max-height: 500px;
  overflow: hidden;
}
.collapsible.collapsed {
  max-height: 0;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin: 10px 0;
}
th, td {
  border: 1px solid #dee2e6;
  padding: 8px;
  text-align: left;
  font-size: 0.9em;
}
th {
  background: #005f73;
  color: #fff;
}
tr:nth-child(even) {
  background: #f8f9fa;
}
button {
  background: #005f73;
  color: #fff;
  padding: 8px 16px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin: 5px;
}
button:hover {
  background: #003844;
}
input, select {
  padding: 8px;
  margin: 5px 0;
  border: 1px solid #ced4da;
  border-radius: 5px;
  width: 100%;
  box-sizing: border-box;
}
a {
  color: #005f73;
  text-decoration: none;
}
a:hover {
  text-decoration: underline;
}
@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 480px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
