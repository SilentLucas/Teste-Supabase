if (typeof SUPABASE_URL === "undefined" || typeof SUPABASE_KEY === "undefined") {
  alert("Arquivo config.js não encontrado ou variáveis não definidas! Copie config.example.js para config.js e adicione suas chaves.");
}

const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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
    await client.auth.signOut();
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

client.auth.onAuthStateChange((event, session) => {
  if (session?.user) {
    setWelcomeState(session.user);
  } else {
    showView("login");
  }
});

initSession();