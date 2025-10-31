import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
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

// Helper: show alert and optionally log
function notify(message, type = 'info') {
  // type can be 'info' | 'success' | 'error'
  // adapt this to custom UI later; for now use alert()
  alert(message);
  console[type === 'error' ? 'error' : 'log'](message);
}

// SIGN UP (Firebase)
const signupForm = document.getElementById('signupForm');
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailEl = document.getElementById('signupEmail');
    const passEl = document.getElementById('signupPassword');
    const nameEl = document.getElementById('signupName'); // optional

    const email = emailEl?.value?.trim() || '';
    const password = passEl?.value || '';
    const name = nameEl?.value?.trim() || '';

    if (!email || !password) {
      notify('Please enter email and password', 'error');
      return;
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      try {
        await sendEmailVerification(cred.user);
        notify('Signup successful. Verification email sent. Please verify and then login.', 'success');
      } catch (verErr) {
        notify('Account created but failed to send verification email. Check console.', 'error');
        console.error(verErr);
      }

      // Optionally store some info locally (not passwords)
      localStorage.setItem('signedUpUser', email);

      // Sign out immediately so user must verify email before using app
      try { await signOut(auth); } catch (sErr) { /* ignore */ }

      // redirect to login page (original behavior)
      window.location.href = 'login.html';
    } catch (err) {
      notify(err?.message || 'Signup failed', 'error');
      console.error(err);
    }
  });
}

// GOOGLE SIGNUP (popup)
const googleSignUpBtn = document.getElementById('googleSignUp');
if (googleSignUpBtn) {
  googleSignUpBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // User signed in with Google
      localStorage.setItem('loggedInUser', result.user?.email || '');
      notify('Google signup/signin successful. Redirecting...', 'success');
      setTimeout(() => window.location.href = 'dashboard.html', 700);
    } catch (err) {
      notify(err?.message || 'Google sign-in failed', 'error');
      console.error(err);
    }
  });
}

// LOGIN (Firebase) -- replace existing loginForm handler with this
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = (document.getElementById('email')?.value || '').trim();
    const password = document.getElementById('password')?.value || '';

    if (!email || !password) {
      notify('Please enter email and password', 'error');
      return;
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      // If email not verified, offer to resend verification and then sign out
      if (!cred.user.emailVerified) {
        const resend = confirm('Email not verified. Resend verification email now?');
        if (resend) {
          try {
            await sendEmailVerification(cred.user);
            notify('Verification email resent. Check your inbox.', 'success');
          } catch (sendErr) {
            console.error(sendErr);
            notify('Failed to resend verification email: ' + (sendErr.message || sendErr), 'error');
          }
        } else {
          notify('Please verify your email before logging in.', 'info');
        }

        // Ensure the unverified user is signed out locally
        try { await signOut(auth); } catch (_) { }
        return;
      }

      localStorage.setItem('loggedInUser', email);
      notify('Login successful! Redirecting...', 'success');
      setTimeout(() => window.location.href = 'dashboard.html', 600);

    } catch (err) {
      notify(err?.message || 'Login failed', 'error');
      console.error(err);
    }
  });
}

// LOGIN button IDs used in some pages (preserve older IDs)
// Replace existing signInFormEl handler with this (if present in file)
const signInFormEl = document.getElementById('signInFormEl');
if (signInFormEl) {
  signInFormEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = (document.getElementById('signinEmail')?.value || '').trim();
    const password = document.getElementById('signinPassword')?.value || '';

    if (!email || !password) {
      notify('Please enter email and password', 'error');
      return;
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      if (!cred.user.emailVerified) {
        const resend = confirm('Email not verified. Resend verification email now?');
        if (resend) {
          try {
            await sendEmailVerification(cred.user);
            notify('Verification email resent. Check your inbox.', 'success');
          } catch (sendErr) {
            console.error(sendErr);
            notify('Failed to resend verification email: ' + (sendErr.message || sendErr), 'error');
          }
        } else {
          notify('Please verify your email before logging in.', 'info');
        }

        try { await signOut(auth); } catch (_) { }
        return;
      }

      localStorage.setItem('loggedInUser', email);
      notify('Sign in successful. Redirecting...', 'success');
      setTimeout(() => window.location.href = 'dashboard.html', 700);

    } catch (err) {
      notify(err?.message || 'Sign in failed', 'error');
      console.error(err);
    }
  });
}

// Google sign-in buttons (alternative IDs)
const googleSignInBtn = document.getElementById('googleSignIn');
if (googleSignInBtn) {
  googleSignInBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      const result = await signInWithPopup(auth, googleProvider);
      localStorage.setItem('loggedInUser', result.user?.email || '');
      notify('Google sign-in successful. Redirecting...', 'success');
      setTimeout(() => window.location.href = 'dashboard.html', 700);
    } catch (err) {
      notify(err?.message || 'Google sign-in failed', 'error');
      console.error(err);
    }
  });
}

// LOGOUT
window.logout = async function () {
  try {
    await signOut(auth);
    localStorage.removeItem('loggedInUser');
    notify('Logged out successfully', 'success');
    window.location.href = 'login.html';
  } catch (err) {
    notify('Logout failed', 'error');
    console.error(err);
  }
};

// Protect pages: if <body data-protected="true"> redirect to login when no auth
if (document.body?.dataset?.protected === "true") {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      // No user signed in -> redirect to login
      localStorage.removeItem('loggedInUser');
      window.location.href = 'login.html';
    } else {
      // Optionally check verification
      if (!user.emailVerified) {
        // If you want to force verification you can redirect or notify
        // notify('Please verify your email before using the app', 'error');
      }
    }
  });
} else {
  // If not protected, keep a lightweight onAuthStateChanged for convenience
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in, you can update UI or perform actions as needed
      // For example, you might want to fetch and display user data
    }
  });
}