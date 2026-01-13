// app.js
import { auth } from "./firebase.js";

import {
  setPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

/**
 * No localStorage usage:
 * - We set Firebase Auth persistence to session (uses sessionStorage, not localStorage).
 */
try {
  await setPersistence(auth, browserSessionPersistence);
} catch (_) {
  // If persistence fails in some environments, auth still works; ignore silently.
}

/* -----------------------------
   Helpers
----------------------------- */
function setLoading(btn, spinnerEl, textEl, isLoading, loadingText) {
  if (!btn || !spinnerEl || !textEl) return;
  btn.disabled = isLoading;
  spinnerEl.classList.toggle("hidden", !isLoading);
  textEl.textContent = isLoading ? loadingText : textEl.dataset.originalText || textEl.textContent;
}

function initPasswordToggle(buttonId, inputId) {
  const btn = document.getElementById(buttonId);
  const input = document.getElementById(inputId);
  if (!btn || !input) return;

  btn.addEventListener("click", () => {
    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    btn.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
  });
}

/* -----------------------------
   Password eye toggles (both pages)
----------------------------- */
initPasswordToggle("toggleStudentPassword", "studentPassword");
initPasswordToggle("togglePassword", "password");
initPasswordToggle("toggleConfirmPassword", "confirmPassword");

/* -----------------------------
   LOGIN (login.html)
----------------------------- */
const loginForm = document.getElementById("formStudent");
if (loginForm) {
  const emailEl = document.getElementById("studentEmail");
  const passEl = document.getElementById("studentPassword");

  const loginBtn = document.getElementById("studentLoginBtn");
  const loginSpinner = document.getElementById("studentLoginSpinner");
  const loginText = document.getElementById("studentLoginText");
  if (loginText && !loginText.dataset.originalText) loginText.dataset.originalText = loginText.textContent;

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = (emailEl?.value || "").trim();
    const password = passEl?.value || "";

    setLoading(loginBtn, loginSpinner, loginText, true, "Logging in...");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login successful!");
      // If you want redirect after login, set it here, example:
      // window.location.href = "dashboard.html";
    } catch (err) {
      alert(err?.message || "Login failed.");
    } finally {
      setLoading(loginBtn, loginSpinner, loginText, false, "");
    }
  });
}

/* -----------------------------
   REGISTER (register.html)
----------------------------- */
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  const fullNameEl = document.getElementById("fullName");
  const emailEl = document.getElementById("email");
  const passEl = document.getElementById("password");
  const confirmEl = document.getElementById("confirmPassword");
  const pwHint = document.getElementById("pwHint");

  const createBtn = document.getElementById("createBtn");
  const createSpinner = document.getElementById("createSpinner");
  const createText = document.getElementById("createText");
  if (createText && !createText.dataset.originalText) createText.dataset.originalText = createText.textContent;

  function showPwMismatch(show) {
    if (!pwHint) return;
    pwHint.classList.toggle("hidden", !show);
  }

  // Live mismatch hint
  if (passEl && confirmEl) {
    const check = () => showPwMismatch(passEl.value !== confirmEl.value && confirmEl.value.length > 0);
    passEl.addEventListener("input", check);
    confirmEl.addEventListener("input", check);
  }

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullName = (fullNameEl?.value || "").trim();
    const email = (emailEl?.value || "").trim();
    const password = passEl?.value || "";
    const confirmPassword = confirmEl?.value || "";

    if (password !== confirmPassword) {
      showPwMismatch(true);
      return;
    }
    showPwMismatch(false);

    setLoading(createBtn, createSpinner, createText, true, "Creating...");

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // Save displayName in Auth profile (no localStorage, no database used here)
      if (fullName) {
        try {
          await updateProfile(cred.user, { displayName: fullName });
        } catch (_) {}
      }

      alert("Account created successfully! You can now log in.");
      window.location.href = "login.html";
    } catch (err) {
      alert(err?.message || "Registration failed.");
    } finally {
      setLoading(createBtn, createSpinner, createText, false, "");
    }
  });
}
