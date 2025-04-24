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
  const q = query(
    collection(db, "trades"),
    where("userId", "==", user.uid),
    orderBy("timestamp", "desc")
  );
  onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      console.log("No trades found for user");
      document.querySelector("#tradeTable tbody").innerHTML = "<tr><td colspan='6'>No trades found</td></tr>";
      document.getElementById("winRate").textContent = "Win Rate: 0%";
      document.getElementById("totalTrades").textContent = "Total Trades: 0";
      document.getElementById("avgGain").textContent = "Average Gain: 0";
      const ctx = document.getElementById("gainChart").getContext("2d");
      new Chart(ctx, {
        type: "line",
        data: {
          labels: [],
          datasets: [{ label: "Cumulative Gain", data: [], fill: true, borderColor: "#007bff" }]
        },
        options: { scales: { y: { beginAtZero: true } } }
      });
      const calendarEl = document.getElementById("calendar");
      const calendar = new FullCalendar.Calendar(calendarEl, {
        plugins: ["dayGrid"],
        initialView: "dayGridMonth",
        events: []
      });
      calendar.render();
      return;
    }

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
        <td>${trade.gain.toFixed(2)}</td>
        <td>${trade.entry || '-'}</td>
        <td>${trade.exit || '-'}</td>
      </tr>
    `).join("") : "<tr><td colspan='6'>No valid trades found</td></tr>";

    // Update cumulative gain chart
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
        datasets: [{ label: "Cumulative Gain", data: chartData.gains, fill: true, borderColor: "#007bff" }]
      },
      options: { scales: { y: { beginAtZero: true } } }
    });

    // Update trade calendar
    const calendarEl = document.getElementById("calendar");
    const calendar = new FullCalendar.Calendar(calendarEl, {
      plugins: ["dayGrid"],
      initialView: "dayGridMonth",
      events: trades.map(trade => ({
        title: `${trade.pair} (${trade.outcome})`,
        start: trade.date,
        backgroundColor: trade.outcome === "Win" ? "green" : "red"
      }))
    });
    calendar.render();

    // Update metrics
    const metrics = trades.reduce((acc, trade) => {
      acc.total++;
      if (trade.outcome === "Win") acc.wins++;
      acc.gainSum += trade.gain;
      return acc;
    }, { total: 0, wins: 0, gainSum: 0 });
    document.getElementById("winRate").textContent = 
      `Win Rate: ${metrics.total ? (metrics.wins / metrics.total * 100).toFixed(2) : 0}%`;
    document.getElementById("totalTrades").textContent = 
      `Total Trades: ${metrics.total}`;
    document.getElementById("avgGain").textContent = 
      `Average Gain: ${metrics.total ? (metrics.gainSum / metrics.total).toFixed(2) : 0}`;
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
