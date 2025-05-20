// Global functions for handling job applicants

// Function to view applicants for a specific job
window.viewApplicants = async function(jobId, jobTitle, companyName) {
  const applicantsModal = document.getElementById('applicants-modal');
  if (!applicantsModal) {
    console.error("Applicants modal not found in the DOM");
    return;
  }

  // Show the modal
  applicantsModal.style.display = 'flex';
  
  // Block scrolling on the body
  document.body.style.overflow = 'hidden';
  
  // Show job details
  const modalJobDetails = document.getElementById('modal-job-details');
  if (modalJobDetails) {
    // Set default values if parameters aren't passed or contain special characters
    const safeJobTitle = jobTitle ? jobTitle.replace(/['"]/g, '') : 'Job Posting';
    const safeCompanyName = companyName ? companyName.replace(/['"]/g, '') : 'Company';
    
    modalJobDetails.innerHTML = `
      <div class="d-flex flex-column">
        <h4 class="text-primary mb-2">${safeJobTitle}</h4>
        <div class="d-flex justify-content-between align-items-center">
          <p class="mb-0 text-muted">${safeCompanyName}</p>
          <span class="badge bg-primary rounded-pill" id="applicant-count">0</span>
        </div>
      </div>
    `;
  }
  
  // Show loading state in the applicants container
  const applicantsContainer = document.getElementById('applicants-container');
  if (applicantsContainer) {
    applicantsContainer.innerHTML = `
      <div class="text-center py-4 py-lg-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3 text-muted">Loading applicants...</p>
      </div>
    `;
  }
    // Fetch applicants data
  try {    const token = localStorage.getItem('token');    console.log(`Fetching applicants for job ID: ${jobId}`);
    const response = await axios.get(
      `https://web-backend-7aux.onrender.com/api/v1/applications/job/${jobId}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    console.log('Applicants API response:', response);
    
    // Display applicants with better error handling
    if (response.data) {
      displayApplicants(response.data, jobId);
    } else {
      console.error('No data received from applications API');
      displayApplicants([], jobId); // Pass empty array to show no applicants message
    }
  } catch (error) {
    console.error('Error fetching applicants:', error);
    
    // Display error message
    if (applicantsContainer) {
      applicantsContainer.innerHTML = `
        <div class="alert alert-danger">
          <div class="d-flex">
            <div class="me-3">
              <i class="bi bi-exclamation-triangle-fill fs-4"></i>
            </div>
            <div>
              <p class="mb-0"><strong>Failed to load applicants.</strong></p>
              <p class="mb-0 small">${error.response?.data?.message || error.message || 'Unknown error'}</p>
            </div>
          </div>
          <button class="btn btn-outline-danger mt-3" onclick="closeApplicantsModal()">
            Close
          </button>
        </div>
      `;
    }
  }
};

// Function to close the applicants modal
window.closeApplicantsModal = function() {
  const applicantsModal = document.getElementById('applicants-modal');
  if (applicantsModal) {
    applicantsModal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
};

// Function to update applicant status
window.updateApplicantStatus = async function(applicationId, jobId, newStatus) {
  try {
    const token = localStorage.getItem('token');
    
    console.log(`Updating status for application ${applicationId} to ${newStatus}`);
    
    // Show loading toast notification
    const loadingToast = document.createElement('div');
    loadingToast.className = 'position-fixed bottom-0 end-0 p-3';
    loadingToast.style.zIndex = '5';
    loadingToast.innerHTML = `
      <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true" id="status-updating-toast">
        <div class="toast-header bg-info text-white">
          <div class="spinner-border spinner-border-sm me-2" role="status"></div>
          <strong class="me-auto">Updating Status</strong>
        </div>
        <div class="toast-body">
          Updating application status...
        </div>
      </div>
    `;    document.body.appendChild(loadingToast);    // Make API call to update status - using the correct endpoint
    const response = await axios.patch(
      `https://web-backend-7aux.onrender.com/api/v1/applications/${applicationId}/status`,
      {
        status: newStatus
      },
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    console.log('Status update response:', response);
    
    // Remove loading toast
    loadingToast.remove();
    
    // Show success notification
    const successToast = document.createElement('div');
    successToast.className = 'position-fixed bottom-0 end-0 p-3';
    successToast.style.zIndex = '5';
    successToast.innerHTML = `
      <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-header bg-success text-white">
          <i class="bi bi-check-circle-fill me-2"></i>
          <strong class="me-auto">Success</strong>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close" onclick="this.parentNode.parentNode.parentNode.remove()"></button>
        </div>
        <div class="toast-body">
          Applicant status updated successfully.
        </div>
      </div>
    `;
    document.body.appendChild(successToast);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
      if (successToast.parentNode) {
        successToast.remove();
      }
    }, 3000);
      // Fetch applicants again to refresh the data with complete parameters
    // Here we might not have the job title and company name, so we'll get them from the modal if possible
    const modalJobTitle = document.querySelector('#modal-job-details h4').textContent || '';
    const modalCompanyName = document.querySelector('#modal-job-details p.text-muted').textContent || '';
    viewApplicants(jobId, modalJobTitle, modalCompanyName);
    
  } catch (error) {
    console.error('Error updating applicant status:', error);
    
    // Show error notification
    const errorToast = document.createElement('div');
    errorToast.className = 'position-fixed bottom-0 end-0 p-3';
    errorToast.style.zIndex = '5';
    errorToast.innerHTML = `
      <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-header bg-danger text-white">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          <strong class="me-auto">Error</strong>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close" onclick="this.parentNode.parentNode.parentNode.remove()"></button>
        </div>
        <div class="toast-body">
          Failed to update status: ${error.response?.data?.message || error.message || 'Unknown error'}
        </div>
      </div>
    `;
    document.body.appendChild(errorToast);
    
    // Remove toast after 5 seconds
    setTimeout(() => {
      if (errorToast.parentNode) {
        errorToast.remove();
      }
    }, 5000);
  }
};

// Function to contact an applicant (opens email client)
window.contactApplicant = function(email, jobId) {
  if (!email) {
    // Show error toast if no email is provided
    const errorToast = document.createElement('div');
    errorToast.className = 'position-fixed bottom-0 end-0 p-3';
    errorToast.style.zIndex = '5';
    errorToast.innerHTML = `
      <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-header bg-danger text-white">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          <strong class="me-auto">Error</strong>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close" onclick="this.parentNode.parentNode.parentNode.remove()"></button>
        </div>
        <div class="toast-body">
          Cannot contact applicant: Email address not available.
        </div>
      </div>
    `;
    document.body.appendChild(errorToast);
    
    // Remove toast after 5 seconds
    setTimeout(() => {
      if (errorToast.parentNode) {
        errorToast.remove();
      }
    }, 5000);
    return;
  }
  
  // Open email client with pre-filled subject
  const subject = `Regarding Your Job Application (Job ID: ${jobId})`;
  window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
};

// Function to filter applicants by status
window.filterApplicantsByStatus = function(status) {
  const applicantCards = document.querySelectorAll('.applicant-card');
  
  // Update dropdown active state
  const dropdownItems = document.querySelectorAll('.applicants-modal-content .dropdown-item');
  dropdownItems.forEach(item => {
    item.classList.remove('active');
    if (item.textContent.toLowerCase() === (status === 'all' ? 'all statuses' : status)) {
      item.classList.add('active');
    }
  });
  
  // If no cards found
  if (!applicantCards.length) return;
  
  applicantCards.forEach(card => {
    if (status === 'all') {
      card.style.display = 'block';
      // Add a small animation to show it's active
      card.style.opacity = '0';
      setTimeout(() => {
        card.style.opacity = '1';
      }, 50);
    } else {
      const cardStatus = card.getAttribute('data-status');
      if (cardStatus === status) {
        card.style.display = 'block';
        // Add a small animation to show it's active
        card.style.opacity = '0';
        setTimeout(() => {
          card.style.opacity = '1';
        }, 50);
      } else {
        card.style.display = 'none';
      }
    }
  });
  
  // Show message if no cards match the filter
  const visibleCards = Array.from(applicantCards).filter(card => card.style.display !== 'none');
  const applicantsContainer = document.getElementById('applicants-container');
  const noResultsMsg = document.querySelector('.no-results-message');
  
  if (visibleCards.length === 0 && !noResultsMsg) {
    const message = document.createElement('div');
    message.className = 'alert alert-warning text-center no-results-message mt-3';
    message.innerHTML = `
      <i class="bi bi-filter-circle-fill me-2"></i>
      No applicants with status "${status}" found.
      <button class="btn btn-sm btn-outline-primary d-block mx-auto mt-2" onclick="filterApplicantsByStatus('all')">
        Show All Applicants
      </button>
    `;
    applicantsContainer.appendChild(message);
  } else if (visibleCards.length > 0 && noResultsMsg) {
    noResultsMsg.remove();
  }
};

// Function to display applicants
function displayApplicants(applicantsData, jobId) {
  const applicantsContainer = document.getElementById('applicants-container');
  const applicantCountEl = document.getElementById('applicant-count');
  
  if (!applicantsContainer) return;
  
  // Log the data to console for debugging
  console.log('Applicants data:', applicantsData);
  
  // Check if applicants exist and have length
  if (!applicantsData || !Array.isArray(applicantsData) || applicantsData.length === 0) {
    applicantsContainer.innerHTML = `
      <div class="text-center py-4">
        <i class="bi bi-people text-secondary" style="font-size: 3rem;"></i>
        <h5 class="mt-3">No Applicants Yet</h5>
        <p class="text-muted">This job posting hasn't received any applications yet.</p>
      </div>
    `;
    
    if (applicantCountEl) {
      applicantCountEl.textContent = '0';
    }
    return;
  }
  
  // Update the applicant count
  if (applicantCountEl) {
    applicantCountEl.textContent = applicantsData.length;
  }
  
  // Create HTML for applicants
  let html = `<div class="mb-3 d-flex justify-content-between align-items-center">
    <p class="text-muted mb-0">Total Applications: <strong>${applicantsData.length}</strong></p>
    <div class="dropdown">
      <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
        <i class="bi bi-funnel me-1"></i> Filter
      </button>
    <ul class="dropdown-menu dropdown-menu-dark">
        <li><a class="dropdown-item active" href="#" onclick="filterApplicantsByStatus('all')">All Statuses</a></li>
        <li><a class="dropdown-item" href="#" onclick="filterApplicantsByStatus('applied')">Applied</a></li>
        <li><a class="dropdown-item" href="#" onclick="filterApplicantsByStatus('reviewed')">Reviewed</a></li>
        <li><a class="dropdown-item" href="#" onclick="filterApplicantsByStatus('rejected')">Rejected</a></li>
        <li><a class="dropdown-item" href="#" onclick="filterApplicantsByStatus('accepted')">Accepted</a></li>
      </ul>
    </div>
  </div>`;

  // Add applicants cards
  applicantsData.forEach(application => {
    // Handle potential missing data gracefully
    const applicant = application.applicant || {};
    
    // Format date nicely
    let appliedDate = 'Unknown date';
    try {
      if (application.appliedAt) {
        const date = new Date(application.appliedAt);
        appliedDate = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    } catch (e) {
      console.error("Date parsing error", e);
    }
    
    const coverLetter = application.coverLetter || 'No cover letter provided.';
    
    // Default to a # if resumeUrl is missing, but check for common scenarios
    let resumeUrl = '#';
    if (application.resumeUrl && application.resumeUrl !== 'https://example.com/resumes/john-doe.pdf') {
      resumeUrl = application.resumeUrl;
    } else if (applicant.resumeUrl && applicant.resumeUrl !== 'https://example.com/resumes/john-doe.pdf') {
      resumeUrl = applicant.resumeUrl;
    }
    
    const status = application.status || 'applied';
    const applicationId = application._id || '';
    
    // Get the applicant's bio if available
    const bio = applicant.bio || '';
      // Determine status badge color
    let statusClass = 'status-applied';
    switch(status.toLowerCase()) {
      case 'reviewed':
        statusClass = 'status-reviewed';
        break;
      case 'accepted':
        statusClass = 'status-accepted';
        break;
      case 'rejected':
        statusClass = 'status-rejected';
        break;
    }
    
    // Format the email safely for JavaScript
    const safeEmail = applicant.email ? applicant.email.replace(/'/g, "\\'") : '';
    
    html += `
      <div class="applicant-card p-3 mb-4" data-status="${status}">
        <div class="row">
          <div class="col-12 col-md-8">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h5 class="applicant-name mb-0">${applicant.name || 'Unknown Applicant'}</h5>
              <span class="applicant-status ${statusClass}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
            </div>
            <div class="d-flex flex-column gap-2 mb-3">
              <div class="applicant-email">
                <i class="bi bi-envelope me-2"></i>${applicant.email || 'No email provided'}
              </div>
              ${applicant.location ? `
              <div class="applicant-location">
                <i class="bi bi-geo-alt me-2"></i>${applicant.location}
              </div>` : ''}
              <div class="applicant-date">
                <i class="bi bi-calendar3 me-2"></i>Applied on ${appliedDate}
              </div>
            </div>
            
            ${bio ? `
            <div class="applicant-bio mb-3">
              <p class="small text-muted mb-1">About the applicant:</p>
              <p class="mb-0">${bio}</p>
            </div>
            ` : ''}
            
            <div class="cover-letter-preview">
              <p class="small text-muted mb-1">Cover Letter:</p>
              <p class="mb-0">${coverLetter}</p>
            </div>
          </div>
          
          <div class="col-12 col-md-4 mt-3 mt-md-0">
            <div class="applicant-actions d-flex flex-column gap-2">
              <a href="${resumeUrl}" target="_blank" class="btn btn-outline-primary">
                <i class="bi bi-file-earmark-text me-1"></i> Download Resume
              </a>
              <div class="dropdown">
                <button class="btn btn-outline-secondary dropdown-toggle w-100" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                  <i class="bi bi-gear me-1"></i> Change Status
                </button>
                <ul class="dropdown-menu dropdown-menu-dark">
                  <li><a class="dropdown-item ${status === 'applied' ? 'active' : ''}" href="#" onclick="updateApplicantStatus('${applicationId}', '${jobId}', 'applied')">Applied</a></li>
                  <li><a class="dropdown-item ${status === 'reviewed' ? 'active' : ''}" href="#" onclick="updateApplicantStatus('${applicationId}', '${jobId}', 'reviewed')">Reviewed</a></li>
                  <li><a class="dropdown-item ${status === 'accepted' ? 'active' : ''}" href="#" onclick="updateApplicantStatus('${applicationId}', '${jobId}', 'accepted')">Accepted</a></li>
                  <li><a class="dropdown-item ${status === 'rejected' ? 'active' : ''}" href="#" onclick="updateApplicantStatus('${applicationId}', '${jobId}', 'rejected')">Rejected</a></li>
                </ul>
              </div>
              <button class="btn btn-sm btn-outline-info" onclick="contactApplicant('${safeEmail}', '${jobId}')">
                <i class="bi bi-chat me-1"></i> Contact Applicant
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  });
  
  applicantsContainer.innerHTML = html;
}

// Setup DOM event listeners once content is loaded
document.addEventListener('DOMContentLoaded', () => {
  const applicantsModal = document.getElementById('applicants-modal');
  const closeApplicantsBtn = document.getElementById('close-applicants-btn');
  
  if (closeApplicantsBtn) {
    closeApplicantsBtn.addEventListener('click', closeApplicantsModal);
  }
  
  // Setup event listener for ESC key to close the applicants modal
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && applicantsModal && applicantsModal.style.display === 'flex') {
      closeApplicantsModal();
    }
  });
  
  // Add event listener for closing modal by clicking outside
  if (applicantsModal) {
    applicantsModal.addEventListener('click', function(e) {
      if (e.target === this) {
        closeApplicantsModal();
      }
    });
  }
});
