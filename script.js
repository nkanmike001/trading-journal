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
try {
  firebase.initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization error:", error);
  alert("Failed to connect to Firebase: " + error.message);
}
const auth = firebase.auth();
const db = firebase.firestore();

// Protect pages
auth.onAuthStateChanged((user) => {
  const protectedPages = ["submit-trade.html", "dashboard.html"];
  if (!user && protectedPages.some(page => window.location.pathname.includes(page))) {
    alert("Please login to access this page.");
    window.location.href = "login.html";
  } else if (user && window.location.pathname.includes("index.html")) {
    window.location.href = "dashboard.html";
  }
});

// Register user
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    auth.createUserWithEmailAndPassword(email, password)
      .then(() => {
        alert("Registration successful! Please login.");
        window.location.href = "login.html";
      })
      .catch((error) => {
        alert("Error: " + error.message);
      });
  });
}

// Login user
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        alert("Login successful!");
        window.location.href = "dashboard.html";
      })
      .catch((error) => {
        alert("Error: " + error.message);
      });
  });
}

// Submit trade
const tradeForm = document.getElementById("tradeForm");
if (tradeForm) {
  tradeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    const formData = new FormData(e.target);
    try {
      await db.collection("trades").add({
        userId: user.uid,
        date: formData.get("date"),
        pair: formData.get("pair"),
        outcome: formData.get("outcome"),
        gain: parseFloat(formData.get("gain")),
        entry: formData.get("entry") || "",
        exit: formData.get("exit") || "",
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      alert("Trade submitted successfully!");
      e.target.reset();
    } catch (error) {
      alert("Error: " + error.message);
    }
  });
}

// Dashboard data
if (document.getElementById("tradeTable")) {
  const user = auth.currentUser;
  if (user) {
    db.collection("trades")
      .where("userId", "==", user.uid)
      .orderBy("timestamp", "desc")
      .onSnapshot((snapshot) => {
        const trades = [];
        snapshot.forEach(doc => trades.push({ id: doc.id, ...doc.data() }));

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
      });
  }
}
