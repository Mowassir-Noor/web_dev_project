// jobs.js
// Mock job data and functions for Kariyerim job listings page
const mockJobs = [
  {id: 1, title: 'Frontend Developer', company: 'Acme Corp', location: 'New York, NY', type: 'Full-time', summary: 'Develop and maintain web interfaces using React.', link: 'job-details.html?id=1'},
  {id: 2, title: 'Data Analyst', company: 'DataWiz', location: 'Remote', type: 'Remote', summary: 'Analyze business data and build reports.', link: 'job-details.html?id=2'},
  {id: 3, title: 'Project Manager', company: 'GlobalTech', location: 'Austin, TX', type: 'Full-time', summary: 'Coordinate software projects and manage teams.', link: 'job-details.html?id=3'},
  {id: 4, title: 'Customer Support', company: 'Supportly', location: 'Denver, CO', type: 'Part-time', summary: 'Assist customers with inquiries and issues.', link: 'job-details.html?id=4'},
  {id: 5, title: 'UI/UX Designer', company: 'Designology', location: 'New York, NY', type: 'Full-time', summary: 'Design beautiful and functional user interfaces.', link: 'job-details.html?id=5'}
];

function renderJobs(jobs) {
  let jobsHtml = '';
  if (jobs.length === 0) {
    jobsHtml = '<div class="alert alert-info">No jobs found.</div>';
  } else {
    jobs.forEach(job => {
      // Use first letter of company as logo placeholder
      const logoLetter = job.company ? job.company[0].toUpperCase() : "?";
      jobsHtml += `
      <div class="col">
        <a href="${job.link}" class="job-card-link">
          <div class="job-card h-100">
            <div class="job-card-header">
              <div class="job-company-logo">${logoLetter}</div>
              <div>
                <div class="job-card-title">${job.title}</div>
                <div>
                  <span class="job-card-company">${job.company}</span>
                  <span class="job-card-location">${job.location}</span>
                </div>
              </div>
            </div>
            <div class="job-card-summary">${job.summary}</div>
            <div class="job-card-footer">
              <span class="badge job-type-badge">${job.type}</span>
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
  let filtered = mockJobs.filter(job =>
    (location ? job.location.toLowerCase().includes(location) : true) &&
    (type ? job.type === type : true) &&
    (search ? job.title.toLowerCase().includes(search) || job.company.toLowerCase().includes(search) : true)
  );
  renderJobs(filtered);
}
$(document).ready(function () {
  renderJobs(mockJobs);
  $('#filter-form').on('submit', function(e) {
    e.preventDefault();
    applyFilters();
  });
  $('#search-form').on('submit', function(e) {
    e.preventDefault();
    applyFilters();
  });
});
