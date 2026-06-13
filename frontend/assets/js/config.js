(function () {
  const LOCAL_API_URL = 'http://localhost:5000';
  const PRODUCTION_API_URL = window.TYNA_BACKEND_URL || 'https://tynasystems-backend.onrender.com';
  const isLocal =
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1';

  window.TYNA_API_URL = isLocal
    ? LOCAL_API_URL
    : String(PRODUCTION_API_URL).replace(/\/$/, '');
})();
