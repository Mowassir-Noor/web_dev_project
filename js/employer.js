// employer.js
(() => {
  'use strict';
  const form = document.getElementById('post-job-form');
  if (form) {
    form.addEventListener('submit', function(event) {
      event.preventDefault();
      if (!form.checkValidity()) {
        event.stopPropagation();
      } else {
        alert('Job posted! (Mock submission)');
        form.reset();
      }
      form.classList.add('was-validated');
    }, false);
  }
})();
