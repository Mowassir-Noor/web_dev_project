// jobs.js
// Functions for Kariyerim job listings page that use the live API

let jobsData = []; // Will store fetched jobs

function fetchJobs() {
  // Show loading indicator
  $('#jobs-list').html('<div class="d-flex justify-content-center my-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>');
  
  // Check if we have URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const hasSearchParams = urlParams.has('q') || urlParams.has('l') || urlParams.has('type');
  
  // Make API request
  axios.get('https://web-backend-7aux.onrender.com/api/v1/jobs')
    .then(response => {
      if (response.data && response.data.success) {
        jobsData = response.data.data;
        
        // If we have search parameters, apply filters directly
        // Otherwise just render all jobs
        if (hasSearchParams) {
          applyFilters();
        } else {
          renderJobs(jobsData);
        }
      } else {
        $('#jobs-list').html('<div class="alert alert-danger">Failed to load jobs data.</div>');
      }
    })
    .catch(error => {
      console.error('Error fetching jobs:', error);
      $('#jobs-list').html('<div class="alert alert-danger">Error loading jobs. Please try again later.</div>');
    });
}

function renderJobs(jobs) {
  let jobsHtml = '';
  if (jobs.length === 0) {
    jobsHtml = '<div class="alert alert-info">No jobs found.</div>';
  } else {
    jobs.forEach(job => {
      // Use first letter of company as logo placeholder
      const logoLetter = job.companyName ? job.companyName[0].toUpperCase() : "?";
      
      // Format salary range if available
      const salary = job.salaryRange ? `Salary: ${job.salaryRange}` : '';
      
      // Create job link
      const jobLink = `job-details.html?id=${job._id}`;
      
      jobsHtml += `
      <div class="col">
        <a href="${jobLink}" class="job-card-link">
          <div class="job-card h-100">
            <div class="job-card-header">
              <div class="job-company-logo">${logoLetter}</div>
              <div>
                <div class="job-card-title">${job.title}</div>
                <div>
                  <span class="job-card-company">${job.companyName}</span>
                  <span class="job-card-location">${job.location}</span>
                </div>
              </div>
            </div>
            <div class="job-card-summary">${job.description.substring(0, 100)}${job.description.length > 100 ? '...' : ''}</div>
            <div class="job-card-footer">
              <span class="badge job-type-badge">${job.jobType}</span>
              <span class="btn btn-view-details">View Details</span>
            </div>
          </div>
        </a>
      </div>`;
    });
  }
  $('#jobs-list').html(jobsHtml);
}

function applyFilters() {
  const location = $('#location').val().toLowerCase();
  const type = $('#type').val();
  const search = $('#search-input').val().toLowerCase();
  
  // If we have search parameters, we'll filter the jobs more extensively
  let filtered = jobsData.filter(job => {
    // Location filter
    const locationMatch = location ? job.location.toLowerCase().includes(location) : true;
    
    // Job type filter
    const typeMatch = type ? job.jobType === type : true;
    
    // Search filter - check title, company name, and description
    const searchMatch = search ? (
      job.title.toLowerCase().includes(search) || 
      job.companyName.toLowerCase().includes(search) || 
      job.description.toLowerCase().includes(search)
    ) : true;
    
    // Job must match all applied filters
    return locationMatch && typeMatch && searchMatch;
  });
  
  // Update UI with filtered jobs
  renderJobs(filtered);
  
  // Update URL with filter parameters (optional - enables sharing filtered results)
  updateUrlParams(search, location, type);
}

// Helper function to update the URL with current search parameters
function updateUrlParams(search, location, jobType) {
  const url = new URL(window.location.href);
  const params = url.searchParams;
  
  // Update or remove parameters based on filter values
  if (search) {
    params.set('q', search);
  } else {
    params.delete('q');
  }
  
  if (location) {
    params.set('l', location);
  } else {
    params.delete('l');
  }
  
  if (jobType) {
    params.set('type', jobType);
  } else {
    params.delete('type');
  }
  
  // Replace the current URL without reloading the page
  window.history.replaceState({}, '', url.toString());
}

$(document).ready(function () {
  // Fetch jobs from API when page loads
  fetchJobs();
  
  // Check URL parameters for search query and location
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get('q');
  const searchLocation = urlParams.get('l');
  const jobType = urlParams.get('type');
  const autoFilter = urlParams.get('autofilter');
  
  // Apply search parameters from URL if present
  if (searchQuery || searchLocation || jobType || autoFilter === 'true') {
    // Set form values based on URL parameters
    if (searchQuery) {
      $('#search-input').val(searchQuery);
    }
    if (searchLocation) {
      $('#location').val(searchLocation);
    }
    if (jobType) {
      $('#type').val(jobType);
    }
    
    console.log('Search parameters detected. Preparing to apply filters...');
    
    // Force application of filters once data is loaded
    const applyFiltersWhenReady = () => {
      console.log('Checking if job data is loaded...');
      if (jobsData && jobsData.length > 0) {
        console.log('Job data loaded. Applying filters now.');
        applyFilters();
        return true;
      }
      return false;
    };
    
    // Try to apply filters immediately if data is already loaded
    if (!applyFiltersWhenReady()) {
      console.log('Job data not loaded yet. Setting up interval to check...');
      // Set up an interval to check for data and apply filters once available
      const filterInterval = setInterval(() => {
        if (applyFiltersWhenReady()) {
          clearInterval(filterInterval);
        }
      }, 200);
      
      // Set a timeout to clear the interval if it takes too long
      setTimeout(() => {
        console.log('Filter application timeout reached.');
        clearInterval(filterInterval);
        // One final attempt
        if (jobsData && jobsData.length > 0) {
          applyFilters();
        }
      }, 5000);
    }
  }
  
  // Set up filter handlers
  $('#filter-form').on('submit', function(e) {
    e.preventDefault();
    applyFilters();
  });
  
  $('#search-form').on('submit', function(e) {
    e.preventDefault();
    applyFilters();
  });
  
  // Add event listeners for filter inputs if needed
  $('#location, #type').on('change', function() {
    applyFilters();
  });
  
  // Real-time search filtering (optional)
  $('#search-input').on('input', function() {
    applyFilters();
  });
});
