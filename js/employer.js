// employer.js
import { isLoggedIn, hasRole, redirectWithMessage, getUserId } from './auth-utils.js';

document.addEventListener('DOMContentLoaded', () => {
  'use strict';
  
  // First check if user is logged in
  if (!isLoggedIn()) {
    redirectWithMessage('You need to log in to access the employer page.', 'index.html');
    return;
  }
  
  // Then check if user has the recruiter role
  if (!hasRole('recruiter')) {
    redirectWithMessage('Only recruiters can access this page.', 'index.html');
    return;
  }
  
  // Track if we're editing an existing job or creating a new one
  let isEditMode = false;
  let currentEditJobId = null;
  
  // UI Elements
  const jobFormModal = document.getElementById('job-form-modal');
  const newJobBtn = document.getElementById('new-job-btn');
  const closeFormBtn = document.getElementById('close-form-btn');
  const myJobsContainer = document.getElementById('my-jobs-container');
  const refreshJobsBtn = document.getElementById('refresh-jobs');
  
  // Helper function to show toast notifications
  function showToast(title, message, type = 'success', duration = 5000) {
    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.className = 'position-fixed bottom-0 end-0 p-3';
    toast.style.zIndex = '5';
    toast.innerHTML = `
      <div id="${toastId}" class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-header bg-${type} text-white">
          <i class="bi bi-${type === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill'} me-2"></i>
          <strong class="me-auto">${title}</strong>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close" 
            onclick="document.getElementById('${toastId}').parentNode.remove()"></button>
        </div>
        <div class="toast-body">
          ${message}
        </div>
      </div>
    `;
    document.body.appendChild(toast);
    
    // Remove toast after specified duration
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, duration);
  }
  
  // Toggle job form modal visibility with smooth transitions
  if (newJobBtn) {
    newJobBtn.addEventListener('click', () => {
      // Reset edit mode when posting a new job
      isEditMode = false;
      currentEditJobId = null;
      
      // Reset form if it exists
      const form = document.getElementById('post-job-form');
      if (form) {
        form.reset();
        form.classList.remove('was-validated');
      }
      
      // Reset form title
      const formTitle = document.querySelector('.job-modal-content h2');
      if (formTitle) {
        formTitle.innerHTML = 'Post a Job';
      }
      
      // Reset submit button text
      const submitText = document.getElementById('submit-text');
      if (submitText) {
        submitText.innerText = 'Post Job';
      }
      
      // Clear any existing alerts
      const formAlerts = document.getElementById('form-alerts');
      if (formAlerts) {
        formAlerts.innerHTML = '';
      }
      
      // Show the job form modal
      jobFormModal.style.display = 'flex';
      
      // Add event listener for closing modal by clicking outside
      jobFormModal.addEventListener('click', function(e) {
        if (e.target === this) {
          closeJobFormModal();
        }
      });
      
      // Block scrolling on the body
      document.body.style.overflow = 'hidden';
    });
  }
  
  function closeJobFormModal() {
    // Reset edit mode when closing the form
    isEditMode = false;
    currentEditJobId = null;
    
    // Hide the modal
    jobFormModal.style.display = 'none';
    
    // Enable scrolling on body again
    document.body.style.overflow = 'auto';
    
    // Reset form if it exists
    const form = document.getElementById('post-job-form');
    if (form) {
      form.reset();
      form.classList.remove('was-validated');
    }
    
    // Reset form title
    const formTitle = document.querySelector('.job-modal-content h2');
    if (formTitle) {
      formTitle.innerHTML = 'Post a Job';
    }
    
    // Reset submit button text
    const submitText = document.getElementById('submit-text');
    if (submitText) {
      submitText.innerText = 'Post Job';
    }
    
    // Clear any existing alerts
    const formAlerts = document.getElementById('form-alerts');
    if (formAlerts) {
      formAlerts.innerHTML = '';
    }
  }

  if (closeFormBtn) {
    closeFormBtn.addEventListener('click', () => {
      closeJobFormModal();
    });
  }
  
  // Add refresh functionality
  if (refreshJobsBtn) {
    refreshJobsBtn.addEventListener('click', function() {
      const icon = this.querySelector('i');
      
      // Add spinning animation to refresh icon
      icon.classList.add('fa-spin');
      
      // Fetch employer jobs
      fetchEmployerJobs().finally(() => {
        // Stop spinning after data loads
        setTimeout(() => {
          icon.classList.remove('fa-spin');
        }, 500);
      });
    });
  }

  // Initialize the form for job posting/editing
  const form = document.getElementById('post-job-form');
  if (form) {
    form.addEventListener('submit', async function(event) {
      event.preventDefault();
      
      // Get submit button elements
      const submitBtn = document.getElementById('submit-job-btn');
      const submitSpinner = document.getElementById('submit-spinner');
      const submitText = document.getElementById('submit-text');
      
      if (!form.checkValidity()) {
        event.stopPropagation();
      } else {
        // Show loading state on button
        submitBtn.disabled = true;
        submitSpinner.classList.remove('d-none');
        submitText.innerText = isEditMode ? 'Updating...' : 'Posting...';
        
        // Get form values
        const jobTitle = document.getElementById('jobTitle').value;
        const company = document.getElementById('company').value;
        const location = document.getElementById('location').value;
        const jobType = document.getElementById('type').value;
        const description = document.getElementById('summary').value;
        const category = document.getElementById('category').value;
        const salaryRange = document.getElementById('salaryRange').value;
        
        // Handle expiry date with default value
        let expiresAt = document.getElementById('expiresAt').value;
        if (!expiresAt) {
          // Default to 6 months from now if no expiry date is provided
          const sixMonthsLater = new Date();
          sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
          expiresAt = sixMonthsLater.toISOString().split('T')[0];
        } else {
          // Add time component to make it end of day
          expiresAt = `${expiresAt}T23:59:59.999Z`;
        }
        
        try {
          // Clear any existing alerts
          const formAlerts = document.getElementById('form-alerts');
          formAlerts.innerHTML = '';
          
          // Add loading indicator alert
          const loadingAlert = document.createElement('div');
          loadingAlert.className = 'alert alert-info d-flex align-items-center';
          loadingAlert.innerHTML = `
            <div class="spinner-border spinner-border-sm me-2" role="status"></div>
            <div>${isEditMode ? 'Updating job posting...' : 'Submitting job posting...'}</div>
          `;
          formAlerts.appendChild(loadingAlert);
          
          const token = localStorage.getItem('token');
          
          // Prepare job data
          const jobData = {
            title: jobTitle,
            companyName: company,
            location: location,
            jobType: jobType.toLowerCase(), // Ensure consistent casing with API
            description: description,
            category: category,
            salaryRange: salaryRange,
            expiresAt: expiresAt
          };
          
          // Determine if we're creating or updating a job
          let response;
          
          if (isEditMode && currentEditJobId) {
            // Update existing job
            response = await axios.put(
              `https://web-backend-7aux.onrender.com/api/v1/jobs/${currentEditJobId}`,
              jobData,
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                }
              }
            );
          } else {
            // Create new job
            response = await axios.post(
              'https://web-backend-7aux.onrender.com/api/v1/jobs',
              jobData,
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                }
              }
            );
          }
          
          // Reset form state
          const formTitle = document.querySelector('#job-form-container h2');
          if (formTitle) {
            formTitle.innerHTML = 'Post a Job';
          }
          
          // Reset button state
          submitBtn.disabled = false;
          submitSpinner.classList.add('d-none');
          submitText.innerText = 'Post Job';
          
          // Reset edit mode states
          isEditMode = false;
          currentEditJobId = null;
          
          // Remove loading alert
          loadingAlert.remove();
          
          if (response.data && response.data.success) {
            // Create a success message that disappears after 3 seconds
            const successDiv = document.createElement('div');
            successDiv.className = 'alert alert-success alert-dismissible fade show';
            successDiv.innerHTML = `
              <div class="d-flex">
                <div class="me-3">
                  <i class="bi bi-check-circle-fill fs-4"></i>
                </div>
                <div>
                  <strong>Success!</strong> Your job has been ${isEditMode ? 'updated' : 'posted'}.
                  <div class="text-muted small mt-1">The job listing is now live and visible to applicants.</div>
                </div>
              </div>
              <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            `;
            
            formAlerts.appendChild(successDiv);
            
            // Reset the form 
            form.reset();
            
            // Set a timer to hide the alert and close the modal
            setTimeout(() => {
              // Close the modal
              closeJobFormModal();
              successDiv.remove();
            }, 3000);
            
            fetchEmployerJobs(); // Refresh jobs list
          } else {
            // Show error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-danger alert-dismissible fade show';
            errorDiv.innerHTML = `
              <div class="d-flex">
                <div class="me-3">
                  <i class="bi bi-exclamation-triangle-fill fs-4"></i>
                </div>
                <div>
                  <strong>Error!</strong> ${response.data.message || `Failed to ${isEditMode ? 'update' : 'post'} job.`} 
                  <div class="text-muted small mt-1">Please try again or contact support if the issue persists.</div>
                </div>
              </div>
              <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            `;
            
            formAlerts.appendChild(errorDiv);
            
            // Remove error message after 5 seconds
            setTimeout(() => errorDiv.remove(), 5000);
          }
        } catch (error) {
          console.error(`Error ${isEditMode ? 'updating' : 'submitting'} job:`, error);
          
          // Reset button state
          submitBtn.disabled = false;
          submitSpinner.classList.add('d-none');
          submitText.innerText = isEditMode ? 'Update Job' : 'Post Job';
          
          // Remove loading alert if it exists
          const loadingAlert = document.querySelector('#form-alerts .alert-info');
          if (loadingAlert) loadingAlert.remove();
          
          // Get form alerts container
          const formAlerts = document.getElementById('form-alerts');
          
          // Show detailed error message
          const errorDiv = document.createElement('div');
          errorDiv.className = 'alert alert-danger alert-dismissible fade show';
          errorDiv.innerHTML = `
            <div class="d-flex">
              <div class="me-3">
                <i class="bi bi-exclamation-triangle-fill fs-4"></i>
              </div>
              <div>
                <strong>Error!</strong> ${error.response?.data?.message || error.message || `Failed to ${isEditMode ? 'update' : 'submit'} job posting.`} 
                <div class="text-muted small mt-1">
                  ${error.response?.status ? `Server returned status code: ${error.response.status}` : 'Please check your connection and try again.'}
                </div>
              </div>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
          `;
          
          formAlerts.appendChild(errorDiv);
          
          // Shake button slightly to indicate error
          submitBtn.classList.add('button-shake');
          setTimeout(() => submitBtn.classList.remove('button-shake'), 500);
          
          // Remove error message after 6 seconds
          setTimeout(() => errorDiv.remove(), 6000);
        }
      }
      form.classList.add('was-validated');
    });
  }
  
  // Note: We use the imported getUserId() function from auth-utils.js instead of duplicating functionality

  // Helper function to determine badge color based on job type
  function getBadgeColor(jobType) {
    if (!jobType) return 'secondary';
    
    switch(jobType.toLowerCase()) {
      case 'full-time':
        return 'success';
      case 'part-time':
        return 'info';
      case 'remote':
        return 'primary';
      case 'contract':
        return 'warning';
      case 'internship':
        return 'purple';
      default:
        return 'secondary';
    }
  }

  // Function to fetch jobs posted by this employer
  async function fetchEmployerJobs() {
    try {
      const token = localStorage.getItem('token');
      const userId = getUserId(); // Using the imported getUserId function from auth-utils.js
      
      if (!userId) {
        console.error('Could not determine user ID from token');
        myJobsContainer.innerHTML = `<div class="alert alert-warning">Could not verify your identity. Please try logging in again.</div>`;
        return;
      }
      
      // Show loading state
      myJobsContainer.innerHTML = `
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>`;
      
      // Try to fetch only this employer's jobs first if API supports filtering
      let response;
      
      try {
        // First try to use the API's filter by user endpoint if it exists
        response = await axios.get(
          `https://web-backend-7aux.onrender.com/api/v1/jobs?recruiter=${userId}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
      } catch (filterError) {
        console.log('Direct filter by user not supported by API, fetching all jobs instead');
        // Fallback to fetching all jobs if the filtered endpoint is not supported
        response = await axios.get(
          'https://web-backend-7aux.onrender.com/api/v1/jobs',
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
      }
      
      if (response.data && response.data.success) {
        const allJobs = response.data.data;
        
        console.log(`Total jobs fetched: ${allJobs.length}, Current user ID: ${userId}`);
        
        // Filter jobs to show only those posted by current recruiter
        const employerJobs = allJobs.filter(job => {
          // Log the first few jobs to debug job structure format
          if (allJobs.indexOf(job) < 3) {
            console.log(`Job ID: ${job._id}, Title: ${job.title}`);
            if (job.recruiter) {
              console.log(`Recruiter: ${job.recruiter._id}, Name: ${job.recruiter.name}, Email: ${job.recruiter.email}`);
            }
          }
          
          // Check if job has a recruiter object with matching ID
          if (job.recruiter && job.recruiter._id === userId) {
            return true;
          }
          
          // Legacy checks for older API formats
          if (job.createdBy === userId || job.user_id === userId) {
            return true;
          }
          
          // Check nested creator objects
          if (job.creator && (job.creator.id === userId || job.creator._id === userId)) {
            return true;
          }
          
          // Match by email if available
          const userEmail = localStorage.getItem('userEmail');
          if (userEmail && job.recruiter && job.recruiter.email === userEmail) {
            return true;
          }
          
          return false;
        });
        
        console.log(`Filtered jobs for this recruiter: ${employerJobs.length}`);
        
        // Display the filtered jobs
        displayEmployerJobs(employerJobs);
      } else {
        myJobsContainer.innerHTML = `<div class="alert alert-warning">Failed to load your posted jobs.</div>`;
      }
    } catch (error) {
      console.error('Error fetching employer jobs:', error);
      myJobsContainer.innerHTML = `<div class="alert alert-danger">Error loading your jobs. Please try again later.</div>`;
    }
  }
  
  // Function to display employer jobs
  function displayEmployerJobs(jobs) {
    if (!jobs || jobs.length === 0) {
      myJobsContainer.innerHTML = `
        <div class="card border-0 shadow-sm p-4 text-center">
          <div class="py-4 py-md-5">
            <i class="bi bi-clipboard-x text-secondary" style="font-size: 3rem;"></i>
            <h5 class="mt-3">No Jobs Posted Yet</h5>
            <p class="text-muted">You haven't posted any job listings yet.</p>
            <button class="btn btn-outline-primary mt-2" onclick="document.getElementById('new-job-btn').click()">
              <i class="bi bi-plus-circle me-2"></i> Post Your First Job
            </button>
          </div>
        </div>`;
      return;
    }
    
    // Add summary at the top
    let html = `
      <div class="alert alert-info mb-3 mb-md-4">
        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center job-summary-container">
          <div>
            <strong><i class="bi bi-info-circle-fill me-2"></i> Job Postings Summary</strong>
            <p class="mb-0 mt-1">You have ${jobs.length} active job ${jobs.length === 1 ? 'posting' : 'postings'}</p>
          </div>
          <div>
            <span class="badge bg-primary rounded-pill">${jobs.length}</span>
          </div>
        </div>
      </div>`;
      
    // Add search and filter bar for better usability
    html += `
      <div class="filter-bar mb-4">
        <div class="row g-2 align-items-center">
          <div class="col-12 col-md-6">
            <div class="input-group">
              <span class="input-group-text bg-transparent border-end-0">
                <i class="bi bi-search text-muted"></i>
              </span>
              <input type="text" id="job-search" class="form-control border-start-0 ps-0" placeholder="Search job postings...">
            </div>
          </div>
          <div class="col-12 col-md-6">
            <div class="d-flex gap-2 justify-content-md-end">
              <select id="job-type-filter" class="form-select w-auto">
                <option value="all">All Job Types</option>
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
                <option value="remote">Remote</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
              <select id="job-sort" class="form-select w-auto">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="expiry">Expiry Date</option>
              </select>
            </div>
          </div>
        </div>
      </div>`;
    
    // Card view with horizontal layout for desktop and vertical for mobile
    html += `<div class="row job-cards-container">`;
    
    // Process each job
    jobs.forEach(job => {
      const postedDate = new Date(job.createdAt || Date.now()).toLocaleDateString();
      const expiryDate = job.expiresAt ? new Date(job.expiresAt).toLocaleDateString() : 'Never';
      
      // Check if this job is currently being edited
      const isCurrentlyEditing = isEditMode && currentEditJobId === job._id;
      
      // Format job type display - capitalize first letter
      const formattedJobType = job.jobType ? job.jobType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '';
      
      // Calculate days remaining until expiry
      let daysRemaining = '';
      let expiryBadgeClass = 'bg-light text-dark';
      
      if (job.expiresAt) {
        const today = new Date();
        const expiryDay = new Date(job.expiresAt);
        const diffTime = expiryDay - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        daysRemaining = diffDays;
        
        // Color the badge based on how close to expiry
        if (diffDays < 0) {
          expiryBadgeClass = 'bg-danger text-white';
        } else if (diffDays < 7) {
          expiryBadgeClass = 'bg-warning text-dark';
        } else if (diffDays < 30) {
          expiryBadgeClass = 'bg-info text-white';
        }
      }
      
      const expiryLabel = daysRemaining ? 
        `${expiryDate} <span class="badge ${expiryBadgeClass}">${daysRemaining} days left</span>` : 
        expiryDate;
      
      html += `
        <div class="col-12 mb-4">
          <div class="card job-card ${isCurrentlyEditing ? 'editing' : ''}" 
              data-job-id="${job._id}" 
              data-posted-date="${job.createdAt || Date.now()}" 
              data-expiry="${job.expiresAt || ''}"
              data-job-type="${job.jobType || ''}">
            <div class="card-body">
              <div class="row">
                <div class="col-12 col-md-8">
                  <div class="d-flex flex-column h-100">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                      <h5 class="card-title mb-1">${job.title}</h5>
                      <span class="badge bg-${getBadgeColor(job.jobType)}">${formattedJobType}</span>
                    </div>
                    <h6 class="card-subtitle mb-3 text-muted">${job.companyName}</h6>
                    
                    <div class="job-card-details">
                      <div class="row mb-3">
                        <div class="col-12 col-md-4 mb-2 mb-md-0">
                          <small class="text-muted d-flex align-items-center">
                            <i class="bi bi-geo-alt me-2"></i> ${job.location}
                          </small>
                        </div>
                        ${job.category ? `
                        <div class="col-12 col-md-4 mb-2 mb-md-0">
                          <small class="text-muted d-flex align-items-center">
                            <i class="bi bi-folder me-2"></i> ${job.category}
                          </small>
                        </div>
                        ` : ''}
                        ${job.salaryRange ? `
                        <div class="col-12 col-md-4 mb-2 mb-md-0">
                          <small class="text-muted d-flex align-items-center">
                            <i class="bi bi-cash-stack me-2"></i> ${job.salaryRange}
                          </small>
                        </div>
                        ` : ''}
                      </div>
                      <div class="job-dates mb-3">
                        <div class="d-flex flex-column flex-sm-row gap-3 small">
                          <div>
                            <i class="bi bi-calendar3 me-2"></i> Posted: ${postedDate}
                          </div>
                          <div>
                            <i class="bi bi-calendar-x me-2"></i> Expires: ${expiryLabel}
                          </div>
                        </div>
                      </div>
                      <div class="job-description mb-3">
                        <p class="text-truncate-3 mb-0">${job.description ? job.description.substring(0, 250) + '...' : 'No description provided.'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="col-12 col-md-4 d-flex flex-column justify-content-center">
                  <div class="action-buttons-container d-flex flex-row flex-md-column gap-2 justify-content-end">
                    <a href="job-details.html?id=${job._id}" class="btn btn-outline-primary">
                      <i class="bi bi-eye me-1"></i> <span>View Details</span>
                    </a>
                    <button class="btn btn-outline-secondary" onclick="editJob('${job._id}')">
                      <i class="bi bi-pencil me-1"></i> <span>Edit Job</span>
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteJob('${job._id}')">
                      <i class="bi bi-trash me-1"></i> <span>Delete Job</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>`;
    });
    
    html += `</div>`;
    
    myJobsContainer.innerHTML = html;
  }
  
  // Initialize by fetching employer jobs
  fetchEmployerJobs();
  
  // Add event listeners for search and filter functionality
  document.addEventListener('DOMContentLoaded', function() {
    // Set up search functionality
    const searchInput = document.getElementById('job-search');
    if (searchInput) {
      searchInput.addEventListener('input', filterJobs);
    }
    
    // Set up job type filter
    const typeFilter = document.getElementById('job-type-filter');
    if (typeFilter) {
      typeFilter.addEventListener('change', filterJobs);
    }
    
    // Set up sorting
    const sortSelect = document.getElementById('job-sort');
    if (sortSelect) {
      sortSelect.addEventListener('change', filterJobs);
    }
  });
  
  // Function to filter and sort jobs
  function filterJobs() {
    const searchInput = document.getElementById('job-search');
    const typeFilter = document.getElementById('job-type-filter');
    const sortSelect = document.getElementById('job-sort');
    
    // Get all job cards
    const jobCards = document.querySelectorAll('.job-card');
    if (!jobCards.length) return;
    
    // Get filter values
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const jobType = typeFilter ? typeFilter.value : 'all';
    const sortBy = sortSelect ? sortSelect.value : 'newest';
    
    // Get parent container
    const container = document.querySelector('.job-cards-container');
    if (!container) return;
    
    // Array to hold filtered cards
    let filteredCards = Array.from(jobCards);
    
    // Filter by search term
    if (searchTerm) {
      filteredCards = filteredCards.filter(card => {
        const title = card.querySelector('.card-title')?.textContent?.toLowerCase() || '';
        const company = card.querySelector('.card-subtitle')?.textContent?.toLowerCase() || '';
        const location = card.querySelector('.bi-geo-alt')?.parentElement?.textContent?.toLowerCase() || '';
        const description = card.querySelector('.job-description')?.textContent?.toLowerCase() || '';
        return title.includes(searchTerm) || company.includes(searchTerm) || 
               location.includes(searchTerm) || description.includes(searchTerm);
      });
    }
    
    // Filter by job type
    if (jobType !== 'all') {
      filteredCards = filteredCards.filter(card => {
        const badge = card.querySelector('.badge');
        if (!badge) return false;
        
        const type = badge.textContent.toLowerCase().replace(/\s/g, '-');
        return type === jobType;
      });
    }
    
    // Sort the cards
    filteredCards.sort((a, b) => {
      if (sortBy === 'newest') {
        const dateA = a.getAttribute('data-posted-date') || '';
        const dateB = b.getAttribute('data-posted-date') || '';
        return new Date(dateB) - new Date(dateA);
      } else if (sortBy === 'oldest') {
        const dateA = a.getAttribute('data-posted-date') || '';
        const dateB = b.getAttribute('data-posted-date') || '';
        return new Date(dateA) - new Date(dateB);
      } else if (sortBy === 'expiry') {
        const expiryA = a.getAttribute('data-expiry') || '9999-12-31';
        const expiryB = b.getAttribute('data-expiry') || '9999-12-31';
        return new Date(expiryA) - new Date(expiryB);
      }
      return 0;
    });
    
    // Update the display
    const cols = document.querySelectorAll('.job-cards-container .col-12');
    
    // If no cards are found
    if (filteredCards.length === 0) {
      container.innerHTML = `
        <div class="col-12">
          <div class="alert alert-warning text-center py-4">
            <i class="bi bi-search me-2"></i>
            No jobs match your filters. Try different search terms.
            <button class="btn btn-sm btn-outline-primary d-block mx-auto mt-2" onclick="resetFilters()">
              Reset Filters
            </button>
          </div>
        </div>
      `;
      return;
    }

    // Hide all cards first
    cols.forEach(col => {
      col.style.display = 'none';
    });
    
    // Show only filtered cards
    filteredCards.forEach(card => {
      const parentCol = card.closest('.col-12');
      if (parentCol) {
        parentCol.style.display = 'block';
      }
    });
  }
  
  // Function to reset filters
  window.resetFilters = function() {
    const searchInput = document.getElementById('job-search');
    const typeFilter = document.getElementById('job-type-filter');
    const sortSelect = document.getElementById('job-sort');
    
    if (searchInput) searchInput.value = '';
    if (typeFilter) typeFilter.value = 'all';
    if (sortSelect) sortSelect.value = 'newest';
    
    // Reset all cards
    const cols = document.querySelectorAll('.job-cards-container .col-12');
    cols.forEach(col => {
      col.style.display = 'block';
    });
  }
  
  // Add deleteJob function to window for button click access
  window.deleteJob = async function(jobId) {
    if (!confirm('Are you sure you want to delete this job posting?')) {
      return;
    }
    
    // Find job card elements
    const jobElements = document.querySelectorAll(`.job-card[data-job-id="${jobId}"]`);
    
    // Process all matching job cards
    jobElements.forEach(el => {
      // Apply deletion visual state
      el.classList.add('deleting');
      const buttonContainer = el.querySelector('.d-flex.justify-content-end');
      if (buttonContainer) {
        buttonContainer.innerHTML = `
          <div class="d-flex align-items-center w-100 justify-content-center">
            <div class="spinner-border spinner-border-sm text-secondary me-2" role="status">
              <span class="visually-hidden">Deleting...</span>
            </div>
            <span>Deleting job...</span>
          </div>
        `;
      }
    });
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `https://web-backend-7aux.onrender.com/api/v1/jobs/${jobId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (response.data && response.data.success) {
        // Create and show success toast notification
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
              Job deleted successfully.
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
        
        fetchEmployerJobs(); // Refresh jobs list
      } else {
        // Handle error in card view
        const jobElements = document.querySelectorAll(`.job-card[data-job-id="${jobId}"]`);
        jobElements.forEach(el => {
          // Card error handling with animation
          el.style.opacity = '1';
          el.classList.add('border-danger');
          el.classList.add('shake-animation');
          
          // Remove error styling after animation
          setTimeout(() => {
            el.classList.remove('border-danger');
            el.classList.remove('shake-animation');
          }, 2000);
          
          // Re-render the card by refreshing all jobs
          setTimeout(() => fetchEmployerJobs(), 2100);
        });
        
        // Show error toast instead of alert for better mobile experience
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
              Error deleting job: ${response.data.message || 'Unknown error'}
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
    } catch (error) {
      console.error('Error deleting job:', error);
      
      // Handle error in card view
      const jobElements = document.querySelectorAll(`.job-card[data-job-id="${jobId}"]`);
      jobElements.forEach(el => {
        // Card error handling with animation
        el.classList.remove('deleting');
        el.classList.add('border-danger');
        el.classList.add('shake-animation');
        
        // Remove error styling after animation
        setTimeout(() => {
          el.classList.remove('border-danger');
          el.classList.remove('shake-animation');
        }, 2000);
        
        // Restore buttons
        const buttonContainer = el.querySelector('.d-flex.justify-content-center');
        if (buttonContainer) {
          buttonContainer.innerHTML = `
            <a href="job-details.html?id=${jobId}" class="btn btn-outline-primary me-2">
              <i class="bi bi-eye me-1"></i> <span class="d-none d-sm-inline">View</span>
            </a>
            <button class="btn btn-outline-danger" onclick="deleteJob('${jobId}')">
              <i class="bi bi-trash me-1"></i> <span class="d-none d-sm-inline">Delete</span>
            </button>
          `;
        }
      });
      
      // Show error toast instead of alert for better mobile experience
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
            Failed to delete job: ${error.response?.data?.message || error.message || 'Unknown error'}
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
  
  // Add editJob function to window for button click access
  window.editJob = async function(jobId) {
    try {
      // Set edit mode state
      isEditMode = true;
      currentEditJobId = jobId;
      
      // Get job data by ID
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `https://web-backend-7aux.onrender.com/api/v1/jobs/${jobId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (response.data && response.data.success) {
        const job = response.data.data;
        
        // Update form title
        const formTitle = document.querySelector('.job-modal-content h2');
        if (formTitle) {
          formTitle.innerHTML = '<i class="bi bi-pencil-square me-2"></i> Edit Job Posting';
        }
        
        // Update submit button text
        const submitText = document.getElementById('submit-text');
        if (submitText) {
          submitText.innerText = 'Update Job';
        }
        
        // Populate the form fields
        document.getElementById('jobTitle').value = job.title || '';
        document.getElementById('company').value = job.companyName || '';
        document.getElementById('location').value = job.location || '';
        document.getElementById('type').value = job.jobType || '';
        document.getElementById('summary').value = job.description || '';
        
        if (document.getElementById('category')) {
          document.getElementById('category').value = job.category || '';
        }
        
        if (document.getElementById('salaryRange')) {
          document.getElementById('salaryRange').value = job.salaryRange || '';
        }
        
        // Handle expiry date formatting
        if (document.getElementById('expiresAt') && job.expiresAt) {
          // Convert to YYYY-MM-DD format for input[type="date"]
          const expiryDate = new Date(job.expiresAt);
          const formattedDate = expiryDate.toISOString().split('T')[0];
          document.getElementById('expiresAt').value = formattedDate;
        }
        
        // Show the modal
        jobFormModal.style.display = 'flex';
        
        // Add event listener for closing modal by clicking outside
        jobFormModal.addEventListener('click', function(e) {
          if (e.target === this) {
            closeJobFormModal();
          }
        });
        
        // Block scrolling on the body
        document.body.style.overflow = 'hidden';
        
        // Add a small animation highlight to the form to indicate it's in edit mode
        const modalContent = document.querySelector('.auth-modal.job-form-modal');
        if (modalContent) {
          modalContent.classList.add('edit-mode-highlight');
          setTimeout(() => {
            modalContent.classList.remove('edit-mode-highlight');
          }, 1500);
        }
        
      } else {
        showToast('Error', 'Failed to load job details. Please try again.', 'danger');
      }
    } catch (error) {
      console.error('Error loading job for edit:', error);
      showToast('Error', 'Could not load job details: ' + (error.response?.data?.message || error.message), 'danger');
    }
  };
  
  // Setup event listener for ESC key to close the modal
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && jobFormModal.style.display === 'flex') {
      closeJobFormModal();
    }
  });
});
