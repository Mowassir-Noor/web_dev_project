/**
 * Profile Modal Responsive Behaviors
 * Enhancement script for improving the edit profile modal's
 * behavior on mobile and desktop devices
 */

document.addEventListener('DOMContentLoaded', function() {
  // Constants
  const ANIMATION_DURATION = 200; // ms
  
  // Elements
  const modalBackdrop = document.getElementById('edit-profile-modal-backdrop');
  const modalCloseBtn = document.getElementById('edit-profile-modal-close');
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  const editProfileForm = document.getElementById('edit-profile-form');
  const modal = document.querySelector('.profile-edit-modal');
  
  // Function to close the modal
  function closeModal() {
    if (modalBackdrop) {
      modalBackdrop.style.display = 'none';
    }
  }
  
  // Close modal when clicking the close button
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeModal);
  }
  
  // Close modal when clicking the cancel button
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', closeModal);
  }
  
  // Close modal when clicking outside (but not when clicking inside the modal)
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', function(e) {
      if (e.target === modalBackdrop) {
        closeModal();
      }
    });
  }
  
  // Add touch event listeners for mobile swipe (optional enhancement)
  if (modal) {
    let touchStartY = 0;
    let touchEndY = 0;
    
    modal.addEventListener('touchstart', function(e) {
      touchStartY = e.changedTouches[0].screenY;
    }, {passive: true});
    
    modal.addEventListener('touchend', function(e) {
      touchEndY = e.changedTouches[0].screenY;
      
      // Detect downward swipe (only when at the top of the modal content)
      const scrollTop = modal.scrollTop;
      const swipeDistance = touchEndY - touchStartY;
      
      if (scrollTop <= 5 && swipeDistance > 100) {
        // User swiped down from the top of the modal - close it
        closeModal();
      }
    }, {passive: true});
  }
  
  // Prevent scrolling of the background when modal is open
  function preventBackgroundScroll() {
    const modalOpen = modalBackdrop && modalBackdrop.style.display !== 'none';
    document.body.style.overflow = modalOpen ? 'hidden' : '';
  }
  
  // Watch for display changes on the modal backdrop
  if (modalBackdrop) {
    const observer = new MutationObserver(function() {
      preventBackgroundScroll();
    });
    
    observer.observe(modalBackdrop, { 
      attributes: true, 
      attributeFilter: ['style'] 
    });
  }
  
  // Add keyboard event handler for Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modalBackdrop && modalBackdrop.style.display !== 'none') {
      closeModal();
    }
  });
  
  // Improve mobile viewport behavior for better accessibility
  function updateModalMaxHeight() {
    if (!modal) return;
    
    // Get viewport height and update modal max-height
    const vh = window.innerHeight;
    modal.style.maxHeight = `${vh * 0.85}px`;
  }
  
  // Update on resize
  window.addEventListener('resize', updateModalMaxHeight);
  
  // Initial setup
  updateModalMaxHeight();
});
