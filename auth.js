// ===============================
//   GLOBAL: ENTER TO SUBMIT
// ===============================
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

// ===============================
// FIREBASE CONFIG
// ===============================
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

// ===============================
// SHOW TOAST
// ===============================
function showToast(message, type = "info") {
  const colors = {
    success: "#10b981",
    error: "#ef4444",
    warning: "#facc15",
    info: "#3b82f6"
  };

  Toastify({
    text: message,
    duration: 2000,
    gravity: "top",
    position: "center",
    style: {
      background: colors[type],
      color: "white",
      borderRadius: "8px"
    }
  }).showToast();
}

// ===============================
// PASSWORD VALIDATION
// ===============================
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

// ===============================
// SAVE USER PROFILE
// ===============================
function saveUserProfile(email, name, photo) {
  const profiles = JSON.parse(localStorage.getItem("userProfiles") || "{}");

  profiles[email] = { name, photo };

  localStorage.setItem("userProfiles", JSON.stringify(profiles));

  // Save session
  localStorage.setItem("loggedInUser", email);
  localStorage.setItem("userName", name);
  localStorage.setItem("userPhoto", photo);
}

// ===============================
// SIGNUP (EMAIL/PASSWORD)
// ===============================
async function handleSignUp(email, password, name) {
  const check = validatePassword(password);
  if (!check.valid) {
    showToast(`Password missing: ${check.failed.join(", ")}`, "warning");
    return;
  }

  try {
    await createUserWithEmailAndPassword(auth, email, password);

    // ✅ NO GRAVATAR — leave photo empty or set to ""
    saveUserProfile(email, name, "");

    showToast("Account created successfully!", "success");
    setTimeout(() => (window.location.href = "login.html"), 1200);

  } catch (err) {
    showToast(err.message, "error");
  }
}

// ===============================
// LOGIN (EMAIL/PASSWORD)
// ===============================
async function handleSignIn(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password);

    showToast("Login successful!", "success");
    setTimeout(() => (window.location.href = "dashboard.html"), 900);

  } catch (err) {
    showToast(err.message, "error");
  }
}

// ===============================
// GOOGLE LOGIN / SIGNUP
// ===============================
async function handleGoogleSignIn(isSignup = false) {
  try {
    const result = await signInWithPopup(auth, googleProvider);

    const email = result.user?.email;
    const name = result.user?.displayName || email.split("@")[0];
    const photo = result.user?.photoURL || "";

    // ✅ Save Gmail photo correctly
    saveUserProfile(email, name, photo);

    showToast(isSignup ? "Account created!" : "Login successful!", "success");
    setTimeout(() => (window.location.href = "dashboard.html"), 1200);

  } catch (err) {
    showToast(err.message, "error");
  }
}

// ===============================
// BUTTON LISTENERS
// ===============================
["googleSignUp", "googleSignIn"].forEach((id) => {
  const btn = document.getElementById(id);
  if (btn) btn.addEventListener("click", () => handleGoogleSignIn(id === "googleSignUp"));
});

// ===============================
// FORMS
// ===============================
const signupForm = document.getElementById("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleSignUp(
      document.getElementById("signupEmail").value.trim(),
      document.getElementById("signupPassword").value.trim(),
      document.getElementById("signupName").value.trim()
    );
  });
}

const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleSignIn(
      document.getElementById("email").value.trim(),
      document.getElementById("password").value.trim()
    );
  });
}

// ===============================
// LOGOUT
// ===============================
window.logout = async () => {
  try {
    await signOut(auth);
    localStorage.clear();
    showToast("Logged out successfully", "success");
    setTimeout(() => (window.location.href = "login.html"), 800);
  } catch (err) {
    showToast("Logout failed", "error");
  }
};

// ===============================
// PROTECTED PAGE
// ===============================
onAuthStateChanged(auth, (user) => {
  if (document.body.dataset.protected === "true" && !user) {
    localStorage.clear();
    window.location.href = "login.html";
  }
});
