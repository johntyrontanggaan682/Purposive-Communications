// app.js (single shared Firebase + Auth connector for all pages)
// Uses Firebase Web SDK (modular) via CDN imports.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-analytics.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBZ0b3RzS8OqIxZBv9JSsV8zlEsncAf_LQ",
  authDomain: "purposivecommunication-2e5e9.firebaseapp.com",
  projectId: "purposivecommunication-2e5e9",
  storageBucket: "purposivecommunication-2e5e9.firebasestorage.app",
  messagingSenderId: "316292729628",
  appId: "1:316292729628:web:7c241575863ddbf45fc8d9",
  measurementId: "G-YEHW55GE4S"
};

const LS = {
  session: "pc_session",
  loggedIn: "pc_logged_in",
  prefillEmail: "pc_prefill_email"
};

const app = initializeApp(firebaseConfig);

// Analytics can fail on local file:// or blocked environments; keep non-fatal.
try { getAnalytics(app); } catch (_) {}

const auth = getAuth(app);

// ---------- Session helpers (keeps compatibility with existing localStorage-based UI) ----------
function setLocalSessionFromUser(user) {
  if (!user) return;
  const session = {
    role: "student",
    email: user.email || "",
    fullName: user.displayName || "",
    uid: user.uid || "",
    ts: Date.now()
  };
  localStorage.setItem(LS.session, JSON.stringify(session));
  localStorage.setItem(LS.loggedIn, "1");
}

function clearLocalSession() {
  localStorage.removeItem(LS.session);
  localStorage.removeItem(LS.loggedIn);
}

// Expose a global sign-out hook so existing page scripts can call it.
window.__pcSignOut = async function __pcSignOut() {
  try { await fbSignOut(auth); } catch (_) {}
  clearLocalSession();
  const here = (location.pathname.split("/").pop() || "").toLowerCase();
  if (here !== "login.html") location.href = "login.html";
};

// ---------- UI helpers ----------
function bindPasswordToggle(toggleBtn, input) {
  if (!toggleBtn || !input) return;
  toggleBtn.addEventListener("click", () => {
    input.type = input.type === "password" ? "text" : "password";
  });
}

function pageName() {
  return (location.pathname.split("/").pop() || "index.html").toLowerCase();
}

function isAuthPage() {
  const p = pageName();
  return p === "login.html" || p === "register.html";
}

// ---------- Auth state ----------
onAuthStateChanged(auth, (user) => {
  if (user) {
    setLocalSessionFromUser(user);

    // If already signed in and on login/register, send to homepage.
    if (isAuthPage()) location.href = "index.html";
  } else {
    clearLocalSession();
  }
});

// ---------- Login page ----------
(function initLogin() {
  if (pageName() !== "login.html") return;

  const form = document.getElementById("formStudent");
  const emailEl = document.getElementById("studentEmail");
  const passEl = document.getElementById("studentPassword");

  // Prefill from register flow (optional)
  const prefill = localStorage.getItem(LS.prefillEmail);
  if (prefill && emailEl && !emailEl.value) emailEl.value = prefill;

  const loginBtn = document.getElementById("studentLoginBtn");
  const loginSpinner = document.getElementById("studentLoginSpinner");
  const loginText = document.getElementById("studentLoginText");

  function setLoading(isLoading) {
    if (loginBtn) loginBtn.disabled = isLoading;
    loginBtn?.classList.toggle("opacity-90", isLoading);
    loginSpinner?.classList.toggle("hidden", !isLoading);
    if (loginText) loginText.textContent = isLoading ? "Logging in..." : "Login";
  }

  // Password toggle
  bindPasswordToggle(document.getElementById("toggleStudentPassword"), passEl);

  if (!form || !emailEl || !passEl) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = (emailEl.value || "").trim();
    const pass = passEl.value || "";

    if (!email || !pass) return;

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      localStorage.removeItem(LS.prefillEmail);
      // onAuthStateChanged will set local session + redirect to index
    } catch (err) {
      const code = err?.code || "Login failed.";
      const map = {
        "auth/invalid-credential": "Incorrect email or password.",
        "auth/user-not-found": "No account found for this email.",
        "auth/wrong-password": "Incorrect email or password.",
        "auth/too-many-requests": "Too many attempts. Try again later.",
        "auth/invalid-email": "Please enter a valid email.",
        "auth/network-request-failed": "Network error. Check your connection."
      };
      alert(map[code] || err?.message || "Login failed.");
      setLoading(false);
    }
  });
})();

// ---------- Register page ----------
(function initRegister() {
  if (pageName() !== "register.html") return;

  const form = document.getElementById("registerForm");
  const fullNameEl = document.getElementById("fullName");
  const emailEl = document.getElementById("email");
  const passEl = document.getElementById("password");
  const confirmEl = document.getElementById("confirmPassword");

  const btn = document.getElementById("createBtn");
  const spinner = document.getElementById("createSpinner");

  bindPasswordToggle(document.getElementById("togglePassword"), passEl);
  bindPasswordToggle(document.getElementById("toggleConfirmPassword"), confirmEl);

  function setLoading(isLoading) {
    if (btn) btn.disabled = isLoading;
    btn?.classList.toggle("opacity-90", isLoading);
    spinner?.classList.toggle("hidden", !isLoading);
    const btnText = document.getElementById("createText");
    if (btnText) btnText.textContent = isLoading ? "Creating Account..." : "Create Account";
  }

  if (!form || !emailEl || !passEl || !confirmEl) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = (emailEl.value || "").trim();
    const pass = passEl.value || "";
    const confirm = confirmEl.value || "";
    const fullName = (fullNameEl?.value || "").trim();

    if (!email || !pass) return;

    if (pass !== confirm) {
      alert("Passwords do not match.");
      return;
    }
    if (pass.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);

      if (fullName) {
        try { await updateProfile(cred.user, { displayName: fullName }); } catch (_) {}
      }

      localStorage.setItem(LS.prefillEmail, email);

      // Newly created user is signed in by default; go to index.
      location.href = "index.html";
    } catch (err) {
      const code = err?.code || "Registration failed.";
      const map = {
        "auth/email-already-in-use": "This email is already registered. Try logging in.",
        "auth/invalid-email": "Please enter a valid email.",
        "auth/weak-password": "Password is too weak. Use at least 6 characters.",
        "auth/network-request-failed": "Network error. Check your connection."
      };
      alert(map[code] || err?.message || "Registration failed.");
      setLoading(false);
    }
  });
})();

// ---------- Global: bind any logout buttons if present ----------
(function bindLogoutButtons() {
  const ids = ["signOutBtn", "mSignOutBtn", "logoutBtn"];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("click", (e) => {
      e.preventDefault();
      window.__pcSignOut?.();
    });
  });
})();
