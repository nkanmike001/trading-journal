// Register Chart.js plugins
Chart.register(ChartDataLabels);

// Sample trade data with risk/reward
const trades = [
  { date: "2025-04-24", pair: "EUR/USD", outcome: "Win", gain: 50, entry: 1.1000, exit: 1.1050, risk: 0.0050, reward: 0.0050 },
  { date: "2025-04-23", pair: "GBP/USD", outcome: "Win", gain: 75, entry: 1.2500, exit: 1.2600, risk: 0.0050, reward: 0.0100 },
  { date: "2025-04-22", pair: "USD/JPY", outcome: "Loss", gain: -20, entry: 150.00, exit: 149.50, risk: 0.50, reward: 0.50 },
  { date: "2025-04-21", pair: "AUD/USD", outcome: "Win", gain: 30, entry: 0.6500, exit: 0.6550, risk: 0.0025, reward: 0.0050 },
  { date: "2025-04-20", pair: "EUR/GBP", outcome: "Loss", gain: -15, entry: 0.8600, exit: 0.8550, risk: 0.0050, reward: 0.0050 },
  { date: "2025-04-19", pair: "USD/CAD", outcome: "Win", gain: 25, entry: 1.3700, exit: 1.3750, risk: 0.0050, reward: 0.0050 },
  { date: "2025-04-18", pair: "NZD/USD", outcome: "Win", gain: 40, entry: 0.5900, exit: 0.5950, risk: 0.0025, reward: 0.0050 },
  { date: "2025-04-17", pair: "EUR/JPY", outcome: "Loss", gain: -10, entry: 165.00, exit: 164.50, risk: 0.50, reward: 0.50 },
  { date: "2025-04-16", pair: "GBP/JPY", outcome: "Win", gain: 20, entry: 190.00, exit: 190.50, risk: 0.25, reward: 0.50 },
  { date: "2025-04-15", pair: "USD/CHF", outcome: "Win", gain: -12, entry: 0.9100, exit: 0.9050, risk: 0.0050, reward: 0.0050 }
];

// Toggle collapsible sections
function toggleCollapse(id) {
  console.log(`Toggling section: ${id}`);
  const content = document.getElementById(id);
  if (content) {
    content.classList.toggle('collapsed');
  } else {
    console.error(`Element with id ${id} not found`);
  }
}

// Render trade table
function renderTradeTable(filteredTrades) {
  console.log('Rendering trade table with', filteredTrades.length, 'trades');
  const tbody = document.getElementById("tradeTableBody");
  if (tbody) {
    tbody.innerHTML = filteredTrades.map(trade => `
      <tr>
        <td>${trade.date}</td>
        <td>${trade.pair}</td>
        <td>${trade.outcome}</td>
        <td>${trade.gain.toFixed(2)}%</td>
        <td>${trade.entry || '-'}</td>
        <td>${trade.exit || '-'}</td>
      </tr>
    `).join("") || "<tr><td colspan='6'>No trades found</td></tr>";
  } else {
    console.error("Trade table body not found");
  }
}

// Filter trades
function filterTrades() {
  console.log('Filtering trades');
  const outcome = document.getElementById("filterOutcome")?.value || "all";
  const filteredTrades = outcome === "all" ? trades : trades.filter(t => t.outcome === outcome);
  renderTradeTable(filteredTrades);
}

// Sort table
let sortDirection = 1;
function sortTable(colIndex) {
  console.log(`Sorting table by column ${colIndex}`);
  const keys = ["date", "pair", "outcome", "gain"];
  trades.sort((a, b) => {
    const valA = colIndex === 3 ? a[keys[colIndex]] : a[keys[colIndex]].toString().toLowerCase();
    const valB = colIndex === 3 ? b[keys[colIndex]] : b[keys[colIndex]].toString().toLowerCase();
    return (valA < valB ? -1 : 1) * sortDirection;
  });
  sortDirection *= -1;
  filterTrades();
}

// Update performance chart
function updatePerformanceChart() {
  console.log('Updating performance chart');
  const filter = document.getElementById("performanceFilter")?.value || "month";
  const customRange = document.getElementById("customRange");
  if (customRange) {
    customRange.style.display = filter === "custom" ? "block" : "none";
  }

  let groupBy = filter;
  let startDate = document.getElementById("startDate")?.value;
  let endDate = document.getElementById("endDate")?.value;
  let filteredTrades = trades;

  if (filter === "custom" && startDate && endDate) {
    filteredTrades = trades.filter(t => t.date >= startDate && t.date <= endDate);
    groupBy = "day";
  }

  const performanceData = filteredTrades.reduce((acc, t) => {
    let key;
    if (groupBy === "day") key = t.date;
    else if (groupBy === "week") key = `${t.date.slice(0, 4)}-W${Math.floor(new Date(t.date).getDate() / 7) + 1}`;
    else if (groupBy === "month") key = t.date.slice(0, 7);
    else if (groupBy === "year") key = t.date.slice(0, 4);
    acc[key] = (acc[key] || 0) + t.gain;
    return acc;
  }, {});

  const ctx = document.getElementById("performanceChart");
  const errorEl = document.getElementById("performanceChartError");
  if (!ctx) {
    console.error("Performance chart canvas not found");
    if (errorEl) errorEl.style.display = "block";
    return;
  }
  const ctx2d = ctx.getContext("2d");
  if (!ctx2d) {
    console.error("Failed to get 2D context for performance chart");
    if (errorEl) errorEl.style.display = "block";
    return;
  }

  try {
    if (window.performanceChart) window.performanceChart.destroy();
    window.performanceChart = new Chart(ctx2d, {
      type: "line",
      data: {
        labels: Object.keys(performanceData).sort(),
        datasets: [{
          label: `${filter.charAt(0).toUpperCase() + filter.slice(1)} Gain (%)`,
          data: Object.values(performanceData),
          fill: true,
          backgroundColor: "rgba(0, 212, 180, 0.2)",
          borderColor: "#00d4b4",
          tension: 0.3
        }]
      },
      options: {
        scales: {
          x: { display: true, grid: { display: false }, ticks: { color: "#e0e0e0" } },
          y: { beginAtZero: true, grid: { display: false }, title: { display: true, text: "Gain (%)", color: "#e0e0e0" }, ticks: { color: "#e0e0e0" } }
        },
        plugins: { legend: { labels: { color: "#e0e0e0" } } }
      }
    });
    console.log("Performance Chart initialized");
  } catch (error) {
    console.error("Failed to initialize performance chart:", error);
    if (errorEl) errorEl.style.display = "block";
  }
}

// Initialize charts and calendar
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing visualizations");

  // Set up event listeners for collapsible sections
  const calendarToggle = document.getElementById("calendarToggle");
  if (calendarToggle) {
    calendarToggle.addEventListener("click", () => toggleCollapse("calendarContent"));
  } else {
    console.error("Calendar toggle button not found");
  }

  const tradeLogToggle = document.getElementById("tradeLogToggle");
  if (tradeLogToggle) {
    tradeLogToggle.addEventListener("click", () => toggleCollapse("tradeLogContent"));
  } else {
    console.error("Trade log toggle button not found");
  }

  // Table sorting
  document.querySelectorAll("#tradeTable th[data-col]").forEach(th => {
    th.addEventListener("click", () => sortTable(parseInt(th.dataset.col)));
  });

  // Performance filter
  const performanceFilter = document.getElementById("performanceFilter");
  if (performanceFilter) {
    performanceFilter.addEventListener("change", updatePerformanceChart);
  } else {
    console.error("Performance filter not found");
  }

  const applyCustomRange = document.getElementById("applyCustomRange");
  if (applyCustomRange) {
    applyCustomRange.addEventListener("click", updatePerformanceChart);
  } else {
    console.error("Apply custom range button not found");
  }

  // Filter trades
  const filterOutcome = document.getElementById("filterOutcome");
  if (filterOutcome) {
    filterOutcome.addEventListener("change", filterTrades);
  } else {
    console.error("Filter outcome select not found");
  }

  // Logout button
  const logoutButton = document.getElementById("logoutButton");
  if (logoutButton) {
    logoutButton.addEventListener("click", () => alert("Logout clicked"));
  } else {
    console.error("Logout button not found");
  }

  // Win Rate vs. RR Bulb Visualization
  try {
    const winRRctx = document.getElementById("winRRChart");
    const errorEl = document.getElementById("winRRChartError");
    if (!winRRctx) {
      console.error("Win RR chart canvas not found");
      if (errorEl) errorEl.style.display = "block";
    } else {
      const ctx2d = winRRctx.getContext("2d");
      if (!ctx2d) {
        console.error("Failed to get 2D context for win RR chart");
        if (errorEl) errorEl.style.display = "block";
      } else {
        console.log("Initializing Win Rate vs. RR Bulb Visualization");
        const wins = trades.filter(t => t.outcome === "Win").length;
        const winRate = (wins / trades.length * 100).toFixed(2);
        const avgRR = trades.reduce((sum, t) => sum + (t.reward / t.risk), 0) / trades.length;

        // Determine colors
        const winRateColor = winRate > 60 ? "#66ff99" : winRate >= 40 ? "#cccccc" : "#ff6666";
        const rrColor = avgRR > 1.5 ? "#66ff99" : avgRR >= 1 ? "#cccccc" : "#ff6666";
        const bulbColor = (winRate > 60 && avgRR > 1.5) ? "#66ff99" : (winRate >= 40 && avgRR >= 1) ? "#cccccc" : "#ff6666";
        const bulbStatus = (winRate > 60 && avgRR > 1.5) ? "Profitable - Keep Shining!" : 
                          (winRate >= 40 && avgRR >= 1) ? "Breakeven - Stay Balanced" : 
                          "Not Profitable - Boost Your Strategy";
        const winRateStatus = winRate > 60 ? "Strong" : winRate >= 40 ? "Moderate" : "Weak";
        const rrStatus = avgRR > 1.5 ? "High" : avgRR >= 1 ? "Balanced" : "Low";

        // Custom Chart.js plugin for bulb visualization
        const bulbPlugin = {
          id: 'bulbVisualization',
          afterDraw: (chart) => {
            const ctx = chart.ctx;
            const width = chart.width;
            const height = chart.height;
            ctx.save();

            // Clear canvas
            ctx.clearRect(0, 0, width, height);

            // Draw Win Rate power source (left)
            ctx.fillStyle = winRateColor;
            ctx.beginPath();
            ctx.arc(width * 0.2, height * 0.7, 30, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#e0e0e0";
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw RR power source (right)
            ctx.fillStyle = rrColor;
            ctx.beginPath();
            ctx.arc(width * 0.8, height * 0.7, 30, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Draw connecting lines to bulb
            ctx.beginPath();
            ctx.moveTo(width * 0.2, height * 0.7);
            ctx.lineTo(width * 0.5, height * 0.3);
            ctx.moveTo(width * 0.8, height * 0.7);
            ctx.lineTo(width * 0.5, height * 0.3);
            ctx.stroke();

            // Draw bulb (center)
            ctx.fillStyle = bulbColor;
            ctx.beginPath();
            ctx.arc(width * 0.5, height * 0.3, 40, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // Glowing effect
            ctx.beginPath();
            ctx.arc(width * 0.5, height * 0.3, 45, 0, Math.PI * 2);
            ctx.strokeStyle = bulbColor;
            ctx.lineWidth = 5;
            ctx.globalAlpha = 0.5;
            ctx.stroke();
            ctx.globalAlpha = 1;

            // Labels
            ctx.font = "bold 14px Inter";
            ctx.fillStyle = winRateColor;
            ctx.textAlign = "center";
            ctx.fillText(`Win Rate: ${winRate}%`, width * 0.2, height * 0.85);
            ctx.fillText(winRateStatus, width * 0.2, height * 0.9);
            ctx.fillStyle = rrColor;
            ctx.fillText(`RR: ${avgRR.toFixed(2)}`, width * 0.8, height * 0.85);
            ctx.fillText(rrStatus, width * 0.8, height * 0.9);
            ctx.fillStyle = bulbColor;
            ctx.font = "bold 16px Inter";
            ctx.textShadow = `0 0 5px ${bulbColor}`;
            ctx.fillText(bulbStatus, width * 0.5, height * 0.15);
            ctx.textShadow = "none";

            ctx.restore();
          }
        };

        new Chart(ctx2d, {
          type: 'scatter',
          data: { datasets: [] }, // Empty dataset to use custom plugin
          options: {
            plugins: {
              legend: { display: false }
            },
            scales: {
              x: { display: false },
              y: { display: false }
            }
          },
          plugins: [bulbPlugin]
        });
        console.log("Win Rate vs. RR Bulb Visualization initialized");
      }
    }
  } catch (error) {
    console.error("Failed to initialize Win RR visualization:", error);
    const errorEl = document.getElementById("winRRChartError");
    if (errorEl) errorEl.style.display = "block";
  }

  // Total Trades Pie Chart
  try {
    const pieCtx = document.getElementById("tradesPieChart");
    const errorEl = document.getElementById("tradesPieChartError");
    if (!pieCtx) {
      console.error("Trades pie chart canvas not found");
      if (errorEl) errorEl.style.display = "block";
    } else {
      const ctx2d = pieCtx.getContext("2d");
      if (!ctx2d) {
        console.error("Failed to get 2D context for trades pie chart");
        if (errorEl) errorEl.style.display = "block";
      } else {
        console.log("Initializing Total Trades Pie Chart");
        const wins = trades.filter(t => t.outcome === "Win").length;
        const losses = trades.filter(t => t.outcome === "Loss").length;
        new Chart(ctx2d, {
          type: "pie",
          data: {
            labels: ["Wins", "Losses"],
            datasets: [{
              data: [wins, losses],
              backgroundColor: ["#00d4b4", "#ff6666"],
              borderColor: "#1a1a2e",
              borderWidth: 2
            }]
          },
          options: {
            plugins: {
              legend: { position: "bottom", labels: { color: "#e0e0e0" } },
              datalabels: {
                color: "#e0e0e0",
                formatter: (value, ctx) => ctx.chart.data.labels[ctx.dataIndex],
                font: { size: 12 }
              }
            }
          }
        });
        console.log("Total Trades Pie Chart initialized");
      }
    }
  } catch (error) {
    console.error("Failed to initialize pie chart:", error);
    const errorEl = document.getElementById("tradesPieChartError");
    if (errorEl) errorEl.style.display = "block";
  }

  // Performance Chart (initially monthly)
  try {
    updatePerformanceChart();
    console.log("Performance Chart initialized");
  } catch (error) {
    console.error("Failed to initialize performance chart:", error);
    const errorEl = document.getElementById("performanceChartError");
    if (errorEl) errorEl.style.display = "block";
  }

  // Quick Stats Visualizations
  const sparklineConfigs = [
    { id: "bestTradeSparkline", data: [0, 75], color: "#00d4b4", borderWidth: 2 },
    { id: "worstTradeSparkline", data: [0, -20], color: "#ff6666", borderWidth: 2 }
  ];
  sparklineConfigs.forEach(config => {
    try {
      const ctx = document.getElementById(config.id);
      const errorEl = document.getElementById("quickStatsError");
      if (!ctx) {
        console.error(`Sparkline canvas ${config.id} not found`);
        if (errorEl) errorEl.style.display = "block";
      } else {
        const ctx2d = ctx.getContext("2d");
        if (!ctx2d) {
          console.error(`Failed to get 2D context for ${config.id}`);
          if (errorEl) errorEl.style.display = "block";
        } else {
          console.log(`Initializing sparkline: ${config.id}`);
          new Chart(ctx2d, {
            type: "line",
            data: {
              labels: ["", ""],
              datasets: [{
                data: config.data,
                borderColor: config.color,
                borderWidth: config.borderWidth,
                fill: false,
                pointRadius: 0
              }]
            },
            options: {
              scales: { x: { display: false }, y: { display: false } },
              plugins: { legend: { display: false } }
            }
          });
          console.log(`Sparkline ${config.id} initialized`);
        }
      }
    } catch (error) {
      console.error(`Failed to initialize sparkline ${config.id}:`, error);
      const errorEl = document.getElementById("quickStatsError");
      if (errorEl) errorEl.style.display = "block";
    }
  });

  // Win Rate Bar Chart (Quick Stats)
  try {
    const ctx = document.getElementById("winRateBar");
    const errorEl = document.getElementById("quickStatsError");
    if (!ctx) {
      console.error("Win rate bar canvas not found");
      if (errorEl) errorEl.style.display = "block";
    } else {
      const ctx2d = ctx.getContext("2d");
      if (!ctx2d) {
        console.error("Failed to get 2D context for win rate bar");
        if (errorEl) errorEl.style.display = "block";
      } else {
        console.log("Initializing Win Rate Bar Chart");
        const wins = trades.filter(t => t.outcome === "Win").length;
        const winRate = (wins / trades.length * 100).toFixed(2);
        new Chart(ctx2d, {
          type: "bar",
          data: {
            labels: ["Win Rate"],
            datasets: [{
              data: [winRate],
              backgroundColor: "#ffd700",
              borderColor: "#1a1a2e",
              borderWidth: 1
            }]
          },
          options: {
            indexAxis: "y",
            scales: {
              x: { display: false, max: 100 },
              y: { display: false }
            },
            plugins: { legend: { display: false } }
          }
        });
        console.log("Win Rate Bar Chart initialized");
      }
    }
  } catch (error) {
    console.error("Failed to initialize win rate bar chart:", error);
    const errorEl = document.getElementById("quickStatsError");
    if (errorEl) errorEl.style.display = "block";
  }

  // Daily Gain Calendar
  try {
    const dailyGains = trades.reduce((acc, trade) => {
      acc[trade.date] = (acc[trade.date] || 0) + trade.gain;
      return acc;
    }, {});
    const calendarEl = document.getElementById("calendar");
    const calendarError = document.getElementById("calendarError");
    if (!calendarEl) {
      console.error("Calendar element not found");
      if (calendarError) calendarError.style.display = "block";
    } else {
      console.log("Initializing FullCalendar");
      const calendar = new FullCalendar.Calendar(calendarEl, {
        plugins: [window.FullCalendarDayGrid],
        initialView: "dayGridMonth",
        height: "auto",
        events: Object.entries(dailyGains).map(([date, gain]) => ({
          title: `${gain.toFixed(2)}%`,
          start: date,
          backgroundColor: gain >= 0 ? "rgba(0, 212, 180, 0.3)" : "rgba(255, 102, 102, 0.3)",
          borderColor: gain >= 0 ? "#00d4b4" : "#ff6666",
          textColor: "#e0e0e0"
        })),
        eventDisplay: "block",
        eventMouseEnter: function(info) {
          info.el.style.cursor = "pointer";
          info.el.title = `Gain: ${info.event.title}`;
        }
      });
      calendar.render();
      console.log("Calendar rendered successfully");
    }
  } catch (error) {
    console.error("Calendar initialization failed:", error);
    const calendarError = document.getElementById("calendarError");
    if (calendarError) calendarError.style.display = "block";
  }

  // Initial table render
  try {
    renderTradeTable(trades);
    console.log("Trade table initialized");
  } catch (error) {
    console.error("Failed to initialize trade table:", error);
  }
});
