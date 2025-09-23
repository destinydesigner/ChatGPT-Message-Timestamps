document.addEventListener('DOMContentLoaded', async () => {
  const debugSwitch = document.getElementById('debugSwitch');
  const debugStatus = document.getElementById('debugStatus');
  const refreshNotice = document.getElementById('refreshNotice');

  // Get current debug status
  async function updateStatus() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || (!tab.url.includes('chatgpt.com') && !tab.url.includes('chat.openai.com'))) {
        debugStatus.textContent = 'N/A';
        debugStatus.className = 'status-indicator';
        debugSwitch.style.pointerEvents = 'none';
        debugSwitch.style.opacity = '0.5';
        return;
      }

      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getDebugStatus' });

      if (response) {
        const isEnabled = response.debugEnabled;
        debugSwitch.classList.toggle('enabled', isEnabled);
        debugStatus.textContent = isEnabled ? 'Enabled' : 'Disabled';
        debugStatus.className = `status-indicator ${isEnabled ? 'status-enabled' : 'status-disabled'}`;
      }
    } catch (error) {
      console.error('Error getting debug status:', error);
      debugStatus.textContent = 'Error';
      debugStatus.className = 'status-indicator';
    }
  }

  // Toggle debug mode
  debugSwitch.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || (!tab.url.includes('chatgpt.com') && !tab.url.includes('chat.openai.com'))) {
        return;
      }

      const response = await chrome.tabs.sendMessage(tab.id, { action: 'toggleDebug' });

      if (response) {
        const isEnabled = response.debugEnabled;
        debugSwitch.classList.toggle('enabled', isEnabled);
        debugStatus.textContent = isEnabled ? 'Enabled' : 'Disabled';
        debugStatus.className = `status-indicator ${isEnabled ? 'status-enabled' : 'status-disabled'}`;

        if (response.needsRefresh) {
          refreshNotice.style.display = 'block';
          setTimeout(() => {
            refreshNotice.style.display = 'none';
          }, 5000);
        }
      }
    } catch (error) {
      console.error('Error toggling debug mode:', error);
    }
  });

  // Initialize status
  await updateStatus();
});