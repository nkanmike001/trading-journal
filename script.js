import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDfrbfon26cOVk0cgiBqhEfUYRoJjW6ozQ",
  authDomain: "trad-5257a.firebaseapp.com",
  projectId: "trad-5257a",
  storageBucket: "trad-5257a.firebasestorage.app",
  messagingSenderId: "391760292829",
  appId: "1:391760292829:web:fceec8a1742218b677a434"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
console.log("Firebase initialized successfully");

// Function to render dashboard data
function renderDashboard(user) {
  console.log("Rendering dashboard for user:", user.uid);
  const userName = user.email.split('@')[0];
  document.getElementById("userName").textContent = userName;

  const q = query(
    collection(db, "trades"),
    where("userId", "==", user.uid),
    orderBy("timestamp", "desc")
  );
  onSnapshot(q, (snapshot) => {
    const trades = [];
    snapshot.forEach(doc => {
      const trade = doc.data();
      if (trade.date && trade.pair && trade.outcome && typeof trade.gain === "number") {
        trades.push({ id: doc.id, ...trade });
      } else {
        console.warn("Invalid trade data:", doc.id, trade);
      }
    });
    console.log("Trades fetched:", trades.length, trades);

    // Update trade table
    const tbody = document.querySelector("#tradeTable tbody");
    tbody.innerHTML = trades.length ? trades.map(trade => `
      <tr>
        <td>${trade.date}</td>
        <td>${trade.pair}</td>
        <td>${trade.outcome}</td>
        <td>${trade.gain.toFixed(2)}%</td>
        <td>${trade.entry || '-'}</td>
        <td>${trade.exit || '-'}</td>
      </tr>
    `).join("") : "<tr><td colspan='6'>No trades found</td></tr>";

    // Calculate metrics
    const today = new Date().toISOString().split("T")[0];
    const dailyGain = trades
      .filter(trade => trade.date === today)
      .reduce((sum, trade) => sum + trade.gain, 0);
    const totalGain = trades.reduce((sum, trade) => sum + trade.gain, 0);
    const totalTrades = trades.length;
    const wins = trades.filter(trade => trade.outcome === "Win").length;
    const losses = trades.filter(trade => trade.outcome === "Loss").length;
    const winRate = totalTrades ? (wins / totalTrades * 100) : 0;

    // Average Gain (replacing RR)
    const avgGain = totalTrades ? trades.reduce((sum, trade) => sum + trade.gain, 0) / totalTrades : 0;

    // Expectancy: (WinRate * AvgWin) - (LossRate * AvgLoss)
    const avgWin = wins ? trades.filter(t => t.outcome === "Win").reduce((sum, t) => sum + t.gain, 0) / wins : 0;
    const avgLoss = losses ? Math.abs(trades.filter(t => t.outcome === "Loss").reduce((sum, t) => sum + t.gain, 0) / losses) : 0;
    const expectancy = totalTrades ? (winRate / 100 * avgWin) - ((1 - winRate / 100) * avgLoss) : 0;

    // Profit Ratio: Total Wins / Total Losses
    const totalWins = trades.filter(t => t.outcome === "Win").reduce((sum, t) => sum + t.gain, 0);
    const totalLosses = Math.abs(trades.filter(t => t.outcome === "Loss").reduce((sum, t) => sum + t.gain, 0));
    const profitRatio = totalLosses ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;

    // Update metrics
    document.getElementById("dailyGain").textContent = `${dailyGain.toFixed(2)}%`;
    document.getElementById("totalGain").textContent = `${totalGain.toFixed(2)}%`;
    const winRateMeter = document.getElementById("winRateMeter");
    winRateMeter.value = winRate;
    const winRateStatus = document.getElementById("winRateStatus");
    const winRateGreeting = document.getElementById("winRateGreeting");
    if (winRate > 60 && avgGain > 0) {
      winRateStatus.textContent = "Profitable";
      winRateStatus.style.color = "#2b9348";
      winRateGreeting.textContent = `Hi ${userName}, your win rate is ${winRate.toFixed(2)}% - you're profitable!`;
      winRateGreeting.style.color = "#2b9348";
    } else if (winRate < 40 || avgGain < 0) {
      winRateStatus.textContent = "Not Profitable";
      winRateStatus.style.color = "#ef233c";
      winRateGreeting.textContent = `Hi ${userName}, your win rate is ${winRate.toFixed(2)}% - keep refining your strategy!`;
      winRateGreeting.style.color = "#ef233c";
    } else {
      winRateStatus.textContent = "Breakeven";
      winRateStatus.style.color = "#ffca3a";
      winRateGreeting.textContent = `Hi ${userName}, your win rate is ${winRate.toFixed(2)}% - you're at breakeven.`;
      winRateGreeting.style.color = "#ffca3a";
    }
    document.getElementById("avgGain").textContent = `${avgGain.toFixed(2)}%`;
    document.getElementById("expectancy").textContent = `${expectancy.toFixed(2)}%`;
    document.getElementById("profitRatio").textContent = profitRatio.toFixed(2);

    // Update cumulative gain chart (no gridlines)
    const ctx = document.getElementById("gainChart").getContext("2d");
    const sortedTrades = trades.sort((a, b) => new Date(a.date) - new Date(b.date));
    const chartData = sortedTrades.reduce((acc, trade) => {
      acc.dates.push(trade.date);
      acc.gains.push((acc.gains[acc.gains.length - 1] || 0) + trade.gain);
      return acc;
    }, { dates: [], gains: [] });
    new Chart(ctx, {
      type: "line",
      data: {
        labels: chartData.dates,
        datasets: [{
          label: "Cumulative Gain (%)",
          data: chartData.gains,
          fill: true,
          backgroundColor: "rgba(0, 95, 115, 0.2)",
          borderColor: "#005f73",
          tension: 0.3
        }]
      },
      options: {
        scales: {
          x: { display: true, grid: { display: false } },
          y: { beginAtZero: true, grid: { display: false }, title: { display: true, text: "Gain (%)" } }
        },
        plugins: { legend: { display: true } }
      }
    });

    // Update total trades pie chart
    const pieCtx = document.getElementById("tradesPieChart").getContext("2d");
    new Chart(pieCtx, {
      type: "pie",
      data: {
        labels: ["Wins", "Losses"],
        datasets: [{
          data: [wins, losses],
          backgroundColor: ["#2b9348", "#ef233c"],
          borderColor: "#fff",
          borderWidth: 2
        }]
      },
      options: {
        plugins: { legend: { position: "bottom" } }
      }
    });

    // Update daily gain calendar
    const dailyGains = trades.reduce((acc, trade) => {
      acc[trade.date] = (acc[trade.date] || 0) + trade.gain;
      return acc;
    }, {});
    const calendarEl = document.getElementById("calendar");
    if (calendarEl) {
      const calendar = new FullCalendar.Calendar(calendarEl, {
        plugins: ["dayGrid"],
        initialView: "dayGridMonth",
        height: "auto",
        events: Object.entries(dailyGains).map(([date, gain]) => ({
          title: `${gain.toFixed(2)}%`,
          start: date,
          backgroundColor: gain >= 0 ? "rgba(43, 147, 72, 0.3)" : "rgba(239, 35, 60, 0.3)",
          borderColor: gain >= 0 ? "#2b9348" : "#ef233c",
          textColor: "#212529"
        })),
        eventDisplay: "block"
      });
      calendar.render();
    } else {
      console.error("Calendar element not found");
    }
  }, (error) => {
    console.error("Firestore fetch error:", error.code, error.message);
    if (error.code === "failed-precondition" && error.message.includes("index")) {
      alert("Dashboard failed to load: Missing Firestore index. Please check the Console for an index creation link and create it in Firebase.");
    } else {
      alert("Error loading dashboard: " + error.message);
    }
  });
}

// Handle trade submission
const tradeForm = document.getElementById("tradeForm");
if (tradeForm) {
  console.log("Trade form found");
  tradeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      console.log("No user logged in for trade submission");
      alert("Please login to submit trades.");
      window.location.href = "login.html";
      return;
    }
    const formData = new FormData(e.target);
    try {
      await addDoc(collection(db, "trades"), {
        userId: user.uid,
        date: formData.get("date"),
        pair: formData.get("pair"),
        outcome: formData.get("outcome"),
        gain: parseFloat(formData.get("gain")) || 0,
        entry: formData.get("entry") || "",
        exit: formData.get("exit") || "",
        timestamp: serverTimestamp()
      });
      console.log("Trade submitted successfully");
      alert("Trade submitted successfully!");
      e.target.reset();
    } catch (error) {
      console.error("Trade submission error:", error.code, error.message);
      alert("Error submitting trade: " + error.message);
    }
  });
}

// Handle logout
const logoutLink = document.getElementById("logout");
if (logoutLink) {
  logoutLink.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      await signOut(auth);
      console.log("User logged out");
      window.location.href = "login.html";
    } catch (error) {
      console.error("Logout error:", error.code, error.message);
      alert("Logout failed: " + error.message);
    }
  });
}

// Handle auth state and page access
document.addEventListener("DOMContentLoaded", () => {
  const protectedPages = ["submit-trade.html", "dashboard.html"];
  const isProtectedPage = protectedPages.some(page => window.location.pathname.includes(page));

  onAuthStateChanged(auth, (user) => {
    console.log("Auth state:", user ? `Logged in as ${user.email}` : "No user");
    if (user) {
      if (window.location.pathname.includes("index.html")) {
        console.log("Redirecting logged-in user to dashboard");
        window.location.href = "dashboard.html";
      } else if (isProtectedPage && document.getElementById("tradeTable")) {
        renderDashboard(user);
      }
    } else if (isProtectedPage) {
      console.log("No user, redirecting to login");
      alert("Please login to access this page.");
      window.location.href = "login.html";
    }
  });
});
