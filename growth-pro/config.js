// Public configuration only. Never put API keys or service-role secrets here.
// Local previews use their local server; production uses the permanent HTTPS API.
window.ZIONFLOW_CONFIG = { API_BASE: ['localhost','127.0.0.1','::1'].includes(location.hostname) ? '' : 'https://zionflow-api.onrender.com' };
