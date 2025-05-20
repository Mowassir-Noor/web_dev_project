// job-details.js - Fetches and displays specific job details from the API

function getJobIdFromQuery() {
  const url = new URL(window.location.href);
  return url.searchParams.get('id');
}

function fetchJobDetails(jobId) {
  // Show loading indicator
  $('#job-details').html('<div class="d-flex justify-content-center my-5"><div class="spinner-border text-light" role="status"><span class="visually-hidden">Loading...</span></div></div>');
  
  // First try to get the specific job details if possible
  axios.get(`https://web-backend-7aux.onrender.com/api/v1/jobs/${jobId}`)
    .then(response => {
      if (response.data && response.data.success) {
        renderJobDetails(response.data.data);
      } else {
        // Fallback: If direct job endpoint doesn't exist or fails, fetch all jobs and filter
        fetchAllJobsAndFilter(jobId);
      }
    })
    .catch(error => {
      // Fallback to fetching all jobs if specific endpoint fails
      fetchAllJobsAndFilter(jobId);
    });
}

function fetchAllJobsAndFilter(jobId) {
  axios.get('https://web-backend-7aux.onrender.com/api/v1/jobs')
    .then(response => {
      if (response.data && response.data.success) {
        const job = response.data.data.find(j => j._id === jobId);
        if (job) {
          renderJobDetails(job);
        } else {
          $('#job-details').html('<div class="alert alert-danger">Job not found.</div>');
        }
      } else {
        $('#job-details').html('<div class="alert alert-danger">Failed to load job details.</div>');
      }
    })
    .catch(error => {
      console.error('Error fetching job details:', error);
      $('#job-details').html('<div class="alert alert-danger">Error loading job details. Please try again later.</div>');
    });
}

function renderJobDetails(job) {
  if (!job) {
    $('#job-details').html('<div class="alert alert-danger">Job not found.</div>');
    return;
  }
  
  // Format dates
  const postedDate = new Date(job.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  });
  
  const expiryDate = new Date(job.expiresAt).toLocaleDateString('en-US', {
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  });
  
  // Format salary if available
  const salary = job.salaryRange ? `<div class="job-salary mb-3">Salary Range: ${job.salaryRange}</div>` : '';
  
  // Format company info
  const recruiterInfo = job.recruiter ? 
    `<div class="recruiter-info mb-3">
      <strong>Posted by:</strong> ${job.recruiter.name}
    </div>` : '';

  $('#job-details').html(`
    <div class="card text-white" style="background: transparent; border: none;">
      <div class="card-body">
        <h2 class="card-title mb-2">${job.title}</h2>
        <h5 class="card-subtitle mb-3 text-light opacity-75">${job.companyName} - ${job.location}</h5>
        <span class="badge job-type-badge mb-3">${job.jobType}</span>
        
        ${salary}
        
        <div class="job-dates mb-3">
          <div><strong>Posted:</strong> ${postedDate}</div>
          <div><strong>Expires:</strong> ${expiryDate}</div>
        </div>
        
        ${recruiterInfo}
        
        <div class="job-description mb-4">
          <h5 class="mb-2">Job Description</h5>
          <p class="card-text">${job.description}</p>
        </div>
        
        <div class="mt-4">
          <a href="#" class="btn btn-primary me-2" id="apply-btn">Apply Now</a>
          <a href="jobs.html" class="btn btn-outline-light">Back to Jobs</a>
        </div>
      </div>
    </div>
    
    <!-- Application Modal -->
    <div class="auth-modal-backdrop" id="application-modal" style="display: none;">
      <div class="auth-modal" style="width: 500px; max-width: 95%;">
        <button class="auth-modal-close" id="close-application-modal">&times;</button>
        <h3>Apply for ${job.title}</h3>
        <form id="application-form">
          <div class="mb-3">
            <label for="cover-letter" class="form-label">Cover Letter</label>
            <textarea class="form-control" id="cover-letter" rows="6" placeholder="Write your cover letter here..."></textarea>
          </div>
          <button type="submit" class="btn btn-primary">Submit Application</button>
          <div id="application-status" class="mt-3" style="display: none;"></div>
        </form>
      </div>
    </div>
  `);
  
  // Setup application modal handlers
  $('#apply-btn').on('click', function(e) {
    e.preventDefault();
    
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to apply for this job');
      return;
    }
    
    // Show application modal
    $('#application-modal').fadeIn(200);
  });
  
  $('#close-application-modal').on('click', function() {
    $('#application-modal').fadeOut(200);
  });
  
  // Handle form submission
  $('#application-form').on('submit', function(e) {
    e.preventDefault();
    
    const coverLetter = $('#cover-letter').val();
    
    if (!coverLetter) {
      showApplicationStatus('danger', 'Please provide a cover letter.');
      return;
    }
    
    // Get token for authorization
    const token = localStorage.getItem('token');
    if (!token) {
      showApplicationStatus('danger', 'Authentication error. Please log in again.');
      return;
    }
    
    // Show loading state
    $('#application-form button[type="submit"]').html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submitting...');
    $('#application-form button[type="submit"]').prop('disabled', true);
    
    // Prepare application data
    const applicationData = {
      jobId: job._id,
      coverLetter: coverLetter
    };
    
    // Submit application
    axios.post('https://web-backend-7aux.onrender.com/api/v1/applications', applicationData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      if (response.data) {
        // Show success message
        showApplicationStatus('success', 'Your application has been successfully submitted!');
        
        // Reset form
        $('#application-form')[0].reset();
        
        // Close modal after a delay
        setTimeout(function() {
          $('#application-modal').fadeOut(200);
        }, 2000);
      } else {
        showApplicationStatus('danger', 'There was an error submitting your application. Please try again.');
      }
    })
    .catch(error => {
      console.error('Error submitting application:', error);
      let errorMessage = 'There was an error submitting your application.';
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      showApplicationStatus('danger', errorMessage);
    })
    .finally(() => {
      // Reset button state
      $('#application-form button[type="submit"]').html('Submit Application');
      $('#application-form button[type="submit"]').prop('disabled', false);
    });
  });
  
  // Helper function to show application status
  function showApplicationStatus(type, message) {
    const statusElement = $('#application-status');
    statusElement.removeClass('alert-success alert-danger').addClass(`alert alert-${type}`);
    statusElement.html(message);
    statusElement.fadeIn();
  }
}

$(document).ready(function() {
  const jobId = getJobIdFromQuery();
  if (jobId) {
    fetchJobDetails(jobId);
  } else {
    $('#job-details').html('<div class="alert alert-danger">Invalid job ID.</div>');
  }
  
  // Update auth buttons visibility
  if (typeof updateAuthButtonsVisibility === 'function') {
    updateAuthButtonsVisibility();
  }
  
  // Close application modal when clicking outside
  $(document).on('click', '.auth-modal-backdrop', function(e) {
    if ($(e.target).hasClass('auth-modal-backdrop')) {
      $('.auth-modal-backdrop').fadeOut(200);
    }
  });
});
