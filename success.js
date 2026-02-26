(() => {
  const APPS_SCRIPT_URL =
    'https://script.google.com/macros/s/AKfycbyt2FALtPotLATkgDi5jj69HTst5urJHgE55fsK8cg/dev';
  const STORAGE_KEY = 'rhinoaestheticonRegistrationDraft';

  const statusMessage = document.getElementById('statusMessage');

  const setStatus = (message) => {
    statusMessage.textContent = message;
  };

  const loadRegistrationData = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      throw new Error('No stored registration data found.');
    }

    try {
      return JSON.parse(raw);
    } catch (_error) {
      throw new Error('Stored registration data is invalid.');
    }
  };

  const sendRegistration = async (payload) => {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return response;
  };

  const initialize = async () => {
    try {
      const registrationData = loadRegistrationData();
      await sendRegistration(registrationData);
      localStorage.removeItem(STORAGE_KEY);
      setStatus('Registration successfully recorded.');
    } catch (_error) {
      setStatus('There was an error saving your registration.');
    }
  };

  initialize();
})();
