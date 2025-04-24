import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

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
console.log("Firebase auth initialized for login");

const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    console.log("Login attempt:", email);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Logged in user:", userCredential.user.email);
      alert("Login successful!");
      window.location.href = "dashboard.html";
    } catch (error) {
      console.error("Login error:", error.code, error.message);
      alert("Login failed: " + error.message);
    }
  });
} else {
  console.error("Login form not found");
}
