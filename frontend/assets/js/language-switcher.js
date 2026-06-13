/**
 * Language & Currency Switcher UI Component
 * Provides dropdown menu for language and currency selection
 */

const LanguageCurrencySwitcher = {
  /**
   * Create language switcher dropdown
   */
  createLanguageSwitcher() {
    const container = document.createElement('div');
    container.className = 'lang-currency-switcher';
    container.innerHTML = `
      <div class="switcher-group">
        <div class="switcher-item">
          <button class="switcher-btn lang-btn" aria-label="Select language">
            <span class="lang-flag">🌐</span>
            <span class="lang-code" id="currentLang">EN</span>
            <svg class="switcher-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
          <div class="switcher-dropdown lang-dropdown" id="langDropdown">
            <div class="switcher-title">${i18n.t('common.language')}</div>
            ${Object.entries(i18n.getLanguages()).map(([code, lang]) => `
              <button class="switcher-option ${code === i18n.currentLanguage ? 'active' : ''}" 
                      data-lang="${code}" aria-label="Switch to ${lang.name}">
                <span class="option-flag">${lang.flag}</span>
                <span class="option-name">${lang.name}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <div class="switcher-item">
          <button class="switcher-btn currency-btn" aria-label="Select currency">
            <span class="currency-symbol">${this.getCurrencySymbol(i18n.currentCurrency)}</span>
            <span class="currency-code" id="currentCurrency">${i18n.currentCurrency}</span>
            <svg class="switcher-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
          <div class="switcher-dropdown currency-dropdown" id="currencyDropdown">
            <div class="switcher-title">${i18n.t('common.currency')}</div>
            ${Object.entries(i18n.getCurrencies()).map(([code, curr]) => `
              <button class="switcher-option ${code === i18n.currentCurrency ? 'active' : ''}" 
                      data-currency="${code}" aria-label="Switch to ${curr.name}">
                <span class="option-symbol">${curr.symbol}</span>
                <span class="option-text">${code} - ${curr.name}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    container.querySelector('.lang-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      container.querySelector('.lang-dropdown').classList.toggle('active');
      container.querySelector('.currency-dropdown').classList.remove('active');
    });

    container.querySelector('.currency-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      container.querySelector('.currency-dropdown').classList.toggle('active');
      container.querySelector('.lang-dropdown').classList.remove('active');
    });

    container.querySelectorAll('[data-lang]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const lang = btn.getAttribute('data-lang');
        i18n.setLanguage(lang);
        document.getElementById('currentLang').textContent = lang.toUpperCase();
        container.querySelector('.lang-dropdown').classList.remove('active');
        this.updateSwitcher(container);
      });
    });

    container.querySelectorAll('[data-currency]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const currency = btn.getAttribute('data-currency');
        i18n.setCurrency(currency);
        document.getElementById('currentCurrency').textContent = currency;
        container.querySelector('.currency-dropdown').classList.remove('active');
        this.updateSwitcher(container);
      });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
      container.querySelector('.lang-dropdown').classList.remove('active');
      container.querySelector('.currency-dropdown').classList.remove('active');
    });

    return container;
  },

  /**
   * Get currency symbol
   */
  getCurrencySymbol(currency) {
    const symbols = { USD: '$', EUR: '€', GBP: '£', NGN: '₦' };
    return symbols[currency] || currency;
  },

  /**
   * Update switcher after language/currency change
   */
  updateSwitcher(container) {
    container.querySelectorAll('[data-lang]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === i18n.currentLanguage);
    });
    container.querySelectorAll('[data-currency]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-currency') === i18n.currentCurrency);
    });
  },

  /**
   * Insert switcher into page
   */
  mount(selector = '.nav-right, .navbar-end, header') {
    const target = document.querySelector(selector);
    if (target) {
      target.insertAdjacentElement('afterbegin', this.createLanguageSwitcher());
    }
  }
};

// Listen for language changes and update
document.addEventListener('languageChanged', () => {
  const switcher = document.querySelector('.lang-currency-switcher');
  if (switcher) {
    switcher.querySelector('#currentLang').textContent = i18n.currentLanguage.toUpperCase();
  }
});

document.addEventListener('currencyChanged', () => {
  const switcher = document.querySelector('.lang-currency-switcher');
  if (switcher) {
    switcher.querySelector('#currentCurrency').textContent = i18n.currentCurrency;
  }
});
