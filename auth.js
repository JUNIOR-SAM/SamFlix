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


const firebaseConfig = {
  apiKey: "AIzaSyCMI6bSOWfI_CpCeIY3IMx9edB5FhQvcBQ",
  authDomain: "samflix-4f3df.firebaseapp.com",
  projectId: "samflix-4f3df",
  storageBucket: "samflix-4f3df.firebasestorage.app",
  messagingSenderId: "420605724397",
  appId: "1:420605724397:web:6c1e4f3d7f0143f1ceaee4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

function getGravatar(email) {
  const hash = CryptoJS.MD5(email.trim().toLowerCase()).toString();
  return `https://www.gravatar.com/avatar/${hash}?d=identicon`;
}

function showToast(message, type = "info") {
  const colors = {
    success: "#10b981",
    error: "#ef4444",
    warning: "linear-gradient(to right, #f7b733, #fc4a1a)",
    info: "linear-gradient(to right, #2193b0, #6dd5ed)"
  };

  Toastify({
    text: message,
    duration: 4000,
    gravity: "top",
    position: "center",
    style: {
      background: colors[type],
      color: "white",
      padding: "10px 20px",
      borderRadius: "8px"
    }
  }).showToast();
}

// ===============================
//     PASSWORD VALIDATION
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
    .filter(([_, pass]) => !pass)
    .map(([rule]) => rule);

  return {
    valid: failed.length === 0,
    failed
  };
}

// ===============================
//        SAVE USER PROFILE
// ===============================
function saveUserProfile(email, name, photo) {
  const profiles = JSON.parse(localStorage.getItem("userProfiles") || "{}");

  profiles[email] = {
    name,
    photo
  };

  localStorage.setItem("userProfiles", JSON.stringify(profiles));

  // Save current session data
  localStorage.setItem("loggedInUser", email);
  localStorage.setItem("userName", name);
  localStorage.setItem("userPhoto", photo);
}

// ===============================
//          SIGNUP
// ===============================
async function handleSignUp(email, password, name) {
  const check = validatePassword(password);

  if (!check.valid) {
    const reasons = check.failed.join(", ");
    showToast(`Password is missing: ${reasons}`, "warning");
    return;
  }

  try {
    await createUserWithEmailAndPassword(auth, email, password);

    const photo = getGravatar(email);

    saveUserProfile(email, name, photo);

    showToast("Account created successfully!", "success");
    setTimeout(() => (window.location.href = "login.html"), 1200);

  } catch (err) {
    console.error(err);
    showToast(err.message || "Signup failed", "error");
  }
}

// ===============================
//          LOGIN
// ===============================
async function handleSignIn(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password);

    const profiles = JSON.parse(localStorage.getItem("userProfiles") || "{}");

    const name = profiles[email]?.name || email.split("@")[0];
    const photo = profiles[email]?.photo || getGravatar(email);

    saveUserProfile(email, name, photo);

    showToast("Login successful!", "success");
    setTimeout(() => (window.location.href = "dashboard.html"), 900);

  } catch (err) {
    console.error(err);
    showToast(err.message || "Login failed", "error");
  }
}

// ===============================
//       GOOGLE SIGN-IN
// ===============================
async function handleGoogleSignIn(isSignup = false) {
  try {
    const result = await signInWithPopup(auth, googleProvider);

    const email = result.user?.email;
    const name = result.user?.displayName || email.split("@")[0];
    const photo = result.user?.photoURL || getGravatar(email);

    saveUserProfile(email, name, photo);

    if (isSignup) {
      showToast("Account created successfully!", "success");
      setTimeout(() => (window.location.href = "login.html"), 1200);
    } else {
      showToast("Login successful!", "success");
      setTimeout(() => (window.location.href = "dashboard.html"), 1200);
    }

  } catch (err) {
    console.error(err);
    showToast(err.message || "Google sign-in failed", "error");
  }
}

// Update the event listeners to pass the correct parameter
["googleSignUp", "googleSignIn"].forEach((id) => {
  const btn = document.getElementById(id);
  if (btn) {
    // Pass true if it's signup, false if it's signin
    btn.addEventListener("click", () => handleGoogleSignIn(id === "googleSignUp"));
  }
});

// ===============================
//      FORM SUBMISSION
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
//          LOGOUT
// ===============================
window.logout = async () => {
  try {
    await signOut(auth);
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("userName");
    localStorage.removeItem("userPhoto");
    showToast("Logged out successfully", "success");
    setTimeout(() => (window.location.href = "login.html"), 800);
  } catch (err) {
    console.error(err);
    showToast("Logout failed", "error");
  }
};

// ===============================
//      PROTECTED PAGE CHECK
// ===============================
onAuthStateChanged(auth, (user) => {
  if (document.body.dataset.protected === "true" && !user) {
    localStorage.clear();
    window.location.href = "login.html";
  }
});
