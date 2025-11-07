document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const signupForm = document.getElementById("signupForm");
    if (signupForm) signupForm.requestSubmit();
  }
});

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";


const firebaseConfig = {
  apiKey: "AIzaSyCMI6bSOWfI_CpCeIY3IMx9edB5FhQvcBQ",
  authDomain: "samflix-4f3df.firebaseapp.com",
  projectId: "samflix-4f3df",
  storageBucket: "samflix-4f3df.firebasestorage.app",
  messagingSenderId: "420605724397",
  appId: "1:420605724397:web:6c1e4f3d7f0143f1ceaee4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();


function showToast(message, type = "info") {
  const colors = {
    success: "#10b981",
    error: "#ef4444",
    warning: "#facc15",
    info: "#3b82f6"
  };

  Toastify({
    text: message,
    duration: 2200,
    gravity: "top",
    position: "center",
    style: {
      background: colors[type] || colors.info,
      color: "white",
      borderRadius: "8px"
    }
  }).showToast();
}


function validatePassword(password) {
  const rules = {
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    number: /[0-9]/.test(password),
    length: password.length >= 6
  };

  const failed = Object.entries(rules)
    .filter(([_, valid]) => !valid)
    .map(([rule]) => rule);

  return {
    valid: failed.length === 0,
    failed
  };
}


function getProfiles() {
  try {
    return JSON.parse(localStorage.getItem("userProfiles") || "{}");
  } catch (e) {
    return {};
  }
}

function setProfiles(obj) {
  localStorage.setItem("userProfiles", JSON.stringify(obj || {}));
}

function saveUserProfile(email, name, photo) {
  const profiles = getProfiles();
  profiles[email] = { name: name || (email ? email.split("@")[0] : "User"), photo: photo || "" };
  setProfiles(profiles);

  // Set current session keys used by dashboard
  localStorage.setItem("loggedInUser", email);
  localStorage.setItem("userName", profiles[email].name);
  localStorage.setItem("userPhoto", profiles[email].photo);
}


function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve("");
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}


async function handleSignUp(email, password, name) {
  const check = validatePassword(password);
  if (!check.valid) {
    showToast(`Password missing: ${check.failed.join(", ")}`, "warning");
    return;
  }

  try {
    // If user provided a file input with id 'signupPhoto' convert to data URL
    let photoData = "";
    const photoInput = document.getElementById("signupPhoto");
    if (photoInput && photoInput.files && photoInput.files[0]) {
      try {
        photoData = await fileToDataUrl(photoInput.files[0]);
      } catch (e) {
        console.warn("Could not read signup photo file:", e);
        photoData = "";
      }
    }

    // Create user with Firebase Auth
    await createUserWithEmailAndPassword(auth, email, password);

    // Save profile to localStorage (with uploaded photoData, or empty)
    saveUserProfile(email, name || (email.split("@")[0]), photoData);

    showToast("Account created successfully! Redirecting...", "success");
    setTimeout(() => (window.location.href = "login.html"), 1100);

  } catch (err) {
    console.error("Signup error:", err);
    showToast(err?.message || "Signup failed", "error");
  }
}


async function handleSignIn(email, password) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);

    // Retrieve saved profile (if any) and set session keys
    const profiles = getProfiles();
    const profile = profiles[email] || {};
    const displayName = profile.name || result.user?.displayName || (email.split("@")[0]);
    const photo = profile.photo || result.user?.photoURL || "";

    localStorage.setItem("loggedInUser", email);
    localStorage.setItem("userName", displayName);
    localStorage.setItem("userPhoto", photo);

    showToast("Login successful! Redirecting...", "success");
    setTimeout(() => (window.location.href = "dashboard.html"), 850);

  } catch (err) {
    console.error("Login error:", err);
    showToast(err?.message || "Login failed", "error");
  }
}


async function handleGoogleSignIn(isSignup = false) {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const email = result.user?.email;
    const name = result.user?.displayName || (email ? email.split("@")[0] : "User");
    const photo = result.user?.photoURL || "";

    // Save profile (photo is Google profile URL)
    if (email) saveUserProfile(email, name, photo);

    showToast(isSignup ? "Account created via Google!" : "Login successful!", "success");
    setTimeout(() => (window.location.href = "dashboard.html"), 900);

  } catch (err) {
    console.error("Google sign-in error:", err);
    showToast(err?.message || "Google sign-in failed", "error");
  }
}


["googleSignUp", "googleSignIn"].forEach((id) => {
  const btn = document.getElementById(id);
  if (btn) btn.addEventListener("click", () => handleGoogleSignIn(id === "googleSignUp"));
});


const signupForm = document.getElementById("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleSignUp(
      document.getElementById("signupEmail")?.value?.trim() || "",
      document.getElementById("signupPassword")?.value || "",
      document.getElementById("signupName")?.value?.trim() || ""
    );
  });
}

const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleSignIn(
      document.getElementById("email")?.value?.trim() || "",
      document.getElementById("password")?.value || ""
    );
  });
}


window.logout = async () => {
  try {
    await signOut(auth);
    // keep userProfiles and favorites, remove only session keys
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("userName");
    localStorage.removeItem("userPhoto");

    showToast("Logged out successfully", "success");
    setTimeout(() => (window.location.href = "login.html"), 700);
  } catch (err) {
    console.error("Logout error:", err);
    showToast("Logout failed", "error");
  }
};


onAuthStateChanged(auth, (user) => {
  if (document.body?.dataset?.protected === "true" && !user) {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("userName");
    localStorage.removeItem("userPhoto");
    window.location.href = "login.html";
  }
});


window.handleSignUp = handleSignUp;
window.handleSignIn = handleSignIn;
window.handleGoogleSignIn = handleGoogleSignIn;
