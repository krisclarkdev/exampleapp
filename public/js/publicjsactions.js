// public/js/actions.js

document.addEventListener('DOMContentLoaded', () => {
  const actionButtons = document.querySelectorAll('.action-btn');

  actionButtons.forEach(button => {
    button.addEventListener('click', async () => {
      console.log('click')
      const appId = button.getAttribute('data-app-id');
      const action = button.getAttribute('data-action');

      try {
        console.log(`/v1/apps/instances/id/${appId}/${action}`)
        //const response = await fetch(`/apps/${appId}/${action}`, {
        const response = await fetch(`/api/action/${appId}/${action}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();

        if (response.ok) {
          //alert(result.message);
        } else {
          alert(`Error: ${result.error}`);
        }
      } catch (error) {
        console.error(`Error performing ${action} on App ID ${appId}:`, error);
        alert('An unexpected error occurred.');
      }
    });
  });
});

// public/js/actions.js

document.addEventListener('DOMContentLoaded', () => {
  // Function to handle button clicks
  function handleActionClick(event) {
    const button = event.target.closest('.action-btn');
    if (!button) return;

    const appId = button.getAttribute('data-app-id');
    const action = button.getAttribute('data-action');

    if (!appId || !action) return;

    performAction(appId, action);
  }

  // Attach event listener to the document for dynamic elements
  document.addEventListener('click', handleActionClick);

  // Function to perform the action
  async function performAction(appId, action) {
    try {
      const response = await fetch(`/app/${appId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        // Optionally, display a success message using Bootstrap Toasts or Alerts
        //console.log(result.message);
        //alert(result.message);
        // Optionally, refetch data to update button states
        fetchAppData();
      } else {
        // Optionally, display an error message
        console.error(`Error: ${result.error}`);
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error(`Unexpected error: ${error}`);
      alert('An unexpected error occurred.');
    }
  }
});
