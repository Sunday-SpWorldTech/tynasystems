/**
 * Internationalization (i18n) Module
 * Handles multi-language support and currency conversion
 */

const i18n = {
  currentLanguage: localStorage.getItem('appLanguage') || 'en',
  currentCurrency: localStorage.getItem('appCurrency') || 'USD',
  
  // Exchange rates (fetch from API in production)
  exchangeRates: {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79
  },

  // Translation keys
  translations: {
    en: {
      // Navigation
      'nav.dashboard': 'Dashboard',
      'nav.products': 'Products',
      'nav.staff': 'Staff Portal',
      'nav.support': 'Support',
      'nav.contact': 'Contact',
      'nav.website': 'Website',
      'nav.settings': 'Settings',
      'nav.logout': 'Logout',
      'nav.language': 'Language',
      'nav.currency': 'Currency',

      // Auth Pages
      'auth.login': 'Sign In',
      'auth.signup': 'Create Account',
      'auth.email': 'Email Address',
      'auth.password': 'Password',
      'auth.password_confirm': 'Confirm Password',
      'auth.remember': 'Remember me',
      'auth.forgot_password': 'Forgot password?',
      'auth.signup_link': "Don't have an account? Sign up",
      'auth.login_link': 'Already have an account? Sign in',
      'auth.password_toggle': 'Show password',
      'auth.submit': 'Continue',
      'auth.invalid_email': 'Please enter a valid email address',
      'auth.password_required': 'Password is required',
      'auth.password_weak': 'Password must be at least 8 characters',
      'auth.password_mismatch': 'Passwords do not match',
      'auth.required_field': 'This field is required',

      // Dashboard
      'dashboard.welcome': 'Welcome back',
      'dashboard.overview': 'Dashboard Overview',
      'dashboard.total_sales': 'Total Sales',
      'dashboard.active_users': 'Active Users',
      'dashboard.conversion_rate': 'Conversion Rate',
      'dashboard.revenue': 'Revenue',
      'dashboard.products': 'Your Products',
      'dashboard.recent_activity': 'Recent Activity',
      'dashboard.no_data': 'No data available',

      // Staff Portal
      'staff.title': 'Staff Management Portal',
      'staff.command_center': 'Command Center',
      'staff.total_staff': 'Total Staff',
      'staff.active_today': 'Active Today',
      'staff.pending_tasks': 'Pending Tasks',
      'staff.staff_directory': 'Staff Directory',
      'staff.add_staff': 'Add New Staff',
      'staff.edit': 'Edit',
      'staff.delete': 'Delete',
      'staff.view': 'View',
      'staff.name': 'Name',
      'staff.email': 'Email',
      'staff.position': 'Position',
      'staff.status': 'Status',
      'staff.joined': 'Joined',
      'staff.actions': 'Actions',

      // Support
      'support.title': 'Support Center',
      'support.contact': 'Contact Us',
      'support.faq': 'Frequently Asked Questions',
      'support.submit_ticket': 'Submit a Support Ticket',
      'support.subject': 'Subject',
      'support.message': 'Message',
      'support.submit': 'Submit',
      'support.email_required': 'Email is required',

      // Products
      'products.all': 'All Products',
      'products.price': 'Price',
      'products.description': 'Description',
      'products.add_to_cart': 'Add to Cart',
      'products.buy_now': 'Buy Now',
      'products.in_stock': 'In Stock',
      'products.out_of_stock': 'Out of Stock',

      // Common
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.add': 'Add',
      'common.loading': 'Loading...',
      'common.error': 'An error occurred',
      'common.success': 'Success',
      'common.confirmation': 'Are you sure?',
      'common.yes': 'Yes',
      'common.no': 'No',
      'common.close': 'Close',
      'common.back': 'Back',
      'common.next': 'Next',
      'common.previous': 'Previous',
      'common.date': 'Date',
      'common.time': 'Time',
      'common.language': 'Language',
      'common.currency': 'Currency',
      'common.search': 'Search',
      'common.filter': 'Filter',
      'common.sort': 'Sort',
      'common.no_results': 'No results found',
      'common.page': 'Page',
      'common.of': 'of',
      'common.per_page': 'per page',

      // Settings
      'settings.title': 'Settings',
      'settings.profile': 'Profile Settings',
      'settings.preferences': 'Preferences',
      'settings.privacy': 'Privacy & Security',
      'settings.notifications': 'Notifications',
      'settings.language_preference': 'Language Preference',
      'settings.currency_preference': 'Currency Preference',
      'settings.timezone': 'Timezone',
      'settings.two_factor': 'Two-Factor Authentication',
      'settings.enable': 'Enable',
      'settings.disable': 'Disable',

      // Validation & Errors
      'error.network': 'Network error. Please try again.',
      'error.unauthorized': 'Unauthorized. Please log in.',
      'error.forbidden': 'You do not have permission to access this.',
      'error.not_found': 'Resource not found.',
      'error.server': 'Server error. Please try again later.',
      'error.invalid_request': 'Invalid request. Please check your input.',

      // Success Messages
      'success.saved': 'Changes saved successfully',
      'success.created': 'Created successfully',
      'success.deleted': 'Deleted successfully',
      'success.updated': 'Updated successfully',
      'success.login': 'Login successful',
      'success.logout': 'Logged out successfully',
    },

    es: {
      // Navigation
      'nav.dashboard': 'Panel de Control',
      'nav.products': 'Productos',
      'nav.staff': 'Portal de Personal',
      'nav.support': 'Soporte',
      'nav.contact': 'Contacto',
      'nav.website': 'Sitio Web',
      'nav.settings': 'Configuración',
      'nav.logout': 'Cerrar Sesión',
      'nav.language': 'Idioma',
      'nav.currency': 'Moneda',

      // Auth Pages
      'auth.login': 'Iniciar Sesión',
      'auth.signup': 'Crear Cuenta',
      'auth.email': 'Dirección de Correo',
      'auth.password': 'Contraseña',
      'auth.password_confirm': 'Confirmar Contraseña',
      'auth.remember': 'Recuérdame',
      'auth.forgot_password': '¿Olvidaste tu contraseña?',
      'auth.signup_link': '¿No tienes cuenta? Regístrate',
      'auth.login_link': '¿Ya tienes cuenta? Inicia sesión',
      'auth.password_toggle': 'Mostrar contraseña',
      'auth.submit': 'Continuar',
      'auth.invalid_email': 'Por favor ingresa una dirección de correo válida',
      'auth.password_required': 'La contraseña es requerida',
      'auth.password_weak': 'La contraseña debe tener al menos 8 caracteres',
      'auth.password_mismatch': 'Las contraseñas no coinciden',
      'auth.required_field': 'Este campo es obligatorio',

      // Dashboard
      'dashboard.welcome': 'Bienvenido',
      'dashboard.overview': 'Resumen del Panel',
      'dashboard.total_sales': 'Ventas Totales',
      'dashboard.active_users': 'Usuarios Activos',
      'dashboard.conversion_rate': 'Tasa de Conversión',
      'dashboard.revenue': 'Ingresos',
      'dashboard.products': 'Tus Productos',
      'dashboard.recent_activity': 'Actividad Reciente',
      'dashboard.no_data': 'Sin datos disponibles',

      // Staff Portal
      'staff.title': 'Portal de Gestión de Personal',
      'staff.command_center': 'Centro de Control',
      'staff.total_staff': 'Personal Total',
      'staff.active_today': 'Activo Hoy',
      'staff.pending_tasks': 'Tareas Pendientes',
      'staff.staff_directory': 'Directorio de Personal',
      'staff.add_staff': 'Añadir Nuevo Personal',
      'staff.edit': 'Editar',
      'staff.delete': 'Eliminar',
      'staff.view': 'Ver',
      'staff.name': 'Nombre',
      'staff.email': 'Correo',
      'staff.position': 'Posición',
      'staff.status': 'Estado',
      'staff.joined': 'Se Unió',
      'staff.actions': 'Acciones',

      // Support
      'support.title': 'Centro de Soporte',
      'support.contact': 'Contáctanos',
      'support.faq': 'Preguntas Frecuentes',
      'support.submit_ticket': 'Enviar Ticket de Soporte',
      'support.subject': 'Asunto',
      'support.message': 'Mensaje',
      'support.submit': 'Enviar',
      'support.email_required': 'El correo es requerido',

      // Products
      'products.all': 'Todos los Productos',
      'products.price': 'Precio',
      'products.description': 'Descripción',
      'products.add_to_cart': 'Agregar al Carrito',
      'products.buy_now': 'Comprar Ahora',
      'products.in_stock': 'En Stock',
      'products.out_of_stock': 'Agotado',

      // Common
      'common.save': 'Guardar',
      'common.cancel': 'Cancelar',
      'common.delete': 'Eliminar',
      'common.edit': 'Editar',
      'common.add': 'Agregar',
      'common.loading': 'Cargando...',
      'common.error': 'Ocurrió un error',
      'common.success': 'Éxito',
      'common.confirmation': '¿Estás seguro?',
      'common.yes': 'Sí',
      'common.no': 'No',
      'common.close': 'Cerrar',
      'common.back': 'Atrás',
      'common.next': 'Siguiente',
      'common.previous': 'Anterior',
      'common.date': 'Fecha',
      'common.time': 'Hora',
      'common.language': 'Idioma',
      'common.currency': 'Moneda',
      'common.search': 'Buscar',
      'common.filter': 'Filtrar',
      'common.sort': 'Ordenar',
      'common.no_results': 'Sin resultados',
      'common.page': 'Página',
      'common.of': 'de',
      'common.per_page': 'por página',

      // Settings
      'settings.title': 'Configuración',
      'settings.profile': 'Configuración de Perfil',
      'settings.preferences': 'Preferencias',
      'settings.privacy': 'Privacidad y Seguridad',
      'settings.notifications': 'Notificaciones',
      'settings.language_preference': 'Preferencia de Idioma',
      'settings.currency_preference': 'Preferencia de Moneda',
      'settings.timezone': 'Zona Horaria',
      'settings.two_factor': 'Autenticación de Dos Factores',
      'settings.enable': 'Habilitar',
      'settings.disable': 'Deshabilitar',

      // Validation & Errors
      'error.network': 'Error de red. Intenta de nuevo.',
      'error.unauthorized': 'No autorizado. Inicia sesión.',
      'error.forbidden': 'No tienes permiso para acceder.',
      'error.not_found': 'Recurso no encontrado.',
      'error.server': 'Error del servidor. Intenta más tarde.',
      'error.invalid_request': 'Solicitud inválida. Verifica tu entrada.',

      // Success Messages
      'success.saved': 'Cambios guardados exitosamente',
      'success.created': 'Creado exitosamente',
      'success.deleted': 'Eliminado exitosamente',
      'success.updated': 'Actualizado exitosamente',
      'success.login': 'Inicio de sesión exitoso',
      'success.logout': 'Sesión cerrada exitosamente',
    },

    fr: {
      // Navigation
      'nav.dashboard': 'Tableau de Bord',
      'nav.products': 'Produits',
      'nav.staff': 'Portail du Personnel',
      'nav.support': 'Support',
      'nav.contact': 'Contact',
      'nav.website': 'Site Web',
      'nav.settings': 'Paramètres',
      'nav.logout': 'Déconnexion',
      'nav.language': 'Langue',
      'nav.currency': 'Devise',

      // Auth Pages
      'auth.login': 'Connexion',
      'auth.signup': 'Créer un Compte',
      'auth.email': 'Adresse Email',
      'auth.password': 'Mot de Passe',
      'auth.password_confirm': 'Confirmer le Mot de Passe',
      'auth.remember': 'Se souvenir de moi',
      'auth.forgot_password': 'Mot de passe oublié?',
      'auth.signup_link': "Pas de compte? S'inscrire",
      'auth.login_link': 'Vous avez un compte? Connectez-vous',
      'auth.password_toggle': 'Afficher le mot de passe',
      'auth.submit': 'Continuer',
      'auth.invalid_email': 'Veuillez entrer une adresse email valide',
      'auth.password_required': 'Le mot de passe est requis',
      'auth.password_weak': 'Le mot de passe doit contenir au moins 8 caractères',
      'auth.password_mismatch': 'Les mots de passe ne correspondent pas',
      'auth.required_field': 'Ce champ est obligatoire',

      // Dashboard
      'dashboard.welcome': 'Bienvenue',
      'dashboard.overview': 'Aperçu du Tableau de Bord',
      'dashboard.total_sales': 'Ventes Totales',
      'dashboard.active_users': 'Utilisateurs Actifs',
      'dashboard.conversion_rate': 'Taux de Conversion',
      'dashboard.revenue': 'Chiffre d\'Affaires',
      'dashboard.products': 'Vos Produits',
      'dashboard.recent_activity': 'Activité Récente',
      'dashboard.no_data': 'Aucune donnée disponible',

      // Staff Portal
      'staff.title': 'Portail de Gestion du Personnel',
      'staff.command_center': 'Centre de Contrôle',
      'staff.total_staff': 'Personnel Total',
      'staff.active_today': 'Actif Aujourd\'hui',
      'staff.pending_tasks': 'Tâches en Attente',
      'staff.staff_directory': 'Répertoire du Personnel',
      'staff.add_staff': 'Ajouter un Nouveau Personnel',
      'staff.edit': 'Modifier',
      'staff.delete': 'Supprimer',
      'staff.view': 'Voir',
      'staff.name': 'Nom',
      'staff.email': 'Email',
      'staff.position': 'Poste',
      'staff.status': 'Statut',
      'staff.joined': 'Inscrit le',
      'staff.actions': 'Actions',

      // Support
      'support.title': 'Centre d\'Assistance',
      'support.contact': 'Nous Contacter',
      'support.faq': 'Questions Fréquemment Posées',
      'support.submit_ticket': 'Soumettre un Ticket d\'Assistance',
      'support.subject': 'Sujet',
      'support.message': 'Message',
      'support.submit': 'Soumettre',
      'support.email_required': 'L\'email est requis',

      // Products
      'products.all': 'Tous les Produits',
      'products.price': 'Prix',
      'products.description': 'Description',
      'products.add_to_cart': 'Ajouter au Panier',
      'products.buy_now': 'Acheter Maintenant',
      'products.in_stock': 'En Stock',
      'products.out_of_stock': 'Rupture de Stock',

      // Common
      'common.save': 'Enregistrer',
      'common.cancel': 'Annuler',
      'common.delete': 'Supprimer',
      'common.edit': 'Modifier',
      'common.add': 'Ajouter',
      'common.loading': 'Chargement...',
      'common.error': 'Une erreur s\'est produite',
      'common.success': 'Succès',
      'common.confirmation': 'Êtes-vous sûr?',
      'common.yes': 'Oui',
      'common.no': 'Non',
      'common.close': 'Fermer',
      'common.back': 'Retour',
      'common.next': 'Suivant',
      'common.previous': 'Précédent',
      'common.date': 'Date',
      'common.time': 'Heure',
      'common.language': 'Langue',
      'common.currency': 'Devise',
      'common.search': 'Rechercher',
      'common.filter': 'Filtrer',
      'common.sort': 'Trier',
      'common.no_results': 'Aucun résultat trouvé',
      'common.page': 'Page',
      'common.of': 'sur',
      'common.per_page': 'par page',

      // Settings
      'settings.title': 'Paramètres',
      'settings.profile': 'Paramètres du Profil',
      'settings.preferences': 'Préférences',
      'settings.privacy': 'Confidentialité et Sécurité',
      'settings.notifications': 'Notifications',
      'settings.language_preference': 'Préférence de Langue',
      'settings.currency_preference': 'Préférence de Devise',
      'settings.timezone': 'Fuseau Horaire',
      'settings.two_factor': 'Authentification à Deux Facteurs',
      'settings.enable': 'Activer',
      'settings.disable': 'Désactiver',

      // Validation & Errors
      'error.network': 'Erreur réseau. Réessayez.',
      'error.unauthorized': 'Non autorisé. Connectez-vous.',
      'error.forbidden': 'Vous n\'avez pas la permission d\'accéder.',
      'error.not_found': 'Ressource non trouvée.',
      'error.server': 'Erreur serveur. Réessayez plus tard.',
      'error.invalid_request': 'Requête invalide. Vérifiez votre entrée.',

      // Success Messages
      'success.saved': 'Modifications enregistrées avec succès',
      'success.created': 'Créé avec succès',
      'success.deleted': 'Supprimé avec succès',
      'success.updated': 'Mis à jour avec succès',
      'success.login': 'Connexion réussie',
      'success.logout': 'Déconnexion réussie',
    }
  },

  /**
   * Get translated text
   */
  t(key, defaultText = '') {
    const lang = this.currentLanguage;
    if (this.translations[lang] && this.translations[lang][key]) {
      return this.translations[lang][key];
    }
    if (this.translations['en'] && this.translations['en'][key]) {
      return this.translations['en'][key];
    }
    return defaultText || key;
  },

  /**
   * Get translated text with pluralization
   */
  tp(key, count) {
    const baseText = this.t(key);
    // Simple pluralization - can be expanded per language
    if (count !== 1) {
      return `${count} ${baseText}s`;
    }
    return `${count} ${baseText}`;
  },

  /**
   * Set language
   */
  setLanguage(lang) {
    if (this.translations[lang]) {
      this.currentLanguage = lang;
      localStorage.setItem('appLanguage', lang);
      this.updatePageLanguage();
      document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    }
  },

  /**
   * Get available languages
   */
  getLanguages() {
    return {
      en: { name: 'English', flag: '🇺🇸' },
      es: { name: 'Español', flag: '🇪🇸' },
      fr: { name: 'Français', flag: '🇫🇷' }
    };
  },

  /**
   * Convert currency
   */
  convertCurrency(amount, fromCurrency = 'USD', toCurrency = this.currentCurrency) {
    if (!this.exchangeRates[fromCurrency] || !this.exchangeRates[toCurrency]) {
      return amount;
    }
    const inUSD = amount / this.exchangeRates[fromCurrency];
    return inUSD * this.exchangeRates[toCurrency];
  },

  /**
   * Format currency
   */
  formatCurrency(amount, currency = this.currentCurrency) {
    const symbols = { USD: '$', EUR: '€', GBP: '£' };
    const symbol = symbols[currency] || currency;
    const formatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return symbol + formatter.format(amount);
  },

  /**
   * Format date based on language
   */
  formatDate(date, includeTime = false) {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...(includeTime && { hour: '2-digit', minute: '2-digit' })
    };
    const locales = {
      en: 'en-US',
      es: 'es-ES',
      fr: 'fr-FR'
    };
    return new Date(date).toLocaleDateString(locales[this.currentLanguage] || 'en-US', options);
  },

  /**
   * Set currency
   */
  setCurrency(currency) {
    if (this.exchangeRates[currency]) {
      this.currentCurrency = currency;
      localStorage.setItem('appCurrency', currency);
      this.updatePageCurrency();
      document.dispatchEvent(new CustomEvent('currencyChanged', { detail: { currency } }));
    }
  },

  /**
   * Get available currencies
   */
  getCurrencies() {
    return {
      USD: { name: 'US Dollar', symbol: '$' },
      EUR: { name: 'Euro', symbol: '€' },
      GBP: { name: 'British Pound', symbol: '£' }
    };
  },

  /**
   * Update all text with current language (call after language change)
   */
  updatePageLanguage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = this.t(key);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      el.title = this.t(key);
    });
    document.documentElement.lang = this.currentLanguage;
  },

  /**
   * Update all prices with current currency
   */
  updatePageCurrency() {
    document.querySelectorAll('[data-currency]').forEach(el => {
      const baseAmount = parseFloat(el.getAttribute('data-currency'));
      const converted = this.convertCurrency(baseAmount, 'USD', this.currentCurrency);
      el.textContent = this.formatCurrency(converted, this.currentCurrency);
    });
  },

  /**
   * Initialize i18n
   */
  init() {
    this.updatePageLanguage();
    this.updatePageCurrency();
  }
};

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => i18n.init());
} else {
  i18n.init();
}

