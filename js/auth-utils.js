// auth-utils.js - Utility functions for authentication and authorization

/**
 * Decode JWT token to extract user information
 * @returns {Object|null} Decoded token payload or null if invalid/not present
 */
export function decodeToken() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    // JWT token format: header.payload.signature
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * Check if the current user has a specific role
 * @param {string} requiredRole - The role to check for
 * @returns {boolean} True if user has the required role
 */
export function hasRole(requiredRole) {
  // First try to get role from localStorage (most reliable)
  const storedRole = localStorage.getItem('userRole');
  
  if (storedRole) {
    // Case insensitive comparison to be safer
    if (storedRole.toLowerCase() === requiredRole.toLowerCase()) {
      return true;
    }
  }
  
  // As a fallback, try to get role from decoded token
  const decodedToken = decodeToken();
  if (decodedToken) {
    // Check for role in various possible properties
    const tokenRole = decodedToken.role || decodedToken.userRole || decodedToken.user?.role;
    if (tokenRole && tokenRole.toLowerCase() === requiredRole.toLowerCase()) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if the user is logged in
 * @returns {boolean} True if user is logged in
 */
export function isLoggedIn() {
  return !!localStorage.getItem('token');
}

/**
 * Redirect to home page with a message
 * @param {string} message - Message to display
 */
export function redirectWithMessage(message, page = 'index.html') {
  sessionStorage.setItem('authMessage', message);
  window.location.href = page;
}

/**
 * Get the current user's ID from the token
 * @returns {string|null} User ID or null if not found/available
 */
export function getUserId() {
  const decodedToken = decodeToken();
  if (!decodedToken) return null;
  
  // Try different possible property names for the user ID
  return decodedToken.userId || decodedToken.id || decodedToken.sub || null;
}
