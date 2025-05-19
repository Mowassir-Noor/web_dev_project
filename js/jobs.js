// jobs.js
// Functions for Kariyerim job listings page that use the live API

let jobsData = []; // Will store fetched jobs

function fetchJobs() {
  // Show loading indicator
  $('#jobs-list').html('<div class="d-flex justify-content-center my-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>');
  
  // Make API request
  axios.get('https://web-backend-7aux.onrender.com/api/v1/jobs')
    .then(response => {
      if (response.data && response.data.success) {
        jobsData = response.data.data;
        renderJobs(jobsData);
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
  
  let filtered = jobsData.filter(job =>
    (location ? job.location.toLowerCase().includes(location) : true) &&
    (type ? job.jobType === type : true) &&
    (search ? job.title.toLowerCase().includes(search) || job.companyName.toLowerCase().includes(search) : true)
  );
  
  renderJobs(filtered);
}

$(document).ready(function () {
  // Fetch jobs from API when page loads
  fetchJobs();
  
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
