// public/js/refresh.js

let secondsSinceLastRefresh = 0;
const refreshInterval = 90000; // 90 seconds in milliseconds
let timerInterval;

// Function to update the timer indicator every second
function startTimer() {
  timerInterval = setInterval(() => {
    secondsSinceLastRefresh++;
    document.getElementById('seconds-counter').textContent = secondsSinceLastRefresh;
  }, 1000);
}

// Function to reset the timer
function resetTimer() {
  secondsSinceLastRefresh = 0;
  document.getElementById('seconds-counter').textContent = secondsSinceLastRefresh;
}

// Function to fetch updated app data from the API
async function fetchAppData() {
  try {
    const response = await fetch('/api/apps');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    updateAppCards(data.projects);
    resetTimer();
  } catch (error) {
    console.error('Error fetching app data:', error);
    // Optionally, display an error message to the user
  }
}

// Function to update the app cards in the DOM
function updateAppCards(projects) {
  const appCardsContainer = document.getElementById('app-cards');
  // Clear existing content
  appCardsContainer.innerHTML = '';

  if (projects.length === 0) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-warning text-center';
    alertDiv.setAttribute('role', 'alert');
    alertDiv.textContent = 'No installed apps found.';
    appCardsContainer.appendChild(alertDiv);
    return;
  }

  // Iterate over each project and create cards
  projects.forEach(project => {
    // Create project card
    const projectCol = document.createElement('div');
    projectCol.className = 'col-12 mb-4';

    const projectCard = document.createElement('div');
    projectCard.className = 'card shadow-sm';

    const projectHeader = document.createElement('div');
    projectHeader.className = 'card-header bg-primary text-white';

    const projectTitle = document.createElement('h2');
    projectTitle.className = 'mb-0';
    projectTitle.innerHTML = `<i class="fas fa-project-diagram"></i> ${project.projectName}`;

    projectHeader.appendChild(projectTitle);
    projectCard.appendChild(projectHeader);

    const projectBody = document.createElement('div');
    projectBody.className = 'card-body';

    if (project.apps.length === 0) {
      const noAppsP = document.createElement('p');
      noAppsP.textContent = 'No apps found under this project.';
      projectBody.appendChild(noAppsP);
    } else {
      const appsRow = document.createElement('div');
      appsRow.className = 'row';

      project.apps.forEach(app => {
        // Create app card
        const appCol = document.createElement('div');
        appCol.className = 'col-md-4 mb-4';

        const appCard = document.createElement('div');
        appCard.className = 'card h-100';

        const appCardBody = document.createElement('div');
        appCardBody.className = 'card-body d-flex flex-column';

        const appTitle = document.createElement('h5');
        appTitle.className = 'card-title';
        appTitle.innerHTML = `<i class="fas fa-cube"></i> ${app.title || 'Untitled App'}`;

        // Determine app status
        const isOffline = app.title && app.title.toLowerCase() === 'kubernetes';
        const statusIcon = document.createElement('i');
        statusIcon.className = isOffline ? 'fas fa-circle text-warning ms-2' : 'fas fa-circle text-success ms-2';
        statusIcon.setAttribute('title', isOffline ? 'Offline' : 'Online');
        statusIcon.setAttribute('aria-label', isOffline ? 'Offline' : 'Online');

        appTitle.appendChild(statusIcon);
        appCardBody.appendChild(appTitle);

        // Description
        const descriptionP = document.createElement('p');
        descriptionP.className = 'card-text';
        descriptionP.innerHTML = `<strong>Description:</strong> ${app.description || 'N/A'}`;
        appCardBody.appendChild(descriptionP);

        // Device IDs
        const deviceIdsP = document.createElement('p');
        deviceIdsP.className = 'card-text';
        deviceIdsP.innerHTML = `<strong>Device ID(s):</strong> ${Array.isArray(app.deviceIds) ? app.deviceIds.join(', ') : app.deviceIds}`;
        appCardBody.appendChild(deviceIdsP);

        // Tags
        const tagsP = document.createElement('p');
        tagsP.className = 'card-text';
        tagsP.innerHTML = `<strong>Tags:</strong> `;
        if (Object.keys(app.tags).length === 0) {
          tagsP.innerHTML += 'None';
        } else {
          for (let key in app.tags) {
            const badgeSpan = document.createElement('span');
            badgeSpan.className = 'badge bg-secondary me-1';
            badgeSpan.textContent = `${key}: ${app.tags[key]}`;
            tagsP.appendChild(badgeSpan);
          }
        }
        appCardBody.appendChild(tagsP);

        // Resources
        const resourcesP = document.createElement('p');
        resourcesP.className = 'card-text';
        resourcesP.innerHTML = `<strong>Resources:</strong>`;
        appCardBody.appendChild(resourcesP);

        const resourcesList = document.createElement('ul');
        resourcesList.className = 'list-group list-group-flush';

        const networksLi = document.createElement('li');
        networksLi.className = 'list-group-item';
        networksLi.innerHTML = `<i class="fas fa-network-wired"></i> Networks: ${app.networks}`;
        resourcesList.appendChild(networksLi);

        const drivesLi = document.createElement('li');
        drivesLi.className = 'list-group-item';
        drivesLi.innerHTML = `<i class="fas fa-hdd"></i> Drives: ${app.drives}`;
        resourcesList.appendChild(drivesLi);

        const cpusLi = document.createElement('li');
        cpusLi.className = 'list-group-item';
        cpusLi.innerHTML = `<i class="fas fa-microchip"></i> CPUs: ${app.cpus}`;
        resourcesList.appendChild(cpusLi);

        const memoryLi = document.createElement('li');
        memoryLi.className = 'list-group-item';
        memoryLi.innerHTML = `<i class="fas fa-memory"></i> Memory: ${app.memory} KB`;
        resourcesList.appendChild(memoryLi);

        appCardBody.appendChild(resourcesList);
        appCard.appendChild(appCardBody);

        // Card Footer with Revision Info and Action Buttons
        const appCardFooter = document.createElement('div');
        appCardFooter.className = 'card-footer';

        const revisionSmall = document.createElement('small');
        revisionSmall.className = 'text-muted';
        const updatedAt = new Date(app.revision.updatedAt).toLocaleDateString();
        revisionSmall.innerHTML = `<i class="fas fa-edit"></i> Revision ${app.revision.curr} by ${app.revision.updatedBy} on ${updatedAt}`;
        appCardFooter.appendChild(revisionSmall);

        // Action Buttons Container
        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'mt-3 d-flex justify-content-center';

        // Play Button: Disabled if Online
        const playButton = document.createElement('button');
        playButton.className = 'btn btn-success btn-sm me-2 action-btn';
        playButton.setAttribute('data-app-id', app.appId);
        playButton.setAttribute('data-action', 'play');
        playButton.setAttribute('title', 'Play');
        playButton.setAttribute('aria-label', `Play ${app.title}`);
        if (!isOffline) {
          playButton.disabled = true;
        }
        playButton.innerHTML = `<i class="fas fa-play"></i>`;
        buttonsDiv.appendChild(playButton);

        // Pause Button: Disabled if Offline
        const pauseButton = document.createElement('button');
        pauseButton.className = 'btn btn-warning btn-sm me-2 action-btn';
        pauseButton.setAttribute('data-app-id', app.appId);
        pauseButton.setAttribute('data-action', 'pause');
        pauseButton.setAttribute('title', 'Pause');
        pauseButton.setAttribute('aria-label', `Pause ${app.title}`);
        if (isOffline) {
          pauseButton.disabled = true;
        }
        pauseButton.innerHTML = `<i class="fas fa-pause"></i>`;
        buttonsDiv.appendChild(pauseButton);

        // Stop Button: Disabled if Offline
        const stopButton = document.createElement('button');
        stopButton.className = 'btn btn-danger btn-sm action-btn';
        stopButton.setAttribute('data-app-id', app.appId);
        stopButton.setAttribute('data-action', 'stop');
        stopButton.setAttribute('title', 'Stop');
        stopButton.setAttribute('aria-label', `Stop ${app.title}`);
        if (isOffline) {
          stopButton.disabled = true;
        }
        stopButton.innerHTML = `<i class="fas fa-stop"></i>`;
        buttonsDiv.appendChild(stopButton);

        appCardFooter.appendChild(buttonsDiv);
        appCard.appendChild(appCardFooter);

        appCol.appendChild(appCard);
        appsRow.appendChild(appCol);
      });

      projectBody.appendChild(appsRow);
    }

    projectCard.appendChild(projectBody);
    projectCol.appendChild(projectCard);
    appCardsContainer.appendChild(projectCol);
  });
}

// Function to initialize the timer and data fetching
function initializeDashboard() {
  // Start the timer
  startTimer();

  // Initial data fetch
  fetchAppData();

  // Set interval to fetch data every 90 seconds
  setInterval(fetchAppData, refreshInterval);
}

// Initialize the dashboard once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeDashboard);
