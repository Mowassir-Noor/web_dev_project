// job-details.js
const mockJobs = [
  {id: 1, title: 'Frontend Developer', company: 'Acme Corp', location: 'New York, NY', type: 'Full-time', description: 'You will develop and maintain web interfaces using React and Bootstrap. Responsibilities include collaborating with designers and backend developers, ensuring responsive and accessible UI, and participating in code reviews.'},
  {id: 2, title: 'Data Analyst', company: 'DataWiz', location: 'Remote', type: 'Remote', description: 'Analyze business data, build reports, and provide meaningful insight for startup growth. Mastery of SQL and data visualization tools required.'},
  {id: 3, title: 'Project Manager', company: 'GlobalTech', location: 'Austin, TX', type: 'Full-time', description: 'Coordinate software projects, manage teams, and deliver results for major global clients. PMP certification a plus.'},
  {id: 4, title: 'Customer Support', company: 'Supportly', location: 'Denver, CO', type: 'Part-time', description: 'Assist customers with their inquiries and issues via phone, email, and chat. Must have excellent communication skills.'},
  {id: 5, title: 'UI/UX Designer', company: 'Designology', location: 'New York, NY', type: 'Full-time', description: 'Design beautiful and functional user interfaces for our mobile and web platforms. Portfolio required.'}
];
function getJobIdFromQuery() {
  const url = new URL(window.location.href);
  return parseInt(url.searchParams.get('id'));
}
function renderJobDetails(job) {
  if (!job) {
    $('#job-details').html('<div class="alert alert-danger">Job not found.</div>');
    return;
  }
  $('#job-details').html(`
    <div class="card">
      <div class="card-body">
        <h2 class="card-title mb-1">${job.title}</h2>
        <h5 class="card-subtitle mb-3 text-muted">${job.company} - ${job.location}</h5>
        <span class="badge bg-secondary mb-2">${job.type}</span>
        <p class="card-text mt-3 mb-3">${job.description}</p>
        <a href="#" class="btn btn-primary">Apply Now</a>
        <a href="jobs.html" class="btn-back-jobs">Back to jobs</a>
      </div>
    </div>
  `);
}
$(document).ready(function() {
  const jobId = getJobIdFromQuery();
  const job = mockJobs.find(j => j.id === jobId);
  renderJobDetails(job);
});
