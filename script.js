import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDPnp7kwhZheIGejkNdYyTK0b-urqJbOqE",
  authDomain: "tradingjournal-b0573.firebaseapp.com",
  projectId: "tradingjournal-b0573",
  storageBucket: "tradingjournal-b0573.firebasestorage.app",
  messagingSenderId: "22223820673",
  appId: "1:22223820673:web:56a7c709ffb4f15eb07a80"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
console.log("Firebase initialized successfully");

// Protect pages
onAuthStateChanged(auth, (user) => {
  console.log("Auth state:", user ? `Logged in as ${user.email}` : "No user");
  const protectedPages = ["submit-trade.html", "dashboard.html"];
  if (!user && protectedPages.some(page => window.location.pathname.includes(page))) {
    alert("Please login to access this page.");
    window.location.href = "login.html";
  } else if (user && window.location.pathname.includes("index.html")) {
    window.location.href = "dashboard.html";
  }
});

// Submit trade
const tradeForm = document.getElementById("tradeForm");
if (tradeForm) {
  console.log("Trade form found");
  tradeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
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
        gain: parseFloat(formData.get("gain")),
        entry: formData.get("entry") || "",
        exit: formData.get("exit") || "",
        timestamp: serverTimestamp()
      });
      console.log("Trade submitted");
      alert("Trade submitted successfully!");
      e.target.reset();
    } catch (error) {
      console.error("Trade error:", error.message);
      alert("Error submitting trade: " + error.message);
    }
  });
}

// Dashboard data
if (document.getElementById("tradeTable")) {
  console.log("Dashboard loaded");
  const user = auth.currentUser;
  if (user) {
    const q = query(collection(db, "trades"), where("userId", "==", user.uid), orderBy("timestamp", "desc"));
    onSnapshot(q, (snapshot) => {
      const trades = [];
      snapshot.forEach(doc => trades.push({ id: doc.id, ...doc.data() }));
      console.log("Trades fetched:", trades.length);

      // Trade table
      const tbody = document.querySelector("#tradeTable tbody");
      tbody.innerHTML = trades.map(trade => `
        <tr>
          <td>${trade.date}</td>
          <td>${trade.pair}</td>
          <td>${trade.outcome}</td>
          <td>${trade.gain}</td>
          <td>${trade.entry}</td>
          <td>${trade.exit}</td>
        </tr>
      `).join("");

      // Cumulative gain chart
      const ctx = document.getElementById("gainChart").getContext("2d");
      const data = trades
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .reduce((acc, trade) => {
          acc.dates.push(trade.date);
          acc.gains.push((acc.gains[acc.gains.length - 1] || 0) + trade.gain);
          return acc;
        }, { dates: [], gains: [] });
      new Chart(ctx, {
        type: "line",
        data: {
          labels: data.dates,
          datasets: [{ label: "Cumulative Gain", data: data.gains, fill: true, borderColor: "#007bff" }]
        },
        options: { scales: { y: { beginAtZero: true } } }
      });

      // Calendar
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

      // Metrics
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
      console.error("Firestore error:", error.message);
      alert("Error loading dashboard: " + error.message);
    });
  }
}
