// home-search.js - Handles the search functionality on the home page

document.addEventListener('DOMContentLoaded', function() {
  const searchForm = document.querySelector('form[action="jobs.html"]');
  
  if (searchForm) {
    searchForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Get search parameters
      const searchQuery = document.querySelector('input[name="q"]').value.trim();
      const locationQuery = document.querySelector('input[name="l"]').value.trim();
      
      // Only proceed with redirection if at least one search field has a value
      if (searchQuery || locationQuery) {
        // Build the URL with parameters
        let redirectUrl = 'jobs.html';
        const params = [];
        
        if (searchQuery) {
          params.push(`q=${encodeURIComponent(searchQuery)}`);
        }
        
        if (locationQuery) {
          params.push(`l=${encodeURIComponent(locationQuery)}`);
        }
        
        if (params.length > 0) {
          redirectUrl += `?${params.join('&')}`;
        }
        
        // Add a flag parameter to ensure filtering is applied
        redirectUrl += (params.length > 0 ? '&' : '?') + 'autofilter=true';
        
        // Redirect to jobs page with search parameters
        window.location.href = redirectUrl;
      } else {
        // If no search parameters, just go to jobs page
        window.location.href = 'jobs.html';
      }
    });
  }
});
