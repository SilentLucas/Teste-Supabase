const STORAGE_URL_KEY = "supabase_user_project_url";
const STORAGE_API_KEY = "supabase_user_publishable_key";

let client = null;

const configModal = document.getElementById("config-modal");
const openConfigBtn = document.getElementById("open-config-btn");
const closeConfigBtn = document.getElementById("close-config-btn");
const clearConfigBtn = document.getElementById("clear-config-btn");
const configForm = document.getElementById("config-form");
const configAlert = document.getElementById("config-alert");
const cfgUrlInput = document.getElementById("cfg-url");
const cfgKeyInput = document.getElementById("cfg-key");
const toggleKeyBtn = document.getElementById("toggle-key-visibility");
const connStatus = document.getElementById("conn-status");

const loginCard = document.getElementById("login-card");
const registerCard = document.getElementById("register-card");
const welcomeCard = document.getElementById("welcome-card");

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

const loginEmailInput = document.getElementById("login-email");
const loginPasswordInput = document.getElementById("login-password");
const loginBtn = document.getElementById("login-btn");
const loginAlert = document.getElementById("login-alert");

const registerEmailInput = document.getElementById("register-email");
const registerPasswordInput = document.getElementById("register-password");
const registerConfirmInput = document.getElementById("register-confirm");
const registerBtn = document.getElementById("register-btn");
const registerAlert = document.getElementById("register-alert");
const quotaCounter = document.getElementById("quota-counter");
const registerLimitBox = document.getElementById("register-limit-box");
const limitToLoginBtn = document.getElementById("limit-to-login-btn");

const welcomeEmail = document.getElementById("welcome-email");
const welcomeId = document.getElementById("welcome-id");
const logoutBtn = document.getElementById("logout-btn");

const toRegisterLink = document.getElementById("to-register");
const toLoginLink = document.getElementById("to-login");

const MAX_ACCOUNTS_PER_DEVICE = 2;
const STORAGE_DEVICE_ID = "sb_device_id";
const STORAGE_ACCOUNTS_KEY = "sb_device_created_accounts";
const SESSION_ACCOUNTS_KEY = "sb_session_created_accounts";
const COOKIE_ACCOUNTS_KEY = "sb_device_accs";

function getCookie(name) {
  try {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : null;
  } catch (e) {
    return null;
  }
}

function setCookie(name, value, days = 365) {
  try {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = "; expires=" + date.toUTCString();
    document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/; SameSite=Lax";
  } catch (e) {}
}

function getDeviceId() {
  let devId = null;
  try { devId = localStorage.getItem(STORAGE_DEVICE_ID); } catch(e){}
  if (!devId) devId = getCookie(STORAGE_DEVICE_ID);
  
  if (!devId) {
    devId = (typeof crypto !== "undefined" && crypto.randomUUID) 
      ? crypto.randomUUID() 
      : "dev_" + Math.random().toString(36).substring(2, 10) + Date.now();
    try { localStorage.setItem(STORAGE_DEVICE_ID, devId); } catch(e){}
    setCookie(STORAGE_DEVICE_ID, devId);
  }
  return devId;
}

function getDeviceRegisteredAccounts() {
  let localList = [];
  let sessionList = [];
  let cookieList = [];

  try {
    localList = JSON.parse(localStorage.getItem(STORAGE_ACCOUNTS_KEY) || "[]");
  } catch (e) { localList = []; }

  try {
    sessionList = JSON.parse(sessionStorage.getItem(SESSION_ACCOUNTS_KEY) || "[]");
  } catch (e) { sessionList = []; }

  try {
    cookieList = JSON.parse(getCookie(COOKIE_ACCOUNTS_KEY) || "[]");
  } catch (e) { cookieList = []; }

  const combined = Array.from(new Set([...localList, ...sessionList, ...cookieList])).filter(Boolean);

  try { localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(combined)); } catch(e){}
  try { sessionStorage.setItem(SESSION_ACCOUNTS_KEY, JSON.stringify(combined)); } catch(e){}
  setCookie(COOKIE_ACCOUNTS_KEY, JSON.stringify(combined));

  return combined;
}

function saveDeviceRegisteredAccount(email) {
  if (!email) return;
  const normalizedEmail = email.trim().toLowerCase();
  const accounts = getDeviceRegisteredAccounts();
  if (!accounts.includes(normalizedEmail)) {
    accounts.push(normalizedEmail);
    try { localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts)); } catch(e){}
    try { sessionStorage.setItem(SESSION_ACCOUNTS_KEY, JSON.stringify(accounts)); } catch(e){}
    setCookie(COOKIE_ACCOUNTS_KEY, JSON.stringify(accounts));
  }
  updateQuotaDisplay();
}

function updateQuotaDisplay() {
  const accounts = getDeviceRegisteredAccounts();
  const count = accounts.length;

  if (quotaCounter) {
    quotaCounter.textContent = count + " / " + MAX_ACCOUNTS_PER_DEVICE;
    quotaCounter.style.color = count >= MAX_ACCOUNTS_PER_DEVICE ? "#e11d48" : "#059669";
  }

  if (count >= MAX_ACCOUNTS_PER_DEVICE) {
    if (registerLimitBox) registerLimitBox.classList.remove("hidden");
    if (registerForm) registerForm.classList.add("hidden");
  } else {
    if (registerLimitBox) registerLimitBox.classList.add("hidden");
    if (registerForm) registerForm.classList.remove("hidden");
  }
}

window.getDeviceRegisteredAccounts = getDeviceRegisteredAccounts;
window.saveDeviceRegisteredAccount = saveDeviceRegisteredAccount;
window.updateQuotaDisplay = updateQuotaDisplay;

if (limitToLoginBtn) {
  limitToLoginBtn.addEventListener("click", () => {
    showView("login");
  });
}

function updateConnectionBadge(isConnected) {
  if (isConnected) {
    connStatus.innerHTML = '<span class="dot dot-green"></span> Conectado';
  } else {
    connStatus.innerHTML = '<span class="dot dot-red"></span> Desconectado';
  }
}

function cleanSupabaseUrl(url) {
  if (!url) return "";
  return url.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

function setupSupabaseClient(url, key) {
  const sanitizedUrl = cleanSupabaseUrl(url);
  const sanitizedKey = key.trim();

  if (!sanitizedUrl || !sanitizedKey) {
    client = null;
    updateConnectionBadge(false);
    return false;
  }

  try {
    client = window.supabase.createClient(sanitizedUrl, sanitizedKey);
    window.client = client;
    updateConnectionBadge(true);
    initSession();
    return true;
  } catch (err) {
    client = null;
    updateConnectionBadge(false);
    return false;
  }
}

function loadCredentials() {
  let savedUrl = localStorage.getItem(STORAGE_URL_KEY);
  let savedKey = localStorage.getItem(STORAGE_API_KEY);

  if (savedUrl && savedKey) {
    cfgUrlInput.value = savedUrl;
    cfgKeyInput.value = savedKey;
    setupSupabaseClient(savedUrl, savedKey);
  } else {
    updateConnectionBadge(false);
    configModal.classList.remove("hidden");
  }
}

toggleKeyBtn.addEventListener("click", () => {
  if (cfgKeyInput.type === "password") {
    cfgKeyInput.type = "text";
    toggleKeyBtn.textContent = "Ocultar";
  } else {
    cfgKeyInput.type = "password";
    toggleKeyBtn.textContent = "Mostrar";
  }
});

openConfigBtn.addEventListener("click", () => {
  configModal.classList.remove("hidden");
});

closeConfigBtn.addEventListener("click", () => {
  configModal.classList.add("hidden");
});

configForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const url = cleanSupabaseUrl(cfgUrlInput.value);
  const key = cfgKeyInput.value.trim();

  if (!url || !key) {
    showAlert(configAlert, "Por favor, preencha a URL e a Chave.");
    return;
  }

  localStorage.setItem(STORAGE_URL_KEY, url);
  localStorage.setItem(STORAGE_API_KEY, key);

  const success = setupSupabaseClient(url, key);
  if (success) {
    showAlert(configAlert, "Chaves salvas com sucesso no seu navegador!", true);
    setTimeout(() => {
      configModal.classList.add("hidden");
      hideAlert(configAlert);
    }, 900);
  } else {
    showAlert(configAlert, "URL ou Chave invalidas.");
  }
});

clearConfigBtn.addEventListener("click", () => {
  if (confirm("Deseja realmente remover as chaves deste navegador?")) {
    localStorage.removeItem(STORAGE_URL_KEY);
    localStorage.removeItem(STORAGE_API_KEY);
    cfgUrlInput.value = "";
    cfgKeyInput.value = "";
    client = null;
    updateConnectionBadge(false);
    showAlert(configAlert, "Chaves removidas. Configure novamente quando quiser.");
  }
});

function showAlert(alertEl, message, isSuccess = false) {
  alertEl.textContent = message;
  alertEl.className = isSuccess ? "alert alert-success" : "alert alert-error";
  alertEl.classList.remove("hidden");
}

function hideAlert(alertEl) {
  alertEl.textContent = "";
  alertEl.classList.add("hidden");
}

function showView(view) {
  hideAlert(loginAlert);
  hideAlert(registerAlert);

  loginCard.classList.add("hidden");
  registerCard.classList.add("hidden");
  welcomeCard.classList.add("hidden");

  if (view === "login") {
    loginCard.classList.remove("hidden");
  } else if (view === "register") {
    registerCard.classList.remove("hidden");
    updateQuotaDisplay();
  } else if (view === "welcome") {
    welcomeCard.classList.remove("hidden");
  }
}

toRegisterLink.addEventListener("click", (e) => {
  e.preventDefault();
  showView("register");
});

toLoginLink.addEventListener("click", (e) => {
  e.preventDefault();
  showView("login");
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAlert(loginAlert);

  if (!client) {
    showAlert(loginAlert, "Supabase nao conectado. Configure suas chaves no botao de conexao.");
    configModal.classList.remove("hidden");
    return;
  }

  const email = loginEmailInput.value.trim();
  const password = loginPasswordInput.value;

  if (!email || !password) {
    showAlert(loginAlert, "Por favor, preencha e-mail e senha.");
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "Entrando...";

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        showAlert(loginAlert, "E-mail ou senha incorretos.");
      } else {
        showAlert(loginAlert, "Erro: " + error.message);
      }
      return;
    }

    if (data.user) {
      setWelcomeState(data.user);
    }
  } catch (err) {
    showAlert(loginAlert, "Erro inesperado: " + err.message);
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Entrar";
  }
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAlert(registerAlert);

  const currentAccounts = getDeviceRegisteredAccounts();
  if (currentAccounts.length >= MAX_ACCOUNTS_PER_DEVICE) {
    showAlert(registerAlert, "Este computador ja atingiu o limite de 2 cadastros permitidos.");
    updateQuotaDisplay();
    return;
  }

  if (!client) {
    showAlert(registerAlert, "Supabase nao conectado. Configure suas chaves no botao de conexao.");
    configModal.classList.remove("hidden");
    return;
  }

  const email = registerEmailInput.value.trim();
  const password = registerPasswordInput.value;
  const confirmPassword = registerConfirmInput.value;

  if (!email || !password || !confirmPassword) {
    showAlert(registerAlert, "Por favor, preencha todos os campos.");
    return;
  }

  if (password.length < 6) {
    showAlert(registerAlert, "A senha deve ter no minimo 6 caracteres.");
    return;
  }

  if (password !== confirmPassword) {
    showAlert(registerAlert, "As senhas nao coincidem!");
    return;
  }

  registerBtn.disabled = true;
  registerBtn.textContent = "Cadastrando...";

  try {
    const deviceId = getDeviceId();
    const { data, error } = await client.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          device_id: deviceId,
          nome: email.split("@")[0]
        }
      }
    });

    if (error) {
      if (error.message.includes("already registered") || error.message.includes("User already exists")) {
        showAlert(registerAlert, "Este e-mail ja esta cadastrado no sistema! Faca login.");
      } else if (error.message.includes("rate limit")) {
        showAlert(registerAlert, "Limite de envio de e-mails do Supabase atingido. Aguarde alguns instantes.");
      } else {
        showAlert(registerAlert, "Erro no cadastro: " + error.message);
      }
      return;
    }

    saveDeviceRegisteredAccount(email);
    const updatedCount = getDeviceRegisteredAccounts().length;

    if (data.session) {
      setWelcomeState(data.user);
    } else {
      showAlert(
        registerAlert,
        "Conta criada com sucesso! (" + updatedCount + " de " + MAX_ACCOUNTS_PER_DEVICE + " contas deste computador).",
        true
      );
      registerForm.reset();
      updateQuotaDisplay();
    }
  } catch (err) {
    showAlert(registerAlert, "Erro inesperado: " + err.message);
  } finally {
    registerBtn.disabled = false;
    registerBtn.textContent = "Cadastrar";
  }
});

logoutBtn.addEventListener("click", async () => {
  logoutBtn.disabled = true;
  logoutBtn.textContent = "Saindo...";
  try {
    if (client) {
      await client.auth.signOut();
    }
    showView("login");
  } catch (err) {
    alert("Erro ao sair: " + err.message);
  } finally {
    logoutBtn.disabled = false;
    logoutBtn.textContent = "Sair (Sign Out)";
  }
});

function setWelcomeState(user) {
  welcomeEmail.textContent = user.email || "";
  welcomeId.textContent = user.id || "";
  showView("welcome");
}

async function initSession() {
  if (!client) return;
  try {
    const { data: { session } } = await client.auth.getSession();
    if (session?.user) {
      setWelcomeState(session.user);
    } else {
      showView("login");
    }
  } catch (err) {
    showView("login");
  }
}

window.resetDeviceLimit = function() {
  try { localStorage.removeItem(STORAGE_ACCOUNTS_KEY); } catch(e){}
  try { localStorage.removeItem(STORAGE_DEVICE_ID); } catch(e){}
  try { sessionStorage.removeItem(SESSION_ACCOUNTS_KEY); } catch(e){}
  document.cookie = COOKIE_ACCOUNTS_KEY + "=; Max-Age=0; path=/;";
  document.cookie = STORAGE_DEVICE_ID + "=; Max-Age=0; path=/;";
  updateQuotaDisplay();
  console.log("Limite de contas deste computador foi resetado para 0/2 com sucesso.");
};

loadCredentials();
updateQuotaDisplay();