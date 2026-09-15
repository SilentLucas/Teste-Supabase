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

const welcomeEmail = document.getElementById("welcome-email");
const welcomeId = document.getElementById("welcome-id");
const logoutBtn = document.getElementById("logout-btn");

const toRegisterLink = document.getElementById("to-register");
const toLoginLink = document.getElementById("to-login");

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
    console.error("Erro ao inicializar Supabase:", err);
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
    showAlert(configAlert, "URL ou Chave inválidas.");
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
    showAlert(loginAlert, "Supabase não conectado. Clique em ⚙️ Conexão para configurar suas chaves.");
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

  if (!client) {
    showAlert(registerAlert, "Supabase não conectado. Clique em ⚙️ Conexão para configurar suas chaves.");
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

  if (password !== confirmPassword) {
    showAlert(registerAlert, "As senhas não coincidem!");
    return;
  }

  registerBtn.disabled = true;
  registerBtn.textContent = "Cadastrando...";

  try {
    const { data, error } = await client.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      showAlert(registerAlert, "Erro no cadastro: " + error.message);
      return;
    }

    if (data.session) {
      setWelcomeState(data.user);
    } else {
      showAlert(
        registerAlert,
        "Cadastro realizado! Verifique seu e-mail de confirmação ou faça login.",
        true
      );
      registerForm.reset();
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

loadCredentials();