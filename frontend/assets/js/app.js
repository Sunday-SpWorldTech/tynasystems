const API_URL = window.TYNA_API_URL || ((location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.hostname === '' || location.protocol === 'file:') ? 'http://localhost:5000' : '');
const API_FALLBACK_URL = 'https://tynasystems-backend.onrender.com';
function shouldRetryWithLiveBackend(base){ return /localhost:5000|127\.0\.0\.1:5000/.test(String(base || '')); }
const TOKEN_KEY = 'tyna_token';
const USER_KEY = 'tyna_user';
function token(){ return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY); }
function currentUser(){ try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; } }
function isStaff(u=currentUser()){ return ['staff','admin'].includes(u?.role); }
function isAdmin(u=currentUser()){ return ['staff','admin'].includes(u?.role); }
function isDeveloper(u=currentUser()){ return ['developer','admin'].includes(u?.role); }
function isSocialWorker(u=currentUser()){ return ['social_worker','staff','developer','admin'].includes(u?.role); }
function safe(v=''){ return String(v ?? '').replace(/[&<>\"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }
const USD_NGN_RATE = Number(window.TYNA_USD_NGN_RATE || 1600);
function money(n){ return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(n||0)); }
function moneyCurrency(n,c='USD'){ return new Intl.NumberFormat('en-US',{style:'currency',currency:c || 'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(n||0)); }
function moneyFromNGN(n){ return moneyCurrency(n, 'USD'); }
function orderMoney(o={}){ return moneyCurrency(o.amount, o.currency || 'USD'); }
function productPrice(p={}){ return money(p.priceUSD ?? (p.priceNGN ? Number(p.priceNGN) / USD_NGN_RATE : 0)); }
function showMsg(el,text,type='success'){ if(!el) return alert(text); el.className = `notice ${type}`; el.textContent = text; el.classList.remove('hidden'); }
function initAdSense(){
  const client = String(window.TYNA_ADSENSE_CLIENT_ID || '').trim();
  if(!/^ca-pub-\d{8,}$/i.test(client)) return;
  if(document.getElementById('tyna-adsense-auto-script')) return;
  const script=document.createElement('script');
  script.id='tyna-adsense-auto-script';
  script.async=true;
  script.crossOrigin='anonymous';
  script.src=`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
  document.head.appendChild(script);
  document.querySelectorAll('ins.adsbygoogle').forEach(()=>{ try{ (window.adsbygoogle=window.adsbygoogle||[]).push({}); }catch{} });
}

function hasRealGoogleClientId(value=''){
  const id = String(value || '').trim();
  return id.endsWith('.apps.googleusercontent.com') && !id.includes('your_') && !id.includes('YOUR_') && !id.includes('REPLACE_');
}
function getGoogleClientId(){
  const configured = String(window.TYNA_GOOGLE_CLIENT_ID || '').trim();
  const fromMarkup = String(document.getElementById('g_id_onload')?.dataset?.client_id || '').trim();
  return hasRealGoogleClientId(configured) ? configured : fromMarkup;
}
function configureGoogleSignin(){
  const clientId = getGoogleClientId();
  const onload = document.getElementById('g_id_onload');
  const googleBoxes = document.querySelectorAll('.google-box');
  if(!onload) return;
  if(hasRealGoogleClientId(clientId)){
    window.TYNA_GOOGLE_CLIENT_ID = clientId;
    onload.setAttribute('data-client_id', clientId);
    googleBoxes.forEach(box => box.classList.remove('hidden'));
  } else {
    googleBoxes.forEach(box => box.classList.add('hidden'));
    const msg = document.querySelector('[data-google-message]');
    if(msg) showMsg(msg, 'Google login is not configured yet. Add VITE_GOOGLE_CLIENT_ID on the frontend and GOOGLE_CLIENT_ID on the backend in Render.', 'info');
  }
}
function saveSession(data){
  if(!data || !data.token || !data.user) throw new Error('Login succeeded but session data was not returned. Please try again or contact support.');
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  sessionStorage.setItem(TOKEN_KEY, data.token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
}
function clearSession(){ localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(USER_KEY); }
function isAuthPageTarget(value=''){ return /(^|\/)(login|joinfree|join-free|register|admin-login|staff-login|dev-login|social-worker-login|social-worker-register)\.html/i.test(String(value||'')); }
function requestedRedirect(){ return normalizeDashboardRedirect(new URLSearchParams(location.search).get('redirect') || ''); }
function safeRoleRedirect(requested='', fallback='dashboard.html'){
  const clean=normalizeDashboardRedirect(requested || '');
  if(!clean || isAuthPageTarget(clean)) return fallback;
  if(/^https?:\/\//i.test(clean)) return fallback;
  return clean;
}
function normalizeDashboardRedirect(target=''){ const raw=String(target||'').trim(); if(!raw) return ''; if(raw.includes('demo-checkout.html')) return 'dashboard.html#products'; if(raw.includes('dashboard.html')) return raw; if(raw.startsWith('#')) return `dashboard.html${raw}`; return raw; }
function logout(targetRole=''){
  const pageRole = targetRole || document.body.dataset.appPage || currentUser()?.role || '';
  clearSession();
  let target = 'login.html';
  if(pageRole === 'admin') target = 'admin-calculator.html';
  if(pageRole === 'staff') target = 'staff-calculator.html';
  if(pageRole === 'developer' || pageRole === 'dev') target = 'developer-calculator.html';
  if(pageRole === 'social' || pageRole === 'social_worker') target = 'staff-calculator.html';
  window.location.replace(target);
}
function redirectToAuth(role){ const page = role === 'admin' ? 'admin-calculator.html' : (role === 'staff' ? 'staff-calculator.html' : (role === 'developer' ? 'developer-calculator.html' : (role === 'social' ? 'staff-calculator.html' : 'login.html'))); const sep = page.includes('?') ? '&' : '?'; location.href = `${page}${sep}redirect=${encodeURIComponent(location.pathname.split('/').pop()+location.search+location.hash)}`; }
async function api(path, options={}){
  const headers = {...(options.headers||{})};
  if(!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if(token()) headers.Authorization = `Bearer ${token()}`;
  const maintenancePin = localStorage.getItem('tyna_dev_maintenance_pin');
  if(maintenancePin) headers['X-Dev-Maintenance-Pin'] = maintenancePin;
  const request = async (base) => {
    const res = await fetch(`${base}${path}`, {...options, headers});
    const data = await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(data.message || 'Request could not be completed. Please try again.');
    return data;
  };
  try { return await request(API_URL); }
  catch(err){
    if(shouldRetryWithLiveBackend(API_URL)) return request(API_FALLBACK_URL);
    throw new Error(err.message || 'Service is currently unavailable. Please try again.');
  }
}
async function recordActivity(type,title='',detail='',metadata={}){ try { if(token()) await api('/api/activities',{method:'POST',body:JSON.stringify({type,title,detail,metadata})}); } catch {} }
async function requireLogin(role){
  if(!token()){ redirectToAuth(role); throw new Error('login required'); }
  let data;
  try{
    data = await api('/api/auth/me');
  }catch(error){
    clearSession();
    redirectToAuth(role);
    throw error;
  }
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
  if(role === 'admin' && !isAdmin(data.user)){ location.href='admin-calculator.html'; throw new Error('admin access required'); }
  if(role === 'staff' && !isStaff(data.user)){ location.href='staff-calculator.html'; throw new Error('staff access required'); }
  if(role === 'developer' && !isDeveloper(data.user)){ location.href='developer-calculator.html'; throw new Error('developer required'); }
  if(role === 'social' && !isSocialWorker(data.user)){ location.href='staff-calculator.html'; throw new Error('social worker required'); }
  return data.user;
}


let tynaRouteNavigationLock = false;
function sameDashboardTarget(href=''){
  try{
    const url = new URL(href, location.href);
    const currentFile = location.pathname.split('/').pop() || 'index.html';
    const targetFile = url.pathname.split('/').pop() || currentFile;
    const dashboardFiles = ['dashboard.html','admin.html','dev.html','social-worker-dashboard.html','certificate.html','support-workspace.html','settings.html'];
    return dashboardFiles.includes(currentFile) && targetFile === currentFile && url.hash;
  }catch{ return false; }
}
function bindDashboardNavigation(renderer){
  document.querySelectorAll('a[href]').forEach(link=>{
    if(link.dataset.dashboardNavBound === '1') return;
    const href = link.getAttribute('href') || '';
    if(!sameDashboardTarget(href) && !href.startsWith('#')) return;
    link.dataset.dashboardNavBound = '1';
    link.addEventListener('click', async (e)=>{
      const raw = link.getAttribute('href') || '';
      const url = new URL(raw, location.href);
      const nextHash = url.hash || raw;
      if(!nextHash || nextHash === '#') return;
      e.preventDefault();
      if(tynaRouteNavigationLock) return;
      tynaRouteNavigationLock = true;
      try{
        if(location.hash !== nextHash) history.pushState(null, '', nextHash);
        await renderer();
        window.scrollTo({top:0, behavior:'instant'});
      }catch(err){ console.error('Dashboard navigation failed:', err); }
      finally{ setTimeout(()=>{ tynaRouteNavigationLock = false; }, 120); }
    });
  });
}

function bindLogout(){ document.querySelectorAll('[data-logout]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();logout(a.dataset.logout || '');})); }
function icon(name){
  const paths = {
    home:'<path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    grid:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    box:'<path d="M21 16V8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7L12 12l8.7-5"/><path d="M12 22V12"/>',
    chat:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.82-.33 1.7 1.7 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.51 1.7 1.7 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .33-1.82 1.7 1.7 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.51-1 1.7 1.7 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.82.33h.01A1.7 1.7 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.51 1.7 1.7 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.33 1.82v.01A1.7 1.7 0 0 0 20.91 10H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1z"/>',
    users:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    chart:'<path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6"/><rect x="12" y="8" width="3" height="10"/><rect x="17" y="5" width="3" height="13"/>',
    money:'<path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6"/>',
    logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>'
  };
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.grid}</svg>`;
}
function appShell(active='dashboard'){
  return `<div class="app-shell user-shell"><aside class="app-sidebar"><a class="brand" href="index.html"><div class="brand-mark"><img src="assets/images/logo.webp" alt="Tyna Systems"></div><span>TYNA<small>SYSTEMS</small></span></a><nav><a class="${active==='dashboard'?'active':''}" href="dashboard.html">${icon('grid')} Workspace</a><a class="${(active==='products'||active==='staff-products')?'active':''}" href="dashboard.html#products">${icon('box')} Store</a><a class="${active==='chat'?'active':''}" href="dashboard.html#chat">${icon('chat')} Chat</a><a class="${active==='support'?'active':''}" href="support-workspace.html">${icon('chat')} Support</a><a class="${active==='academy'?'active':''}" href="dashboard.html#academy">${icon('box')} Coding Academy</a><a class="${active==='certificate'?'active':''}" href="certificate.html">${icon('chart')} Certificate</a><a class="${active==='settings'?'active':''}" href="settings.html">${icon('gear')} Settings</a><div class="sidebar-divider"></div><a href="#" data-logout="user">${icon('logout')} Logout</a></nav></aside><main class="app-main" id="appMain"></main><a class="dashboard-floating-chat" href="dashboard.html#chat">💬 Support</a></div>`;
}
function staffShell(active='overview'){
  return `<div class="app-shell staff-shell"><aside class="app-sidebar staff-sidebar"><a class="brand" href="admin.html"><div class="brand-mark"><img src="assets/images/logo.webp" alt="Tyna Systems"></div><span>TYNA<small>ADMIN</small></span></a><p class="staff-sidebar-note">Company admin workspace for operations, products, orders, wallet and withdrawals.</p><nav><a class="${(active==='overview'||active==='staff-overview')?'active':''}" href="admin.html#overview">${icon('home')} Admin Command Center</a><a class="${(active==='wallet'||active==='staff-wallet')?'active':''}" href="admin.html#staff-wallet">${icon('money')} Wallet</a><a class="${(active==='activity'||active==='staff-activity')?'active':''}" href="admin.html#staff-activity">${icon('chart')} Activity</a><a class="${(active==='users'||active==='staff-users')?'active':''}" href="admin.html#staff-users">${icon('users')} Users</a><a class="${active==='academy'?'active':''}" href="admin.html#staff-academy">${icon('box')} Academy Students</a><a class="${active==='certificates'?'active':''}" href="admin.html#staff-certificates">${icon('chart')} Certificates</a><a class="${(active==='products'||active==='staff-products')?'active':''}" href="admin.html#staff-products">${icon('box')} Products</a><a class="${(active==='orders'||active==='staff-orders')?'active':''}" href="admin.html#staff-orders">${icon('money')} Orders</a><a class="${(active==='chat'||active==='staff-chat')?'active':''}" href="admin.html#staff-chat">${icon('chat')} Chats</a><a class="${(active==='withdrawals'||active==='staff-withdrawals')?'active':''}" href="admin.html#staff-withdrawals">${icon('money')} Withdrawals</a><div class="sidebar-divider"></div><a href="#" data-logout="admin">${icon('logout')} Logout</a></nav></aside><main class="app-main staff-main" id="appMain"></main><a class="dashboard-floating-chat" href="admin.html#staff-chat">💬 Chats</a></div>`;
}

function devShell(active='requests'){
  return `<div class="app-shell staff-shell dev-shell"><aside class="app-sidebar staff-sidebar dev-sidebar"><a class="brand" href="dev.html"><div class="brand-mark"><img src="assets/images/logo.webp" alt="Tyna Systems"></div><span>TYNA<small>DEV</small></span></a><p class="staff-sidebar-note">Sunday Prince Augustine · FullStack Development Engineering.</p><nav><a class="${active==='requests'?'active':''}" href="dev.html#requests">${icon('chat')} Student Requests</a><a class="${(active==='activity'||active==='staff-activity')?'active':''}" href="dev.html#activity">${icon('chart')} Activity</a><a class="${(active==='users'||active==='staff-users')?'active':''}" href="dev.html#users">${icon('users')} Users</a><a class="${active==='academy'?'active':''}" href="dev.html#academy">${icon('box')} Academy Students</a><a class="${active==='certificates'?'active':''}" href="dev.html#certificates">${icon('chart')} Certificates</a><a class="${active==='chat'?'active':''}" href="dev.html#chat">${icon('chat')} Support Chats</a><a class="${active==='payments'?'active':''}" href="dev.html#payments">${icon('money')} Developer Wallet</a><a class="${active==='maintenance'?'active':''}" href="dev.html#maintenance">${icon('gear')} Maintenance Mode</a><a class="${active==='spy'?'active':''}" href="dev.html#spy">${icon('gear')} Spy Access</a><div class="sidebar-divider"></div><a href="developer.html">${icon('home')} Public Dev Page</a><a href="#" data-logout="developer">${icon('logout')} Logout</a></nav></aside><main class="app-main staff-main dev-main" id="appMain"></main><a class="dashboard-floating-chat" href="dev.html#chat">💬 Chats</a></div>`;
}

function socialShell(active='overview'){
  return `<div class="app-shell staff-shell social-shell"><aside class="app-sidebar staff-sidebar"><a class="brand" href="social-worker-dashboard.html"><div class="brand-mark"><img src="assets/images/logo.webp" alt="Tyna Systems"></div><span>TYNA<small>SOCIAL</small></span></a><p class="staff-sidebar-note">Role-based social worker workspace. Payments remain admin controlled.</p><nav><a class="${(active==='overview'||active==='staff-overview')?'active':''}" href="social-worker-dashboard.html#overview">${icon('home')} Role Center</a><a class="${active==='contacts'?'active':''}" href="social-worker-dashboard.html#contacts">${icon('users')} Contacts</a><a class="${active==='tickets'?'active':''}" href="social-worker-dashboard.html#tickets">${icon('chat')} Support Care</a><a class="${(active==='activity'||active==='staff-activity')?'active':''}" href="social-worker-dashboard.html#activity">${icon('chart')} Activity</a><div class="sidebar-divider"></div><a href="#" data-logout="social">${icon('logout')} Logout</a></nav></aside><main class="app-main staff-main social-main" id="appMain"></main><a class="dashboard-floating-chat" href="social-worker-dashboard.html#tickets">💬 Support</a></div>`;
}

function renderGoogleSigninButtons(){
  const clientId = getGoogleClientId();
  if(!hasRealGoogleClientId(clientId) || typeof window.handleGoogleCredential !== 'function') return;
  const render = () => {
    if(!window.google?.accounts?.id) return;
    window.google.accounts.id.initialize({ client_id: clientId, callback: window.handleGoogleCredential });
    document.querySelectorAll('.g_id_signin').forEach(btn => {
      btn.innerHTML = '';
      window.google.accounts.id.renderButton(btn, {
        type: btn.dataset.type || 'standard',
        theme: btn.dataset.theme || 'outline',
        size: btn.dataset.size || 'large',
        text: btn.dataset.text || 'signin_with',
        shape: btn.dataset.shape || 'pill',
        logo_alignment: btn.dataset.logo_alignment || 'left',
        width: Number(btn.dataset.width || 360)
      });
    });
  };
  if(window.google?.accounts?.id) return render();
  let script = document.getElementById('google-gsi-script');
  if(!script){
    script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = render;
    document.head.appendChild(script);
  } else {
    script.addEventListener('load', render, { once: true });
  }
}

function redirectAfterLogin(data){
  const fallback = isStaff(data.user) ? 'admin.html' : (isDeveloper(data.user) ? 'dev.html' : (data.user?.role === 'social_worker' ? 'social-worker-dashboard.html' : 'dashboard.html'));
  const requested = safeRoleRedirect(requestedRedirect(), fallback);
  const protectedRoleMismatch = (fallback === 'admin.html' && !/admin|staff/i.test(requested)) || (fallback === 'dev.html' && !/dev/i.test(requested)) || (fallback === 'social-worker-dashboard.html' && !/social-worker/i.test(requested));
  location.replace(protectedRoleMismatch ? fallback : requested);
}
function redirectAfterUserLogin(data){
  const requested = safeRoleRedirect(requestedRedirect(), 'dashboard.html');
  const blocked = /admin|staff|dev|developer|social-worker/i.test(requested);
  location.replace((!blocked && requested) ? requested : 'dashboard.html');
}
async function initAuthPages(){
  configureGoogleSignin();
  if(token()) {
    try {
      const current = await api('/api/auth/me');
      localStorage.setItem(USER_KEY,JSON.stringify(current.user));
      sessionStorage.setItem(USER_KEY,JSON.stringify(current.user));
      const isRoleLoginPage = Boolean(document.querySelector('[data-staff-login-form], [data-dev-login-form], [data-social-login-form], [data-social-register-form]'));
      isRoleLoginPage ? redirectAfterLogin({ user: current.user }) : redirectAfterUserLogin({ user: current.user });
      return;
    } catch { clearSession(); }
  }
  document.querySelector('[data-joinfree-form], [data-register-form]')?.addEventListener('submit', async e=>{ e.preventDefault(); const form=e.currentTarget; const box=form.querySelector('[data-form-message]'); try{ const payload=Object.fromEntries(new FormData(form).entries()); if(payload.governmentIdReference) payload.governmentIdReference=String(payload.governmentIdReference).slice(-4); const data=await api('/api/auth/join-free',{method:'POST',body:JSON.stringify(payload)}); saveSession(data); redirectAfterUserLogin(data); } catch(err){ showMsg(box,err.message,'error'); } });
  document.querySelector('[data-login-form]')?.addEventListener('submit', async e=>{ e.preventDefault(); const form=e.currentTarget; const box=form.querySelector('[data-form-message]'); try{ const data=await api('/api/auth/login',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(form).entries()))}); saveSession(data); redirectAfterUserLogin(data); } catch(err){ showMsg(box,err.message,'error'); } });
  document.querySelector('[data-staff-login-form]')?.addEventListener('submit', async e=>{ e.preventDefault(); const form=e.currentTarget; const box=form.querySelector('[data-form-message]'); try{ const data=await api('/api/auth/staff-login',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(form).entries()))}); saveSession(data); redirectAfterLogin(data); } catch(err){ showMsg(box,err.message,'error'); } });
  document.querySelector('[data-dev-login-form]')?.addEventListener('submit', async e=>{ e.preventDefault(); const form=e.currentTarget; const box=form.querySelector('[data-form-message]'); try{ const data=await api('/api/auth/dev-login',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(form).entries()))}); saveSession(data); redirectAfterLogin(data); } catch(err){ showMsg(box,err.message,'error'); } });
  document.querySelector('[data-social-login-form]')?.addEventListener('submit', async e=>{ e.preventDefault(); const form=e.currentTarget; const box=form.querySelector('[data-form-message]'); try{ const data=await api('/api/auth/social-login',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(form).entries()))}); saveSession(data); redirectAfterLogin(data); } catch(err){ showMsg(box,err.message,'error'); } });
  document.querySelector('[data-social-register-form]')?.addEventListener('submit', async e=>{ e.preventDefault(); const form=e.currentTarget; const box=form.querySelector('[data-form-message]'); try{ const data=await api('/api/auth/social-register',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(form).entries()))}); saveSession(data); location.href = 'social-worker-dashboard.html'; } catch(err){ showMsg(box,err.message,'error'); } });
  window.handleGoogleCredential = async function(response){ const box=document.querySelector('[data-google-message]'); const roleSelect=document.querySelector('[name=workerRole]'); const social=document.body.dataset.socialAuth==='true'; try{ const data=await api(social?'/api/auth/google-social':'/api/auth/google',{method:'POST',body:JSON.stringify({credential:response.credential, workerRole: roleSelect?.value})}); saveSession(data); social ? redirectAfterLogin(data) : redirectAfterUserLogin(data); } catch(err){ showMsg(box,err.message,'error'); } };
  renderGoogleSigninButtons();
}
async function startPayment(productSlug='backend-os-demo'){
  const u = await requireLogin();
  await recordActivity('checkout_attempt','Checkout attempt',`Started checkout for ${productSlug}`,{productSlug});
  const data = await api('/api/payments/initialize',{method:'POST',body:JSON.stringify({email:u.email,name:u.name,productSlug})});
  if(data.authorization_url) location.href = data.authorization_url;
  else throw new Error('Payment could not start. Check Paystack settings.');
}
function productCard(p, owned=false){
  const image = p.imageUrl ? `<img src="${safe(p.imageUrl)}" alt="${safe(p.name)}">` : `<div class="preview-panel"><h3>${safe(p.name)}</h3><div class="mini-bars"></div></div>`;
  const action = owned && (p.downloadUrl || p.fileUrl) ? `<a class="btn dark small" href="${safe(p.downloadUrl || p.fileUrl)}" target="_blank" rel="noreferrer" data-download="${safe(p.slug)}">Download</a>` : `<button class="btn gold small" data-buy="${safe(p.slug)}">Buy Now</button>`;
  return `<article class="card product-card">${image}<div><span class="badge info">${safe(p.category || p.deliveryType || 'Product')}</span><h3>${safe(p.name)}</h3><p>${safe(p.subtitle || p.description || '')}</p></div><div class="module row"><b>${productPrice(p)}</b><div class="app-actions">${action}${p.youtubeUrl?`<a class="btn light small" href="${safe(p.youtubeUrl)}" target="_blank" rel="noreferrer">Tour</a>`:''}</div></div></article>`;
}

function chatFileLinks(files=[]){ return (files||[]).map(f=>`<a class="chat-attachment" href="${safe(f.url)}" target="_blank" rel="noreferrer">📎 ${safe(f.originalName||f.filename||'attachment')}</a>`).join(''); }
function isSupportSender(sender){ return ['staff','admin','developer','social_worker'].includes(sender); }
function chatDisplayName(m, mode='user'){
  if(mode === 'support') return safe(m.name || 'Team member');
  if(isSupportSender(m.sender)) return 'Tyna Support';
  if(m.sender === 'system') return 'Tyna Systems';
  return safe(m.name || 'You');
}
function chatMeta(m, mode='user'){
  const time = new Date(m.createdAt||Date.now()).toLocaleString();
  if(mode === 'support') return `${safe(m.role || m.sender || 'support')} · ${time}`;
  return time;
}
function dashboardChatMessages(messages=[], mode='user'){
  return (messages||[]).map(m=>{
    const mine = ['staff','admin','developer','social_worker','user'].includes(m.sender) && currentUser()?.email && String(m.email||'').toLowerCase() === String(currentUser()?.email||'').toLowerCase();
    const side = mine ? 'mine' : (isSupportSender(m.sender) ? 'staff' : 'client');
    return `<div class="support-chat-bubble ${side}"><b>${chatDisplayName(m, mode)}</b>${m.message?`<p>${safe(m.message)}</p>`:''}${chatFileLinks(m.files)}<small>${chatMeta(m, mode)}</small></div>`;
  }).join('') || '<div class="empty-state">No chat messages yet.</div>';
}
function scrollChatToBottom(el){ if(el) requestAnimationFrame(()=>{ el.scrollTop = el.scrollHeight; }); }

async function renderUserChat(main,u){
  main.innerHTML = `<div class="app-title"><div><span class="eyebrow">Support</span><h1>Chat with Support</h1><p>Simple WhatsApp-style chat for help, screenshots, payments and learning issues.</p></div><a class="btn light" href="dashboard.html">Back</a></div><section class="chat-page-simple"><div class="dash-card chat-card-clean"><div class="floating-chat-head chat-card-head"><div><b>Tyna Support</b><small id="user-chat-status">Loading</small></div></div><div id="user-chat-messages" class="support-chat-window whatsapp-chat-window">Loading...</div><form class="app-form chat-compose whatsapp-compose" data-user-chat-form><label class="chat-file-picker compact">📎<input name="files" type="file" accept="image/*,.pdf,.txt,.doc,.docx" multiple></label><textarea name="message" rows="1" placeholder="Type a message"></textarea><button class="btn gold" type="submit">Send</button><div class="hidden" data-form-message></div></form></div></section>`;
  async function load(){
    const {thread}=await api('/api/chat/my');
    document.getElementById('user-chat-status').textContent = thread.status === 'closed' ? 'Case closed' : 'Online';
    document.getElementById('user-chat-messages').innerHTML = dashboardChatMessages(thread.messages, 'user');
    scrollChatToBottom(document.getElementById('user-chat-messages'));
  }
  const form=main.querySelector('[data-user-chat-form]');
  form.addEventListener('submit', async e=>{ e.preventDefault(); const msg=form.querySelector('[data-form-message]'); try{ const fd=new FormData(form); if(!String(fd.get('message')||'').trim() && !form.querySelector('[name=files]').files.length) throw new Error('Type a message or upload a screenshot/file.'); await api('/api/chat/my/messages',{method:'POST',body:fd}); form.reset(); showMsg(msg,'Message sent.','success'); await load(); }catch(err){ showMsg(msg,err.message,'error'); } });
  try{ await load(); }catch(err){ document.getElementById('user-chat-messages').innerHTML=`<div class="notice error">${safe(err.message)}</div>`; }
}

async function renderStaffChat(main){
  main.innerHTML = `<div class="app-title"><div><span class="eyebrow">Company Chat</span><h1>User and Team Chats</h1><p>Reply to users, open or close chats, and communicate internally with staff/admin.</p></div></div><section class="workspace-grid chat-admin-grid"><div class="dash-card"><div class="module row"><h2>User Chats</h2><button class="btn light small" id="refresh-chat-threads">Refresh</button></div><div id="staff-thread-list" class="chat-thread-list">Loading...</div></div><div class="dash-card"><div id="staff-chat-panel" class="empty-state">Choose a user chat to open.</div></div></section><section class="section" style="padding-bottom:0"><div class="dash-card"><div class="module row"><div><h2>Admin & Staff Internal Chat</h2><p class="muted">Private team messages for company staff and admin.</p></div><button class="btn light small" id="refresh-internal-chat">Refresh</button></div><div id="internal-chat-window" class="support-chat-window">Loading...</div><form class="app-form chat-compose" data-internal-chat-form><label>Internal message<textarea name="message" rows="3" placeholder="Message admin/staff/developer team..."></textarea></label><label class="chat-file-picker">📎 Attach file<input name="files" type="file" accept="image/*,.pdf,.txt,.doc,.docx" multiple></label><button class="btn gold" type="submit">Send Internal Message</button><div class="hidden" data-form-message></div></form></div></section>`;
  let activeThreadId='';
  async function loadThreads(){
    const list=document.getElementById('staff-thread-list');
    try{ const {threads}=await api('/api/chat/staff/threads');
      list.innerHTML=(threads||[]).map(t=>`<button class="chat-thread ${activeThreadId===String(t.id)?'active':''}" data-thread-id="${safe(t.id)}"><b>${safe(t.client?.name || 'Visitor')}</b><span>${safe(t.client?.email || '')}</span><small>${safe(t.status)} · ${new Date(t.lastMessageAt||t.updatedAt).toLocaleString()}</small></button>`).join('') || '<div class="empty-state">No user chats yet.</div>';
      list.querySelectorAll('[data-thread-id]').forEach(btn=>btn.addEventListener('click',()=>openThread(btn.dataset.threadId)));
    }catch(err){ list.innerHTML=`<div class="notice error">${safe(err.message)}</div>`; }
  }
  async function openThread(id){
    activeThreadId=id;
    const panel=document.getElementById('staff-chat-panel');
    try{ const {thread}=await api(`/api/chat/staff/threads/${encodeURIComponent(id)}`);
      panel.innerHTML=`<div class="module row"><div><h2>${safe(thread.client?.name || 'Chat')}</h2><p class="muted">${safe(thread.client?.email || '')}</p></div><button class="btn ${thread.status==='closed'?'gold':'light'} small" data-toggle-chat>${thread.status==='closed'?'Open Chat':'Close Chat'}</button></div><span class="badge ${thread.status==='closed'?'warn':'success'}">${safe(thread.status)}</span><div class="support-chat-window" id="active-staff-chat">${dashboardChatMessages(thread.messages)}</div><form class="app-form chat-compose" data-staff-chat-reply><label>Reply<textarea name="message" rows="3" placeholder="Reply to user..."></textarea></label><label class="chat-file-picker">📎 Attach screenshot/file<input name="files" type="file" accept="image/*,.pdf,.txt,.doc,.docx" multiple></label><button class="btn gold" type="submit">Send Reply</button><div class="hidden" data-form-message></div></form>`;
      const win=document.getElementById('active-staff-chat'); win.scrollTop=win.scrollHeight;
      panel.querySelector('[data-toggle-chat]').addEventListener('click',async()=>{ await api(`/api/chat/staff/threads/${encodeURIComponent(id)}/status`,{method:'PATCH',body:JSON.stringify({status: thread.status==='closed'?'open':'closed'})}); await openThread(id); await loadThreads(); });
      panel.querySelector('[data-staff-chat-reply]').addEventListener('submit',async e=>{ e.preventDefault(); const form=e.currentTarget, box=form.querySelector('[data-form-message]'); try{ const fd=new FormData(form); if(!String(fd.get('message')||'').trim() && !form.querySelector('[name=files]').files.length) throw new Error('Type a reply or attach a file.'); await api(`/api/chat/staff/threads/${encodeURIComponent(id)}/messages`,{method:'POST',body:fd}); form.reset(); showMsg(box,'Reply sent.','success'); await openThread(id); await loadThreads(); }catch(err){ showMsg(box,err.message,'error'); } });
      await loadThreads();
    }catch(err){ panel.innerHTML=`<div class="notice error">${safe(err.message)}</div>`; }
  }
  async function loadInternal(){
    const win=document.getElementById('internal-chat-window');
    try{ const {thread}=await api('/api/chat/staff/internal'); win.innerHTML=dashboardChatMessages(thread.messages); win.scrollTop=win.scrollHeight; }catch(err){ win.innerHTML=`<div class="notice error">${safe(err.message)}</div>`; }
  }
  main.querySelector('#refresh-chat-threads').addEventListener('click',loadThreads);
  main.querySelector('#refresh-internal-chat').addEventListener('click',loadInternal);
  main.querySelector('[data-internal-chat-form]').addEventListener('submit',async e=>{ e.preventDefault(); const form=e.currentTarget, box=form.querySelector('[data-form-message]'); try{ const fd=new FormData(form); if(!String(fd.get('message')||'').trim() && !form.querySelector('[name=files]').files.length) throw new Error('Type a message or attach a file.'); await api('/api/chat/staff/internal/messages',{method:'POST',body:fd}); form.reset(); showMsg(box,'Internal message sent.','success'); await loadInternal(); }catch(err){ showMsg(box,err.message,'error'); } });
  await loadThreads(); await loadInternal();
}

async function renderDevSpy(main){
  const savedPin = localStorage.getItem('tyna_dev_maintenance_pin') || '';
  main.innerHTML=`<div class="app-title"><div><span class="eyebrow">Developer Maintenance</span><h1>Spy / Maintenance Access</h1><p>Enter the protected PIN to preview admin or staff dashboards for fixing issues.</p></div></div><section class="workspace-grid"><div class="dash-card"><h2>Open a dashboard role</h2><form class="app-form" data-dev-spy-form><label>PIN<input name="pin" type="password" required value="${safe(savedPin)}" placeholder="Enter maintenance PIN"></label><label>Open Role<select name="role"><option value="admin">Admin Command Center</option><option value="staff">Staff Role Dashboard</option></select></label><button class="btn gold" type="submit">Open Spy Dashboard</button><div class="hidden" data-form-message></div></form></div><div class="dash-card"><h2>Security note</h2><p>This maintenance access is reserved for approved platform maintenance and dashboard review.</p><div class="notice info">Current PIN required: 12121991</div></div></section>`;
  main.querySelector('[data-dev-spy-form]').addEventListener('submit',async e=>{ e.preventDefault(); const form=e.currentTarget, box=form.querySelector('[data-form-message]'); const pin=form.pin.value.trim(); try{ localStorage.setItem('tyna_dev_maintenance_pin', pin); await api('/api/staff/overview'); showMsg(box,'PIN accepted. Opening selected dashboard...','success'); const target=form.role.value==='staff'?'social-worker-dashboard.html#overview':'admin.html#overview'; setTimeout(()=>{ location.href=target; },600); }catch(err){ localStorage.removeItem('tyna_dev_maintenance_pin'); showMsg(box,'PIN failed or access denied: '+err.message,'error'); } });
}


let tynaDashboardRouterBound = false;
function bindDashboardHashRouter(renderer){ /* handled by bindDashboardNavigation + global route dispatcher */ }
let tynaStaffRouterBound = false;
function bindStaffHashRouter(renderer){ /* handled by bindDashboardNavigation + global route dispatcher */ }
let tynaDevRouterBound = false;
function bindDevHashRouter(renderer){ /* handled by bindDashboardNavigation + global route dispatcher */ }
async function initDashboard(){
  const u = await requireLogin(); await recordActivity('dashboard_visit','Dashboard visit','User opened the dashboard workspace');
  const activeDash = location.hash === '#products' ? 'products' : (location.hash === '#chat' ? 'chat' : (location.hash === '#academy' ? 'academy' : 'dashboard'));
  bindDashboardHashRouter(initDashboard);
  document.body.innerHTML = appShell(activeDash); bindLogout(); bindDashboardNavigation(initDashboard);
  const main=document.getElementById('appMain');
  if(location.hash === '#chat') return renderUserChat(main, u);
  if(location.hash === '#academy') return renderUserAcademy(main, u);
  main.innerHTML = `<section class="dashboard-hero-banner user"><img src="assets/images/homepage-hero-team.webp" alt="Professional Tyna Systems workspace"><div class="banner-overlay"></div><div class="banner-content"><div class="banner-copy"><span class="eyebrow">User Workspace</span><h1>Welcome, ${safe((u.name||'Founder').split(' ')[0])}</h1><p>Access your backend operating systems, purchased products, support, and account settings from one professional workspace.</p><div class="banner-chips"><span class="hero-chip">Notion &amp; ClickUp Dashboard</span></div></div><a class="btn gold" href="#products">Browse Products</a></div></section><div class="kpi-grid"><div class="kpi"><span class="muted">Account</span><strong>${safe(u.status||'active')}</strong></div><div class="kpi"><span class="muted">Role</span><strong>${safe(u.role||'client')}</strong></div><div class="kpi"><span class="muted">Support</span><strong>24h</strong></div><div class="kpi"><span class="muted">Academy</span><strong>Live</strong></div></div><section class="workspace-grid"><div class="dash-card"><div class="app-title"><div><h2>My Purchased Systems</h2><p>Paid products and accessible files appear here.</p></div></div><div data-owned class="product-grid"><div class="empty-state">Loading your products...</div></div></div><aside class="dash-card"><h3>Account Summary</h3><p><b>${safe(u.name)}</b><br><span class="muted">${safe(u.email)}</span></p><div class="badges"><span class="badge success">${safe(u.status)}</span><span class="badge info">${safe(u.role)}</span></div><br><div class="app-actions"><a class="btn dark wide" href="support-workspace.html">Get Support</a><a class="btn light wide" href="settings.html">Update Profile</a><a class="btn gold wide" href="certificate.html">My Certificate</a></div></aside></section><section class="section" id="products" style="padding-bottom:0"><div class="app-title"><div><span class="eyebrow">Product Store</span><h2>Available Backend OS Products</h2><p>Products require login before payment. You are already logged in.</p></div></div><div data-store class="product-grid"><div class="empty-state">Loading products...</div></div></section>`;
  const qs=new URLSearchParams(location.search); const ref=qs.get('reference')||qs.get('trxref');
  if(ref){
    const paymentBox=document.createElement('div'); paymentBox.className='notice info'; paymentBox.textContent='Verifying your payment and updating your dashboard access...'; main.prepend(paymentBox);
    try{ const data=await api(`/api/payments/verify/${encodeURIComponent(ref)}`); paymentBox.className='notice success'; paymentBox.innerHTML=`<b>Payment verified.</b> ${safe(data.message||'Your product access is now active.')}`; window.history.replaceState({}, document.title, 'dashboard.html#products'); }
    catch(err){ paymentBox.className='notice error'; paymentBox.textContent=err.message; }
  }
  const ownedWrap=main.querySelector('[data-owned]'), storeWrap=main.querySelector('[data-store]');
  try{
    const [storeData, mineData] = await Promise.all([api('/api/products'), api('/api/products/dashboard/my-products').catch(()=>({orders:[],products:[]}))]);
    const products = storeData.products || [];
    const paidSlugs = new Set((mineData.orders||[]).filter(o=>o.status==='paid').map(o=>o.productSlug));
    const ownedProducts = products.filter(p=>paidSlugs.has(p.slug));
    ownedWrap.innerHTML = ownedProducts.length ? ownedProducts.map(p=>productCard(p,true)).join('') : `<div class="empty-state">No paid products yet. Start with the Backend OS Demo below.</div>`;
    storeWrap.innerHTML = products.length ? products.map(p=>productCard(p, paidSlugs.has(p.slug))).join('') : `<div class="empty-state">No products available yet.</div>`;
    main.querySelectorAll('[data-buy]').forEach(b=>b.addEventListener('click',async()=>{ try{ await startPayment(b.dataset.buy); }catch(err){ alert(err.message); } }));
    main.querySelectorAll('[data-download]').forEach(a=>a.addEventListener('click',()=>recordActivity('download','Product download',`Opened download for ${a.dataset.download}`,{productSlug:a.dataset.download})));
  }catch(err){ storeWrap.innerHTML = `<div class="notice error">${safe(err.message)}</div>`; ownedWrap.innerHTML = `<div class="notice error">${safe(err.message)}</div>`; }
}
async function initSupport(kind='support'){
  await requireLogin(); document.body.innerHTML=appShell(kind); bindLogout(); const main=document.getElementById('appMain');
  const title = kind==='support'?'Support Tickets':'Message the Admin Team';
  main.innerHTML = `<div class="app-title"><div><span class="eyebrow">${kind==='support'?'Help Center':'Admin Communication'}</span><h1>${title}</h1><p>Send a message connected to your account. Our team typically responds within 24 hours.</p></div></div><section class="workspace-grid"><div class="dash-card"><h2>Submit New Ticket</h2><form class="app-form" data-ticket><label>Subject<input name="subject" required placeholder="What do you need help with?"></label><label>Priority<select name="priority"><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label><label>Message<textarea name="message" required placeholder="Describe your issue in detail..."></textarea></label><button class="btn gold" type="submit">Send Message</button><div class="hidden" data-form-message></div></form></div><div class="dash-card"><h2>Your Support History</h2><div data-tickets class="module-list"><div class="empty-state">Loading...</div></div></div></section>`;
  const form=main.querySelector('[data-ticket]');
  form.addEventListener('submit',async e=>{ e.preventDefault(); const box=form.querySelector('[data-form-message]'); try{ await api('/api/support',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(form).entries()))}); showMsg(box,'Message sent to admin.','success'); form.reset(); loadTickets(); }catch(err){ showMsg(box,err.message,'error'); } });
  async function loadTickets(){ const box=main.querySelector('[data-tickets]'); try{ const {tickets}=await api('/api/support/mine'); box.innerHTML = tickets.length ? tickets.map(t=>`<div class="module"><div class="module row"><b>${safe(t.subject)}</b><span class="badge ${t.status==='open'?'info':'success'}">${safe(t.status)}</span></div><p>${safe(t.message)}</p>${t.adminReply?`<div class="notice success"><b>Admin Reply:</b> ${safe(t.adminReply)}</div>`:''}</div>`).join('') : '<div class="empty-state">No tickets yet.</div>'; }catch(err){ box.innerHTML=`<div class="notice error">${safe(err.message)}</div>`; } }
  loadTickets();
}
async function initSettings(){
  const u=await requireLogin(); document.body.innerHTML=appShell('settings'); bindLogout(); const main=document.getElementById('appMain');
  main.innerHTML = `<div class="app-title"><div><span class="eyebrow">User Settings</span><h1>Account Profile</h1><p>Update your personal information and contact details.</p></div></div><div class="dash-card" style="max-width:680px"><form class="app-form" data-settings><label>Full Name<input name="name" value="${safe(u.name||'')}" required></label><label>Company / Business Name<input name="company" value="${safe(u.company||'')}" placeholder="Your business name"></label><label>Phone Number<input name="phone" value="${safe(u.phone||'')}" placeholder="+234..."></label><label>Email Address<input value="${safe(u.email)}" disabled></label><button class="btn gold" type="submit">Save Changes</button><div class="hidden" data-form-message></div></form></div>`;
  main.querySelector('[data-settings]').addEventListener('submit',async e=>{ e.preventDefault(); const form=e.currentTarget, box=form.querySelector('[data-form-message]'); try{ const data=await api('/api/auth/me',{method:'PUT',body:JSON.stringify(Object.fromEntries(new FormData(form).entries()))}); localStorage.setItem(USER_KEY,JSON.stringify(data.user)); showMsg(box,'Profile updated','success'); }catch(err){ showMsg(box,err.message,'error'); } });
}
async function initStaff(){
  bindStaffHashRouter(initStaff);
  await requireLogin(document.body.dataset.appPage === 'admin' ? 'admin' : 'staff');
  const raw = location.hash || '#overview';
  const active = raw.replace('#staff-','').replace('#','') || 'overview';
  document.body.innerHTML = staffShell(active); bindLogout(); bindDashboardNavigation(initStaff); const main=document.getElementById('appMain');
  if(raw==='#overview' || raw==='') return renderStaffOverview(main);
  if(raw==='#staff-users') return renderStaffUsers(main);
  if(raw==='#staff-products') return renderStaffProducts(main);
  if(raw==='#staff-orders') return renderStaffOrders(main);
  if(raw==='#staff-chat') return renderStaffChat(main);
  if(raw==='#staff-wallet') return renderStaffWallet(main);
  if(raw==='#staff-withdrawals') return renderStaffWithdrawals(main);
  if(raw==='#staff-activity') return renderStaffActivity(main);
  if(raw==='#staff-academy') return renderAcademyAdmin(main, 'admin');
  if(raw==='#staff-certificates') return renderAcademyCertificates(main, 'admin');
  return renderStaffOverview(main);
}
async function renderStaffOverview(main){
  main.innerHTML = `<section class="dashboard-hero-banner admin"><img src="assets/images/hero-dashboard.svg" alt="Professional admin dashboard banner"><div class="banner-overlay"></div><div class="banner-content"><div class="banner-copy"><span class="eyebrow">Administrative Control</span><h1>Admin Command Center</h1><p>Manage users, products, orders, wallet activity, and company withdrawals from one professional company workspace.</p><div class="banner-chips"><span class="hero-chip">Notion</span><span class="hero-chip">ClickUp</span></div></div><a class="btn gold" href="#staff-wallet">Open Wallet</a></div></section><div class="kpi-grid"><div class="kpi"><span class="muted">Revenue</span><strong id="stat-revenue">...</strong></div><div class="kpi"><span class="muted">Users</span><strong id="stat-users">...</strong></div><div class="kpi"><span class="muted">Products</span><strong id="stat-products">...</strong></div><div class="kpi"><span class="muted">Open Tickets</span><strong id="stat-tickets">...</strong></div></div><section class="workspace-grid"><div class="dash-card"><h2>Recent Activity</h2><div id="overview-activity" class="module-list">Loading...</div></div><div class="dash-card"><h2>Admin Shortcuts</h2><div class="app-actions"><a href="#staff-wallet" class="btn gold wide">Wallet & Withdraw</a><a href="#staff-products" class="btn dark wide">Upload Product</a><a href="#staff-users" class="btn light wide">Manage Users</a></div></div></section>`;
  try{ const data=await api('/api/staff/overview'); const s=data.stats || data; document.getElementById('stat-revenue').textContent=moneyFromNGN(s.revenueNGN || s.revenue || 0); document.getElementById('stat-users').textContent=s.users ?? s.userCount ?? 0; document.getElementById('stat-products').textContent=s.products ?? 0; document.getElementById('stat-tickets').textContent=s.openTickets ?? s.ticketCount ?? 0; }catch(err){ console.error(err); }
  try{ const {activities}=await api('/api/staff/activities'); const operational=(activities||[]).filter(a=>!['login','registration'].includes(String(a.type||'').toLowerCase()) && !/login|logged in|join free|registration|created an account/i.test(`${a.title||''} ${a.detail||''}`)); document.getElementById('overview-activity').innerHTML=operational.slice(0,8).map(activityItem).join('') || '<div class="empty-state">No product, support, payment, certificate or academy activity yet.</div>'; }catch(err){ document.getElementById('overview-activity').innerHTML=`<div class="notice error">${safe(err.message)}</div>`; }
}
function activityItem(a){ return `<div class="module"><div class="module row"><b>${safe(a.title || a.type)}</b><span class="badge info">${safe(a.type)}</span></div><p>${safe(a.detail||'')}</p><small class="muted">${safe(a.name||'System')} · ${new Date(a.createdAt).toLocaleString()}</small></div>`; }
async function renderStaffUsers(main){
  main.innerHTML = `<div class="app-title"><div><span class="eyebrow">User Management</span><h1>Users</h1><p>View users without changing backend permissions or auth rules.</p></div></div><div class="dash-card"><div id="user-list">Loading...</div></div>`;
  try{ const {users}=await api('/api/staff/users'); document.getElementById('user-list').innerHTML = `<div class="table-wrap"><table class="app-table"><thead><tr><th>Name</th><th>Email</th><th>Type</th><th>Student / Business Details</th><th>Role</th><th>Status</th></tr></thead><tbody>${(users||[]).map(u=>{ const details=u.accountType==='student' ? `${safe(u.schoolName||'-')}<br><small>ID: ${safe(u.studentIdNumber||u.studentId||'-')} · Enroll: ${safe(u.enrollmentNumber||'-')} · ${safe(u.department||'')}</small>` : `${safe(u.businessName||u.company||'-')}<br><small>${safe(u.businessType||'-')} · ${safe(u.country||'-')} · ${safe(u.serviceNeeded||'-')}</small>`; return `<tr><td>${safe(u.name)}</td><td>${safe(u.email)}</td><td><span class="badge info">${safe(u.accountType||'client')}</span></td><td>${details}</td><td><span class="badge info">${safe(u.role)}</span></td><td><span class="badge ${u.status==='active'?'success':'warn'}">${safe(u.status)}</span></td></tr>`; }).join('')}</tbody></table></div>`; }catch(err){ document.getElementById('user-list').innerHTML=`<div class="notice error">${safe(err.message)}</div>`; }
}
async function renderStaffProducts(main){
  main.innerHTML = `<div class="app-title"><div><span class="eyebrow">Product Management</span><h1>Product Uploads</h1><p>Uploaded products automatically appear on the homepage/product API and user dashboard.</p></div></div><section class="workspace-grid"><div class="dash-card"><h2>Create Product</h2><form class="app-form" data-product-form><label>Name<input name="name" required placeholder="Backend OS Demo"></label><label>Slug<input name="slug" placeholder="backend-os-demo"></label><label>Subtitle<input name="subtitle" placeholder="Short product promise"></label><label>Description<textarea name="description" placeholder="Product details"></textarea></label><label>Price USD<input type="number" name="priceUSD" required value="6.99" min="0" step="0.01"></label><input type="hidden" name="priceNGN" value="11184"><label>Category<input name="category" value="Backend OS"></label><label>Delivery Type<select name="deliveryType"><option value="digital">Digital</option><option value="service">Service</option></select></label><label>Image URL<input name="imageUrl" placeholder="/assets/images/uploads/image.png"></label><label>Download/File URL<input name="fileUrl" placeholder="/uploads/products/file.pdf"></label><label>YouTube Walkthrough URL<input name="youtubeUrl" placeholder="https://youtube.com/..."></label><label>Tags<input name="tags" placeholder="notion, clickup, finance"></label><button class="btn gold" type="submit">Create Product</button><div class="hidden" data-form-message></div></form></div><div class="dash-card"><h2>Upload Files</h2><form class="app-form" data-upload-form data-upload-type="image"><label>Product image<input type="file" name="file" accept="image/*" required></label><button class="btn light" type="submit">Upload Image</button><div class="hidden" data-form-message></div></form><hr><form class="app-form" data-upload-form data-upload-type="file"><label>Product file<input type="file" name="file" required></label><button class="btn light" type="submit">Upload Product File</button><div class="hidden" data-form-message></div></form></div></section><section class="section" style="padding-bottom:0"><div class="dash-card"><h2>Current Products</h2><div id="product-list" class="product-grid">Loading...</div></div></section>`;
  async function loadProducts(){ const list=document.getElementById('product-list'); try{ const {products}=await api('/api/products'); list.innerHTML=(products||[]).map(p=>productCard(p,false)).join('') || '<div class="empty-state">No products yet.</div>'; }catch(err){ list.innerHTML=`<div class="notice error">${safe(err.message)}</div>`; } }
  const productForm=main.querySelector('[data-product-form]');
  const syncUsdPrice=()=>{ const usd=Number(productForm.querySelector('[name=priceUSD]')?.value||0); const ngn=productForm.querySelector('[name=priceNGN]'); if(ngn) ngn.value=Math.round(usd * USD_NGN_RATE); };
  productForm.querySelector('[name=priceUSD]')?.addEventListener('input',syncUsdPrice); syncUsdPrice();
  productForm.addEventListener('submit',async e=>{ e.preventDefault(); const form=e.currentTarget, box=form.querySelector('[data-form-message]'); syncUsdPrice(); const data=Object.fromEntries(new FormData(form).entries()); try{ await api('/api/products',{method:'POST',body:JSON.stringify(data)}); showMsg(box,'Product created successfully.','success'); form.reset(); syncUsdPrice(); loadProducts(); }catch(err){ showMsg(box,err.message,'error'); } });
  main.querySelectorAll('[data-upload-form]').forEach(form=>form.addEventListener('submit',async e=>{ e.preventDefault(); const box=form.querySelector('[data-form-message]'); const type=form.dataset.uploadType === 'image' ? '?type=image' : ''; const fd=new FormData(form); try{ const data=await api(`/api/products/upload${type}`,{method:'POST',body:fd}); showMsg(box,`Uploaded: ${data.fileUrl}`,'success'); }catch(err){ showMsg(box,err.message,'error'); } }));
  loadProducts();
}
async function renderStaffOrders(main){
  main.innerHTML = `<div class="app-title"><div><span class="eyebrow">Payments</span><h1>Orders</h1><p>Payment records from the existing Paystack flow.</p></div></div><div class="dash-card"><div id="order-list">Loading...</div></div>`;
  try{ const {orders}=await api('/api/staff/orders'); document.getElementById('order-list').innerHTML=`<div class="table-wrap"><table class="app-table"><thead><tr><th>Name</th><th>Email</th><th>Product</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead><tbody>${(orders||[]).map(o=>`<tr><td>${safe(o.name||'-')}</td><td>${safe(o.email)}</td><td>${safe(o.productSlug)}</td><td>${orderMoney(o)}</td><td><span class="badge ${o.status==='paid'?'success':'warn'}">${safe(o.status)}</span></td><td>${new Date(o.createdAt).toLocaleDateString()}</td></tr>`).join('')}</tbody></table></div>`; }catch(err){ document.getElementById('order-list').innerHTML=`<div class="notice error">${safe(err.message)}</div>`; }
}
async function renderStaffWallet(main){
  main.innerHTML = `<div class="app-title"><div><span class="eyebrow">Tyna Systems LLC</span><h1>Wallet & Payout</h1><p>View clean business sales balance and withdraw available company funds.</p></div><a class="btn light" href="#staff-orders">View Orders</a></div><div class="kpi-grid"><div class="kpi"><span class="muted">Gross Sales</span><strong id="wallet-gross">...</strong></div><div class="kpi"><span class="muted">Processing Fees</span><strong id="wallet-fees">...</strong></div><div class="kpi"><span class="muted">Pending Withdrawals</span><strong id="wallet-pending">...</strong></div><div class="kpi"><span class="muted">Available</span><strong id="wallet-available">...</strong></div></div><section class="workspace-grid"><div class="dash-card"><h2>Quick Withdraw</h2><form class="app-form" data-wallet-withdraw><label>Amount (USD)<input type="number" step="0.01" min="1" name="amount" required></label><div class="notice info">Admin withdrawals are locked to the Tyna Systems company bank configured in Render environment variables.</div><label>Notes<textarea name="notes" placeholder="Example: Company wallet payout"></textarea></label><button class="btn gold" type="submit">Withdraw from Wallet</button><div class="hidden" data-form-message></div></form></div><div class="dash-card"><h2>Wallet Rules</h2><div class="module-list"><div class="module"><b>Sales credit</b><p>Paid orders credit Tyna Systems LLC after Paystack verification.</p></div><div class="module"><b>Charges</b><p>Only standard payment processor fees are considered in available balance when Paystack returns fee data.</p></div><div class="module"><b>Withdrawals</b><p>Pending and completed withdrawals reduce available wallet balance for safer company payout tracking.</p></div></div></div></section><section class="section" style="padding-bottom:0"><div class="dash-card"><h2>Recent Withdrawals</h2><div id="wallet-withdrawals" class="module-list">Loading...</div></div></section>`;
  async function loadWallet(){
    try{ const {wallet}=await api('/api/staff/wallet'); document.getElementById('wallet-gross').textContent=money(wallet.grossUSD); document.getElementById('wallet-fees').textContent=money(wallet.feeUSD); document.getElementById('wallet-pending').textContent=money(wallet.pendingWithdrawalsUSD); document.getElementById('wallet-available').textContent=money(wallet.availableUSD); const amount=main.querySelector('[name=amount]'); if(amount && !amount.value) amount.value=Math.max(0, Number(wallet.availableUSD||0)).toFixed(2); document.getElementById('wallet-withdrawals').innerHTML=(wallet.withdrawals||[]).map(w=>`<div class="module"><div class="module row"><b>${money(w.amount)}</b><span class="badge ${w.status==='completed'?'success':w.status==='rejected'?'warn':'info'}">${safe(w.status)}</span></div><small class="muted">Secured company payout · ${new Date(w.createdAt).toLocaleDateString()}</small></div>`).join('') || '<div class="empty-state">No withdrawals yet.</div>'; }
    catch(err){ document.getElementById('wallet-withdrawals').innerHTML=`<div class="notice error">${safe(err.message)}</div>`; }
  }
  const form=main.querySelector('[data-wallet-withdraw]'); form.addEventListener('submit',async e=>{ e.preventDefault(); const box=form.querySelector('[data-form-message]'); try{ await api('/api/staff/withdrawals',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(form).entries()))}); showMsg(box,'Withdrawal request submitted.','success'); form.reset(); await loadWallet(); }catch(err){ showMsg(box,err.message,'error'); } });
  loadWallet();
}

async function renderStaffWithdrawals(main){
  main.innerHTML = `<div class="app-title"><div><span class="eyebrow">Financial System</span><h1>Withdrawals</h1><p>Track company wallet payout requests.</p></div><a class="btn gold" href="#staff-wallet">Withdraw from Wallet</a></div><section class="workspace-grid"><div class="dash-card"><h2>Request Payout</h2><form class="app-form" data-withdrawal-form><label>Amount (USD)<input type="number" name="amount" required></label><div class="notice info">Admin withdrawals are locked to the Tyna Systems company bank configured in Render environment variables.</div><label>Notes<textarea name="notes" placeholder="Optional note"></textarea></label><button class="btn gold" type="submit">Submit Request</button><div class="hidden" data-form-message></div></form></div><div class="dash-card"><h2>Withdrawal History</h2><div id="withdrawal-list" class="module-list">Loading...</div></div></section>`;
  const form=main.querySelector('[data-withdrawal-form]'); form.addEventListener('submit',async e=>{ e.preventDefault(); const box=form.querySelector('[data-form-message]'); try{ await api('/api/staff/withdrawals',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(form).entries()))}); showMsg(box,'Withdrawal request submitted.','success'); form.reset(); loadWithdrawals(); }catch(err){ showMsg(box,err.message,'error'); } });
  async function loadWithdrawals(){ const box=document.getElementById('withdrawal-list'); try{ const {withdrawals}=await api('/api/staff/withdrawals'); box.innerHTML=(withdrawals||[]).map(w=>`<div class="module"><div class="module row"><b>${money(w.amount)}</b><span class="badge ${w.status==='completed'?'success':'info'}">${safe(w.status)}</span></div><small class="muted">Secured company payout · ${new Date(w.createdAt).toLocaleDateString()}</small></div>`).join('') || '<div class="empty-state">No requests yet.</div>'; }catch(err){ box.innerHTML=`<div class="notice error">${safe(err.message)}</div>`; } }
  loadWithdrawals();
}

async function renderStaffActivity(main){
  main.innerHTML = `<div class="app-title"><div><span class="eyebrow">Notifications & Activity</span><h1>User Activity Log</h1><p>Registration, login, dashboard, purchase, support and staff actions.</p></div></div><div class="dash-card"><div id="activity-list" class="module-list">Loading...</div></div>`;
  try{ const {activities}=await api('/api/staff/activities'); document.getElementById('activity-list').innerHTML=(activities||[]).map(activityItem).join('') || '<div class="empty-state">No activity recorded.</div>'; }catch(err){ document.getElementById('activity-list').innerHTML=`<div class="notice error">${safe(err.message)}</div>`; }
}

function devFiles(files=[]){ return files.length ? `<div class="dev-files">${files.map(f=>`<a class="badge info" href="${safe(f.url)}" target="_blank" rel="noreferrer">📎 ${safe(f.originalName || f.filename)} (${Math.round((f.size||0)/1024)} KB)</a>`).join('')}</div>` : ''; }
function devChat(messages=[]){ return `<div class="dev-chat-window dashboard-chat">${messages.map(m=>`<div class="chat-bubble ${m.sender==='developer'?'developer':'student'}"><b>${m.sender==='developer'?'Developer':safe(m.name||'Student')}</b><p>${safe(m.message||'')}</p>${devFiles(m.files||[])}<small>${new Date(m.createdAt||Date.now()).toLocaleString()}</small></div>`).join('') || '<div class="empty-state">No messages yet.</div>'}</div>`; }
function requestCard(r){ return `<article class="dev-request-card" data-request-id="${safe(r.id)}"><div class="module row"><div><span class="badge ${r.status==='new'?'warn':'info'}">${safe(r.status)}</span> <span class="badge">${safe(r.priority)}</span><h3>${safe(r.title)}</h3><p><b>${safe(r.studentName)}</b> · ${safe(r.studentEmail)} ${r.studentPhone?`· ${safe(r.studentPhone)}`:''}</p><small class="muted">${safe(r.serviceType)} · ${new Date(r.lastMessageAt||r.createdAt).toLocaleString()}</small></div><div class="app-actions"><select data-status><option value="new" ${r.status==='new'?'selected':''}>New</option><option value="in_review" ${r.status==='in_review'?'selected':''}>In review</option><option value="in_progress" ${r.status==='in_progress'?'selected':''}>In progress</option><option value="completed" ${r.status==='completed'?'selected':''}>Completed</option><option value="closed" ${r.status==='closed'?'selected':''}>Closed</option></select></div></div>${devChat(r.messages||[])}<form class="app-form compact-form" data-dev-dashboard-reply><input type="hidden" name="requestId" value="${safe(r.id)}"><label>Developer Reply<textarea name="message" rows="3" placeholder="Reply like WhatsApp..."></textarea></label><label>Attach files<input type="file" name="files" multiple></label><button class="btn gold small" type="submit">Send Reply</button><div class="hidden" data-form-message></div></form></article>`; }
async function initDevDashboard(){
  bindDevHashRouter(initDevDashboard);
  await requireLogin('developer');
  const active=(location.hash||'#requests').replace('#','') || 'requests';
  document.body.innerHTML=devShell(active); bindLogout(); bindDashboardNavigation(initDevDashboard); const main=document.getElementById('appMain');
  if(active==='activity') return renderDevActivity(main);
  if(active==='users') return renderDevUsers(main);
  if(active==='chat') return renderStaffChat(main);
  if(active==='payments') return renderDevPayments(main);
  if(active==='academy') return renderAcademyAdmin(main, 'developer');
  if(active==='certificates') return renderAcademyCertificates(main, 'developer');
  if(active==='maintenance') return renderDevMaintenance(main);
  if(active==='spy') return renderDevSpy(main);
  return renderDevRequests(main);
}
async function renderDevRequests(main){
  main.innerHTML=`<div class="app-title"><div><span class="eyebrow">Developer Dashboard</span><h1>Student Developer Requests</h1><p>Receive student project activities from the public developer page. This dashboard is separate from users and staff pages.</p></div><a class="btn gold" href="developer.html">Open Public Page</a></div><div class="kpi-grid"><div class="kpi"><span class="muted">Total</span><strong data-dev-stat="total">0</strong></div><div class="kpi"><span class="muted">New</span><strong data-dev-stat="fresh">0</strong></div><div class="kpi"><span class="muted">In Progress</span><strong data-dev-stat="inProgress">0</strong></div><div class="kpi"><span class="muted">Completed</span><strong data-dev-stat="completed">0</strong></div></div><div class="dash-card"><h2>Student chats</h2><div id="dev-request-list" class="module-list">Loading...</div></div>`;
  try{ const {stats}=await api('/api/developer/dashboard/overview'); Object.entries(stats||{}).forEach(([k,v])=>{ const el=main.querySelector(`[data-dev-stat="${k}"]`); if(el) el.textContent=v; }); }catch{}
  async function load(){ const list=document.getElementById('dev-request-list'); try{ const {requests}=await api('/api/developer/dashboard/requests'); list.innerHTML=(requests||[]).map(requestCard).join('') || '<div class="empty-state">No developer requests yet.</div>'; bindDevRequestActions(list, load); }catch(err){ list.innerHTML=`<div class="notice error">${safe(err.message)}</div>`; } }
  load();
}
function bindDevRequestActions(root, reload){
  root.querySelectorAll('[data-status]').forEach(sel=>sel.addEventListener('change',async()=>{ const card=sel.closest('[data-request-id]'); try{ await api(`/api/developer/dashboard/requests/${card.dataset.requestId}`,{method:'PATCH',body:JSON.stringify({status:sel.value})}); reload(); }catch(err){ alert(err.message); } }));
  root.querySelectorAll('[data-dev-dashboard-reply]').forEach(form=>form.addEventListener('submit',async e=>{ e.preventDefault(); const box=form.querySelector('[data-form-message]'); const fd=new FormData(form); const id=fd.get('requestId'); fd.delete('requestId'); try{ await api(`/api/developer/dashboard/requests/${id}/reply`,{method:'POST',body:fd}); showMsg(box,'Reply sent.','success'); form.reset(); reload(); }catch(err){ showMsg(box,err.message,'error'); } }));
}
async function renderDevActivity(main){
  main.innerHTML=`<div class="app-title"><div><span class="eyebrow">Developer Activity</span><h1>Developer actions and messages</h1><p>Latest developer requests, replies and dashboard actions.</p></div></div><div class="dash-card"><div id="dev-activity-list" class="module-list">Loading...</div></div>`;
  try{ const {activities}=await api('/api/developer/dashboard/activities'); document.getElementById('dev-activity-list').innerHTML=(activities||[]).map(activityItem).join('') || '<div class="empty-state">No developer activity recorded yet.</div>'; }catch(err){ document.getElementById('dev-activity-list').innerHTML=`<div class="notice error">${safe(err.message)}</div>`; }
}


async function renderDevUsers(main){
  main.innerHTML=`<div class="app-title"><div><span class="eyebrow">Developer Full Control</span><h1>Users & Roles</h1><p>Developer can manage user status and roles while existing backend authentication rules stay unchanged.</p></div></div><div class="dash-card"><div id="dev-user-list">Loading...</div></div>`;
  try{
    const {users}=await api('/api/developer/dashboard/users');
    document.getElementById('dev-user-list').innerHTML=`<div class="table-wrap"><table class="app-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Social Duty</th><th>Status</th><th>Update</th></tr></thead><tbody>${(users||[]).map(u=>`<tr data-user-id="${safe(u._id||u.id)}"><td>${safe(u.name)}</td><td>${safe(u.email)}</td><td><select data-dev-user-role><option value="client" ${u.role==='client'?'selected':''}>Client</option><option value="social_worker" ${u.role==='social_worker'?'selected':''}>Social Worker</option><option value="staff" ${u.role==='staff'?'selected':''}>Admin Team</option><option value="developer" ${u.role==='developer'?'selected':''}>Developer</option><option value="admin" ${u.role==='admin'?'selected':''}>Admin</option></select></td><td><select data-dev-worker-role><option value="general" ${u.workerRole==='general'?'selected':''}>General</option><option value="operations_systems_manager" ${u.workerRole==='operations_systems_manager'?'selected':''}>Operations Systems Manager</option><option value="chartered_accountant" ${u.workerRole==='chartered_accountant'?'selected':''}>Chartered Accountant</option><option value="client_relationship_manager" ${u.workerRole==='client_relationship_manager'?'selected':''}>Client Relationship Manager</option></select></td><td><select data-dev-user-status><option value="active" ${u.status==='active'?'selected':''}>Active</option><option value="blocked" ${u.status==='blocked'?'selected':''}>Blocked</option></select></td><td><button class="btn gold small" data-dev-save-user>Save</button></td></tr>`).join('')}</tbody></table></div>`;
    document.querySelectorAll('[data-dev-save-user]').forEach(btn=>btn.addEventListener('click',async()=>{ const row=btn.closest('[data-user-id]'); try{ await api(`/api/developer/dashboard/users/${row.dataset.userId}`,{method:'PATCH',body:JSON.stringify({role:row.querySelector('[data-dev-user-role]').value, workerRole:row.querySelector('[data-dev-worker-role]').value, status:row.querySelector('[data-dev-user-status]').value})}); btn.textContent='Saved'; setTimeout(()=>btn.textContent='Save',1200); }catch(err){ alert(err.message); } }));
  }catch(err){ document.getElementById('dev-user-list').innerHTML=`<div class="notice error">${safe(err.message)}</div>`; }
}
async function renderDevPayments(main){
  main.innerHTML=`<div class="app-title"><div><span class="eyebrow">Developer Wallet</span><h1>Developer Wallet</h1><p>Verified product payments are recorded privately and can be managed only from the developer workspace.</p></div></div><div class="kpi-grid"><div class="kpi"><span class="muted">Total Credits</span><strong id="dev-wallet-gross">...</strong></div><div class="kpi"><span class="muted">Pending Withdrawals</span><strong id="dev-wallet-pending">...</strong></div><div class="kpi"><span class="muted">Available</span><strong id="dev-wallet-available">...</strong></div><div class="kpi"><span class="muted">Currency</span><strong id="dev-wallet-currency">USD</strong></div></div><section class="workspace-grid"><div class="dash-card"><h2>Withdraw Developer Wallet</h2><form class="app-form" data-dev-wallet-withdraw><label>Amount (USD)<input type="number" step="0.01" min="1" name="amount" required></label><label>Bank Name<input name="bankName" placeholder="Any bank name" required></label><label>Account Number<input name="accountNumber" placeholder="Account number / IBAN" required></label><label>Account Name<input name="accountName" placeholder="Account holder name" required></label><label>Notes<textarea name="notes" placeholder="Optional withdrawal note"></textarea></label><button class="btn gold" type="submit">Withdraw with Token/PIN Access</button><div class="hidden" data-form-message></div></form></div><div class="dash-card"><div class="module row"><div><h2>SP WorldTech Forwarding Token</h2><p class="muted">Create a lifetime secure token for SP WorldTech admin. The token is shown once and stays active permanently.</p></div><button class="btn gold small" type="button" id="create-spw-token">Create Token</button></div><div id="spw-token-output" class="module-list"></div><div id="spw-token-list" class="module-list">Loading tokens...</div></div></section><section class="workspace-grid"><div class="dash-card"><h2>Payment Records</h2><div id="dev-wallet-transactions" class="module-list">Loading...</div></div><div class="dash-card"><h2>Payment Orders</h2><div id="dev-payment-list">Loading...</div></div></section>`;
  async function loadWallet(){
    const {wallet}=await api('/api/developer/dashboard/wallet');
    document.getElementById('dev-wallet-gross').textContent=moneyCurrency(wallet.grossUSD, wallet.currency || 'USD');
    document.getElementById('dev-wallet-pending').textContent=moneyCurrency(wallet.pendingWithdrawalsUSD, wallet.currency || 'USD');
    document.getElementById('dev-wallet-available').textContent=moneyCurrency(wallet.availableUSD, wallet.currency || 'USD');
    document.getElementById('dev-wallet-currency').textContent=wallet.currency || 'USD';
    const amount=main.querySelector('[name=amount]'); if(amount && !amount.value) amount.value=Math.max(0, Number(wallet.availableUSD||0)).toFixed(2);
    document.getElementById('dev-wallet-transactions').innerHTML=(wallet.transactions||[]).map(tx=>`<div class="module"><div class="module row"><b>${moneyCurrency(tx.amount, tx.currency || wallet.currency || 'USD')}</b><span class="badge success">${safe(tx.type||'credit')}</span></div><p>${safe(tx.description)}</p><small class="muted">${safe(tx.reference||'')} · ${new Date(tx.createdAt).toLocaleDateString()}</small></div>`).join('') || '<div class="empty-state">No Developer Wallet credits yet.</div>';
  }
  async function loadTokens(){
    const box=document.getElementById('spw-token-list');
    try{
      const {tokens}=await api('/api/dev-token/dashboard/list');
      box.innerHTML=(tokens||[]).map(t=>`<div class="module"><div class="module row"><div><b>${safe(t.allowedSystem||'spworldtech')}</b><p class="muted">Status: ${safe(t.status)} · Lifetime active</p></div></div></div>`).join('') || '<div class="empty-state">No forwarding tokens created yet.</div>';
    }catch(err){ box.innerHTML=`<div class="notice error">${safe(err.message)}</div>`; }
  }
  main.querySelector('#create-spw-token')?.addEventListener('click',async()=>{
    const out=document.getElementById('spw-token-output');
    try{
      const data=await api('/api/dev-token/dashboard/create',{method:'POST',body:JSON.stringify({})});
      out.innerHTML=`<div class="notice success"><b>Token created. Copy it now; it will not be shown again.</b></div><textarea readonly rows="5" style="width:100%;margin-top:10px">${safe(data.token)}</textarea><p class="muted">Paste this in the SP WorldTech admin token connection form. Lifetime token stays active permanently.</p>`;
      await loadTokens();
    }catch(err){ out.innerHTML=`<div class="notice error">${safe(err.message)}</div>`; }
  });
  const form=main.querySelector('[data-dev-wallet-withdraw]'); form.addEventListener('submit',async e=>{ e.preventDefault(); const box=form.querySelector('[data-form-message]'); try{ await api('/api/developer/dashboard/withdrawals',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(form).entries()))}); showMsg(box,'Developer wallet withdrawal authorized.','success'); form.reset(); await loadWallet(); }catch(err){ showMsg(box,err.message,'error'); } });
  try{ await loadWallet(); }catch(err){ document.getElementById('dev-wallet-transactions').innerHTML=`<div class="notice error">${safe(err.message)}</div>`; }
  await loadTokens();
  try{ const {orders}=await api('/api/developer/dashboard/orders'); document.getElementById('dev-payment-list').innerHTML=`<div class="table-wrap"><table class="app-table"><thead><tr><th>Name</th><th>Email</th><th>Product</th><th>Total Paid</th><th>Status</th><th>Date</th></tr></thead><tbody>${(orders||[]).map(o=>`<tr><td>${safe(o.name||o.user?.name||'-')}</td><td>${safe(o.email||o.user?.email||'-')}</td><td>${safe(o.productSlug||o.product?.name||'-')}</td><td>${orderMoney(o)}</td><td><span class="badge ${o.status==='paid'?'success':'warn'}">${safe(o.status)}</span></td><td>${new Date(o.createdAt).toLocaleDateString()}</td></tr>`).join('')}</tbody></table></div>`; }catch(err){ document.getElementById('dev-payment-list').innerHTML=`<div class="notice error">${safe(err.message)}</div>`; }
}

async function renderDevMaintenance(main){
  main.innerHTML=`<div class="app-title"><div><span class="eyebrow">Developer Control</span><h1>Maintenance Mode</h1><p>Controls public website availability while company workspaces remain accessible.</p></div></div><section class="workspace-grid"><div class="dash-card"><h2>System switch</h2><form class="app-form" data-maintenance-form><label>Status<select name="enabled"><option value="false">Website Active</option><option value="true">Maintenance Mode On</option></select></label><label>Public Message<textarea name="message" rows="4">Tyna Systems is under professional maintenance. Please check back shortly.</textarea></label><button class="btn gold" type="submit">Save Maintenance Mode</button><div class="hidden" data-form-message></div></form></div><div class="dash-card"><h2>System availability</h2><p>When enabled, public forms and customer actions display the maintenance message. Company dashboard access remains open for approved work.</p><div id="maintenance-current" class="notice info">Loading current mode...</div></div></section>`;
  const form=main.querySelector('[data-maintenance-form]'); const current=document.getElementById('maintenance-current');
  try{ const {maintenance}=await api('/api/settings/maintenance'); form.enabled.value=String(Boolean(maintenance.enabled)); form.message.value=maintenance.message||form.message.value; current.textContent=maintenance.enabled?'Maintenance mode is currently ON.':'Website is currently ACTIVE.'; current.className=`notice ${maintenance.enabled?'warn':'success'}`; }catch(err){ current.className='notice error'; current.textContent=err.message; }
  form.addEventListener('submit',async e=>{ e.preventDefault(); const box=form.querySelector('[data-form-message]'); const payload={enabled: form.enabled.value==='true', message: form.message.value}; try{ const data=await api('/api/settings/maintenance',{method:'PATCH',body:JSON.stringify(payload)}); showMsg(box,data.message||'Maintenance updated.','success'); current.textContent=data.maintenance.enabled?'Maintenance mode is currently ON.':'Website is currently ACTIVE.'; current.className=`notice ${data.maintenance.enabled?'warn':'success'}`; }catch(err){ showMsg(box,err.message,'error'); } });
}



const academyLearningPages = {
  'html': 'academy-html.html',
  'css': 'academy-css.html',
  'javascript': 'academy-javascript.html',
  'python': 'academy-python.html',
  'react': 'academy-react.html',
  'node': 'academy-node.html',
  'express': 'academy-express.html',
  'mongodb': 'academy-mongodb.html',
  'git-github': 'academy-git-github.html',
  'cloud-render': 'academy-cloud-render.html',
  'cpp': 'academy-cpp.html',
  'csharp': 'academy-csharp.html',
  'csharp-dotnet': 'academy-csharp-dotnet.html',
  'html-foundations': 'academy-html-foundations.html',
  'css-professional-ui': 'academy-css-professional-ui.html',
  'javascript-core': 'academy-javascript-core.html',
  'python-for-builders': 'academy-python-for-builders.html',
  'django-backend': 'academy-django.html',
  'react-frontend': 'academy-react-frontend.html',
  'node-express-api': 'academy-node-express-api.html',
  'mongodb-backend': 'academy-mongodb-backend.html',
  'premium-school-1': 'academy-premium-school-1.html',
  'premium-school-2': 'academy-premium-school-2.html',
  'premium-school-3': 'academy-premium-school-3.html'
};
const academyLessonPlans = {
  'html': ['HTML setup','Text and headings','Links and images','Lists and tables','Forms','Semantic sections','SEO basics','Build a complete page'],
  'css': ['CSS setup','Selectors','Colors and typography','Box model','Flexbox','Grid','Responsive design','Build a modern layout'],
  'javascript': ['Variables','Functions','Arrays','Objects','DOM selection','Events','Forms','Fetch API','Local storage','Build interactivity'],
  'python': ['Python setup','Variables','Conditions','Loops','Functions','Lists and dictionaries','Files','Errors','Mini automation project'],
  'react': ['Components','Props','State','Forms','Routing','API fetch','Reusable UI','Deploy React app'],
  'node': ['Node setup','NPM scripts','Modules','File system','HTTP basics','Environment variables','Build a Node service'],
  'express': ['Express setup','Routes','Controllers','Middleware','Validation','Error handling','REST API','Deploy Express API'],
  'mongodb': ['MongoDB setup','Collections','Documents','Mongoose schemas','Queries','Updates','Relationships','Production database'],
  'git-github': ['Git setup','Repository basics','Commit workflow','Branches','GitHub push','Pull requests','README','Deploy from GitHub'],
  'cloud-render': ['Render account setup','Static site deploy','Backend service deploy','Environment variables','Custom domain','Logs','Production checks'],
  'cpp': ['C++ setup','Variables','Input/output','Conditions','Loops','Functions','Arrays','Mini console project'],
  'csharp': ['C# setup','Variables','Classes','Methods','Collections','LINQ basics','Console project','App structure'],
  'csharp-dotnet': ['.NET setup','Project structure','Controllers','Services','Database connection','Authentication overview','Build API','Deploy .NET app'],
  'html-foundations': ['HTML document setup','Headings and content sections','Links, images and media','Forms and inputs','Semantic layout','Tables and lists','SEO basics','Build one landing page'],
  'css-professional-ui': ['CSS setup and selectors','Colors, spacing and typography','Flexbox layout','CSS grid layout','Responsive design','Buttons and cards','Hero sections','Forms styling','Professional animations','Build one modern UI page'],
  'javascript-core': ['Variables and data','Functions','Arrays and objects','DOM selection','Click events','Form validation','Local storage','Fetch API basics','Error handling','Modules concept','Dashboard interactions','Build an interactive page'],
  'python-for-builders': ['Python setup','Variables and types','Conditions','Loops','Functions','Lists and dictionaries','Files','Error handling','Simple automation','Working with data','Mini backend concepts','Build a Python script'],
  'django-backend': ['Django setup','Project and app structure','URLs and views','Templates','Static files','Models','Admin panel','Forms','Authentication overview','Database migrations','REST API basics','Deployment preparation'],
  'react-frontend': ['React project structure','Components','Props','State','Forms','Routing','API fetch','Dashboard UI','Protected UI states','Reusable cards','Deployment preparation','Code organization','Project review','Build React frontend'],
  'node-express-api': ['Node setup','Express server','Routes','Controllers','Middleware','Validation','Authentication overview','REST API patterns','File uploads','Error handling','Production settings','API documentation','Deployment checklist','Build API service'],
  'mongodb-backend': ['MongoDB connection','Mongoose schemas','User records','Course records','Progress records','Queries','Updates','Relationships','Security rules','Production database setup'],
  'premium-school-1': ['Project planning','Professional homepage','About page','Services page','Contact page','Resources page','Responsive layout','Assets and branding','Forms wiring','API-ready frontend','Quality review','Deployment preparation','Client delivery notes','Portfolio presentation','Final review','Submit project'],
  'premium-school-2': ['Auth planning','Login page','Join page','User dashboard','Admin dashboard','Developer dashboard','Protected routing','Access levels','Student records','Progress tracking','API connection','Error states','Dashboard tables','Control buttons','Testing','Deployment settings','Security review','Submit dashboard'],
  'premium-school-3': ['Job-ready project brief','Database design','Frontend pages','Backend routes','Dashboard controls','Learning access','Certificate logic','Future job API plan','Admin review','Developer review','Bug fixing','Deployment','Documentation','Demo video','Portfolio page','Professional handover','Final defense','Certificate request','Career readiness','Submit Premium School 3']
};
const academyCourseAliases = {
  'html-foundations': 'html',
  'css-professional-ui': 'css',
  'javascript-core': 'javascript',
  'python-for-builders': 'python',
  'django-backend': 'django',
  'react-frontend': 'react',
  'node-express-api': 'node-express',
  'mongodb-backend': 'mongodb'
};
function normalizeAcademyCourseId(courseId=''){
  const id = String(courseId || '').trim();
  return id || 'html';
}
function academyPageFor(courseId){ return academyLearningPages[courseId] || `academy-course.html?course=${encodeURIComponent(courseId)}`; }
function academyLessonTitles(course){
  const id = course?.id || course?.slug || '';
  const apiLessons = (course?.lessonItems || []).filter(l=>l && l.title);
  if(apiLessons.length) return apiLessons.map((l,i)=>({ title:l.title, body:l.body || `Practice ${l.title} and save your progress.`, order:l.order || i+1 }));
  const titles = academyLessonPlans[id] || academyLessonPlans[academyCourseAliases[id]] || Array.from({length:Number(course?.lessons||1)},(_,i)=>`Lesson ${i+1}`);
  return titles.map((title,i)=>({ title, body:`Study ${title}, practice the code task, run it in the practice terminal, then mark progress for this lesson.`, order:i+1 }));
}
function academyQuizHtml(course){
  const quiz = Array.isArray(course?.quiz) && course.quiz.length ? course.quiz : [
    { question:`What should you do after each ${course?.title || 'course'} lesson?`, options:['Practice and save progress','Close the page','Skip the project'], answerIndex:0, explanation:'The academy is practical. Students learn, practice, and save progress.' },
    { question:'What happens after Premium School 3?', options:['Certificate review can be awarded','Learning stops forever','Dashboard is deleted'], answerIndex:0, explanation:'Admin or Developer can award the certificate after the required premium path.' }
  ];
  return `<div class="module-list academy-quiz-list">${quiz.map((q,qi)=>`<div class="module academy-quiz-item" data-quiz-question="${qi}" data-answer="${Number(q.answerIndex||0)}"><b>${qi+1}. ${safe(q.question)}</b><div class="quiz-options">${(q.options||[]).map((opt,oi)=>`<button type="button" class="btn light small" data-quiz-option="${oi}">${safe(opt)}</button>`).join('')}</div><p class="muted" data-quiz-feedback>${safe(q.explanation || 'Choose the best answer.')}</p></div>`).join('')}</div>`;
}
function academyCourseView(course, enrollment={}, done=0, serviceNotice=''){
  const lessons = academyLessonTitles(course);
  const total = Number(course.lessons || lessons.length || 1);
  const titleText = course.title || 'Course';
  const projectName = `${titleText} professional mini project`;
  const outcomes = course.outcomes || [
    `Understand the real purpose of ${titleText} in modern software projects.`,
    'Practice each lesson with a small task instead of only reading theory.',
    'Build a portfolio-ready mini project and save learning progress.',
    'Prepare for quiz review and Tyna Coding Academy certificate path.'
  ];
  return `<div class="app-title"><div><span class="eyebrow">${safe(course.track || 'Coding Academy')} · ${safe(course.level || 'basic')}</span><h1>${safe(titleText)}</h1><p>${safe(course.description || 'Learn with structured lessons, practice, quiz review and project work.')}</p></div><a class="btn light" href="dashboard.html#academy">Back to Academy Dashboard</a></div>${serviceNotice}<div class="kpi-grid"><div class="kpi"><span class="muted">Access Level</span><strong>${safe(enrollment.accessLevel || 'basic')}</strong></div><div class="kpi"><span class="muted">Course Status</span><strong>Open</strong></div><div class="kpi"><span class="muted">Progress</span><strong>${done}/${total}</strong></div><div class="kpi"><span class="muted">Certificate</span><strong>${safe(enrollment.certificateStatus || 'not_eligible')}</strong></div></div><section class="workspace-grid academy-learning-workspace"><div class="dash-card"><h2>Course Roadmap</h2><p class="muted">Open each lesson, read the goal, complete the practice task, run your code, then save progress.</p><div class="module-list academy-lesson-list">${lessons.map((lesson,i)=>`<button type="button" class="module row academy-lesson-button ${i===0?'active':''}" data-lesson-index="${i}"><span><b>${i+1}. ${safe(lesson.title)}</b><small class="muted">${i < done ? 'Completed' : 'Ready to learn'}</small></span><span class="badge ${i < done ? 'success' : 'info'}">${i < done ? 'Done' : 'Open'}</span></button>`).join('')}</div><div class="app-actions" style="margin-top:18px"><button class="btn gold" data-course-progress="${safe(course.id || course.slug)}">Mark Full Course Complete</button><a class="btn light" href="support-workspace.html">Ask for Help</a></div></div><div class="dash-card academy-lesson-detail"><h2 data-active-lesson-title>${safe(lessons[0]?.title || 'Lesson')}</h2><p data-active-lesson-body>${safe(lessons[0]?.body || 'Practice this lesson and save your progress.')}</p><div class="notice info"><b>Real assignment:</b> Build a small working example from this lesson. Explain what it does and why it matters in a real client project.</div><div class="module-list" style="margin-top:14px"><div class="module"><b>Learning outcomes</b><ul>${outcomes.map(o=>`<li>${safe(o)}</li>`).join('')}</ul></div><div class="module"><b>Portfolio task</b><p>Create: ${safe(projectName)}. Keep your code clean, test it, and prepare it for review.</p></div></div><div class="app-actions" style="margin:14px 0"><button class="btn dark small" data-save-current-lesson>Save This Lesson Progress</button></div>${academyTerminalHtml(course)}</div></section><section class="section" style="padding:22px 0 0"><div class="dash-card"><h2>Quiz Practice</h2><p class="muted">Use the quiz to confirm understanding before moving to the next lesson.</p>${academyQuizHtml(course)}</div></section>`;
}

function bindAcademyCoursePage(main, course, enrollment={}){
  const lessons = academyLessonTitles(course);
  let activeIndex=0;
  const title=main.querySelector('[data-active-lesson-title]');
  const body=main.querySelector('[data-active-lesson-body]');
  function selectLesson(index){
    activeIndex = Number(index)||0;
    const lesson = lessons[activeIndex] || lessons[0];
    if(title) title.textContent = lesson?.title || 'Lesson';
    if(body) body.textContent = lesson?.body || 'Practice this lesson and save your progress.';
    main.querySelectorAll('[data-lesson-index]').forEach(btn=>btn.classList.toggle('active', Number(btn.dataset.lessonIndex)===activeIndex));
  }
  main.querySelectorAll('[data-lesson-index]').forEach(btn=>btn.addEventListener('click',()=>selectLesson(btn.dataset.lessonIndex)));
  main.querySelector('[data-save-current-lesson]')?.addEventListener('click',async()=>{
    try{ await api(`/api/academy/progress/${course.id || course.slug}`,{method:'PATCH',body:JSON.stringify({completedLessons:Math.max(activeIndex+1, Number(academyProgressFor(enrollment, course.id || course.slug).completedLessons||0))})}); initAcademyCourse(); }
    catch(err){ alert(err.message); }
  });
  main.querySelector('[data-course-progress]')?.addEventListener('click',async()=>{ try{ await api(`/api/academy/progress/${course.id || course.slug}`,{method:'PATCH',body:JSON.stringify({completedLessons:course.lessons || lessons.length})}); initAcademyCourse(); }catch(err){ alert(err.message); } });
  main.querySelectorAll('[data-quiz-option]').forEach(btn=>btn.addEventListener('click',()=>{ const wrap=btn.closest('[data-quiz-question]'); const feedback=wrap?.querySelector('[data-quiz-feedback]'); const correct=Number(btn.dataset.quizOption)===Number(wrap?.dataset.answer||0); if(feedback){ feedback.className = correct ? 'notice success' : 'notice error'; feedback.textContent = correct ? 'Correct. Good job — continue learning.' : 'Not correct yet. Review the lesson and try again.'; } }));
  bindAcademyTerminal(main, course);
}

function academyLevelBadge(level){ return level === 'basic' ? 'success' : (level === 'advanced' ? 'info' : 'warn'); }
function academyProgressFor(enrollment, courseId){ return (enrollment?.progress || []).find(p => p.courseId === courseId) || {}; }

function fallbackAcademyCourses(){
  return [
    {id:'python',title:'Python',track:'Programming',level:'basic',lessons:9,description:'Learn Python syntax, logic, functions, files and automation practice.',locked:false,logo:'PY'},
    {id:'html',title:'HTML',track:'Frontend',level:'basic',lessons:8,description:'Create professional page structure, forms, links, images and clean sections.',locked:false,logo:'HTML'},
    {id:'css',title:'CSS',track:'Frontend',level:'basic',lessons:8,description:'Design responsive layouts, cards, buttons, colors and professional UI spacing.',locked:false,logo:'CSS'},
    {id:'javascript',title:'JavaScript',track:'Frontend',level:'basic',lessons:10,description:'Build interactive pages with DOM events, forms, storage and API calls.',locked:false,logo:'JS'},
    {id:'react',title:'React',track:'Frontend',level:'basic',lessons:8,description:'Create component-based frontend apps, state, forms and reusable dashboard UI.',locked:false,logo:'React'},
    {id:'node',title:'Node.js',track:'Backend',level:'basic',lessons:7,description:'Use Node.js modules, npm, environment variables and backend service basics.',locked:false,logo:'Node'},
    {id:'express',title:'Express.js',track:'Backend',level:'basic',lessons:8,description:'Build REST API routes, middleware, validation and production-ready server structure.',locked:false,logo:'Express'},
    {id:'mongodb',title:'MongoDB',track:'Database',level:'basic',lessons:8,description:'Design document databases, schemas, queries and platform records.',locked:false,logo:'Mongo'},
    {id:'git-github',title:'GitHub',track:'Developer Tools',level:'basic',lessons:8,description:'Use Git, GitHub, commits, branches, repositories and deployment workflow.',locked:false,logo:'GitHub'},
    {id:'cloud-render',title:'Render',track:'Cloud',level:'basic',lessons:7,description:'Deploy frontend and backend services, set environment variables and custom domains.',locked:false,logo:'Render'},
    {id:'cpp',title:'C++',track:'Programming',level:'basic',lessons:8,description:'Learn C++ variables, input/output, loops, functions and console projects.',locked:false,logo:'C++'},
    {id:'csharp',title:'C#',track:'Programming',level:'basic',lessons:8,description:'Learn C# syntax, classes, methods, collections and application structure.',locked:false,logo:'C#'},
    {id:'premium-school-1',title:'Premium School 1',track:'Premium',level:'premium',lessons:16,description:'Build a complete professional website connected to backend-ready structure.',locked:false,logo:'P1'},
    {id:'premium-school-2',title:'Premium School 2',track:'Premium',level:'premium',lessons:18,description:'Build dashboards, auth flow and protected workspaces.',locked:false,logo:'P2'},
    {id:'premium-school-3',title:'Premium School 3',track:'Premium',level:'premium',lessons:20,description:'Complete a job-ready platform project and qualify for certificate review.',locked:false,logo:'P3'},
    {id:'html-foundations',title:'HTML Foundations',track:'Frontend',level:'basic',lessons:8,description:'Complete HTML document structure, content sections, media, tables, forms and SEO.',locked:false,logo:'HTML'},
    {id:'css-professional-ui',title:'CSS Professional UI',track:'Frontend',level:'basic',lessons:10,description:'Build polished layouts with typography, spacing, flexbox, grid and responsive UI.',locked:false,logo:'CSS'},
    {id:'javascript-core',title:'JavaScript Core',track:'Frontend',level:'basic',lessons:12,description:'Master DOM, forms, events, storage, fetch, errors and practical interactivity.',locked:false,logo:'JS'},
    {id:'python-for-builders',title:'Python for Builders',track:'Programming',level:'basic',lessons:12,description:'Learn Python logic, data, files, errors, automation and mini backend ideas.',locked:false,logo:'PY'},
    {id:'django-backend',title:'Django Backend',track:'Backend',level:'advanced',lessons:12,description:'Build Django apps with views, templates, models, admin, forms and deployment prep.',locked:false,logo:'DJ'},
    {id:'react-frontend',title:'React Frontend',track:'Frontend',level:'advanced',lessons:14,description:'Build React components, state, forms, routing, API UI and protected dashboards.',locked:false,logo:'React'},
    {id:'node-express-api',title:'Node Express API',track:'Backend',level:'advanced',lessons:14,description:'Build Express APIs with controllers, middleware, auth overview and production checks.',locked:false,logo:'API'},
    {id:'mongodb-backend',title:'MongoDB Backend',track:'Database',level:'advanced',lessons:10,description:'Design MongoDB records, schemas, queries, updates, relationships and security rules.',locked:false,logo:'DB'},
    {id:'csharp-dotnet',title:'C# .NET Backend',track:'Backend',level:'advanced',lessons:8,description:'Build .NET backend projects with controllers, services and deployment structure.',locked:false,logo:'.NET'}
  ];
}
function fallbackEnrollment(u=currentUser()){
  return {name:u?.name||'Student',email:u?.email||'',accessLevel:'premium',status:'active',verificationStatus:'verified',verificationMethod:'open_learning',progress:[],premiumSchoolStage:0,certificateStatus:'not_eligible',certificateId:'',certificateAwardedAt:''};
}
function academyOfflineNotice(err){
  return `<div class="notice info"><b>Learning service status:</b> ${safe(err?.message || 'Service is connecting')}. Learning pages remain available. Progress and certificates save when the service is online.</div>`;
}


function academyTerminalHtml(course){
  const starter = String(course?.id || '').includes('html') ? '<h1>Hello Coding Academy</h1>\n<p>I am practicing HTML.</p>' :
    String(course?.id || '').includes('css') ? '<style>body{font-family:Arial;padding:20px} .card{padding:20px;border-radius:16px;background:#f8fafc}</style>\n<div class="card">CSS practice card</div>' :
    String(course?.id || '').includes('python') ? 'name = "Student"\nprint("Hello", name)\nprint("Python practice is ready")' :
    String(course?.id || '').includes('node') ? 'console.log("Express route practice");\nconst route = "/api/academy";\nconsole.log("Route:", route);' :
    String(course?.id || '').includes('mongodb') ? 'const student = { name: "Student", course: "MongoDB" };\nconsole.log(JSON.stringify(student, null, 2));' :
    'console.log("Hello Coding Academy");\nconst skills = ["HTML", "CSS", "JavaScript"];\nconsole.log(skills.join(" + "));';
  return `<div class="academy-terminal"><div class="terminal-top"><div><b>Practice Terminal</b><p class="muted">Runs JavaScript/HTML preview in your browser. Python/Node lessons show guided output for safe practice.</p></div><span class="badge success">Learning page only</span></div><textarea class="terminal-editor" spellcheck="false" data-terminal-code>${safe(starter)}</textarea><div class="app-actions terminal-actions"><button class="btn gold small" data-run-terminal>Run Practice</button><button class="btn light small" data-reset-terminal>Reset</button></div><pre class="terminal-output" data-terminal-output>Ready. Write code and click Run Practice.</pre><iframe class="terminal-preview" data-terminal-preview title="Coding practice preview"></iframe></div>`;
}
function bindAcademyTerminal(main, course){
  const editor=main.querySelector('[data-terminal-code]');
  const out=main.querySelector('[data-terminal-output]');
  const frame=main.querySelector('[data-terminal-preview]');
  if(!editor || !out) return;
  const starter=editor.value;
  const run=()=>{
    const code=editor.value || '';
    out.textContent='Running...';
    if(/<\w+|<!doctype|<style|<script/i.test(code)){
      if(frame){ frame.style.display='block'; frame.srcdoc=code; }
      out.textContent='HTML/CSS preview rendered below.';
      return;
    }
    if(String(course?.id||'').includes('python')){
      const printed=[...code.matchAll(/print\(([^)]*)\)/g)].map(m=>m[1].replace(/["']/g,'').replace(/,/g,' '));
      out.textContent=(printed.length?printed.join('\n'):'Python practice checked. Save real execution for a backend sandbox when you add one.');
      if(frame) frame.style.display='none';
      return;
    }
    const logs=[];
    const originalLog=console.log;
    try{
      console.log=(...args)=>logs.push(args.map(v=>typeof v==='object'?JSON.stringify(v,null,2):String(v)).join(' '));
      new Function(code)();
      out.textContent=logs.join('\n') || 'Code ran successfully.';
    }catch(error){ out.textContent='Error: '+error.message; }
    finally{ console.log=originalLog; if(frame) frame.style.display='none'; }
  };
  main.querySelector('[data-run-terminal]')?.addEventListener('click', run);
  main.querySelector('[data-reset-terminal]')?.addEventListener('click', ()=>{ editor.value=starter; out.textContent='Reset complete. Click Run Practice.'; if(frame) frame.style.display='none'; });
}


function academyVerificationHtml(e={}){ return ''; }
function bindAcademyVerification(main, reload){
  main.querySelector('[data-academy-email-verify]')?.addEventListener('submit',async e=>{ e.preventDefault(); const form=e.currentTarget, box=form.querySelector('[data-form-message]'); try{ const data=await api('/api/academy/verify/school-email',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(form).entries()))}); showMsg(box,data.message||'School details submitted.','success'); }catch(err){ showMsg(box,err.message,'error'); } });
  main.querySelector('[data-academy-otp-confirm]')?.addEventListener('submit',async e=>{ e.preventDefault(); const form=e.currentTarget, box=form.querySelector('[data-form-message]'); try{ const data=await api('/api/academy/verify/school-email/confirm',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(form).entries()))}); showMsg(box,data.message||'School email verified.','success'); setTimeout(reload,700); }catch(err){ showMsg(box,err.message,'error'); } });
  main.querySelector('[data-academy-id-verify]')?.addEventListener('submit',async e=>{ e.preventDefault(); const form=e.currentTarget, box=form.querySelector('[data-form-message]'); try{ const data=await api('/api/academy/verify/id',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(form).entries()))}); showMsg(box,data.message||'Verification submitted.','success'); form.reset(); setTimeout(reload,700); }catch(err){ showMsg(box,err.message,'error'); } });
}


function courseLogoText(c={}){
  const id=String(c.id || c.slug || c.title || '').toLowerCase();
  if(id.includes('python')) return 'PY';
  if(id === 'html' || id.includes('html')) return 'HTML';
  if(id === 'css' || id.includes('css')) return 'CSS';
  if(id.includes('javascript')) return 'JS';
  if(id.includes('react')) return 'React';
  if(id === 'node' || id.includes('node')) return 'Node';
  if(id.includes('express')) return 'Express';
  if(id.includes('mongodb') || id.includes('mongo')) return 'Mongo';
  if(id.includes('github') || id.includes('git-')) return 'GitHub';
  if(id.includes('render') || id.includes('cloud-render')) return 'Render';
  if(id.includes('cpp')) return 'C++';
  if(id.includes('csharp') || id.includes('dotnet')) return 'C#';
  return safe(c.logo || String(c.title || 'Code').split(' ')[0]);
}
function courseLogoClass(c={}){
  const id=String(c.id || c.slug || c.title || '').toLowerCase();
  if(id.includes('python')) return 'python';
  if(id.includes('html')) return 'html';
  if(id.includes('css')) return 'css';
  if(id.includes('javascript')) return 'javascript';
  if(id.includes('react')) return 'react';
  if(id.includes('node')) return 'node';
  if(id.includes('express')) return 'express';
  if(id.includes('mongodb') || id.includes('mongo')) return 'mongodb';
  if(id.includes('github') || id.includes('git-')) return 'github';
  if(id.includes('render')) return 'render';
  if(id.includes('cpp')) return 'cpp';
  if(id.includes('csharp') || id.includes('dotnet')) return 'csharp';
  return 'default';
}
function academyCourseCard(c, enrollment=null, progress=null, offline=false){
  const done=Number(progress?.completedLessons||0);
  const total=Number(c.lessons||1);
  const pct=Math.round((done/total)*100);
  return `<article class="academy-course-card product-card"><a class="academy-course-icon ${courseLogoClass(c)}" href="${academyPageFor(c.id || c.slug)}" aria-label="Open ${safe(c.title)} course"><span>${courseLogoText(c)}</span></a><div class="product-body"><div class="badges"><span class="badge ${academyLevelBadge(c.level)}">${safe(c.level || 'free')}</span><span class="badge success">Free access</span></div><h3>${safe(c.title)}</h3><p>${safe(c.description)}</p><small class="muted">${offline ? `${safe(c.lessons)} lessons · local preview` : `${done}/${safe(c.lessons)} lessons · ${pct}% complete`}</small><div class="app-actions" style="margin-top:14px"><a class="btn dark small" href="${academyPageFor(c.id || c.slug)}">Open Course</a>${offline?'<button class="btn light small" disabled>Progress saves online</button>':`<button class="btn gold small" data-complete-course="${safe(c.id || c.slug)}">Mark Complete</button>`}</div></div></article>`;
}

function academyCourseAdminCard(c={}){
  return `<article class="academy-course-card product-card"><a class="academy-course-icon ${courseLogoClass(c)}" href="${academyPageFor(c.id || c.slug)}" aria-label="Open ${safe(c.title)} course"><span>${courseLogoText(c)}</span></a><div class="product-body"><div class="badges"><span class="badge ${academyLevelBadge(c.level)}">${safe(c.level || 'free')}</span><span class="badge info">${safe(c.provider || 'auto-learning-api')}</span></div><h3>${safe(c.title || 'Course')}</h3><p>${safe(c.track || 'Coding Academy')} · ${safe(c.lessons || 1)} lessons</p><div class="app-actions" style="margin-top:14px"><a class="btn light small" href="${academyPageFor(c.id || c.slug)}">Open Course</a></div></div></article>`;
}


async function renderUserAcademy(main,u){
  main.innerHTML=`<div class="app-title"><div><span class="eyebrow">Coding Academy</span><h1>Student Learning Dashboard</h1><p>Choose any free course icon, open the lesson page, complete lessons, practice assignments, take quizzes and build toward your Tyna Coding Academy certificate.</p></div><a class="btn light" href="tyna-coding-academy.html">Open Academy Page</a></div><div id="academy-student-alert" class="notice success">Free learning access is open for students and users.</div><section class="workspace-grid"><div class="dash-card"><h2>Choose a Course</h2><div id="academy-user-courses" class="product-grid academy-icon-grid">Loading...</div></div><aside class="dash-card"><h3>Certificate Path</h3><p>Complete Premium School 3 or a full capstone path to become eligible for a Tyna Systems certificate award.</p><div id="academy-certificate-box" class="notice info">Checking certificate status...</div></aside></section>`;
  try{
    await api('/api/academy/enroll',{method:'POST',body:JSON.stringify({})});
    const data=await api('/api/academy/me');
    const e=data.enrollment;
    document.getElementById('academy-student-alert').className='notice success';
    document.getElementById('academy-student-alert').textContent='Free learning is open. Choose any course and start studying now.';
    document.getElementById('academy-certificate-box').className=`notice ${e.certificateStatus==='awarded'?'success':(e.certificateStatus==='eligible'?'warn':'info')}`;
    document.getElementById('academy-certificate-box').innerHTML=e.certificateStatus==='awarded'?`Certificate awarded: <b>${safe(e.certificateId)}</b>`:(e.certificateStatus==='eligible'?'Premium path complete. Waiting for Tyna Systems certificate award.':'Complete Premium School 3 to become eligible for certificate award.');
    document.getElementById('academy-user-courses').innerHTML=(data.courses||[]).map(c=>academyCourseCard(c, e, academyProgressFor(e,c.id), false)).join('');
    main.querySelectorAll('[data-complete-course]').forEach(btn=>btn.addEventListener('click',async()=>{ const course=(data.courses||[]).find(c=>c.id===btn.dataset.completeCourse); try{ await api(`/api/academy/progress/${btn.dataset.completeCourse}`,{method:'PATCH',body:JSON.stringify({completedLessons: course?.lessons || 1})}); btn.textContent='Completed'; setTimeout(()=>renderUserAcademy(main,u),700); }catch(err){ alert(err.message); } }));
  }catch(err){
    const e=fallbackEnrollment(u);
    document.getElementById('academy-student-alert').className='notice info';
    document.getElementById('academy-student-alert').innerHTML=academyOfflineNotice(err);
    document.getElementById('academy-certificate-box').className='notice info';
    document.getElementById('academy-certificate-box').textContent='Certificate progress will save when the learning service is online.';
    document.getElementById('academy-user-courses').innerHTML=fallbackAcademyCourses().map(c=>academyCourseCard(c, e, null, true)).join('');
  }
}
function academyStudentRow(st, mode){
  const vStatus=st.verificationStatus||'unverified';
  const vClass=vStatus==='verified'?'success':(vStatus==='pending'?'warn':'info');
  return `<tr data-academy-student="${safe(st.id)}"><td><b>${safe(st.name||'Student')}</b><br><small>${safe(st.email)}</small></td><td><span class="badge ${vClass}">${safe(vStatus)}</span><br><small>${safe(st.verificationMethod||'none')} ${st.schoolEmail?'· '+safe(st.schoolEmail):''}</small><br><button class="btn gold small" data-verify-student>Verify</button><button class="btn light small" data-reject-student>Reject</button></td><td><select data-academy-access><option value="basic" ${st.accessLevel==='basic'?'selected':''}>Basic</option><option value="advanced" ${st.accessLevel==='advanced'?'selected':''}>Advanced</option><option value="premium" ${st.accessLevel==='premium'?'selected':''}>Premium</option></select></td><td><select data-academy-status><option value="active" ${st.status==='active'?'selected':''}>Active</option><option value="paused" ${st.status==='paused'?'selected':''}>Paused</option><option value="blocked" ${st.status==='blocked'?'selected':''}>Blocked</option></select></td><td><select data-academy-stage><option value="0" ${Number(st.premiumSchoolStage)===0?'selected':''}>Not premium</option><option value="1" ${Number(st.premiumSchoolStage)===1?'selected':''}>Premium 1</option><option value="2" ${Number(st.premiumSchoolStage)===2?'selected':''}>Premium 2</option><option value="3" ${Number(st.premiumSchoolStage)===3?'selected':''}>Premium 3</option></select></td><td><span class="badge ${st.certificateStatus==='awarded'?'success':(st.certificateStatus==='eligible'?'warn':'info')}">${safe(st.certificateStatus)}</span><br><small>${safe(st.certificateId||'')}</small></td><td><textarea data-academy-notes rows="2" placeholder="Admin/dev note">${safe(st.notes||'')}</textarea></td><td><button class="btn gold small" data-save-academy>Save</button><button class="btn light small" data-award-certificate>Award Cert</button></td></tr>`;
}
async function renderAcademyAdmin(main, mode='admin'){
  const devMode=mode==='developer';
  main.innerHTML=`<div class="app-title"><div><span class="eyebrow">${devMode?'Developer':'Admin'} Academy Control</span><h1>Coding Academy Students</h1><p>Auto-learning courses are generated by the learning provider, not manual upload. Review academy students, progress and certificate awards after Premium School 3 completion.</p></div><a class="btn light" href="tyna-coding-academy.html">Public Academy Page</a></div><section class="workspace-grid"><div class="dash-card"><h2>Auto Learning API</h2><div class="notice success"><b>Manual course creation disabled.</b><br>Courses come automatically from the Tyna auto-learning backend provider. Use Sync only to refresh catalog.</div><div class="app-actions"><button class="btn gold small" data-sync-academy>Sync Auto Courses</button></div><div id="academy-page-list" class="module-list"></div></div><div class="dash-card"><h2>Student Progress Review</h2><div id="academy-admin-list">Loading students...</div></div></section>`;
  const base=devMode?'/api/academy/developer/students':'/api/academy/admin/students';
  const pageList=document.getElementById('academy-page-list');
  if(pageList){ pageList.innerHTML='<div class="notice info">Loading auto-generated courses...</div>'; }
  main.querySelector('[data-sync-academy]')?.addEventListener('click',async()=>{ try{ const msg=await api('/api/academy/provider/sync',{method:'POST',body:JSON.stringify({})}); alert(msg.message||'Auto courses synced.'); renderAcademyAdmin(main, mode); }catch(err){ alert(err.message); } });
  try{
    const {students,courses}=await api(base);
    if(pageList){ pageList.className='product-grid academy-icon-grid'; pageList.innerHTML=(courses||[]).slice(0,80).map(c=>academyCourseAdminCard(c)).join('') || '<div class="empty-state">No auto courses yet. Click Sync Auto Courses.</div>'; }
    document.getElementById('academy-admin-list').innerHTML=students?.length?`<div class="table-wrap"><table class="app-table"><thead><tr><th>Student</th><th>Verification</th><th>Access</th><th>Status</th><th>Premium Stage</th><th>Certificate</th><th>Notes</th><th>Control</th></tr></thead><tbody>${students.map(st=>academyStudentRow(st, mode)).join('')}</tbody></table></div>`:'<div class="empty-state">No academy students yet. Students appear after opening the academy dashboard.</div>';
    main.querySelectorAll('[data-save-academy]').forEach(btn=>btn.addEventListener('click',async()=>{ const row=btn.closest('[data-academy-student]'); const payload={accessLevel:row.querySelector('[data-academy-access]').value,status:row.querySelector('[data-academy-status]').value,premiumSchoolStage:row.querySelector('[data-academy-stage]').value,notes:row.querySelector('[data-academy-notes]').value}; try{ await api(`${base}/${row.dataset.academyStudent}`,{method:'PATCH',body:JSON.stringify(payload)}); btn.textContent='Saved'; setTimeout(()=>btn.textContent='Save',1000); }catch(err){ alert(err.message); } }));
    main.querySelectorAll('[data-verify-student]').forEach(btn=>btn.addEventListener('click',async()=>{ const row=btn.closest('[data-academy-student]'); try{ await api(`${base}/${row.dataset.academyStudent}/verification`,{method:'PATCH',body:JSON.stringify({verificationStatus:'verified'})}); renderAcademyAdmin(main, mode); }catch(err){ alert(err.message); } }));
    main.querySelectorAll('[data-reject-student]').forEach(btn=>btn.addEventListener('click',async()=>{ const row=btn.closest('[data-academy-student]'); try{ await api(`${base}/${row.dataset.academyStudent}/verification`,{method:'PATCH',body:JSON.stringify({verificationStatus:'rejected'})}); renderAcademyAdmin(main, mode); }catch(err){ alert(err.message); } }));
    main.querySelectorAll('[data-award-certificate]').forEach(btn=>btn.addEventListener('click',async()=>{ const row=btn.closest('[data-academy-student]'); try{ await api(`${base}/${row.dataset.academyStudent}/certificate`,{method:'POST',body:JSON.stringify({fullName: row.querySelector('b')?.textContent || ''})}); renderAcademyAdmin(main, mode); }catch(err){ alert(err.message); } }));
  }catch(err){ document.getElementById('academy-admin-list').innerHTML=`<div class="notice error">${safe(err.message)}</div>`; }
}


async function certificateCardMarkup({ name, awarded=false, eligible=false, certificateId='', certificateAwardedAt='', status='not_eligible', progressText='' }){
  const statusClass = awarded ? 'success' : (eligible ? 'warn' : 'info');
  const issueDate = awarded && certificateAwardedAt ? new Date(certificateAwardedAt).toLocaleDateString() : '';
  return `<div class="certificate-preview-card"><div class="certificate-border ${awarded?'certificate-awarded':'certificate-pending'}"><div class="certificate-brand"><img src="assets/images/logo.webp" alt="Tyna Systems logo" class="certificate-logo"><div><span class="kicker">TYNA CODING ACADEMY</span><p class="certificate-brand-line">Professional Education</p></div></div><p class="certificate-overline">Tyna Systems Learning Platform</p><h2>${awarded?'Certificate of Completion':'Certificate Path'}</h2><p>This certifies that</p><h1>${safe(name||'Student')}</h1><p>${awarded?'has successfully completed the Premium School 3 learning path and is recognized by Tyna Coding Academy for professional education achievement.':'is building toward the Premium School 3 certificate award in Tyna Coding Academy.'}</p><div class="badges center-actions"><span class="badge ${statusClass}">${safe(status||'not_eligible')}</span>${certificateId?`<span class="badge dark">${safe(certificateId)}</span>`:''}</div><div class="certificate-meta"><small>${issueDate ? 'Awarded ' + issueDate : 'Tyna Systems Admin or Developer awards the certificate after Premium School 3.'}</small><small>${progressText || 'Each certificate includes the platform logo and academy identity for professional education use.'}</small></div></div></div>`;
}

async function renderUserCertificate(main,u){
  main.innerHTML=`<div class="app-title"><div><span class="eyebrow">Coding Academy Certificate</span><h1>My Certificate</h1><p>Your certificate status updates from Tyna Coding Academy after your course progress is completed.</p></div><a class="btn light" href="dashboard.html#academy">Back to Academy</a></div><div id="certificate-user-box" class="dash-card">Loading certificate...</div>`;
  try{
    await api('/api/academy/enroll',{method:'POST',body:JSON.stringify({})});
    const data=await api('/api/academy/me');
    const e=data.enrollment||{};
    const premium3=academyProgressFor(e,'premium-school-3');
    const done=Number(premium3.completedLessons||0);
    const total=20;
    const pct=Math.min(100,Math.round((done/total)*100));
    const awarded=e.certificateStatus==='awarded';
    const eligible=e.certificateStatus==='eligible';
    const certificateProgressText = awarded ? 'Issued by Tyna Systems · Tyna Coding Academy.' : `Premium School 3 progress: ${pct}% complete.`;
    document.getElementById('certificate-user-box').innerHTML=`${certificateCardMarkup({ name: e.name||u.name||'Student', awarded, eligible, certificateId: e.certificateId, certificateAwardedAt: e.certificateAwardedAt, status: e.certificateStatus||'not_eligible', progressText: certificateProgressText })}<br><div class="kpi-grid"><div class="kpi"><span class="muted">Access Level</span><strong>${safe(e.accessLevel||'basic')}</strong></div><div class="kpi"><span class="muted">Premium Stage</span><strong>${Number(e.premiumSchoolStage||0)}/3</strong></div><div class="kpi"><span class="muted">Premium 3 Progress</span><strong>${pct}%</strong></div><div class="kpi"><span class="muted">Certificate</span><strong>${safe(e.certificateStatus||'not_eligible')}</strong></div></div><div class="notice ${awarded?'success':(eligible?'warn':'info')}">${awarded?'Your certificate has been awarded with Tyna Coding Academy branding.':(eligible?'You are eligible. Admin or Developer can award your certificate from their dashboard.':'Complete Premium School 3 to become eligible for certificate award.')}</div>`;
  }catch(err){ const e=fallbackEnrollment(u); document.getElementById('certificate-user-box').innerHTML=`${academyOfflineNotice(err)}<br>${certificateCardMarkup({ name: e.name||u.name||'Student', status: 'not_eligible', progressText: 'Certificate records activate when Admin or Developer awards the certificate.' })}`; }
}

async function renderAcademyCertificates(main, mode='admin'){
  const devMode=mode==='developer';
  const base=devMode?'/api/academy/developer/students':'/api/academy/admin/students';
  main.innerHTML=`<div class="app-title"><div><span class="eyebrow">${devMode?'Developer':'Admin'} Certificate Control</span><h1>Coding Academy Certificates</h1><p>Review certificate eligibility and award certificates after Premium School 3 completion.</p></div><a class="btn light" href="${devMode?'dev.html#academy':'admin.html#staff-academy'}">Academy Students</a></div><div class="dash-card"><div id="certificate-admin-list">Loading certificate records...</div></div>`;
  try{
    const {students}=await api(base);
    const rows=(students||[]).map(st=>`<tr data-academy-student="${safe(st.id)}"><td><b>${safe(st.name||'Student')}</b><br><small>${safe(st.email)}</small></td><td>${Number(st.premiumSchoolStage||0)}/3</td><td><span class="badge ${st.certificateStatus==='awarded'?'success':(st.certificateStatus==='eligible'?'warn':'info')}">${safe(st.certificateStatus||'not_eligible')}</span><br><small>${safe(st.certificateId||'No certificate ID yet')}</small></td><td>${st.certificateAwardedAt?new Date(st.certificateAwardedAt).toLocaleDateString():'-'}</td><td><button class="btn gold small" data-award-certificate ${Number(st.premiumSchoolStage||0)<3?'disabled':''}>Award Certificate</button></td></tr>`).join('');
    document.getElementById('certificate-admin-list').innerHTML=rows?`<div class="table-wrap"><table class="app-table"><thead><tr><th>Student</th><th>Premium Stage</th><th>Certificate Status</th><th>Awarded Date</th><th>Control</th></tr></thead><tbody>${rows}</tbody></table></div>`:'<div class="empty-state">No academy certificate records yet.</div>';
    main.querySelectorAll('[data-award-certificate]').forEach(btn=>btn.addEventListener('click',async()=>{ const row=btn.closest('[data-academy-student]'); try{ await api(`${base}/${row.dataset.academyStudent}/certificate`,{method:'POST',body:JSON.stringify({fullName: row.querySelector('b')?.textContent || ''})}); renderAcademyCertificates(main, mode); }catch(err){ alert(err.message); } }));
  }catch(err){ document.getElementById('certificate-admin-list').innerHTML=`<div class="notice error">${safe(err.message)}</div>`; }
}


async function initAcademyCourse(){
  const rawCourseId=document.body.dataset.courseId || new URLSearchParams(location.search).get('course') || 'html';
  const courseId=normalizeAcademyCourseId(rawCourseId);
  const u=await requireLogin();
  document.body.innerHTML=appShell('academy'); bindLogout(); const main=document.getElementById('appMain');
  main.innerHTML=`<div class="app-title"><div><span class="eyebrow">Coding Academy Learning Page</span><h1>Loading course...</h1><p>Opening the exact individual course page with lessons, quiz, assignment and practice terminal.</p></div><a class="btn light" href="dashboard.html#academy">Back to Academy Dashboard</a></div><div class="notice success">Opening structured learning content...</div>`;
  let enrollment=fallbackEnrollment(u);
  try{
    await api('/api/academy/enroll',{method:'POST',body:JSON.stringify({})});
    const data=await api('/api/academy/me');
    enrollment=data.enrollment || enrollment;
    let course=(data.courses||[]).find(c=>c.id===courseId || c.slug===courseId || c.id===rawCourseId || c.slug===rawCourseId);
    if(!course){
      const detail=await api(`/api/academy/course/${encodeURIComponent(courseId)}`);
      course=detail.course;
    }
    if(!course) throw new Error('Course page not found in auto-learning API.');
    const progress=academyProgressFor(enrollment, course.id || course.slug);
    const done=Number(progress.completedLessons||0);
    main.innerHTML=academyCourseView(course, enrollment, done);
    bindAcademyCoursePage(main, course, enrollment);
  }catch(err){
    try{
      const detail=await api(`/api/academy/course/${encodeURIComponent(courseId)}`);
      const course=detail.course;
      main.innerHTML=academyCourseView(course, enrollment, 0, `<div class="notice info"><b>Course loaded directly from public course endpoint.</b> ${safe(err.message || '')}</div>`);
      bindAcademyCoursePage(main, course, enrollment);
      return;
    }catch(publicErr){
      const course=fallbackAcademyCourses().find(c=>c.id===courseId) || fallbackAcademyCourses().find(c=>c.id===rawCourseId);
      if(!course){ main.innerHTML=`<div class="app-title"><div><span class="eyebrow">Academy Error</span><h1>Learning page unavailable</h1><p>${safe(publicErr.message || err.message)}</p></div><a class="btn light" href="dashboard.html#academy">Back to Academy</a></div>`; return; }
      main.innerHTML=academyCourseView(course, enrollment, 0, academyOfflineNotice(publicErr || err));
      bindAcademyCoursePage(main, course, enrollment);
    }
  }
}

function roleDuty(role){
  return {
    operations_systems_manager:'Operations checks, workflow quality, project order, and service coordination.',
    chartered_accountant:'Finance observation, accountability notes, payment visibility requests through staff, and reporting discipline.',
    client_relationship_manager:'Student/client care, follow-up, communication quality, and relationship support.'
  }[role] || 'General social support, care notes, and service follow-up.';
}
async function initSocialDashboard(){
  const u=await requireLogin('social');
  const active=(location.hash||'#overview').replace('#','') || 'overview';
  document.body.innerHTML=socialShell(active); bindLogout(); bindDashboardNavigation(initSocialDashboard); const main=document.getElementById('appMain');
  if(active==='contacts') return renderSocialContacts(main);
  if(active==='tickets') return renderSocialTickets(main);
  if(active==='activity') return renderSocialActivity(main);
  return renderSocialOverview(main,u);
}
async function renderSocialOverview(main,u){
  main.innerHTML=`<div class="app-title"><div><span class="eyebrow">Company Standard Social Worker Dashboard</span><h1>${safe(u.name||'Social Worker')}</h1><p>${safe(roleDuty(u.workerRole))}</p></div><a class="btn light" href="contact.html">Open public contact page</a></div><div class="kpi-grid"><div class="kpi"><span class="muted">Contacts</span><strong data-social-stat="contacts">0</strong></div><div class="kpi"><span class="muted">Open Care Tickets</span><strong data-social-stat="openTickets">0</strong></div><div class="kpi"><span class="muted">Bookings</span><strong data-social-stat="bookings">0</strong></div></div><section class="workspace-grid"><div class="dash-card"><h2>Role duty</h2><p>${safe(roleDuty(u.workerRole))}</p><div class="notice info">This dashboard can support students and clients, but payment activities and full user control remain only in Admin workspace.</div></div><div class="dash-card"><h2>Save care note</h2><form class="app-form" data-social-note><label>Title<input name="title" required placeholder="Example: Student follow-up needed"></label><label>Note<textarea name="detail" rows="5" required placeholder="Write a professional note for staff visibility..."></textarea></label><button class="btn gold" type="submit">Save Note</button><div class="hidden" data-form-message></div></form></div></section>`;
  try{ const {stats}=await api('/api/social/overview'); Object.entries(stats||{}).forEach(([k,v])=>{ const el=main.querySelector(`[data-social-stat="${k}"]`); if(el) el.textContent=v; }); }catch{}
  const form=main.querySelector('[data-social-note]'); form.addEventListener('submit',async e=>{ e.preventDefault(); const box=form.querySelector('[data-form-message]'); try{ const data=await api('/api/social/note',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(form).entries()))}); showMsg(box,data.message,'success'); form.reset(); }catch(err){ showMsg(box,err.message,'error'); } });
}
async function renderSocialContacts(main){
  main.innerHTML=`<div class="app-title"><div><span class="eyebrow">Care Contacts</span><h1>Contact Messages</h1><p>Follow up with public website contacts according to your role.</p></div></div><div class="dash-card"><div id="social-contact-list" class="module-list">Loading...</div></div>`;
  try{ const {contacts}=await api('/api/social/contacts'); document.getElementById('social-contact-list').innerHTML=(contacts||[]).map(c=>`<div class="module"><b>${safe(c.name||'Contact')}</b><p>${safe(c.message||c.subject||'')}</p><small>${safe(c.email||'')} · ${new Date(c.createdAt).toLocaleString()}</small></div>`).join('') || '<div class="empty-state">No contacts yet.</div>'; }catch(err){ document.getElementById('social-contact-list').innerHTML=`<div class="notice error">${safe(err.message)}</div>`; }
}
async function renderSocialTickets(main){
  main.innerHTML=`<div class="app-title"><div><span class="eyebrow">Support Care</span><h1>Support Tickets</h1><p>View support needs without taking payment control.</p></div></div><div class="dash-card"><div id="social-ticket-list" class="module-list">Loading...</div></div>`;
  try{ const {tickets}=await api('/api/social/tickets'); document.getElementById('social-ticket-list').innerHTML=(tickets||[]).map(t=>`<div class="module"><div class="module row"><b>${safe(t.subject)}</b><span class="badge info">${safe(t.status)}</span></div><p>${safe(t.message)}</p><small>${safe(t.user?.email||'')} · ${new Date(t.createdAt).toLocaleString()}</small></div>`).join('') || '<div class="empty-state">No tickets yet.</div>'; }catch(err){ document.getElementById('social-ticket-list').innerHTML=`<div class="notice error">${safe(err.message)}</div>`; }
}
async function renderSocialActivity(main){
  main.innerHTML=`<div class="app-title"><div><span class="eyebrow">Activity Visibility</span><h1>Care Activity Log</h1><p>Registration, support and staff activity relevant to social workers.</p></div></div><div class="dash-card"><div id="social-activity-list" class="module-list">Loading...</div></div>`;
  try{ const {activities}=await api('/api/social/activities'); document.getElementById('social-activity-list').innerHTML=(activities||[]).map(activityItem).join('') || '<div class="empty-state">No activity yet.</div>'; }catch(err){ document.getElementById('social-activity-list').innerHTML=`<div class="notice error">${safe(err.message)}</div>`; }
}

let tynaGlobalRouteTimer;
window.addEventListener('hashchange',()=>{
  if(tynaRouteNavigationLock) return;
  clearTimeout(tynaGlobalRouteTimer);
  tynaGlobalRouteTimer=setTimeout(()=>{
    const page=document.body.dataset.appPage;
    if(page==='staff' || page==='admin') initStaff();
    if(page==='dashboard') initDashboard();
    if(page==='dev') initDevDashboard();
    if(page==='academy-course') initAcademyCourse();
    if(page==='certificate') { requireLogin().then(u=>{ document.body.innerHTML=appShell('certificate'); bindLogout(); bindDashboardNavigation(()=>Promise.resolve()); renderUserCertificate(document.getElementById('appMain'),u); }).catch(()=>{}); }
    if(page==='social') initSocialDashboard();
    if(page==='role-gateway') initRoleGateway();
  }, 40);
});
document.addEventListener('DOMContentLoaded',()=>{ initAdSense(); const page=document.body.dataset.appPage; if(page==='auth') initVerifiedAuthPages(); if(page==='dashboard') initDashboard(); if(page==='support') initSupport('support'); if(page==='contact-staff') initSupport('contact-staff'); if(page==='settings') initSettings(); if(page==='staff' || page==='admin') initStaff(); if(page==='dev') initDevDashboard(); if(page==='academy-course') initAcademyCourse(); if(page==='certificate') { requireLogin().then(u=>{ document.body.innerHTML=appShell('certificate'); bindLogout(); renderUserCertificate(document.getElementById('appMain'),u); }).catch(()=>{}); } if(page==='social') initSocialDashboard(); if(page==='role-gateway') initRoleGateway(); });



// Calculator role gateway and verified user auth upgrade
function initRoleGateway(){
  let expr=''; let selectedRole=new URLSearchParams(location.search).get('role') || document.body.dataset.defaultRole || 'admin';
  const display=document.getElementById('calcDisplay'), status=document.getElementById('status'), title=document.getElementById('gatewayTitle');
  const pinKeyFor=()=>`tyna_role_gateway_pin_${selectedRole==='social'?'staff':selectedRole}`;
  const setStatus=(msg,type='')=>{ if(status){ status.textContent=msg||''; status.className=`status ${type}`; } };
  const render=()=>{ if(display) display.textContent=expr || '0'; };
  const setTitle=()=>{ if(title) title.textContent = selectedRole==='developer'?'Developer':(selectedRole==='staff'||selectedRole==='social'?'Staff':'Admin'); };
  const savePin=()=>{ const value=prompt('Create or enter your 4 to 8 digit calculator PIN', localStorage.getItem(pinKeyFor())||''); if(value===null) return; const pin=String(value).replace(/\D/g,'').slice(0,8); if(!/^\d{4,8}$/.test(pin)) return setStatus('PIN must be 4 to 8 digits.','error'); localStorage.setItem(pinKeyFor(),pin); expr=pin; render(); setStatus('PIN ready. Press PIN or = to continue.','success'); };
  async function openRole(){ const pin=(expr.match(/\d+/g)||[''])[0] || localStorage.getItem(pinKeyFor()) || ''; if(!/^\d{4,8}$/.test(pin)) return setStatus('Enter your saved 4 to 8 digit PIN first.','error'); const role=selectedRole==='developer'?'developer':(selectedRole==='staff'||selectedRole==='social'?'social':'admin'); try{ setStatus('Verifying PIN...'); const data=await api('/api/auth/role-pin-session',{method:'POST',body:JSON.stringify({role,pin,workerRole:document.getElementById('workerRole')?.value})}); saveSession(data); if(role==='admin') location.replace('admin.html'); else if(role==='developer') location.replace('dev.html'); else location.replace('social-worker-dashboard.html'); }catch(err){ setStatus(err.message,'error'); expr=''; render(); } }
  document.querySelectorAll('[data-role]').forEach(btn=>btn.addEventListener('click',()=>{ selectedRole=btn.dataset.role; setTitle(); setStatus('Enter PIN, then press PIN or =.'); }));
  document.getElementById('savePinBtn')?.addEventListener('click',savePin); document.getElementById('removePinBtn')?.addEventListener('click',()=>{ localStorage.removeItem(pinKeyFor()); expr=''; render(); setStatus('PIN removed from this device. Enter the correct backend PIN to access.'); });
  document.getElementById('calcKeys')?.addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; if(b.dataset.value){ expr += b.dataset.value; render(); return; } if(b.dataset.op){ if(expr && !/[+\-*/.]$/.test(expr)) expr += b.dataset.op; render(); return; } if(b.dataset.action==='clear'){ expr=''; render(); } if(b.dataset.action==='back'){ expr=expr.slice(0,-1); render(); } if(b.dataset.action==='pin'){ openRole(); } if(b.dataset.action==='equals'){ if(/^\d{4,8}$/.test(expr)) return openRole(); try{ if(/^[0-9+\-*/().\s]+$/.test(expr)){ expr=String(Function('"use strict"; return ('+expr+')')()); render(); } }catch{ setStatus('Calculator input is invalid.','error'); } } });
  setTitle(); setStatus(localStorage.getItem(pinKeyFor())?'Enter PIN, then press PIN or =.':'Create a PIN first, then press PIN or =.'); render();
}
function bindIdentityFields(){ const sel=document.querySelector('[data-account-type]'); if(!sel) return; const sync=()=>{ const isStudent=sel.value==='student'; document.querySelectorAll('[data-student-fields]').forEach(el=>el.style.display=isStudent?'block':'none'); document.querySelectorAll('[data-business-fields]').forEach(el=>el.style.display=isStudent?'none':'block'); }; sel.addEventListener('change',sync); sync(); }
function showTokenNotice(data={}){ return data; }
async function initVerifiedAuthPages(){
  bindIdentityFields();
  if(token()){
    try{ const current=await api('/api/auth/me'); localStorage.setItem(USER_KEY,JSON.stringify(current.user)); sessionStorage.setItem(USER_KEY,JSON.stringify(current.user)); redirectAfterUserLogin({user:current.user}); return; }
    catch{ clearSession(); }
  }
  document.querySelector('[data-joinfree-form]')?.addEventListener('submit',async e=>{
    e.preventDefault();
    const form=e.currentTarget, box=form.querySelector('[data-form-message]');
    try{
      const payload=Object.fromEntries(new FormData(form).entries());
      const data=await api('/api/auth/join-free',{method:'POST',body:JSON.stringify(payload)});
      saveSession(data);
      showMsg(box,data.message||'Signup successful. Opening dashboard...','success');
      setTimeout(()=>redirectAfterUserLogin(data),500);
    }catch(err){ showMsg(box,err.message,'error'); }
  });
  document.querySelector('[data-login-form]')?.addEventListener('submit',async e=>{
    e.preventDefault();
    const form=e.currentTarget, box=form.querySelector('[data-form-message]');
    try{
      const payload=Object.fromEntries(new FormData(form).entries());
      const data=await api('/api/auth/login',{method:'POST',body:JSON.stringify(payload)});
      saveSession(data);
      showMsg(box,data.message||'Login successful. Opening dashboard...','success');
      setTimeout(()=>redirectAfterUserLogin(data),300);
    }catch(err){ showMsg(box,err.message,'error'); }
  });  document.querySelector('[data-pin-reset-link]')?.addEventListener('click',async e=>{
    e.preventDefault();
    const loginId=prompt('Enter your account email, school email, business email, or username');
    if(!loginId) return;
    const password=prompt('Enter your account password to verify ownership');
    if(!password) return;
    const pin=prompt('Create your new 4 to 8 digit PIN');
    if(pin===null) return;
    const cleanPin=String(pin).replace(/\D/g,'').slice(0,8);
    if(!/^\d{4,8}$/.test(cleanPin)) return alert('PIN must be 4 to 8 digits.');
    try{ const data=await api('/api/auth/reset-pin',{method:'POST',body:JSON.stringify({loginId,password,pin:cleanPin})}); alert(data.message||'PIN reset successful.'); }
    catch(err){ alert(err.message); }
  });
}