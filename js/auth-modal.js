// Handles showing/hiding login/signup modal and switching forms
 axios.interceptors.request.use(
      config => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );

  // Logout function
    function logout() {
      localStorage.removeItem('token');
      alert('Logged out!');
      updateAuthButtonsVisibility();
    }

// Function to update auth buttons visibility based on login state
function updateAuthButtonsVisibility() {
  const token = localStorage.getItem('token');
  const loginBtn = document.getElementById('login-btn');
  const signupBtn = document.getElementById('signup-btn');
  
  if (loginBtn && signupBtn) {
    if (token) {
      loginBtn.style.display = 'none';
      signupBtn.style.display = 'none';
    } else {
      loginBtn.style.display = '';
      signupBtn.style.display = '';
    }
  }
}

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

function showLoader() {
  let loader = document.getElementById("auth-modal-loader");
  if (!loader) {
    loader = document.createElement("div");
    loader.id = "auth-modal-loader";
    loader.style.position = "fixed";
    loader.style.top = "0";
    loader.style.left = "0";
    loader.style.width = "100vw";
    loader.style.height = "100vh";
    loader.style.background = "rgba(255,255,255,0.5)";
    loader.style.display = "flex";
    loader.style.alignItems = "center";
    loader.style.justifyContent = "center";
    loader.style.zIndex = "9999";
    loader.innerHTML = `<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>`;
    document.body.appendChild(loader);
  }
}

function hideLoader() {
  const loader = document.getElementById("auth-modal-loader");
  if (loader) loader.remove();
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
    document.getElementById("login-form").onsubmit = async function(e) {
      e.preventDefault();
      const btn = this.querySelector('button[type="submit"]');
      btn.disabled = true;
      const originalHtml = btn.innerHTML;
      btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Logging in...`;
      const email = this.querySelector('input[placeholder="Email"]').value;
      const password = this.querySelector('input[placeholder="Password"]').value;
      const payload = { email, password };
      try {
        const response = await axios.post(
          'https://web-backend-7aux.onrender.com/api/v1/auth/sign-in',
          JSON.stringify(payload),
          { headers: { 'Content-Type': 'application/json' } }
        );
        const token = response.data.data.token;
        localStorage.setItem('token', token);
        window.location.href = "index.html";
      } catch (err) {
        let msg = "Sign in failed";
        if (err.response && err.response.data && err.response.data.message) {
          msg += ": " + err.response.data.message;
        }
        alert(msg);
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
      }
    };
  } else {
    content.innerHTML = `
      <h3>Sign Up</h3>
      <form id="signup-form" autocomplete="off">
        <input type="text" class="form-control" placeholder="Full Name" required />
        <input type="email" class="form-control" placeholder="Email" required />
        <input type="password" class="form-control" placeholder="Password" required />
        <div class="mb-3 mt-3">
          <div class="form-check form-check-inline">
            <input class="form-check-input" type="radio" name="role" id="role-jobseeker" value="job_seeker" required>
            <label class="form-check-label" for="role-jobseeker">Job Seeker</label>
          </div>
          <div class="form-check form-check-inline">
            <input class="form-check-input" type="radio" name="role" id="role-recruiter" value="recruiter" required>
            <label class="form-check-label" for="role-recruiter">recruiter</label>
          </div>
        </div>
        <button type="submit" class="btn btn-primary">Sign Up</button>
      </form>
      <div class="mt-3 text-center">
        Already have an account?
        <span class="switch-auth-link" id="switch-to-login">Login</span>
      </div>
    `;
    document.getElementById("switch-to-login").onclick = () => renderAuthForm("login");
    document.getElementById("signup-form").onsubmit = async function(e) {
      e.preventDefault();
      const btn = this.querySelector('button[type="submit"]');
      btn.disabled = true;
      const originalHtml = btn.innerHTML;
      btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Signing up...`;
      const name = this.querySelector('input[placeholder="Full Name"]').value;
      const email = this.querySelector('input[placeholder="Email"]').value;
      const password = this.querySelector('input[placeholder="Password"]').value;
      const role = this.querySelector('input[name="role"]:checked')?.value;
      const payload = { name, email, password, role };
      try {
        const response = await axios.post(
          'https://web-backend-7aux.onrender.com/api/v1/auth/sign-up',
          JSON.stringify(payload),
          { headers: { 'Content-Type': 'application/json' } }
        );
        window.location.href = "index.html";
      } catch (err) {
        let msg = "Sign Up failed";
        if (err.response && err.response.data && err.response.data.message) {
          msg += ": " + err.response.data.message;
        }
        alert(msg);
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
      }
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
  
  // Check auth state on page load
  updateAuthButtonsVisibility();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupAuthModalButtons);
} else {
  setupAuthModalButtons();
}
