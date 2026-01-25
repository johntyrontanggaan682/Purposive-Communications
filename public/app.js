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
} catch (_) {}

/* -----------------------------
   Helpers
----------------------------- */
function setLoading(btn, spinnerEl, textEl, isLoading, loadingText) {
  if (!btn || !spinnerEl || !textEl) return;
  btn.disabled = isLoading;
  spinnerEl.classList.toggle("hidden", !isLoading);
  textEl.textContent = isLoading ? loadingText : (textEl.dataset.originalText || textEl.textContent);
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

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

/* -----------------------------
   Password eye toggles (both pages)
----------------------------- */
initPasswordToggle("toggleStudentPassword", "studentPassword");
initPasswordToggle("togglePassword", "password");
initPasswordToggle("toggleConfirmPassword", "confirmPassword");

/* -----------------------------
   OTP RESET (login.html) - requires modal HTML
----------------------------- */
const forgotBtn = document.getElementById("forgotPasswordBtn");
const otpModal = document.getElementById("otpModal");
const otpBackdrop = document.getElementById("otpBackdrop");
const otpClose = document.getElementById("otpClose");

const otpStep1 = document.getElementById("otpStep1");
const otpStep2 = document.getElementById("otpStep2");
const otpMsg = document.getElementById("otpMsg");

const otpEmail = document.getElementById("otpEmail");
const otpSendBtn = document.getElementById("otpSendBtn");

const otpCode = document.getElementById("otpCode");
const otpNewPass = document.getElementById("otpNewPass");
const otpConfirmBtn = document.getElementById("otpConfirmBtn");
const otpBackBtn = document.getElementById("otpBackBtn");

// ✅ change this to your project id
const PROJECT_ID = "YOUR_PROJECT_ID";
const REGION = "us-central1";

// ✅ Cloud Functions endpoints:
const FN_REQUEST = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/requestPasswordResetOTP`;
const FN_CONFIRM = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/confirmPasswordResetOTP`;

function openOtpModal(prefillEmail = "") {
  if (!otpModal) return;
  otpModal.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");

  if (otpEmail) otpEmail.value = prefillEmail || "";
  otpMsg.textContent = "";
  otpStep1.classList.remove("hidden");
  otpStep2.classList.add("hidden");
}

function closeOtpModal() {
  otpModal?.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
}

forgotBtn?.addEventListener("click", () => {
  const email = (document.getElementById("studentEmail")?.value || "").trim();
  openOtpModal(email);
});

otpBackdrop?.addEventListener("click", closeOtpModal);
otpClose?.addEventListener("click", closeOtpModal);

otpBackBtn?.addEventListener("click", () => {
  otpMsg.textContent = "";
  otpStep2.classList.add("hidden");
  otpStep1.classList.remove("hidden");
});

otpSendBtn?.addEventListener("click", async () => {
  const email = (otpEmail?.value || "").trim();
  otpMsg.textContent = "";

  if (!email || !isValidEmail(email)) {
    otpMsg.textContent = "Please enter a valid email.";
    return;
  }

  otpSendBtn.disabled = true;
  otpSendBtn.classList.add("opacity-80");

  try {
    const r = await fetch(FN_REQUEST, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await r.json();

    if (!data.ok) throw new Error(data.message || "Failed to send OTP.");

    otpMsg.textContent = "OTP sent! Check your email.";
    otpStep1.classList.add("hidden");
    otpStep2.classList.remove("hidden");
  } catch (e) {
    console.log("OTP SEND ERROR:", e);
    otpMsg.textContent = e.message || "Failed to send OTP.";
  } finally {
    otpSendBtn.disabled = false;
    otpSendBtn.classList.remove("opacity-80");
  }
});

otpConfirmBtn?.addEventListener("click", async () => {
  const email = (otpEmail?.value || "").trim();
  const code = (otpCode?.value || "").trim();
  const newPass = otpNewPass?.value || "";
  otpMsg.textContent = "";

  if (!email || !isValidEmail(email)) return (otpMsg.textContent = "Invalid email.");
  if (!/^\d{6}$/.test(code)) return (otpMsg.textContent = "Code must be 6 digits.");
  if (newPass.length < 6) return (otpMsg.textContent = "Password must be at least 6 characters.");

  otpConfirmBtn.disabled = true;
  otpConfirmBtn.classList.add("opacity-80");

  try {
    const r = await fetch(FN_CONFIRM, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp: code, newPassword: newPass })
    });
    const data = await r.json();

    if (!data.ok) throw new Error(data.message || "Reset failed.");

    otpMsg.textContent = "Password updated! You can now login.";
    setTimeout(() => closeOtpModal(), 900);
  } catch (e) {
    console.log("OTP CONFIRM ERROR:", e);
    otpMsg.textContent = e.message || "Reset failed.";
  } finally {
    otpConfirmBtn.disabled = false;
    otpConfirmBtn.classList.remove("opacity-80");
  }
});

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
      // window.location.href = "index.html";
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
