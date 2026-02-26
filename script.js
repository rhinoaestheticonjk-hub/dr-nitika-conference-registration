(() => {
  const EXCHANGE_RATE_INR_TO_USD = 83; // Fixed conversion: 1 USD = 83 INR
  const EARLY_BIRD_DEADLINE = new Date('2026-03-15T23:59:59'); // Early-bird cutoff date
  const WORKSHOP_PRICE_INR = 7500;
  const EARLY_BIRD_REGISTRATION_INR = 7500;
  const STANDARD_REGISTRATION_INR = 10000;
  const COMBO_PRICE_INR = 26000;
  const STORAGE_KEY = 'rhinoaestheticonRegistrationDraft';

  const elements = {
    form: document.getElementById('registrationForm'),
    notice: document.getElementById('earlyBirdNotice'),
    nationality: document.getElementById('nationality'),
    countryWrapper: document.getElementById('countryWrapper'),
    country: document.getElementById('country'),
    registration: document.getElementById('registrationCheck'),
    workshops: [...document.querySelectorAll('.workshop-item')],
    workshopLabels: [...document.querySelectorAll('.workshop-price')],
    combo: document.getElementById('comboCheck'),
    registrationPriceLabel: document.getElementById('registrationPriceLabel'),
    comboPriceLabel: document.getElementById('comboPriceLabel'),
    breakdownRegistration: document.getElementById('breakdownRegistration'),
    selectedCount: document.getElementById('selectedCount'),
    breakdownWorkshops: document.getElementById('breakdownWorkshops'),
    breakdownCombo: document.getElementById('breakdownCombo'),
    totalAmount: document.getElementById('totalAmount'),
    formError: document.getElementById('formError'),
  };

  const isEarlyBird = () => new Date() <= EARLY_BIRD_DEADLINE;

  const getCurrencyConfig = () => {
    const international = elements.nationality.value === 'International';
    return {
      international,
      symbol: international ? '$' : '₹',
      locale: international ? 'en-US' : 'en-IN',
    };
  };

  const convertFromInr = (valueInInr, international) =>
    international ? valueInInr / EXCHANGE_RATE_INR_TO_USD : valueInInr;

  const formatCurrency = (value, { symbol, locale }) => `${symbol}${value.toLocaleString(locale, { maximumFractionDigits: 2 })}`;

  const getRegistrationPriceInr = () => (isEarlyBird() ? EARLY_BIRD_REGISTRATION_INR : STANDARD_REGISTRATION_INR);

  const getWorkshopCount = () => elements.workshops.filter((workshop) => workshop.checked).length;

  const getPriceState = () => {
    const { international } = getCurrencyConfig();
    const registrationPriceInr = getRegistrationPriceInr();
    const workshopCount = getWorkshopCount();
    const workshopsTotalInr = workshopCount * WORKSHOP_PRICE_INR;
    const comboApplied = elements.combo.checked;

    let totalInr = registrationPriceInr + workshopsTotalInr;
    if (comboApplied || workshopCount === 4) {
      totalInr = COMBO_PRICE_INR;
    }

    return {
      registrationPriceInr,
      workshopsTotalInr,
      workshopCount,
      comboApplied,
      totalInr,
      totalDisplayValue: convertFromInr(totalInr, international),
      registrationDisplayValue: convertFromInr(registrationPriceInr, international),
      workshopsDisplayValue: convertFromInr(workshopsTotalInr, international),
      workshopPriceDisplayValue: convertFromInr(WORKSHOP_PRICE_INR, international),
      comboDisplayValue: convertFromInr(COMBO_PRICE_INR, international),
    };
  };

  const updateNotice = () => {
    if (isEarlyBird()) {
      elements.notice.textContent = 'Early Bird Registration ends on March 15.';
      return;
    }
    elements.notice.textContent = 'Early Bird Closed. Standard Registration ₹10,000';
  };

  const toggleCountryField = () => {
    const { international } = getCurrencyConfig();
    elements.countryWrapper.classList.toggle('hidden', !international);
    elements.country.required = international;
    if (!international) {
      elements.country.value = '';
    }
  };

  const toggleComboBehavior = () => {
    const comboEnabled = elements.combo.checked;
    elements.registration.disabled = comboEnabled;
    elements.workshops.forEach((workshop) => {
      workshop.disabled = comboEnabled;
    });

    if (comboEnabled) {
      elements.registration.checked = false;
      elements.workshops.forEach((workshop) => {
        workshop.checked = false;
      });
    }
  };

  const updatePriceLabels = (priceState) => {
    const currencyConfig = getCurrencyConfig();
    const workshopLabel = formatCurrency(priceState.workshopPriceDisplayValue, currencyConfig);

    elements.registrationPriceLabel.textContent = formatCurrency(priceState.registrationDisplayValue, currencyConfig);
    elements.comboPriceLabel.textContent = formatCurrency(priceState.comboDisplayValue, currencyConfig);
    elements.workshopLabels.forEach((label) => {
      label.textContent = workshopLabel;
    });
  };

  const updateSummary = (priceState) => {
    const currencyConfig = getCurrencyConfig();
    elements.breakdownRegistration.textContent =
      elements.registration.checked || priceState.comboApplied
        ? formatCurrency(priceState.registrationDisplayValue, currencyConfig)
        : 'Not selected';
    elements.selectedCount.textContent = String(priceState.workshopCount);
    elements.breakdownWorkshops.textContent = formatCurrency(priceState.workshopsDisplayValue, currencyConfig);
    elements.breakdownCombo.textContent = priceState.comboApplied || priceState.workshopCount === 4 ? 'Yes' : 'No';
    elements.totalAmount.textContent = formatCurrency(priceState.totalDisplayValue, currencyConfig);
  };

  const saveDraft = (priceState) => {
    const draft = {
      nationality: elements.nationality.value,
      country: elements.country.value,
      registration: elements.registration.checked,
      combo: elements.combo.checked,
      workshops: elements.workshops.reduce((acc, workshop) => {
        acc[workshop.name] = workshop.checked;
        return acc;
      }, {}),
      pricing: {
        totalInr: priceState.totalInr,
        workshopCount: priceState.workshopCount,
        comboApplied: priceState.comboApplied || priceState.workshopCount === 4,
      },
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  };

  const restoreDraft = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    try {
      const draft = JSON.parse(stored);
      if (draft.nationality) {
        elements.nationality.value = draft.nationality;
      }
      if (draft.country) {
        elements.country.value = draft.country;
      }
      if (draft.registration) {
        elements.registration.checked = true;
      }
      if (draft.workshops) {
        elements.workshops.forEach((workshop) => {
          workshop.checked = Boolean(draft.workshops[workshop.name]);
        });
      }
      if (draft.combo) {
        elements.combo.checked = true;
      }
    } catch (_error) {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const refresh = () => {
    updateNotice();
    toggleCountryField();
    toggleComboBehavior();
    const priceState = getPriceState();
    updatePriceLabels(priceState);
    updateSummary(priceState);
    saveDraft(priceState);
  };

  const showFormError = (message) => {
    elements.formError.textContent = message;
    elements.formError.classList.remove('hidden');
  };

  const clearFormError = () => {
    elements.formError.textContent = '';
    elements.formError.classList.add('hidden');
  };

  const validateForm = () => {
    const requiresRegistration = !elements.combo.checked;
    if (requiresRegistration && !elements.registration.checked) {
      showFormError('Registration is mandatory unless Premium Full Access Combo is selected.');
      return false;
    }
    if (elements.nationality.value === 'International' && !elements.country.value.trim()) {
      showFormError('Country is required for international delegates.');
      return false;
    }
    clearFormError();
    return true;
  };

  const bindEvents = () => {
    elements.nationality.addEventListener('change', refresh);
    elements.country.addEventListener('input', refresh);
    elements.registration.addEventListener('change', refresh);
    elements.combo.addEventListener('change', refresh);
    elements.workshops.forEach((workshop) => {
      workshop.addEventListener('change', refresh);
    });

    elements.form.addEventListener('submit', (event) => {
      if (!validateForm()) {
        event.preventDefault();
      }
    });
  };

  restoreDraft();
  bindEvents();
  refresh();
})();
