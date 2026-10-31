import { api } from './api.js';

// Application State
const state = {
  trip: null,
  activeDayId: 'day-1',
  selectedActivityId: null,
  dbStatus: null,
  map: null,
  markersGroup: null,
  routePolyline: null,
  toasts: [],
  activeModal: null, // 'activity', 'ai', 'confirm-delete', 'edit-trip', 'share'
  modalData: null,
  aiPreviewData: null,
  isAiLoading: false
};

// Travel Category Visual Styles
const CATEGORY_MAP = {
  Dining: { class: 'cat-dining', icon: '🍽️', label: 'Dining' },
  Culture: { class: 'cat-culture', icon: '⛩️', label: 'Culture' },
  Sightseeing: { class: 'cat-sightseeing', icon: '🏛️', label: 'Sightseeing' },
  Nature: { class: 'cat-nature', icon: '🌿', label: 'Nature' },
  Shopping: { class: 'cat-shopping', icon: '🛍️', label: 'Shopping' },
  Relaxation: { class: 'cat-nature', icon: '♨️', label: 'Relaxation' }
};

// Transport Visual Modes
const TRANSPORT_ICONS = {
  walking: '🚶',
  cab: '🚕',
  transit: '🚇',
  bus: '🚌',
  bicycle: '🚲'
};

/**
 * Initialize application
 */
async function initApp() {
  renderNavbar();
  renderToastContainer();
  initMap();

  try {
    const statusData = await api.getStatus();
    state.dbStatus = statusData;
    updateStatusBadge();

    const trips = await api.getTrips();
    const tripId = (trips && trips.length > 0) ? trips[0].id : 'trip-japan-2026';
    const tripData = await api.getTrip(tripId);
    state.trip = tripData;
    if (tripData.days && tripData.days.length > 0) {
      state.activeDayId = tripData.days[0].id;
    }

    renderHeader();
    renderOverview();
    renderDaySelector();
    renderTimeline();
    renderBudget();
    updateMap();

    showToast("Itinerary loaded successfully", "success");
  } catch (err) {
    console.error("Initialization error:", err);
    showToast("Failed to connect to backend. Operating in cached mode.", "error");
  }
}

/**
 * Top Navbar Rendering
 */
function renderNavbar() {
  const container = document.getElementById('navbar-mount');
  if (!container) return;

  container.innerHTML = `
    <nav class="top-navbar">
      <div class="nav-container">
        <div class="nav-left">
          <a href="#" class="brand-logo">
            <div class="logo-icon-wrap">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
              </svg>
            </div>
            <span>WanderWise</span>
          </a>
          <ul class="nav-links">
            <li><a href="#" class="nav-item-link">Dashboard</a></li>
            <li><a href="#" class="nav-item-link active">My Trips</a></li>
            <li><a href="#" class="nav-item-link">Explore</a></li>
            <li><a href="#" class="nav-item-link">Community</a></li>
          </ul>
        </div>
        <div class="nav-right">
          <div id="cloud-badge-mount"></div>
          <button class="nav-icon-btn" id="notif-btn" title="Notifications">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span class="nav-badge-count"></span>
          </button>
          <div class="user-profile-btn" id="profile-btn">
            <img class="user-avatar-img" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80" alt="Avatar" />
            <span class="user-name">Naman Sahu</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </div>
    </nav>
  `;

  document.getElementById('notif-btn')?.addEventListener('click', () => {
    showToast("You have 2 new itinerary updates from Japan travel advisor", "info");
  });
}

function updateStatusBadge() {
  const mount = document.getElementById('cloud-badge-mount');
  if (!mount) return;
  const db = state.dbStatus?.database;
  const isSupabase = db?.supabase_connected;
  mount.innerHTML = `
    <span class="cloud-status-badge" title="${db?.engine || 'Local Cloud'}">
      <span class="status-dot-pulse"></span>
      <span>${isSupabase ? 'Supabase Connected' : 'Local Cloud Sync'}</span>
    </span>
  `;
}

/**
 * Page Header & Breadcrumbs
 */
function renderHeader() {
  const container = document.getElementById('header-mount');
  if (!container || !state.trip) return;

  const trip = state.trip;
  container.innerHTML = `
    <header class="page-header-section">
      <div class="header-container">
        <nav class="breadcrumbs">
          <a href="#">My Trips</a>
          <span class="separator">/</span>
          <a href="#">${trip.country || 'International'}</a>
          <span class="separator">/</span>
          <span class="current">Itinerary</span>
        </nav>
        <div class="header-main-row">
          <div class="trip-title-wrapper">
            <h1>
              <span class="country-flag-badge">🇯🇵</span>
              <span>${trip.title}</span>
            </h1>
            <div class="trip-meta-bar">
              <span class="meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span>${trip.start_date} – ${trip.end_date} (${trip.days.length} Days)</span>
              </span>
              <span class="meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span>${trip.travelers_count} Travelers</span>
              </span>
              <span class="meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                <span>$${trip.total_budget.toLocaleString()} Total Budget</span>
              </span>
            </div>
          </div>
          <div class="header-actions">
            <button class="btn btn-secondary" id="btn-edit-trip">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              <span>Edit Trip</span>
            </button>
            <button class="btn btn-secondary" id="btn-share-trip">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
              <span>Share</span>
            </button>
            <button class="btn btn-secondary" id="btn-download-pdf">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  `;

  document.getElementById('btn-edit-trip')?.addEventListener('click', () => openEditTripModal());
  document.getElementById('btn-share-trip')?.addEventListener('click', () => openShareModal());
  document.getElementById('btn-download-pdf')?.addEventListener('click', () => exportItineraryPDF());
}

/**
 * Trip Overview 5 Metric Cards
 */
function renderOverview() {
  const container = document.getElementById('overview-mount');
  if (!container || !state.trip) return;

  const trip = state.trip;
  container.innerHTML = `
    <div class="trip-overview-cards">
      <div class="overview-card">
        <div class="overview-icon teal">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
        <div class="overview-content">
          <div class="label">Destination</div>
          <div class="value">${trip.destination}</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="overview-icon blue">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div class="overview-content">
          <div class="label">Trip Duration</div>
          <div class="value">${trip.days.length} Days / ${trip.days.length - 1} Nights</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="overview-icon amber">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          </svg>
        </div>
        <div class="overview-content">
          <div class="label">Total Budget</div>
          <div class="value">$${trip.total_budget.toLocaleString()}</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="overview-icon purple">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </div>
        <div class="overview-content">
          <div class="label">Travel Style</div>
          <div class="value">${trip.travel_style.split('•')[0].trim()}</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Day Selector Tabs
 */
function renderDaySelector() {
  const container = document.getElementById('day-selector-mount');
  if (!container || !state.trip) return;

  const daysHtml = state.trip.days.map((day) => {
    const isActive = day.id === state.activeDayId;
    return `
      <button class="day-tab-btn ${isActive ? 'active' : ''}" data-day-id="${day.id}">
        <div class="day-tab-title">
          <span>Day ${day.day_number}</span>
          <span class="day-tab-count">${day.activities.length}</span>
        </div>
        <div class="day-tab-date">${day.date}</div>
      </button>
    `;
  }).join('');

  container.innerHTML = `
    <div class="day-selector-section">
      ${daysHtml}
      <button class="add-day-btn" id="btn-add-day">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>Add Day</span>
      </button>
    </div>
  `;

  // Attach tab events
  container.querySelectorAll('.day-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const dayId = btn.getAttribute('data-day-id');
      selectDay(dayId);
    });
  });

  document.getElementById('btn-add-day')?.addEventListener('click', () => handleAddDay());
}

async function selectDay(dayId) {
  state.activeDayId = dayId;
  state.selectedActivityId = null;
  renderDaySelector();
  renderTimeline();
  updateMap();
  showToast(`Switched to Day ${getActiveDay().day_number}`, "info");
}

function getActiveDay() {
  if (!state.trip || !state.trip.days) return null;
  return state.trip.days.find(d => d.id === state.activeDayId) || state.trip.days[0];
}

async function handleAddDay() {
  try {
    const nextNum = state.trip.days.length + 1;
    const updatedTrip = await api.addDay(state.trip.id, {
      title: `Day ${nextNum}: Tokyo Highlights & Exploration`,
      theme: 'Modern Architecture & Nightlife',
      date: `2026-10-${12 + nextNum - 1}`
    });
    state.trip = updatedTrip;
    state.activeDayId = updatedTrip.days[updatedTrip.days.length - 1].id;
    renderHeader();
    renderOverview();
    renderDaySelector();
    renderTimeline();
    renderBudget();
    updateMap();
    showToast(`Day ${nextNum} successfully added`, "success");
  } catch (err) {
    showToast("Failed to add day: " + err.message, "error");
  }
}

/**
 * Daily Itinerary Timeline Rendering
 */
function renderTimeline() {
  const container = document.getElementById('timeline-mount');
  if (!container) return;

  const currentDay = getActiveDay();
  if (!currentDay) {
    container.innerHTML = `<div class="empty-state">No days found in trip.</div>`;
    return;
  }

  // Day Banner
  let html = `
    <div class="day-header-banner">
      <div class="day-header-info">
        <h2>Day ${currentDay.day_number}: ${currentDay.title}</h2>
        <span class="day-theme-pill">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
          <span>${currentDay.theme || 'Exploration'}</span>
        </span>
      </div>
      <div class="day-header-actions">
        <button class="btn btn-ai-sparkle" id="btn-regenerate-day">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
          </svg>
          <span>Regenerate Day with AI</span>
        </button>
      </div>
    </div>
    <div class="timeline-container">
      <div class="timeline-track-line"></div>
  `;

  // Activities loop
  if (!currentDay.activities || currentDay.activities.length === 0) {
    html += `
      <div style="margin-left: 56px; padding: 32px; background: white; border-radius: 16px; border: 1px solid var(--border-subtle); text-align: center;">
        <h4 style="margin-bottom: 6px;">No activities planned for this day yet</h4>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 16px;">Click below to add your first stop or let AI generate an exciting schedule!</p>
      </div>
    `;
  } else {
    currentDay.activities.forEach((act, idx) => {
      const catConfig = CATEGORY_MAP[act.category] || CATEGORY_MAP['Sightseeing'];
      const isSelected = act.id === state.selectedActivityId;
      const isFirst = idx === 0;
      const isLast = idx === currentDay.activities.length - 1;

      html += `
        <div class="timeline-item-wrapper" data-activity-id="${act.id}">
          <div class="activity-card ${isSelected ? 'active-selected' : ''}" id="act-card-${act.id}">
            <div class="timeline-sequence-marker">${idx + 1}</div>
            
            <div class="activity-media">
              <img src="${act.image_url || 'https://images.unsplash.com/photo-1545048702-79362596cdc9?auto=format&fit=crop&w=400&q=80'}" alt="${act.name}" class="activity-img" />
              <span class="activity-category-tag ${catConfig.class}">
                ${catConfig.icon} ${catConfig.label}
              </span>
            </div>

            <div class="activity-body">
              <div class="activity-top-row">
                <h3 class="activity-title">${act.name}</h3>
                <span class="activity-cost-badge">${act.cost > 0 ? '$' + act.cost : 'Free'}</span>
              </div>

              <div class="activity-location-row">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span>${act.location}</span>
              </div>

              <div class="activity-time-pill">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>${act.start_time} – ${act.end_time} (${act.duration})</span>
              </div>

              <p class="activity-desc">${act.description || 'No description provided.'}</p>

              <div class="activity-card-footer">
                <div class="reorder-btns">
                  <button class="reorder-btn btn-move-up" data-id="${act.id}" title="Move Up" ${isFirst ? 'disabled' : ''}>▲</button>
                  <button class="reorder-btn btn-move-down" data-id="${act.id}" title="Move Down" ${isLast ? 'disabled' : ''}>▼</button>
                </div>
                <div class="activity-actions">
                  <button class="action-pill-btn edit btn-edit-act" data-id="${act.id}">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    <span>Edit</span>
                  </button>
                  <button class="action-pill-btn delete btn-delete-act" data-id="${act.id}">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
      `;

      // Transport connector between activities
      if (!isLast) {
        const trans = act.transport_to_next || { mode: 'walking', duration: '15 mins', distance: '1.0 km', cost: 0.0 };
        const modeIcon = TRANSPORT_ICONS[trans.mode] || '🚶';
        html += `
          <div class="transport-connector-row">
            <div class="transport-badge">
              <span>${modeIcon}</span>
              <select class="transport-mode-select" data-activity-id="${act.id}">
                <option value="walking" ${trans.mode === 'walking' ? 'selected' : ''}>Walking</option>
                <option value="cab" ${trans.mode === 'cab' ? 'selected' : ''}>Cab / Taxi</option>
                <option value="transit" ${trans.mode === 'transit' ? 'selected' : ''}>Subway / Metro</option>
                <option value="bus" ${trans.mode === 'bus' ? 'selected' : ''}>Bus</option>
              </select>
              <span class="transport-meta-info">• ${trans.duration} (${trans.distance || 'approx. 1.2 km'})</span>
            </div>
          </div>
        `;
      }

      html += `</div>`; // timeline-item-wrapper
    });
  }

  // Add Activity dashed trigger button
  html += `
      <div class="add-activity-dashed-box" id="btn-trigger-add-activity">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="16"></line>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
        <span>Add Activity to Day ${currentDay.day_number}</span>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Bind Activity Click for Selection
  container.querySelectorAll('.activity-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('select')) return;
      const actId = card.id.replace('act-card-', '');
      selectActivity(actId);
    });
  });

  // Bind Reorder Buttons
  container.querySelectorAll('.btn-move-up').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleReorderActivity(btn.getAttribute('data-id'), -1);
    });
  });

  container.querySelectorAll('.btn-move-down').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleReorderActivity(btn.getAttribute('data-id'), 1);
    });
  });

  // Bind Edit & Delete
  container.querySelectorAll('.btn-edit-act').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openActivityModal('edit', btn.getAttribute('data-id'));
    });
  });

  container.querySelectorAll('.btn-delete-act').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openConfirmDeleteModal(btn.getAttribute('data-id'));
    });
  });

  // Bind Transport Mode Dropdown Change
  container.querySelectorAll('.transport-mode-select').forEach(sel => {
    sel.addEventListener('change', async (e) => {
      const actId = sel.getAttribute('data-activity-id');
      const newMode = sel.value;
      await handleTransportModeChange(actId, newMode);
    });
  });

  // Bind Regenerate Day with AI
  document.getElementById('btn-regenerate-day')?.addEventListener('click', () => openAiRegenerateModal());

  // Bind Add Activity button
  document.getElementById('btn-trigger-add-activity')?.addEventListener('click', () => openActivityModal('add'));
}

/**
 * Activity Selection Sync with Map
 */
function selectActivity(actId) {
  state.selectedActivityId = actId;
  document.querySelectorAll('.activity-card').forEach(c => c.classList.remove('active-selected'));
  const card = document.getElementById(`act-card-${actId}`);
  if (card) {
    card.classList.add('active-selected');
  }

  // Highlight and center on map
  highlightMapMarker(actId);
}

/**
 * Handle inline transport mode changes
 */
async function handleTransportModeChange(activityId, newMode) {
  const currentDay = getActiveDay();
  const act = currentDay.activities.find(a => a.id === activityId);
  if (!act) return;

  const cost = newMode === 'cab' ? 22.0 : (newMode === 'transit' ? 6.0 : (newMode === 'bus' ? 4.0 : 0.0));
  const duration = newMode === 'walking' ? '18 mins' : (newMode === 'cab' ? '10 mins' : '15 mins');
  act.transport_to_next = {
    mode: newMode,
    duration: duration,
    distance: act.transport_to_next?.distance || '1.2 km',
    cost: cost
  };

  try {
    const updated = await api.updateActivity(state.trip.id, currentDay.id, act.id, act);
    state.trip = updated;
    renderTimeline();
    renderBudget();
    showToast(`Updated transit to ${newMode.toUpperCase()}`, "success");
  } catch (err) {
    showToast("Failed to update transportation", "error");
  }
}

/**
 * Handle reordering of activities
 */
async function handleReorderActivity(activityId, direction) {
  const currentDay = getActiveDay();
  const acts = [...currentDay.activities];
  const idx = acts.findIndex(a => a.id === activityId);
  if (idx < 0) return;

  const targetIdx = idx + direction;
  if (targetIdx < 0 || targetIdx >= acts.length) return;

  // Swap
  const temp = acts[idx];
  acts[idx] = acts[targetIdx];
  acts[targetIdx] = temp;

  const reorderedIds = acts.map(a => a.id);
  try {
    const updated = await api.reorderActivities(state.trip.id, currentDay.id, reorderedIds);
    state.trip = updated;
    renderTimeline();
    updateMap();
    showToast("Activity order updated", "success");
  } catch (err) {
    showToast("Failed to reorder: " + err.message, "error");
  }
}

/**
 * Interactive Leaflet Map Initialization and Synchronization
 */
function initMap() {
  const mapElement = document.getElementById('leaflet-map');
  if (!mapElement || typeof L === 'undefined') return;

  state.map = L.map('leaflet-map', {
    zoomControl: false,
    scrollWheelZoom: true
  }).setView([35.0116, 135.7681], 13); // Default Kyoto

  L.control.zoom({ position: 'bottomright' }).addTo(state.map);

  // Clean, high-performance OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(state.map);

  state.markersGroup = L.layerGroup().addTo(state.map);

  document.getElementById('btn-reset-map')?.addEventListener('click', () => {
    fitMapToMarkers();
  });
}

function updateMap() {
  if (!state.map || !state.markersGroup) return;

  state.markersGroup.clearLayers();
  if (state.routePolyline) {
    state.map.removeLayer(state.routePolyline);
    state.routePolyline = null;
  }

  const currentDay = getActiveDay();
  if (!currentDay || !currentDay.activities || currentDay.activities.length === 0) return;

  const latLngs = [];

  currentDay.activities.forEach((act, idx) => {
    if (act.lat && act.lng) {
      const isSelected = act.id === state.selectedActivityId;
      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker-wrap',
        html: `<div class="custom-itinerary-pin ${isSelected ? 'active' : ''}" id="map-pin-${act.id}">${idx + 1}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([act.lat, act.lng], { icon: customIcon });

      const popupHtml = `
        <div style="font-family: var(--font-sans); padding: 4px; max-width: 200px;">
          <h4 style="font-size: 0.95rem; margin-bottom: 4px; color: #0f172a;">${act.name}</h4>
          <p style="font-size: 0.775rem; color: #64748b; margin-bottom: 8px;">${act.start_time} – ${act.end_time}</p>
          <div style="font-size: 0.8rem; font-weight: 700; color: #0d9488;">${act.cost > 0 ? '$' + act.cost : 'Free'}</div>
        </div>
      `;
      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        selectActivity(act.id);
        const card = document.getElementById(`act-card-${act.id}`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });

      state.markersGroup.addLayer(marker);
      latLngs.push([act.lat, act.lng]);
    }
  });

  // Polyline connecting activities in chronological order
  if (latLngs.length > 1) {
    state.routePolyline = L.polyline(latLngs, {
      color: '#0d9488',
      weight: 3.5,
      opacity: 0.85,
      dashArray: '6, 8',
      lineCap: 'round'
    }).addTo(state.map);
  }

  fitMapToMarkers();
}

function fitMapToMarkers() {
  if (!state.map || !state.markersGroup) return;
  const layers = state.markersGroup.getLayers();
  if (layers.length === 0) return;

  const featureGroup = L.featureGroup(layers);
  state.map.fitBounds(featureGroup.getBounds(), { padding: [50, 50], maxZoom: 15 });
}

function highlightMapMarker(actId) {
  document.querySelectorAll('.custom-itinerary-pin').forEach(pin => pin.classList.remove('active'));
  const targetPin = document.getElementById(`map-pin-${actId}`);
  if (targetPin) {
    targetPin.classList.add('active');
  }

  const currentDay = getActiveDay();
  const act = currentDay?.activities.find(a => a.id === actId);
  if (act && act.lat && act.lng && state.map) {
    state.map.panTo([act.lat, act.lng], { animate: true, duration: 0.5 });
  }
}

/**
 * Budget Utilization Sidebar Calculations & Rendering
 */
function renderBudget() {
  const container = document.getElementById('budget-mount');
  if (!container || !state.trip) return;

  const trip = state.trip;
  const accommodation = trip.accommodation_budget || 1400.0;

  let foodTotal = 0.0;
  let activityTotal = 0.0;
  let transportTotal = 0.0;

  trip.days.forEach(day => {
    day.activities.forEach(act => {
      const cost = parseFloat(act.cost) || 0.0;
      if (act.category === 'Dining') {
        foodTotal += cost;
      } else {
        activityTotal += cost;
      }

      if (act.transport_to_next && act.transport_to_next.cost) {
        transportTotal += parseFloat(act.transport_to_next.cost);
      }
    });
  });

  const totalSpent = accommodation + foodTotal + activityTotal + transportTotal;
  const remaining = trip.total_budget - totalSpent;
  const utilizationPercent = Math.min(Math.round((totalSpent / trip.total_budget) * 100), 100);

  let statusClass = 'status-on-track';
  let statusText = 'On Track';
  let fillClass = '';

  if (utilizationPercent > 95) {
    statusClass = 'status-danger';
    statusText = 'Over Budget';
    fillClass = 'danger';
  } else if (utilizationPercent > 80) {
    statusClass = 'status-warning';
    statusText = 'Near Limit';
    fillClass = 'warning';
  }

  container.innerHTML = `
    <div class="budget-summary-card">
      <div class="budget-card-header">
        <div class="budget-card-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
          <span>Budget & Expense Summary</span>
        </div>
        <span class="budget-status-pill ${statusClass}">${utilizationPercent}% • ${statusText}</span>
      </div>

      <div class="budget-progress-wrap">
        <div class="progress-labels">
          <span>Spent $${totalSpent.toLocaleString()}</span>
          <span>Target $${trip.total_budget.toLocaleString()}</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill ${fillClass}" style="width: ${utilizationPercent}%"></div>
        </div>
      </div>

      <div class="expense-breakdown-list">
        <div class="expense-row">
          <div class="expense-label-wrap">
            <span class="expense-color-dot" style="background: #3b82f6;"></span>
            <span>Accommodation</span>
          </div>
          <span class="expense-amount">$${accommodation.toLocaleString()}</span>
        </div>
        <div class="expense-row">
          <div class="expense-label-wrap">
            <span class="expense-color-dot" style="background: #f59e0b;"></span>
            <span>Food & Dining</span>
          </div>
          <span class="expense-amount">$${foodTotal.toLocaleString()}</span>
        </div>
        <div class="expense-row">
          <div class="expense-label-wrap">
            <span class="expense-color-dot" style="background: #10b981;"></span>
            <span>Activities & Tickets</span>
          </div>
          <span class="expense-amount">$${activityTotal.toLocaleString()}</span>
        </div>
        <div class="expense-row">
          <div class="expense-label-wrap">
            <span class="expense-color-dot" style="background: #8b5cf6;"></span>
            <span>Transportation</span>
          </div>
          <span class="expense-amount">$${transportTotal.toLocaleString()}</span>
        </div>
      </div>

      <div class="budget-total-row">
        <span class="label">Remaining Budget:</span>
        <span class="remaining-value" style="color: ${remaining < 0 ? '#dc2626' : 'var(--primary)'}">
          ${remaining < 0 ? '-$' + Math.abs(remaining).toLocaleString() : '$' + remaining.toLocaleString()}
        </span>
      </div>
    </div>
  `;
}

/**
 * Modals: Activity Add/Edit Modal
 */
function openActivityModal(mode = 'add', activityId = null) {
  state.activeModal = 'activity';
  const currentDay = getActiveDay();
  let act = {
    id: 'act-' + Date.now(),
    name: '',
    location: 'Kyoto, Japan',
    lat: 35.0116,
    lng: 135.7681,
    start_time: '10:00 AM',
    end_time: '11:30 AM',
    duration: '1 hr 30 mins',
    cost: 0.0,
    category: 'Sightseeing',
    description: '',
    image_url: 'https://images.unsplash.com/photo-1545048702-79362596cdc9?auto=format&fit=crop&w=800&q=80'
  };

  if (mode === 'edit' && activityId) {
    const existing = currentDay.activities.find(a => a.id === activityId);
    if (existing) act = { ...existing };
  }

  state.modalData = { mode, act };

  const modalMount = document.getElementById('modal-mount');
  if (!modalMount) return;

  modalMount.innerHTML = `
    <div class="modal-overlay" id="activity-modal-overlay">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3>${mode === 'add' ? 'Add New Activity' : 'Edit Activity Details'}</h3>
          <button class="modal-close-btn" id="modal-close-x">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Activity Name</label>
            <input type="text" class="form-input" id="act-input-name" value="${act.name}" placeholder="e.g. Zen Meditation at Kennin-ji" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Category</label>
              <select class="form-select" id="act-input-category">
                <option value="Sightseeing" ${act.category === 'Sightseeing' ? 'selected' : ''}>🏛️ Sightseeing</option>
                <option value="Dining" ${act.category === 'Dining' ? 'selected' : ''}>🍽️ Dining</option>
                <option value="Culture" ${act.category === 'Culture' ? 'selected' : ''}>⛩️ Culture</option>
                <option value="Nature" ${act.category === 'Nature' ? 'selected' : ''}>🌿 Nature</option>
                <option value="Shopping" ${act.category === 'Shopping' ? 'selected' : ''}>🛍️ Shopping</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Estimated Cost (USD)</label>
              <input type="number" class="form-input" id="act-input-cost" value="${act.cost}" placeholder="0.00" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Location / Address</label>
            <input type="text" class="form-input" id="act-input-location" value="${act.location}" placeholder="e.g. Gion District, Kyoto" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Start Time</label>
              <input type="text" class="form-input" id="act-input-start" value="${act.start_time}" placeholder="09:00 AM" />
            </div>
            <div class="form-group">
              <label class="form-label">End Time</label>
              <input type="text" class="form-input" id="act-input-end" value="${act.end_time}" placeholder="10:30 AM" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea class="form-textarea" rows="3" id="act-input-desc" placeholder="What makes this experience special?">${act.description}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Photo Image URL</label>
            <input type="text" class="form-input" id="act-input-img" value="${act.image_url}" placeholder="https://images.unsplash.com/..." />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="modal-btn-cancel">Cancel</button>
          <button class="btn btn-primary" id="modal-btn-save">
            ${mode === 'add' ? 'Add Activity' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('modal-close-x')?.addEventListener('click', closeModal);
  document.getElementById('modal-btn-cancel')?.addEventListener('click', closeModal);
  document.getElementById('activity-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'activity-modal-overlay') closeModal();
  });

  document.getElementById('modal-btn-save')?.addEventListener('click', async () => {
    const name = document.getElementById('act-input-name')?.value.trim();
    if (!name) {
      showToast("Activity name is required", "error");
      return;
    }

    const category = document.getElementById('act-input-category')?.value;
    const cost = parseFloat(document.getElementById('act-input-cost')?.value) || 0;
    const location = document.getElementById('act-input-location')?.value || 'Kyoto';
    const start_time = document.getElementById('act-input-start')?.value || '10:00 AM';
    const end_time = document.getElementById('act-input-end')?.value || '11:30 AM';
    const description = document.getElementById('act-input-desc')?.value;
    const image_url = document.getElementById('act-input-img')?.value;

    const activityPayload = {
      ...state.modalData.act,
      name,
      category,
      cost,
      location,
      start_time,
      end_time,
      duration: '1 hr 30 mins',
      description,
      image_url: image_url || 'https://images.unsplash.com/photo-1545048702-79362596cdc9?auto=format&fit=crop&w=800&q=80'
    };

    try {
      let updated;
      if (mode === 'add') {
        updated = await api.addActivity(state.trip.id, currentDay.id, activityPayload);
        showToast("Activity added to Day " + currentDay.day_number, "success");
      } else {
        updated = await api.updateActivity(state.trip.id, currentDay.id, activityPayload.id, activityPayload);
        showToast("Activity updated", "success");
      }

      state.trip = updated;
      closeModal();
      renderTimeline();
      renderBudget();
      updateMap();
    } catch (err) {
      showToast("Save failed: " + err.message, "error");
    }
  });
}

/**
 * AI Regeneration Modal (Configure & Review Preview)
 */
function openAiRegenerateModal() {
  state.activeModal = 'ai';
  state.aiPreviewData = null;
  state.isAiLoading = false;
  const currentDay = getActiveDay();

  const modalMount = document.getElementById('modal-mount');
  if (!modalMount) return;

  renderAiModalContent(currentDay);
}

function renderAiModalContent(currentDay) {
  const modalMount = document.getElementById('modal-mount');
  if (!modalMount) return;

  if (state.aiPreviewData) {
    // Preview Mode
    const preview = state.aiPreviewData;
    modalMount.innerHTML = `
      <div class="modal-overlay" id="ai-modal-overlay">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>✨ AI Itinerary Preview: Day ${currentDay.day_number}</h3>
            <button class="modal-close-btn" id="modal-close-x">✕</button>
          </div>
          <div class="modal-body">
            <div style="background: var(--primary-light); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--primary-border); margin-bottom: 12px;">
              <div style="font-weight: 700; color: var(--primary); font-size: 0.95rem; margin-bottom: 4px;">${preview.title}</div>
              <p style="font-size: 0.825rem; color: var(--text-secondary); line-height: 1.4;">${preview.rationale}</p>
            </div>
            
            <label class="form-label">Generated Schedule (${preview.activities.length} stops):</label>
            <div class="ai-preview-container">
              ${preview.activities.map(a => `
                <div class="ai-preview-item">
                  <img src="${a.image_url}" class="ai-preview-thumb" alt="${a.name}" />
                  <div class="ai-preview-details">
                    <div class="ai-preview-title">${a.name}</div>
                    <div class="ai-preview-meta">${a.start_time} – ${a.end_time} • ${a.category} • ${a.cost > 0 ? '$' + a.cost : 'Free'}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="ai-btn-back">Modify Settings</button>
            <button class="btn btn-primary" id="ai-btn-apply">
              Apply to Day ${currentDay.day_number}
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-close-x')?.addEventListener('click', closeModal);
    document.getElementById('ai-btn-back')?.addEventListener('click', () => {
      state.aiPreviewData = null;
      renderAiModalContent(currentDay);
    });
    document.getElementById('ai-btn-apply')?.addEventListener('click', async () => {
      try {
        const updated = await api.applyAIDay(state.trip.id, currentDay.id, state.aiPreviewData);
        state.trip = updated;
        closeModal();
        renderTimeline();
        renderBudget();
        updateMap();
        showToast("AI Itinerary successfully applied!", "success");
      } catch (err) {
        showToast("Failed to apply itinerary: " + err.message, "error");
      }
    });

    return;
  }

  // Configuration Form Mode
  modalMount.innerHTML = `
    <div class="modal-overlay" id="ai-modal-overlay">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3>✨ Regenerate Day ${currentDay.day_number} with AI</h3>
          <button class="modal-close-btn" id="modal-close-x">✕</button>
        </div>
        <div class="modal-body">
          <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5;">
            Our travel AI will craft a personalized day itinerary for <strong>${state.trip.destination}</strong> based on your preferences.
          </p>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Day Focus</label>
              <select class="form-select" id="ai-select-focus">
                <option value="culture" selected>⛩️ Cultural Heritage & Temples</option>
                <option value="foodie">🍜 Epicurean Foodie & Cooking</option>
                <option value="scenic">🌄 Scenic Vistas & Bamboo Groves</option>
                <option value="shopping">🛍️ Artisans & Vintage Boutiques</option>
                <option value="adventure">🛶 Rapids & River Walks</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Travel Pace</label>
              <select class="form-select" id="ai-select-pace">
                <option value="relaxed">Slow & Mindful (4-5 stops)</option>
                <option value="moderate" selected>Balanced Flow (6 stops)</option>
                <option value="fast">Action-Packed (7 stops)</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Budget Tier</label>
            <select class="form-select" id="ai-select-budget">
              <option value="budget">Budget Conscious</option>
              <option value="balanced" selected>Comfortable & Balanced</option>
              <option value="luxury">Luxury & Premium Dining</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Special Requests (Optional)</label>
            <textarea class="form-textarea" rows="2" id="ai-input-notes" placeholder="e.g. Include a tea ceremony or avoid crowded midday spots..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="modal-btn-cancel">Cancel</button>
          <button class="btn btn-ai-sparkle" id="ai-btn-generate">
            <span id="ai-btn-text">Generate Day Plan</span>
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('modal-close-x')?.addEventListener('click', closeModal);
  document.getElementById('modal-btn-cancel')?.addEventListener('click', closeModal);
  document.getElementById('ai-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'ai-modal-overlay') closeModal();
  });

  document.getElementById('ai-btn-generate')?.addEventListener('click', async () => {
    const focus = document.getElementById('ai-select-focus')?.value;
    const pace = document.getElementById('ai-select-pace')?.value;
    const budget_tier = document.getElementById('ai-select-budget')?.value;
    const notes = document.getElementById('ai-input-notes')?.value;

    const btnText = document.getElementById('ai-btn-text');
    if (btnText) btnText.innerText = "Crafting Itinerary...";

    try {
      const generated = await api.regenerateDayAI(state.trip.id, currentDay.id, {
        trip_id: state.trip.id,
        day_number: currentDay.day_number,
        focus,
        pace,
        budget_tier,
        custom_prompt: notes
      });

      state.aiPreviewData = generated;
      renderAiModalContent(currentDay);
    } catch (err) {
      showToast("Generation failed: " + err.message, "error");
      if (btnText) btnText.innerText = "Generate Day Plan";
    }
  });
}

/**
 * Delete Confirmation Modal
 */
function openConfirmDeleteModal(activityId) {
  state.activeModal = 'confirm-delete';
  const currentDay = getActiveDay();
  const act = currentDay.activities.find(a => a.id === activityId);
  if (!act) return;

  const modalMount = document.getElementById('modal-mount');
  if (!modalMount) return;

  modalMount.innerHTML = `
    <div class="modal-overlay" id="confirm-modal-overlay">
      <div class="modal-dialog" style="max-width: 440px;">
        <div class="modal-header">
          <h3>Confirm Delete</h3>
          <button class="modal-close-btn" id="modal-close-x">✕</button>
        </div>
        <div class="modal-body">
          <p style="font-size: 0.925rem; color: var(--text-secondary); line-height: 1.5;">
            Are you sure you want to remove <strong>"${act.name}"</strong> from your Day ${currentDay.day_number} schedule?
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="modal-btn-cancel">Cancel</button>
          <button class="btn btn-danger" id="modal-btn-confirm-delete">Delete Activity</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('modal-close-x')?.addEventListener('click', closeModal);
  document.getElementById('modal-btn-cancel')?.addEventListener('click', closeModal);
  document.getElementById('confirm-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'confirm-modal-overlay') closeModal();
  });

  document.getElementById('modal-btn-confirm-delete')?.addEventListener('click', async () => {
    try {
      const updated = await api.deleteActivity(state.trip.id, currentDay.id, activityId);
      state.trip = updated;
      closeModal();
      renderTimeline();
      renderBudget();
      updateMap();
      showToast("Activity deleted", "info");
    } catch (err) {
      showToast("Delete failed: " + err.message, "error");
    }
  });
}

/**
 * Edit Trip Header Modal
 */
function openEditTripModal() {
  state.activeModal = 'edit-trip';
  const trip = state.trip;
  const modalMount = document.getElementById('modal-mount');
  if (!modalMount) return;

  modalMount.innerHTML = `
    <div class="modal-overlay" id="trip-modal-overlay">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3>Edit Trip Information</h3>
          <button class="modal-close-btn" id="modal-close-x">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Trip Title</label>
            <input type="text" class="form-input" id="trip-input-title" value="${trip.title}" />
          </div>
          <div class="form-group">
            <label class="form-label">Destination</label>
            <input type="text" class="form-input" id="trip-input-destination" value="${trip.destination}" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Start Date</label>
              <input type="date" class="form-input" id="trip-input-start" value="${trip.start_date}" />
            </div>
            <div class="form-group">
              <label class="form-label">End Date</label>
              <input type="date" class="form-input" id="trip-input-end" value="${trip.end_date}" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Number of Travelers</label>
              <input type="number" class="form-input" id="trip-input-travelers" value="${trip.travelers_count}" min="1" />
            </div>
            <div class="form-group">
              <label class="form-label">Total Budget (USD)</label>
              <input type="number" class="form-input" id="trip-input-budget" value="${trip.total_budget}" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="modal-btn-cancel">Cancel</button>
          <button class="btn btn-primary" id="trip-btn-save">Save Trip</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('modal-close-x')?.addEventListener('click', closeModal);
  document.getElementById('modal-btn-cancel')?.addEventListener('click', closeModal);
  document.getElementById('trip-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'trip-modal-overlay') closeModal();
  });

  document.getElementById('trip-btn-save')?.addEventListener('click', async () => {
    const title = document.getElementById('trip-input-title')?.value;
    const destination = document.getElementById('trip-input-destination')?.value;
    const start_date = document.getElementById('trip-input-start')?.value;
    const end_date = document.getElementById('trip-input-end')?.value;
    const travelers_count = parseInt(document.getElementById('trip-input-travelers')?.value) || 2;
    const total_budget = parseFloat(document.getElementById('trip-input-budget')?.value) || 3800;

    try {
      const updated = await api.updateTrip(trip.id, {
        title, destination, start_date, end_date, travelers_count, total_budget
      });
      state.trip = updated;
      closeModal();
      renderHeader();
      renderOverview();
      renderBudget();
      showToast("Trip details updated", "success");
    } catch (err) {
      showToast("Update failed: " + err.message, "error");
    }
  });
}

/**
 * Share Trip Modal
 */
function openShareModal() {
  const modalMount = document.getElementById('modal-mount');
  if (!modalMount) return;

  const shareUrl = window.location.href;

  modalMount.innerHTML = `
    <div class="modal-overlay" id="share-modal-overlay">
      <div class="modal-dialog" style="max-width: 480px;">
        <div class="modal-header">
          <h3>Share Itinerary</h3>
          <button class="modal-close-btn" id="modal-close-x">✕</button>
        </div>
        <div class="modal-body">
          <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 12px;">
            Share this live interactive itinerary with your travel companions or family.
          </p>
          <div class="form-group">
            <label class="form-label">Direct Link</label>
            <div style="display: flex; gap: 8px;">
              <input type="text" class="form-input" id="share-link-input" value="${shareUrl}" readonly style="background: var(--bg-subtle);" />
              <button class="btn btn-primary" id="btn-copy-link">Copy</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('modal-close-x')?.addEventListener('click', closeModal);
  document.getElementById('share-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'share-modal-overlay') closeModal();
  });
  document.getElementById('btn-copy-link')?.addEventListener('click', () => {
    navigator.clipboard.writeText(shareUrl);
    showToast("Link copied to clipboard!", "success");
    closeModal();
  });
}

function closeModal() {
  state.activeModal = null;
  state.modalData = null;
  state.aiPreviewData = null;
  const modalMount = document.getElementById('modal-mount');
  if (modalMount) modalMount.innerHTML = '';
}

/**
 * PDF / Print Export
 */
function exportItineraryPDF() {
  window.print();
}

/**
 * Toast Notification Helpers
 */
function renderToastContainer() {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerText = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(30px)';
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// Kickoff
window.addEventListener('DOMContentLoaded', initApp);
