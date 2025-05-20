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
    // Store the current filter values before we clear the container
    const currentSearchEl = document.getElementById('job-search');
    const currentTypeEl = document.getElementById('job-type-filter');
    const currentSortEl = document.getElementById('job-sort');
    
    // Save filter values to window object to restore them later
    window.lastSearchValue = currentSearchEl ? currentSearchEl.value : '';
    window.lastFilterValue = currentTypeEl ? currentTypeEl.value : 'all';
    window.lastSortValue = currentSortEl ? currentSortEl.value : 'newest';
    
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
                    <button class="btn btn-outline-info" onclick="viewApplicants('${job._id}', '${job.title?.replace(/'/g, "\\'")}', '${job.companyName?.replace(/'/g, "\\'")}')">
                      <i class="bi bi-people me-1"></i> <span>View Applicants</span>
                    </button>
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
    
    // Set up filter and search listeners after the jobs are displayed
    setupFilterListeners();
    
    // Restore filter values if they exist
    if (window.lastSearchValue || window.lastFilterValue || window.lastSortValue) {
      const searchInput = document.getElementById('job-search');
      const typeFilter = document.getElementById('job-type-filter');
      const sortSelect = document.getElementById('job-sort');
      
      if (searchInput) searchInput.value = window.lastSearchValue || '';
      if (typeFilter) typeFilter.value = window.lastFilterValue || 'all';
      if (sortSelect) sortSelect.value = window.lastSortValue || 'newest';
      
      console.log('Restoring filters:', {
        search: window.lastSearchValue,
        type: window.lastFilterValue,
        sort: window.lastSortValue
      });
      
      // Apply the filters with a small delay to ensure DOM is ready
      setTimeout(() => filterJobs(), 100);
    }
  }
  
  // Initialize by fetching employer jobs
  fetchEmployerJobs();
  
  // Add event listeners for search and filter functionality
  // Using a function to set up listeners after jobs are displayed
  function setupFilterListeners() {
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
  }
  
  // Function to filter and sort jobs
  function filterJobs() {
    console.log("Running filterJobs function");
    const searchInput = document.getElementById('job-search');
    const typeFilter = document.getElementById('job-type-filter');
    const sortSelect = document.getElementById('job-sort');
    
    // Get all job cards
    const jobCards = document.querySelectorAll('.job-card');
    console.log(`Found ${jobCards.length} job cards total`);
    
    // Debug the first card's content
    if (jobCards.length > 0) {
      const firstCard = jobCards[0];
      console.log('Sample card data:', {
        id: firstCard.getAttribute('data-job-id'),
        title: firstCard.querySelector('.card-title')?.textContent,
        hasCardBody: !!firstCard.querySelector('.card-body'),
        hasCardTitle: !!firstCard.querySelector('.card-title'),
        hasDescription: !!firstCard.querySelector('.job-description p')
      });
    }
    
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
      console.log(`Filtering by search term: "${searchTerm}"`);
      filteredCards = filteredCards.filter(card => {
        // Debug info to see what we're extracting
        const title = card.querySelector('.card-title')?.textContent?.toLowerCase() || '';
        const company = card.querySelector('.card-subtitle')?.textContent?.toLowerCase() || '';
        const location = card.querySelector('.bi-geo-alt')?.parentElement?.textContent?.toLowerCase() || '';
        const description = card.querySelector('.job-description p')?.textContent?.toLowerCase() || '';
        
        const matches = title.includes(searchTerm) || 
                        company.includes(searchTerm) || 
                        location.includes(searchTerm) || 
                        description.includes(searchTerm);
        
        return matches;
      });
      console.log(`Found ${filteredCards.length} cards matching search term`);
    }
    
    // Filter by job type - updated for the new card layout
    if (jobType !== 'all') {
      filteredCards = filteredCards.filter(card => {
        // Get job type either from badge or data attribute
        const badge = card.querySelector('.badge');
        if (badge) {
          const type = badge.textContent.toLowerCase().replace(/\s/g, '-');
          return type === jobType;
        }
        
        // Fallback to data attribute if badge is not found
        const dataType = card.getAttribute('data-job-type');
        if (dataType) {
          return dataType.toLowerCase() === jobType;
        }
        
        return false;
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
      console.log("No cards match the filter criteria");
      // Clear the container and show a message
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

    // Problem: when we filter, cards might be emptied or hidden incorrectly
    // Solution: Instead of manipulating existing cards, let's rebuild the container completely
    
    if (filteredCards.length > 0) {
      console.log(`Showing ${filteredCards.length} filtered cards`);
      
      // First, preserve all the original cards and their parent columns
      const originalCards = [];
      jobCards.forEach(card => {
        const jobId = card.getAttribute('data-job-id');
        if (jobId) {
          const parentCol = card.closest('.col-12');
          if (parentCol) {
            originalCards.push({
              id: jobId,
              card: card,
              parent: parentCol,
              html: parentCol.outerHTML
            });
          }
        }
      });
      
      // Clear the container
      container.innerHTML = '';
      
      // Add back only the filtered cards
      filteredCards.forEach(card => {
        const jobId = card.getAttribute('data-job-id');
        const original = originalCards.find(o => o.id === jobId);
        if (original) {
          // Add the original HTML back to the container
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = original.html;
          const newCol = tempDiv.firstChild;
          container.appendChild(newCol);
        }
      });
      
      console.log(`Container now has ${container.children.length} cards`);
    } else {
      // No cards matched filters
      cols.forEach(col => {
        col.style.display = 'none';
      });
    }
  }
  
  // Function to reset filters
  window.resetFilters = function() {
    console.log("Resetting all filters");
    
    // Clear saved filter values
    window.lastSearchValue = '';
    window.lastFilterValue = 'all';
    window.lastSortValue = 'newest';
    
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
      
      // Ensure card content is visible
      const card = col.querySelector('.job-card');
      if (card) {
        card.style.opacity = '1';
        card.style.visibility = 'visible';
      }
    });
    
    // Force page to reflow
    document.querySelector('.job-cards-container').offsetHeight;
    
    console.log(`Reset complete, showing ${cols.length} cards`);
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
      const buttonContainer = el.querySelector('.action-buttons-container');
      if (buttonContainer) {
        buttonContainer.innerHTML = `
          <div class="d-flex align-items-center justify-content-center p-3">
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
        
        fetchEmployerJobs(); // Refresh jobs list and filter will be set up after display
      } else {
        // Handle error in card view
        const jobElements = document.querySelectorAll(`.job-card[data-job-id="${jobId}"]`);
        jobElements.forEach(el => {
          // Card error handling with animation
          el.style.opacity = '1';
          el.classList.remove('deleting');
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
        
        // Restore buttons - updated selector for the new horizontal card layout
        const buttonContainer = el.querySelector('.action-buttons-container');
        if (buttonContainer) {
          // Find the title and company to pass to viewApplicants
          let jobTitle = "Job";
          let companyName = "";
          const titleEl = el.querySelector('.card-title');
          const companyEl = el.querySelector('.card-subtitle');
          
          if (titleEl) jobTitle = titleEl.textContent;
          if (companyEl) companyName = companyEl.textContent;
          
          buttonContainer.innerHTML = `
            <a href="job-details.html?id=${jobId}" class="btn btn-outline-primary">
              <i class="bi bi-eye me-1"></i> <span>View Details</span>
            </a>
            <button class="btn btn-outline-info" onclick="viewApplicants('${jobId}', '${jobTitle}', '${companyName}')">
              <i class="bi bi-people me-1"></i> <span>View Applicants</span>
            </button>
            <button class="btn btn-outline-secondary" onclick="editJob('${jobId}')">
              <i class="bi bi-pencil me-1"></i> <span>Edit Job</span>
            </button>
            <button class="btn btn-outline-danger" onclick="deleteJob('${jobId}')">
              <i class="bi bi-trash me-1"></i> <span>Delete Job</span>
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
  
  // Applicants Modal Functionality
  document.addEventListener('DOMContentLoaded', () => {
    // UI Elements for applicants modal
    const applicantsModal = document.getElementById('applicants-modal');
    const closeApplicantsBtn = document.getElementById('close-applicants-btn');
    
    if (closeApplicantsBtn) {
      closeApplicantsBtn.addEventListener('click', () => {
        closeApplicantsModal();
      });
    }
    
    // Setup event listener for ESC key to close the applicants modal
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && applicantsModal && applicantsModal.style.display === 'flex') {
        closeApplicantsModal();
      }
    });

    // Function to close applicants modal
    function closeApplicantsModal() {
      if (applicantsModal) {
        applicantsModal.style.display = 'none';
        document.body.style.overflow = 'auto';
      }
    }
    
    // Add event listener for closing modal by clicking outside
    if (applicantsModal) {
      applicantsModal.addEventListener('click', function(e) {
        if (e.target === this) {
          closeApplicantsModal();
        }
      });
    }

  // Expose a global function to view applicants
  window.viewApplicants = async function(jobId, jobTitle, companyName) {
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
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `https://web-backend-7aux.onrender.com/api/v1/applications/job/${jobId}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        
        // Display applicants
        displayApplicants(response.data, jobId);
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
    }
    
    // Function to close the applicants modal from anywhere
    window.closeApplicantsModal = closeApplicantsModal;

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
          <li><a class="dropdown-item" href="#" onclick="filterApplicantsByStatus('accepted')">Accepted</a></li>
          <li><a class="dropdown-item" href="#" onclick="filterApplicantsByStatus('rejected')">Rejected</a></li>
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
    
    // Function to update applicant status
    window.updateApplicantStatus = async function(applicationId, jobId, newStatus) {
      try {
        const token = localStorage.getItem('token');
        
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
        `;
        document.body.appendChild(loadingToast);
        
        // Make API call to update status
        const response = await axios.patch(
          `https://web-backend-7aux.onrender.com/api/v1/applications/${applicationId}`,
          {
            status: newStatus
          },
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        
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
        
        // Fetch applicants again to refresh the data
        viewApplicants(jobId);
        
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
    }
    
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
    }
    
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
    }
  });
});
