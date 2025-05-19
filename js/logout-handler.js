// Simple script to handle logout button clicks

document.addEventListener('DOMContentLoaded', function() {
  // Find any logout button
  const logoutBtn = document.getElementById('logout-btn');
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      // Remove the token
      localStorage.removeItem('token');
      
      // Update buttons visibility if on the same page
      const loginBtn = document.getElementById('login-btn');
      const signupBtn = document.getElementById('signup-btn');
      
      if (loginBtn) loginBtn.style.display = '';
      if (signupBtn) signupBtn.style.display = '';
      
      // Optional: Alert the user
      alert('Logged out successfully!');
      
      // Redirect to home page or refresh current page
      if (window.location.pathname.includes('profile.html')) {
        window.location.href = 'index.html';
      } else {
        window.location.reload();
      }
    });
  }
});
