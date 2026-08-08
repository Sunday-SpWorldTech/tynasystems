/**
 * International Compliance Module
 * GDPR, CCPA, and global privacy standards
 */


function complianceApiUrl(path) {
  const base = window.TYNA_API_URL || ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:5000' : '');
  return `${String(base).replace(/\/$/, '')}${path}`;
}

function complianceToken() {
  return localStorage.getItem('tyna_token') || localStorage.getItem('token') || '';
}

const Compliance = {
  /**
   * Check if user has accepted privacy policy
   */
  hasAcceptedPrivacy() {
    return localStorage.getItem('privacyAccepted') === 'true';
  },

  /**
   * Mark privacy as accepted
   */
  acceptPrivacy() {
    localStorage.setItem('privacyAccepted', 'true');
    localStorage.setItem('privacyAcceptedDate', new Date().toISOString());
    document.dispatchEvent(new CustomEvent('privacyAccepted'));
  },

  /**
   * Revoke consent
   */
  revokeConsent() {
    localStorage.removeItem('privacyAccepted');
    localStorage.removeItem('privacyAcceptedDate');
    document.dispatchEvent(new CustomEvent('consentRevoked'));
  },

  /**
   * Show privacy banner (GDPR compliant)
   */
  showPrivacyBanner() {
    if (this.hasAcceptedPrivacy()) return;

    const banner = document.createElement('div');
    banner.className = 'privacy-banner';
    banner.innerHTML = `
      <div class="privacy-banner-content">
        <div class="privacy-banner-text">
          <p>
            We value your privacy. We use cookies and analytics to enhance your experience.
            By continuing, you accept our <a href="/privacy-policy" target="_blank">Privacy Policy</a>
            and <a href="/terms" target="_blank">Terms of Service</a>.
          </p>
        </div>
        <div class="privacy-banner-actions">
          <button class="btn secondary small privacy-reject-btn">${i18n.t('common.cancel')}</button>
          <button class="btn primary small privacy-accept-btn">${i18n.t('common.yes')}</button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    banner.querySelector('.privacy-accept-btn').addEventListener('click', () => {
      this.acceptPrivacy();
      banner.remove();
    });

    banner.querySelector('.privacy-reject-btn').addEventListener('click', () => {
      banner.remove();
    });
  },

  /**
   * Get user's data (GDPR Right to Access)
   */
  async getUserData() {
    try {
      const response = await fetch(complianceApiUrl('/api/user/data'), {
        headers: { 'Authorization': `Bearer ${complianceToken()}` }
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to retrieve user data:', error);
      return null;
    }
  },

  /**
   * Export user data as JSON (GDPR Right to Data Portability)
   */
  async exportUserData() {
    const userData = await this.getUserData();
    if (!userData) return;

    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `user-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Delete user account (GDPR Right to Erasure)
   */
  async deleteAccount() {
    if (!confirm(i18n.t('common.confirmation') + ' ' + i18n.t('common.delete'))) return;

    try {
      const response = await fetch(complianceApiUrl('/api/user/delete'), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${complianceToken()}` }
      });

      if (response.ok) {
        localStorage.clear();
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert(i18n.t('error.server'));
    }
  },

  /**
   * Anonymize user data (GDPR compliance)
   */
  async anonymizeAccount() {
    if (!confirm('Anonymize your account? Your personal data will be removed.')) return;

    try {
      const response = await fetch(complianceApiUrl('/api/user/anonymize'), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${complianceToken()}` }
      });

      if (response.ok) {
        alert('Your account has been anonymized');
        localStorage.clear();
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Failed to anonymize account:', error);
      alert(i18n.t('error.server'));
    }
  },

  /**
   * Get compliance info for user's region
   */
  getRegionalCompliance() {
    const region = this.detectUserRegion();
    const compliances = {
      EU: {
        name: 'GDPR (General Data Protection Regulation)',
        description: 'European data protection regulation requiring explicit consent',
        rights: ['Right to Access', 'Right to Erasure', 'Right to Data Portability', 'Right to Object'],
        dataRetention: '30 days after account deletion'
      },
      US: {
        name: 'CCPA (California Consumer Privacy Act)',
        description: 'California privacy law for US residents',
        rights: ['Right to Know', 'Right to Delete', 'Right to Opt-Out', 'Right to Non-Discrimination'],
        dataRetention: '30 days after account deletion'
      },
      CA: {
        name: 'PIPEDA (Personal Information Protection and Electronic Documents Act)',
        description: 'Canadian privacy law',
        rights: ['Right to Access', 'Right to Correction', 'Right to Deletion'],
        dataRetention: 'As per applicable laws'
      },
      DEFAULT: {
        name: 'International Privacy Standards',
        description: 'Standard privacy practices',
        rights: ['Right to Access', 'Right to Deletion'],
        dataRetention: '30 days after account deletion'
      }
    };

    return compliances[region] || compliances.DEFAULT;
  },

  /**
   * Detect user region from timezone or browser
   */
  detectUserRegion() {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Map timezones to regions (simplified)
    if (timezone.includes('Europe')) return 'EU';
    if (timezone.includes('America/Los_Angeles') || timezone.includes('America/San_Francisco')) return 'US';
    if (timezone.includes('America/Toronto') || timezone.includes('America/Vancouver')) return 'CA';
    
    return 'DEFAULT';
  },

  /**
   * Generate privacy settings UI
   */
  createPrivacySettingsUI() {
    const region = this.getRegionalCompliance();
    const container = document.createElement('div');
    container.className = 'privacy-settings-panel';
    container.innerHTML = `
      <div class="privacy-settings-content">
        <h3>${i18n.t('settings.privacy')}</h3>
        
        <div class="compliance-info">
          <h4>${region.name}</h4>
          <p>${region.description}</p>
          <div class="rights-list">
            <strong>Your Rights:</strong>
            <ul>
              ${region.rights.map(right => `<li>${right}</li>`).join('')}
            </ul>
          </div>
        </div>

        <div class="privacy-actions">
          <h4>Data Management</h4>
          <button class="btn secondary small" id="exportDataBtn">
            📥 Export My Data
          </button>
          <button class="btn secondary small" id="anonymizeBtn">
            🔒 Anonymize Account
          </button>
          <button class="btn danger small" id="deleteAccountBtn">
            🗑️ Delete Account
          </button>
        </div>

        <div class="privacy-consent">
          <h4>Consent Management</h4>
          <div class="consent-item">
            <label>
              <input type="checkbox" id="analyticsConsent" ${this.hasAnalyticsConsent() ? 'checked' : ''}>
              Analytics & Performance Tracking
            </label>
          </div>
          <div class="consent-item">
            <label>
              <input type="checkbox" id="marketingConsent" ${this.hasMarketingConsent() ? 'checked' : ''}>
              Marketing Communications
            </label>
          </div>
        </div>
      </div>
    `;

    container.querySelector('#exportDataBtn').addEventListener('click', () => this.exportUserData());
    container.querySelector('#anonymizeBtn').addEventListener('click', () => this.anonymizeAccount());
    container.querySelector('#deleteAccountBtn').addEventListener('click', () => this.deleteAccount());

    container.querySelector('#analyticsConsent').addEventListener('change', (e) => {
      localStorage.setItem('analyticsConsent', e.target.checked);
    });

    container.querySelector('#marketingConsent').addEventListener('change', (e) => {
      localStorage.setItem('marketingConsent', e.target.checked);
    });

    return container;
  },

  /**
   * Check consent status
   */
  hasAnalyticsConsent() {
    return localStorage.getItem('analyticsConsent') !== 'false';
  },

  hasMarketingConsent() {
    return localStorage.getItem('marketingConsent') !== 'false';
  },

  /**
   * Initialize compliance on page load
   */
  init() {
    this.showPrivacyBanner();
  }
};

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Compliance.init());
} else {
  Compliance.init();
}

