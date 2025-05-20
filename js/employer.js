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
  
  // UI Elements
  const jobFormContainer = document.getElementById('job-form-container');
  const newJobBtn = document.getElementById('new-job-btn');
  const closeFormBtn = document.getElementById('close-form-btn');
  const myJobsContainer = document.getElementById('my-jobs-container');
  
  // Toggle job form visibility
  if (newJobBtn) {
    newJobBtn.addEventListener('click', () => {
      jobFormContainer.style.display = 'block';
      window.scrollTo({ top: jobFormContainer.offsetTop, behavior: 'smooth' });
    });
  }
  
  if (closeFormBtn) {
    closeFormBtn.addEventListener('click', () => {
      jobFormContainer.style.display = 'none';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Initialize the form for job posting
  const form = document.getElementById('post-job-form');
  if (form) {
    form.addEventListener('submit', async function(event) {
      event.preventDefault();
      if (!form.checkValidity()) {
        event.stopPropagation();
      } else {
        // Get form values
        const jobTitle = document.getElementById('jobTitle').value;
        const company = document.getElementById('company').value;
        const location = document.getElementById('location').value;
        const jobType = document.getElementById('type').value;
        const description = document.getElementById('summary').value;
        
        try {
          const token = localStorage.getItem('token');
          // Submit job posting to API
          const response = await axios.post(
            'https://web-backend-7aux.onrender.com/api/v1/jobs',
            {
              title: jobTitle,
              companyName: company,
              location: location,
              jobType: jobType,
              description: description
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            }
          );
          
          if (response.data && response.data.success) {
            // Create a success message that disappears after 3 seconds
            const successDiv = document.createElement('div');
            successDiv.className = 'alert alert-success alert-dismissible fade show';
            successDiv.innerHTML = `
              <strong>Success!</strong> Your job has been posted.
              <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            `;
            
            form.prepend(successDiv);
            
            // Reset the form and hide it
            form.reset();
            
            // Set a timer to hide the alert and form
            setTimeout(() => {
              successDiv.remove();
              jobFormContainer.style.display = 'none';
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 3000);
            
            fetchEmployerJobs(); // Refresh jobs list
          } else {
            // Show error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-danger alert-dismissible fade show';
            errorDiv.innerHTML = `
              <strong>Error!</strong> ${response.data.message || 'Failed to post job.'} 
              <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            `;
            
            form.prepend(errorDiv);
            
            // Remove error message after 5 seconds
            setTimeout(() => errorDiv.remove(), 5000);
          }
        } catch (error) {
          console.error('Error submitting job:', error);
          
          // Show detailed error message
          const errorDiv = document.createElement('div');
          errorDiv.className = 'alert alert-danger alert-dismissible fade show';
          errorDiv.innerHTML = `
            <strong>Error!</strong> ${error.response?.data?.message || error.message || 'Failed to submit job posting.'} 
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
          `;
          
          form.prepend(errorDiv);
          
          // Remove error message after 5 seconds
          setTimeout(() => errorDiv.remove(), 5000);
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
          <div class="py-5">
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
    
    let html = `<div class="table-responsive">
      <table class="table table-hover">
        <thead>
          <tr>
            <th>Job Title</th>
            <th>Company</th>
            <th>Location</th>
            <th>Type</th>
            <th>Posted Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>`;
    
    jobs.forEach(job => {
      const postedDate = new Date(job.createdAt || Date.now()).toLocaleDateString();
      // Format job type display - capitalize first letter and handle full-time format
      const formattedJobType = job.jobType ? job.jobType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '';
      
      html += `
        <tr data-job-id="${job._id}">
          <td>${job.title}</td>
          <td>${job.companyName}</td>
          <td>${job.location}</td>
          <td><span class="badge bg-${getBadgeColor(job.jobType)}">${formattedJobType}</span></td>
          <td>${postedDate}</td>
          <td>
            <a href="job-details.html?id=${job._id}" class="btn btn-sm btn-outline-primary me-1" title="View">
              <i class="bi bi-eye"></i>
            </a>
            <button class="btn btn-sm btn-outline-danger" title="Delete" onclick="deleteJob('${job._id}')">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>`;
    });
    
    html += `</tbody>
      </table>
    </div>`;
    
    myJobsContainer.innerHTML = html;
  }
  
  // Initialize by fetching employer jobs
  fetchEmployerJobs();
  
  // Add deleteJob function to window for button click access
  window.deleteJob = async function(jobId) {
    if (!confirm('Are you sure you want to delete this job posting?')) {
      return;
    }
    
    // Find the job row and add loading state
    const jobRow = document.querySelector(`[data-job-id="${jobId}"]`);
    if (jobRow) {
      jobRow.classList.add('table-secondary');
      const actionCell = jobRow.querySelector('td:last-child');
      if (actionCell) {
        const originalContent = actionCell.innerHTML;
        actionCell.innerHTML = `
          <div class="d-flex align-items-center">
            <div class="spinner-border spinner-border-sm text-secondary me-2" role="status">
              <span class="visually-hidden">Deleting...</span>
            </div>
            <span>Deleting...</span>
          </div>
        `;
      }
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `https://web-backend-7aux.onrender.com/api/v1/jobs/${jobId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (response.data && response.data.success) {
        // Add a status message at the top of the jobs container
        const statusDiv = document.createElement('div');
        statusDiv.className = 'alert alert-success alert-dismissible fade show';
        statusDiv.innerHTML = `
          <strong>Success!</strong> Job deleted successfully.
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        myJobsContainer.prepend(statusDiv);
        
        // Remove the message after a few seconds
        setTimeout(() => statusDiv.remove(), 3000);
        
        fetchEmployerJobs(); // Refresh jobs list
      } else {
        if (jobRow) {
          jobRow.classList.remove('table-secondary');
          // Restore original content and add error indicators
          jobRow.classList.add('table-danger');
          setTimeout(() => jobRow.classList.remove('table-danger'), 2000);
        }
        alert('Error deleting job: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      
      if (jobRow) {
        jobRow.classList.remove('table-secondary');
        // Restore original content and add error indicators
        jobRow.classList.add('table-danger');
        setTimeout(() => jobRow.classList.remove('table-danger'), 2000);
      }
      
      alert('Failed to delete job. ' + (error.response?.data?.message || error.message));
    }
  };
});
