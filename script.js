/* =========================================================
   FOLIO — script.js
   Every interaction on this page lives here.
   The pattern is always the same: FIND an element,
   LISTEN for an event, then CHANGE something.

   Four features:
     1. Dark mode toggle
     2. Back-to-top button
     3. Scroll reveal (IntersectionObserver)
     4. Project filter (fade-out -> hide/show -> staggered fade-in)
   ========================================================= */


/* ---------- 1. DARK MODE TOGGLE ---------- */

// FIND the toggle button.
const themeToggle = document.querySelector('#theme-toggle');

// LISTEN for a click.
themeToggle.addEventListener('click', () => {
  // CHANGE: toggle the 'dark' class on <body>.
  // CSS re-reads every var(--surface), var(--ink), etc. automatically.
  document.body.classList.toggle('dark');

  // Swap the icon to match the current mode.
  const isDark = document.body.classList.contains('dark');
  themeToggle.textContent = isDark ? '\u2600\uFE0F' : '\uD83C\uDF19'; // ☀️ or 🌙
});


/* ---------- 2. BACK-TO-TOP BUTTON ---------- */

// FIND the button.
const toTop = document.querySelector('#to-top');

// LISTEN for scrolling on the whole window.
window.addEventListener('scroll', () => {
  // CHANGE: show the button after scrolling 300px down.
  if (window.scrollY > 300) {
    toTop.classList.add('show');
  } else {
    toTop.classList.remove('show');
  }
});

// LISTEN for a click on the button.
toTop.addEventListener('click', () => {
  // CHANGE: scroll smoothly to the top.
  window.scrollTo({ top: 0, behavior: 'smooth' });
});


/* ---------- 3. SCROLL REVEAL ---------- */

// FIND every element with class "reveal".
const revealItems = document.querySelectorAll('.reveal');

// IntersectionObserver fires when elements enter the viewport —
// far smoother than a raw scroll event listener.
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      // CHANGE: fade + slide the element in.
      entry.target.classList.add('is-visible');
      // Stop watching — the animation only runs once.
      observer.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.15 // fire when 15% of the element is visible
});

// Register every reveal element with the observer.
revealItems.forEach((item) => observer.observe(item));


/* ---------- 4. PROJECT FILTER ---------- */

// FIND the filter buttons, all project cards, and the count display.
const filterBtns   = document.querySelectorAll('.filter-btn');
const projectCards = document.querySelectorAll('.projects-grid .card');
const projectCount = document.querySelector('#project-count');

// Track the current filter and guard against double-clicks during animation.
let activeFilter   = 'all';
let filterBusy     = false;

// Helper — updates the "Showing N projects" live text.
function updateProjectCount(count) {
  projectCount.textContent =
    'Showing ' + count + ' project' + (count !== 1 ? 's' : '');
}

// Main filter function — three-phase animation:
//   Phase 1: fade all cards out
//   Phase 2: hide non-matching cards, prep matching ones
//   Phase 3: staggered fade-in for matching cards
function applyFilter(category) {
  if (filterBusy || category === activeFilter) return;
  filterBusy    = true;
  activeFilter  = category;

  // FIND and update which button looks active.
  filterBtns.forEach(function(btn) {
    btn.classList.toggle('filter-active', btn.dataset.filter === category);
  });

  // CHANGE Phase 1: fade every card out simultaneously.
  projectCards.forEach(function(card) {
    card.style.opacity   = '0';
    card.style.transform = 'scale(0.95) translateY(8px)';
  });

  // CHANGE Phase 2: after the fade (280ms), reorganise visibility.
  setTimeout(function() {
    var toShow = [];
    var count  = 0;

    projectCards.forEach(function(card) {
      var isMatch = (category === 'all') || (card.dataset.category === category);

      if (isMatch) {
        // Restore display and ensure reveal has already been applied.
        card.style.display = 'flex';
        card.classList.add('is-visible');
        toShow.push(card);
        count++;
      } else {
        // Hide the card — it collapses out of the grid cleanly.
        card.style.display = 'none';
      }
    });

    // Update the live count immediately.
    updateProjectCount(count);

    // CHANGE Phase 3: stagger each visible card back in.
    toShow.forEach(function(card, index) {
      setTimeout(function() {
        card.style.opacity   = '1';
        card.style.transform = ''; // remove inline transform; CSS takes over

        // Release the animation lock after the last card starts appearing.
        if (index === toShow.length - 1) {
          filterBusy = false;
        }
      }, index * 90); // 90ms stagger between each card
    });

    // Edge case: no cards matched — release lock immediately.
    if (toShow.length === 0) {
      filterBusy = false;
    }
  }, 280);
}

// LISTEN for a click on each filter button.
filterBtns.forEach(function(btn) {
  btn.addEventListener('click', function() {
    applyFilter(btn.dataset.filter);
  });
});

// Set the initial count when the page loads.
updateProjectCount(projectCards.length);
