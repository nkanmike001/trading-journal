import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

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
console.log("Firebase auth initialized for register");

const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    console.log("Register attempt:", email);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Registered user:", userCredential.user.email);
      alert("Registration successful! Please login.");
      window.location.href = "login.html";
    } catch (error) {
      console.error("Register error:", error.code, error.message);
      alert("Registration failed: " + error.message);
    }
  });
} else {
  console.error("Register form not found");
}
