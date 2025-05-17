// Handles showing/hiding login/signup modal and switching forms

function showAuthModal(type = "login") {
  if (document.getElementById("auth-modal-backdrop")) return;
  const modalHtml = `
    <div class="auth-modal-backdrop" id="auth-modal-backdrop">
      <div class="auth-modal">
        <button class="auth-modal-close" id="auth-modal-close" aria-label="Close">&times;</button>
        <div id="auth-modal-content"></div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHtml);
  renderAuthForm(type);

  document.getElementById("auth-modal-close").onclick = closeAuthModal;
  document.getElementById("auth-modal-backdrop").onclick = function(e) {
    if (e.target === this) closeAuthModal();
  };
  setTimeout(() => {
    const firstInput = document.querySelector("#auth-modal-content input");
    if (firstInput) firstInput.focus();
  }, 100);
}

function closeAuthModal() {
  const modal = document.getElementById("auth-modal-backdrop");
  if (modal) modal.remove();
}

function renderAuthForm(type) {
  const content = document.getElementById("auth-modal-content");
  if (!content) return;
  if (type === "login") {
    content.innerHTML = `
      <h3>Login</h3>
      <form id="login-form" autocomplete="off">
        <input type="email" class="form-control" placeholder="Email" required />
        <input type="password" class="form-control" placeholder="Password" required />
        <button type="submit" class="btn btn-primary">Login</button>
      </form>
      <div class="mt-3 text-center">
        Don't have an account?
        <span class="switch-auth-link" id="switch-to-signup">Sign Up</span>
      </div>
    `;
    document.getElementById("switch-to-signup").onclick = () => renderAuthForm("signup");
    document.getElementById("login-form").onsubmit = function(e) {
      e.preventDefault();
      alert("Login submitted (mock)");
      closeAuthModal();
    };
  } else {
    content.innerHTML = `
      <h3>Sign Up</h3>
      <form id="signup-form" autocomplete="off">
        <input type="text" class="form-control" placeholder="Full Name" required />
        <input type="email" class="form-control" placeholder="Email" required />
        <input type="password" class="form-control" placeholder="Password" required />
        <button type="submit" class="btn btn-primary">Sign Up</button>
      </form>
      <div class="mt-3 text-center">
        Already have an account?
        <span class="switch-auth-link" id="switch-to-login">Login</span>
      </div>
    `;
    document.getElementById("switch-to-login").onclick = () => renderAuthForm("login");
    document.getElementById("signup-form").onsubmit = function(e) {
      e.preventDefault();
      alert("Sign Up submitted (mock)");
      closeAuthModal();
    };
  }
}

// Attach modal openers to navbar buttons
function setupAuthModalButtons() {
  document.querySelectorAll(".navbar-auth-btn").forEach(btn => {
    btn.addEventListener("click", function(e) {
      e.preventDefault();
      showAuthModal(this.textContent.trim().toLowerCase() === "sign up" ? "signup" : "login");
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupAuthModalButtons);
} else {
  setupAuthModalButtons();
}
