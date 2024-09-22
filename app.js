// app.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios'); // Ensure axios is installed
const app = express();
const PORT = process.env.PORT || 3000;

// Load environment variables from .env file (for security)
require('dotenv').config();

// Define the API token from environment variables
const token = process.env.API_TOKEN;
if (!token) {
  console.error('Error: API_TOKEN is not set in environment variables.');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
};

const baseURL = `${process.env.ZURL}/api` || 'https://zedcontrol.zededa.net/api';

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Fetches data from a specified API endpoint.
 * @param {string} endpoint - The API endpoint to fetch data from.
 * @returns {Object|null} - The response data or null if an error occurs.
 */
async function fetchData(endpoint) {
  try {
    const url = `${baseURL}${endpoint}`;
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching data from ${endpoint}:`,
      error.response ? JSON.stringify(error.response.data) : error.message
    );
    return null;
  }
}

/**
 * Fetches the project name based on the projectId.
 * @param {string} projectId - The ID of the project.
 * @returns {string} - The project name or 'Unknown Project' if not found.
 */
async function projectIdToName(projectId) {
  try {
    const endpoint = `/v1/projects/id/${encodeURIComponent(projectId)}`;
    const projectData = await fetchData(endpoint);

    if (projectData) {
      // Assuming the endpoint returns an object with a 'name' property
      if (projectData.name) {
        return projectData.name;
      } else {
        console.error(`Project name not found in response for project ID ${projectId}:`, JSON.stringify(projectData));
        return 'Unknown Project';
      }
    } else {
      console.error(`Project data not found for project ID ${projectId}`);
      return 'Unknown Project';
    }
  } catch (error) {
    console.error(
      `Error fetching project for project ID ${projectId}:`,
      error.response ? JSON.stringify(error.response.data) : error.message
    );
    return 'Unknown Project';
  }
}

/**
 * Fetches and processes app data from the API.
 * @returns {Object} - Structured data ready for rendering.
 */
async function getStructuredAppData() {
  // Step 1: Fetch all apps
  const appsData = await fetchData('/v1/apps');
  if (!appsData || !appsData.list) {
    console.error('No apps data found.');
    return {};
  }

  // Step 2: Fetch all app instances
  const appInstancesData = await fetchData('/v1/apps/instances');
  if (!appInstancesData || !appInstancesData.list) {
    console.error('No app instances data found.');
    return {};
  }

  // Step 3: Create a mapping of appId to instances
  const appIdToInstances = {};
  appInstancesData.list.forEach((instance) => {
    const appId = String(instance.appId);
    if (!appIdToInstances[appId]) {
      appIdToInstances[appId] = [];
    }
    appIdToInstances[appId].push({
      projectId: instance.projectId || 'Unknown Project ID',
      tags: instance.tags || {},
      deviceId: instance.deviceId || 'Unknown Device ID',
    });
  });

  // Step 4: Prepare the output data structure
  const outputData = {};

  // Implement caching to avoid redundant API calls for the same projectId
  const projectCache = {};

  // Step 5: Process each app
  for (const app of appsData.list) {
    const appId = String(app.id);
    const appName = app.name || 'Unknown App';

    // Check if the app is installed (has at least one instance)
    if (!appIdToInstances[appId]) {
      continue; // Skip apps that are not installed
    }

    // Fetch app details
    const appDetails = await fetchData(`/v1/apps/id/${encodeURIComponent(appId)}`);
    if (!appDetails) {
      console.error(`No details found for app ID ${appId}`);
      continue;
    }

    // Aggregate tags and deviceIds from instances
    const instances = appIdToInstances[appId];
    const aggregatedTags = {}; // Assuming tags are consistent across instances
    const deviceIds = [];

    instances.forEach((instance) => {
      // Merge tags (if different, later tags will overwrite earlier ones)
      Object.assign(aggregatedTags, instance.tags);
      // Collect device IDs
      deviceIds.push(instance.deviceId);
    });

    // If there's only one deviceId, store it as a string; otherwise, keep it as an array
    const deviceIdsOutput = deviceIds.length === 1 ? deviceIds[0] : deviceIds;

    // Count the number of networks and drives
    const networksCount = Array.isArray(appDetails.networks) ? appDetails.networks.length : 0;
    const drivesCount = Array.isArray(appDetails.drives) ? appDetails.drives.length : 0;

    // Fetch project name using projectId from instances
    // Assuming all instances belong to the same projectId
    const projectId = instances[0].projectId;
    let projectName = 'Unknown Project';

    if (projectId !== 'Unknown Project ID') {
      if (projectCache[projectId]) {
        projectName = projectCache[projectId].name;
      } else {
        projectName = await projectIdToName(projectId);
        projectCache[projectId] = { name: projectName };
      }
    }

    // Extract required fields for the app
    const appOutput = {
      appId: appId,
      projectId: projectId,
      project: projectName, // Append project name
      tags: aggregatedTags,
      deviceIds: deviceIdsOutput,
      title: appDetails.title || '',
      description: appDetails.description || '',
      networks: networksCount,
      drives: drivesCount,
      cpus: appDetails.cpus || 0,
      memory: appDetails.memory || 0,
      category: appDetails.category || '',
      os: appDetails.os || '',
      appCategory: appDetails.appCategory || '',
      revision: {
        prev: appDetails.revision ? appDetails.revision.prev : '',
        curr: appDetails.revision ? appDetails.revision.curr : '',
        createdAt: appDetails.revision ? appDetails.revision.createdAt : '',
        createdBy: appDetails.revision ? appDetails.revision.createdBy : '',
        updatedAt: appDetails.revision ? appDetails.revision.updatedAt : '',
        updatedBy: appDetails.revision ? appDetails.revision.updatedBy : '',
      },
    };

    // Add the app to the output data with appName as the key
    outputData[appName] = appOutput;
  }

  return outputData;
}

/**
 * Route to serve the main dashboard.
 */
app.get('/', async (req, res) => {
  try {
    const appData = await getStructuredAppData();

    // Extract unique project names
    const uniqueProjects = [...new Set(Object.values(appData).map(app => app.project))];

    // Structure data: { projectName: [App1, App2, ...], ... }
    const structuredData = uniqueProjects.map((projectName) => {
      const apps = Object.values(appData).filter(app => app.project === projectName);
      return { projectName, apps };
    });

    res.render('index', { projects: structuredData });
  } catch (error) {
    console.error('Error processing data for rendering:', error);
    res.status(500).send('Internal Server Error');
  }
});

/**
 * API Route to serve app data as JSON.
 */
app.get('/api/apps', async (req, res) => {
  try {
    const appData = await getStructuredAppData();

    // Extract unique project names
    const uniqueProjects = [...new Set(Object.values(appData).map(app => app.project))];

    // Structure data: { projectName: [App1, App2, ...], ... }
    const structuredData = uniqueProjects.map((projectName) => {
      const apps = Object.values(appData).filter(app => app.project === projectName);
      return { projectName, apps };
    });

    res.json({ projects: structuredData });
  } catch (error) {
    console.error('Error processing data for API:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
