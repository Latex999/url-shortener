/**
 * URL Shortener - Main JavaScript file
 */

document.addEventListener('DOMContentLoaded', function() {
  
  // Auto-dismiss alert messages after 5 seconds
  const alertMessages = document.querySelectorAll('.alert');
  if (alertMessages) {
    alertMessages.forEach(alert => {
      setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alert);
        bsAlert.close();
      }, 5000);
    });
  }
  
  // Copy to clipboard functionality
  const copyButtons = document.querySelectorAll('[data-copy]');
  if (copyButtons) {
    copyButtons.forEach(button => {
      button.addEventListener('click', function() {
        const textToCopy = this.getAttribute('data-copy');
        navigator.clipboard.writeText(textToCopy).then(() => {
          // Change button text temporarily
          const originalHTML = this.innerHTML;
          this.innerHTML = '<i class="fas fa-check"></i> Copied!';
          setTimeout(() => {
            this.innerHTML = originalHTML;
          }, 2000);
          
          // Show tooltip if available
          const tooltip = this.querySelector('.tooltiptext');
          if (tooltip) {
            tooltip.textContent = 'Copied!';
            setTimeout(() => {
              tooltip.textContent = 'Copy to clipboard';
            }, 2000);
          }
        }).catch(err => {
          console.error('Could not copy text: ', err);
        });
      });
    });
  }
  
  // Toggle password visibility
  const togglePasswordButtons = document.querySelectorAll('.toggle-password');
  if (togglePasswordButtons) {
    togglePasswordButtons.forEach(button => {
      button.addEventListener('click', function() {
        const passwordField = document.querySelector(this.getAttribute('data-target'));
        if (passwordField) {
          const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
          passwordField.setAttribute('type', type);
          
          // Toggle icon
          this.querySelector('i').classList.toggle('fa-eye');
          this.querySelector('i').classList.toggle('fa-eye-slash');
        }
      });
    });
  }
  
  // URL form validation
  const urlForm = document.querySelector('form[action="/urls/create"]');
  if (urlForm) {
    urlForm.addEventListener('submit', function(e) {
      const longUrl = document.getElementById('longUrl').value;
      const customCode = document.getElementById('customCode')?.value;
      
      // Validate URL
      if (longUrl && !isValidUrl(longUrl)) {
        e.preventDefault();
        alert('Please enter a valid URL (include http:// or https://)');
        return false;
      }
      
      // Validate custom code if provided
      if (customCode && !isValidCustomCode(customCode)) {
        e.preventDefault();
        alert('Custom code can only contain letters, numbers, hyphens, and underscores');
        return false;
      }
      
      return true;
    });
  }
  
  // URL helpers
  function isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }
  
  function isValidCustomCode(code) {
    return /^[a-zA-Z0-9-_]+$/.test(code);
  }
  
  // Add active class to current navigation item
  const currentPage = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });
  
  // API key generator
  const generateApiKeyButton = document.getElementById('generateApiKey');
  if (generateApiKeyButton) {
    generateApiKeyButton.addEventListener('click', function() {
      if (confirm('Generating a new API key will invalidate your existing key. Continue?')) {
        return true;
      } else {
        event.preventDefault();
        return false;
      }
    });
  }
  
  // Password strength meter
  const passwordInput = document.getElementById('password');
  const passwordStrengthMeter = document.getElementById('password-strength-meter');
  const passwordStrengthText = document.getElementById('password-strength-text');
  
  if (passwordInput && passwordStrengthMeter && passwordStrengthText) {
    passwordInput.addEventListener('input', function() {
      const password = this.value;
      const strength = calculatePasswordStrength(password);
      
      // Update the strength meter
      passwordStrengthMeter.value = strength.score;
      passwordStrengthText.textContent = strength.message;
      
      // Update color based on strength
      const colors = ['#f44336', '#ff9800', '#ffeb3b', '#8bc34a', '#4caf50'];
      passwordStrengthText.style.color = colors[strength.score];
    });
  }
  
  function calculatePasswordStrength(password) {
    // Simple password strength calculation
    let score = 0;
    let message = '';
    
    if (!password) {
      message = 'No password provided';
      return { score, message };
    }
    
    // Length check
    if (password.length < 6) {
      message = 'Too short';
      return { score, message };
    } else if (password.length >= 16) {
      score += 2;
    } else if (password.length >= 10) {
      score += 1;
    }
    
    // Complexity checks
    if (password.match(/[A-Z]/)) score += 1;  // Has uppercase
    if (password.match(/[a-z]/)) score += 1;  // Has lowercase
    if (password.match(/[0-9]/)) score += 1;  // Has number
    if (password.match(/[^A-Za-z0-9]/)) score += 1;  // Has special character
    
    // Determine message based on score
    if (score < 2) {
      message = 'Weak';
    } else if (score < 3) {
      message = 'Fair';
    } else if (score < 4) {
      message = 'Good';
    } else if (score < 5) {
      message = 'Strong';
    } else {
      message = 'Very strong';
    }
    
    // Cap score at 4 for the meter
    score = Math.min(score, 4);
    
    return { score, message };
  }
  
  // Initialize tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
});