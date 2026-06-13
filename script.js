/* =========================================================
   FOLIO — script.js
   Every interaction on this page lives here.
   The pattern is always the same: FIND an element,
   LISTEN for an event, then CHANGE something.

   Five features:
     1. Dark mode toggle
     2. Back-to-top button
     3. Scroll reveal (IntersectionObserver)
     4. Project filter (fade-out -> hide/show -> staggered fade-in)
     5. Dynamic projects loaded from projects.json (Automated Bot sync)
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

// FIND the filter buttons and the count display.
// NOTE: projectCards uses 'let' (not 'const') because we re-assign it
// after dynamic projects are injected from projects.json (Section 5 below).
const filterBtns   = document.querySelectorAll('.filter-btn');
let   projectCards = document.querySelectorAll('.projects-grid .card');
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


/* ---------- 5. DYNAMIC PROJECTS FROM projects.json (Automated Bot) ----------

   HOW THIS WORKS:
   ───────────────
   The sync_projects.py script (in r4hulee/automated-email-bot) runs via
   GitHub Actions every day at midnight IST and on every push. It fetches
   all public repos from the GitHub API and writes them to projects.json
   in this portfolio repository.

   This section reads that projects.json and renders each repo as a card
   inside .projects-grid — using the EXACT same card structure and CSS
   classes as the hardcoded cards above, so they look identical and the
   filter system works with them automatically.

   FILTER CATEGORY MAPPING:
   ─────────────────────────
   GitHub language →  data-category  (matches existing filter buttons)
     JavaScript, TypeScript, HTML, CSS  →  "web"
     Python, Java, C, C++, Go, Rust, etc.  →  "code"
     Figma (custom)  →  "design"
     Unknown / N/A  →  "code"                                          */

// Map GitHub languages to the portfolio's filter categories
var LANGUAGE_TO_CATEGORY = {
  'JavaScript' : 'web',
  'TypeScript' : 'web',
  'HTML'       : 'web',
  'CSS'        : 'web',
  'SCSS'       : 'web',
  'Sass'       : 'web',
  'Vue'        : 'web',
  'Svelte'     : 'web',
  'Python'     : 'code',
  'Java'       : 'code',
  'C'          : 'code',
  'C++'        : 'code',
  'Go'         : 'code',
  'Rust'       : 'code',
  'Ruby'       : 'code',
  'PHP'        : 'code',
  'Shell'      : 'code',
  'Kotlin'     : 'code',
  'Swift'      : 'code',
  'Figma'      : 'design',
};

/**
 * Returns the filter category for a given GitHub language string.
 * Falls back to 'code' for anything not in the map.
 * @param {string} language - e.g. "Python", "JavaScript"
 * @returns {string} - "web" | "code" | "design"
 */
function getCategory(language) {
  return LANGUAGE_TO_CATEGORY[language] || 'code';
}

/**
 * Builds the chip HTML for language + topics.
 * Shows language first, then up to 2 topics (to keep the card clean).
 * @param {string} language - the primary programming language
 * @param {string[]} topics - array of GitHub topics
 * @returns {string} - HTML string of <span class="chip"> elements
 */
function buildChips(language, topics) {
  var chips = '';
  if (language && language !== 'N/A') {
    chips += '<span class="chip">' + language + '</span>';
  }
  var topicsToShow = (topics || []).slice(0, 2);
  topicsToShow.forEach(function(topic) {
    // Capitalise first letter of each topic for display
    var label = topic.charAt(0).toUpperCase() + topic.slice(1);
    chips += '<span class="chip">' + label + '</span>';
  });
  return chips || '<span class="chip">GitHub</span>';
}

/**
 * Builds the full HTML string for one project card.
 * Matches the same structure as the hardcoded cards in index.html:
 *   <article class="card reveal" data-category="...">
 *     <span class="card-tag">...</span>
 *     <h3 class="card-title">...</h3>
 *     <p class="card-desc">...</p>
 *     <div class="card-meta">chips...</div>
 *     <a class="card-link">...</a>
 *   </article>
 * @param {Object} project - one item from projects.json
 * @returns {string} - complete <article> HTML
 */
function buildProjectCard(project) {
  var category = getCategory(project.language);

  // Card tag label — use the language, or fall back to "GitHub"
  var tagLabel = (project.language && project.language !== 'N/A')
    ? project.language
    : 'GitHub';

  // Prefer the live demo URL (homepage) for the link; fall back to the repo URL
  var linkHref = (project.homepage && project.homepage.trim())
    ? project.homepage
    : (project.url || '#');
  var linkText = (project.homepage && project.homepage.trim())
    ? 'Live Demo &#8599;'
    : 'View Code &#8599;';

  // Sanitise description — trim and fall back to a generic message
  var desc = (project.description && project.description.trim())
    ? project.description
    : 'A public repository by r4hulee.';

  var chips = buildChips(project.language, project.topics);

  // data-dynamic="true" lets you target dynamic cards separately via CSS/JS if needed
  return (
    '<article class="card reveal" '
    +         'data-category="' + category + '" '
    +         'data-dynamic="true" '
    +         'data-repo="' + project.name + '">'
    + '  <span class="card-tag">' + tagLabel + '</span>'
    + '  <h3 class="card-title">' + project.name + '</h3>'
    + '  <p class="card-desc">' + desc + '</p>'
    + '  <div class="card-meta">' + chips + '</div>'
    + '  <a href="' + linkHref + '" '
    +      'target="_blank" rel="noopener" '
    +      'class="card-link">' + linkText + '</a>'
    + '</article>'
  );
}

/**
 * Shows a small loading indicator below the filter bar while fetching JSON.
 */
function showLoader() {
  var grid   = document.querySelector('.projects-grid');
  var loader = document.createElement('p');
  loader.id             = 'projects-loader';
  loader.style.cssText  = 'color:var(--ink-muted,#888);font-size:0.875rem;'
                        + 'margin-top:0.75rem;text-align:center;';
  loader.textContent    = '⏳ Loading projects from GitHub...';
  grid.parentElement.insertBefore(loader, grid);
}

/** Removes the loading indicator. */
function hideLoader() {
  var loader = document.querySelector('#projects-loader');
  if (loader) loader.remove();
}

/**
 * Re-registers any card that has 'reveal' but not yet 'is-visible'
 * with the IntersectionObserver so they animate in as the user scrolls.
 * Call this after injecting new cards into the grid.
 */
function reObserveNewCards() {
  var newCards = document.querySelectorAll(
    '.projects-grid .card.reveal:not(.is-visible)'
  );
  newCards.forEach(function(card) {
    observer.observe(card);
  });
}

/**
 * Refreshes the projectCards NodeList to include dynamically added cards,
 * then re-applies the currently active filter so new cards are shown/hidden
 * correctly without any visible glitch.
 */
function refreshFilterSystem() {
  // Re-query to include the newly added cards
  projectCards = document.querySelectorAll('.projects-grid .card');

  // Temporarily reset activeFilter so applyFilter() doesn't short-circuit
  var previousFilter = activeFilter;
  activeFilter = null;
  filterBusy   = false;

  // Re-apply the same filter — new cards will be included
  applyFilter(previousFilter);
}

/**
 * Main function — fetches projects.json and injects project cards.
 *
 * projects.json lives in the same repo as this website.
 * It is automatically updated by sync_projects.py (via GitHub Actions).
 */
async function loadProjectsFromJSON() {
  showLoader();

  try {
    // Relative path — projects.json is in the root of the portfolio repo
    var response = await fetch('./projects.json');

    if (!response.ok) {
      throw new Error('HTTP ' + response.status + ' — could not load projects.json');
    }

    var projects = await response.json();

    if (!Array.isArray(projects) || projects.length === 0) {
      console.info('[Automated Bot] projects.json is empty — no cards to add.');
      return;
    }

    // Collect names of hardcoded cards already in the HTML
    // so we don't accidentally duplicate them
    var existingNames = Array.from(
      document.querySelectorAll('.projects-grid .card-title')
    ).map(function(el) {
      return el.textContent.trim().toLowerCase();
    });

    var grid  = document.querySelector('.projects-grid');
    var added = 0;

    projects.forEach(function(project) {
      // Skip if this project is already shown as a hardcoded card
      if (existingNames.includes(project.name.toLowerCase())) {
        return;
      }
      // Build card HTML and append it to the grid
      grid.insertAdjacentHTML('beforeend', buildProjectCard(project));
      added++;
    });

    console.info(
      '[Automated Bot] Loaded ' + added + ' project(s) from projects.json'
    );

    if (added > 0) {
      // Register new cards with the scroll-reveal observer
      reObserveNewCards();

      // Refresh the filter system so new cards respond to filter clicks
      refreshFilterSystem();
    }

  } catch (err) {
    // Silently fail — the hardcoded cards are still perfectly visible
    console.warn('[Automated Bot] Could not load projects.json:', err.message);
  } finally {
    hideLoader();
  }
}

// Kick off dynamic project loading as soon as the script runs.
// The DOM is already ready at this point (script is at end of <body>).
loadProjectsFromJSON();
