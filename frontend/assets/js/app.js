const API_URL = window.TYNA_API_URL || ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:5000' : '');
const TOKEN_KEY = 'tyna_token';
const USER_KEY = 'tyna_user';
function token(){ return localStorage.getItem(TOKEN_KEY); }
function currentUser(){ try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; } }
function isStaff(u=currentUser()){ return ['staff','admin'].includes(u?.role); }
function safe(v=''){ return String(v ?? '').replace(/[&<>\"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }
function money(n){ return new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(Number(n||0)); }
function showMsg(el,text,type='success'){ if(!el) return alert(text); el.className = `notice ${type}`; el.textContent = text; el.classList.remove('hidden'); }
function saveSession(data){ localStorage.setItem(TOKEN_KEY,data.token); localStorage.setItem(USER_KEY,JSON.stringify(data.user)); }
function logout(){ localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); location.href='login.html'; }
function redirectToAuth(role){ const page = role === 'staff' ? 'staff-login.html' : 'login.html'; location.href = `${page}?redirect=${encodeURIComponent(location.pathname.split('/').pop()+location.search+location.hash)}`; }
async function api(path, options={}){
  const headers = {...(options.headers||{})};
  if(!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if(token()) headers.Authorization = `Bearer ${token()}`;
  const res = await fetch(`${API_URL}${path}`, {...options, headers});
  const data = await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}
async function recordActivity(type,title='',detail='',metadata={}){ try { if(token()) await api('/api/activities',{method:'POST',body:JSON.stringify({type,title,detail,metadata})}); } catch {} }
async function requireLogin(role){
  if(!token()){ redirectToAuth(role); throw new Error('login required'); }
  const data = await api('/api/auth/me');
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  if(role === 'staff' && !isStaff(data.user)){ location.href='dashboard.html'; throw new Error('staff required'); }
  return data.user;
}
function bindLogout(){ document.querySelectorAll('[data-logout]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();logout();})); }
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
  return `<div class="app-shell user-shell"><aside class="app-sidebar"><a class="brand" href="index.html"><div class="brand-mark"><img src="assets/images/logo.png" alt="Tyna Systems"></div><span>TYNA<small>SYSTEMS</small></span></a><nav><a class="${active==='dashboard'?'active':''}" href="dashboard.html">${icon('grid')} Workspace</a><a class="${active==='products'?'active':''}" href="dashboard.html#products">${icon('box')} Store</a><a class="${active==='support'?'active':''}" href="support.html">${icon('chat')} Support</a><a class="${active==='contact-staff'?'active':''}" href="contact-staff.html">${icon('users')} Contact Staff</a><a class="${active==='settings'?'active':''}" href="settings.html">${icon('gear')} Settings</a><div class="sidebar-divider"></div><a href="index.html">${icon('home')} Main Website</a><a href="#" data-logout>${icon('logout')} Logout</a></nav></aside><main class="app-main" id="appMain"></main></div>`;
}
function staffShell(active='overview'){
  return `<div class="app-shell staff-shell"><aside class="app-sidebar staff-sidebar"><a class="brand" href="staff.html"><div class="brand-mark"><img src="assets/images/logo.png" alt="Tyna Systems"></div><span>TYNA<small>STAFF</small></span></a><p class="staff-sidebar-note">Private operations area. Backend access rules remain unchanged.</p><nav><a class="${active==='overview'?'active':''}" href="staff.html#overview">${icon('home')} Command Center</a><a class="${active==='activity'?'active':''}" href="staff.html#staff-activity">${icon('chart')} Activity</a><a class="${active==='users'?'active':''}" href="staff.html#staff-users">${icon('users')} Users</a><a class="${active==='products'?'active':''}" href="staff.html#staff-products">${icon('box')} Products</a><a class="${active==='orders'?'active':''}" href="staff.html#staff-orders">${icon('money')} Orders</a><a class="${active==='withdrawals'?'active':''}" href="staff.html#staff-withdrawals">${icon('money')} Withdrawals</a><div class="sidebar-divider"></div><a href="#" data-logout>${icon('logout')} Logout</a></nav></aside><main class="app-main staff-main" id="appMain"></main></div>`;
}
function redirectAfterLogin(data){ const redirect = new URLSearchParams(location.search).get('redirect'); location.href = redirect || (isStaff(data.user) ? 'staff.html' : 'dashboard.html'); }
async function initAuthPages(){
  if(token()) { try { const current = await api('/api/auth/me'); localStorage.setItem(USER_KEY,JSON.stringify(current.user)); } catch { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); } }
  document.querySelector('[data-joinfree-form], [data-register-form]')?.addEventListener('submit', async e=>{ e.preventDefault(); const form=e.currentTarget; const box=form.querySelector('[data-form-message]'); try{ const data=await api('/api/auth/join-free',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(form).entries()))}); saveSession(data); redirectAfterLogin(data); } catch(err){ showMsg(box,err.message,'error'); } });
  document.querySelector('[data-login-form]')?.addEventListener('submit', async e=>{ e.preventDefault(); const form=e.currentTarget; const box=form.querySelector('[data-form-message]'); try{ const data=await api('/api/auth/login',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(form).entries()))}); saveSession(data); redirectAfterLogin(data); } catch(err){ showMsg(box,err.message,'error'); } });
  document.querySelector('[data-staff-login-form]')?.addEventListener('submit', async e=>{ e.preventDefault(); const form=e.currentTarget; const box=form.querySelector('[data-form-message]'); try{ const data=await api('/api/auth/staff-login',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(form).entries()))}); saveSession(data); location.href = new URLSearchParams(location.search).get('redirect') || 'staff.html'; } catch(err){ showMsg(box,err.message,'error'); } });
  window.handleGoogleCredential = async function(response){ const box=document.querySelector('[data-google-message]'); try{ const data=await api('/api/auth/google',{method:'POST',body:JSON.stringify({credential:response.credential})}); saveSession(data); redirectAfterLogin(data); } catch(err){ showMsg(box,err.message,'error'); } };
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
  return `<article class="card product-card">${image}<div><span class="badge info">${safe(p.category || p.deliveryType || 'Product')}</span><h3>${safe(p.name)}</h3><p>${safe(p.subtitle || p.description || '')}</p></div><div class="module row"><b>${money(p.priceNGN)}</b><div class="app-actions">${action}${p.youtubeUrl?`<a class="btn light small" href="${safe(p.youtubeUrl)}" target="_blank" rel="noreferrer">Tour</a>`:''}</div></div></article>`;
}
async function initDashboard(){
  const u = await requireLogin(); await recordActivity('dashboard_visit','Dashboard visit','User opened the dashboard workspace');
  document.body.innerHTML = appShell(location.hash === '#products' ? 'products' : 'dashboard'); bindLogout();
  const main=document.getElementById('appMain');
  main.innerHTML = `<div class="app-title"><div><span class="eyebrow">User Workspace</span><h1>Welcome, ${safe((u.name||'Founder').split(' ')[0])}</h1><p>Access your backend operating systems, products, support, and account settings.</p></div><a class="btn gold" href="#products">Browse Products</a></div><div class="kpi-grid"><div class="kpi"><span class="muted">Account</span><strong>${safe(u.status||'active')}</strong></div><div class="kpi"><span class="muted">Role</span><strong>${safe(u.role||'client')}</strong></div><div class="kpi"><span class="muted">Support</span><strong>24h</strong></div><div class="kpi"><span class="muted">Demo</span><strong>$7</strong></div></div><section class="workspace-grid"><div class="dash-card"><div class="app-title"><div><h2>My Purchased Systems</h2><p>Paid products and accessible files appear here.</p></div></div><div data-owned class="product-grid"><div class="empty-state">Loading your products...</div></div></div><aside class="dash-card"><h3>Account Summary</h3><p><b>${safe(u.name)}</b><br><span class="muted">${safe(u.email)}</span></p><div class="badges"><span class="badge success">${safe(u.status)}</span><span class="badge info">${safe(u.role)}</span></div><br><div class="app-actions"><a class="btn dark wide" href="support.html">Get Support</a><a class="btn light wide" href="settings.html">Update Profile</a></div></aside></section><section class="section" id="products" style="padding-bottom:0"><div class="app-title"><div><span class="eyebrow">Product Store</span><h2>Available Backend OS Products</h2><p>Products require login before payment. You are already logged in.</p></div></div><div data-store class="product-grid"><div class="empty-state">Loading products...</div></div></section>`;
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
  const title = kind==='support'?'Support Tickets':'Message the Staff Team';
  main.innerHTML = `<div class="app-title"><div><span class="eyebrow">${kind==='support'?'Help Center':'Staff Communication'}</span><h1>${title}</h1><p>Send a message connected to your account. Our team typically responds within 24 hours.</p></div></div><section class="workspace-grid"><div class="dash-card"><h2>Submit New Ticket</h2><form class="app-form" data-ticket><label>Subject<input name="subject" required placeholder="What do you need help with?"></label><label>Priority<select name="priority"><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label><label>Message<textarea name="message" required placeholder="Describe your issue in detail..."></textarea></label><button class="btn gold" type="submit">Send Message</button><div class="hidden" data-form-message></div></form></div><div class="dash-card"><h2>Your Support History</h2><div data-tickets class="module-list"><div class="empty-state">Loading...</div></div></div></section>`;
  const form=main.querySelector('[data-ticket]');
  form.addEventListener('submit',async e=>{ e.preventDefault(); const box=form.querySelector('[data-form-message]'); try{ await api('/api/support',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(form).entries()))}); showMsg(box,'Message sent to staff.','success'); form.reset(); loadTickets(); }catch(err){ showMsg(box,err.message,'error'); } });
  async function loadTickets(){ const box=main.querySelector('[data-tickets]'); try{ const {tickets}=await api('/api/support/mine'); box.innerHTML = tickets.length ? tickets.map(t=>`<div class="module"><div class="module row"><b>${safe(t.subject)}</b><span class="badge ${t.status==='open'?'info':'success'}">${safe(t.status)}</span></div><p>${safe(t.message)}</p>${t.adminReply?`<div class="notice success"><b>Staff Reply:</b> ${safe(t.adminReply)}</div>`:''}</div>`).join('') : '<div class="empty-state">No tickets yet.</div>'; }catch(err){ box.innerHTML=`<div class="notice error">${safe(err.message)}</div>`; } }
  loadTickets();
}
async function initSettings(){
  const u=await requireLogin(); document.body.innerHTML=appShell('settings'); bindLogout(); const main=document.getElementById('appMain');
  main.innerHTML = `<div class="app-title"><div><span class="eyebrow">User Settings</span><h1>Account Profile</h1><p>Update your personal information and contact details.</p></div></div><div class="dash-card" style="max-width:680px"><form class="app-form" data-settings><label>Full Name<input name="name" value="${safe(u.name||'')}" required></label><label>Company / Business Name<input name="company" value="${safe(u.company||'')}" placeholder="Your business name"></label><label>Phone Number<input name="phone" value="${safe(u.phone||'')}" placeholder="+234..."></label><label>Email Address<input value="${safe(u.email)}" disabled></label><button class="btn gold" type="submit">Save Changes</button><div class="hidden" data-form-message></div></form></div>`;
  main.querySelector('[data-settings]').addEventListener('submit',async e=>{ e.preventDefault(); const form=e.currentTarget, box=form.querySelector('[data-form-message]'); try{ const data=await api('/api/auth/me',{method:'PUT',body:JSON.stringify(Object.fromEntries(new FormData(form).entries()))}); localStorage.setItem(USER_KEY,JSON.stringify(data.user)); showMsg(box,'Profile updated','success'); }catch(err){ showMsg(box,err.message,'error'); } });
}
async function initStaff(){
  await requireLogin('staff');
  const raw = location.hash || '#overview';
  const active = raw.replace('#staff-','').replace('#','') || 'overview';
  document.body.innerHTML = staffShell(active); bindLogout(); const main=document.getElementById('appMain');
  if(raw==='#overview' || raw==='') return renderStaffOverview(main);
  if(raw==='#staff-users') return renderStaffUsers(main);
  if(raw==='#staff-products') return renderStaffProducts(main);
  if(raw==='#staff-orders') return renderStaffOrders(main);
  if(raw==='#staff-withdrawals') return renderStaffWithdrawals(main);
  if(raw==='#staff-activity') return renderStaffActivity(main);
  return renderStaffOverview(main);
}
async function renderStaffOverview(main){
  main.innerHTML = `<div class="app-title"><div><span class="eyebrow">Administrative Control</span><h1>Command Center</h1><p>Global overview of users, products, bookings, support and revenue.</p></div></div><div class="kpi-grid"><div class="kpi"><span class="muted">Revenue</span><strong id="stat-revenue">...</strong></div><div class="kpi"><span class="muted">Users</span><strong id="stat-users">...</strong></div><div class="kpi"><span class="muted">Products</span><strong id="stat-products">...</strong></div><div class="kpi"><span class="muted">Open Tickets</span><strong id="stat-tickets">...</strong></div></div><section class="workspace-grid"><div class="dash-card"><h2>Recent Activity</h2><div id="overview-activity" class="module-list">Loading...</div></div><div class="dash-card"><h2>Staff Shortcuts</h2><div class="app-actions"><a href="#staff-products" class="btn dark wide">Upload Product</a><a href="#staff-users" class="btn light wide">Manage Users</a><a href="#staff-withdrawals" class="btn gold wide">Withdrawals</a></div></div></section>`;
  try{ const data=await api('/api/staff/overview'); const s=data.stats || data; document.getElementById('stat-revenue').textContent=money(s.revenueNGN || s.revenue || 0); document.getElementById('stat-users').textContent=s.users ?? s.userCount ?? 0; document.getElementById('stat-products').textContent=s.products ?? 0; document.getElementById('stat-tickets').textContent=s.openTickets ?? s.ticketCount ?? 0; }catch(err){ console.error(err); }
  try{ const {activities}=await api('/api/staff/activities'); document.getElementById('overview-activity').innerHTML=(activities||[]).slice(0,8).map(activityItem).join('') || '<div class="empty-state">No activity yet.</div>'; }catch(err){ document.getElementById('overview-activity').innerHTML=`<div class="notice error">${safe(err.message)}</div>`; }
}
function activityItem(a){ return `<div class="module"><div class="module row"><b>${safe(a.title || a.type)}</b><span class="badge info">${safe(a.type)}</span></div><p>${safe(a.detail||'')}</p><small class="muted">${safe(a.name||'System')} ${a.email?`(${safe(a.email)})`:''} · ${new Date(a.createdAt).toLocaleString()}</small></div>`; }
async function renderStaffUsers(main){
  main.innerHTML = `<div class="app-title"><div><span class="eyebrow">User Management</span><h1>Users</h1><p>View users without changing backend permissions or auth rules.</p></div></div><div class="dash-card"><div id="user-list">Loading...</div></div>`;
  try{ const {users}=await api('/api/staff/users'); document.getElementById('user-list').innerHTML = `<div class="table-wrap"><table class="app-table"><thead><tr><th>Name</th><th>Email</th><th>Company</th><th>Role</th><th>Status</th></tr></thead><tbody>${(users||[]).map(u=>`<tr><td>${safe(u.name)}</td><td>${safe(u.email)}</td><td>${safe(u.company||'-')}</td><td><span class="badge info">${safe(u.role)}</span></td><td><span class="badge ${u.status==='active'?'success':'warn'}">${safe(u.status)}</span></td></tr>`).join('')}</tbody></table></div>`; }catch(err){ document.getElementById('user-list').innerHTML=`<div class="notice error">${safe(err.message)}</div>`; }
}
async function renderStaffProducts(main){
  main.innerHTML = `<div class="app-title"><div><span class="eyebrow">Product Management</span><h1>Product Uploads</h1><p>Uploaded products automatically appear on the homepage/product API and user dashboard.</p></div></div><section class="workspace-grid"><div class="dash-card"><h2>Create Product</h2><form class="app-form" data-product-form><label>Name<input name="name" required placeholder="Backend OS Demo"></label><label>Slug<input name="slug" placeholder="backend-os-demo"></label><label>Subtitle<input name="subtitle" placeholder="Short product promise"></label><label>Description<textarea name="description" placeholder="Product details"></textarea></label><div class="grid grid-2"><label>Price USD<input type="number" name="priceUSD" required value="7"></label><label>Price NGN<input type="number" name="priceNGN" required value="11200"></label></div><label>Category<input name="category" value="Backend OS"></label><label>Delivery Type<select name="deliveryType"><option value="digital">Digital</option><option value="service">Service</option></select></label><label>Image URL<input name="imageUrl" placeholder="/assets/images/uploads/image.png"></label><label>Download/File URL<input name="fileUrl" placeholder="/uploads/products/file.pdf"></label><label>YouTube Walkthrough URL<input name="youtubeUrl" placeholder="https://youtube.com/..."></label><label>Tags<input name="tags" placeholder="notion, clickup, finance"></label><button class="btn gold" type="submit">Create Product</button><div class="hidden" data-form-message></div></form></div><div class="dash-card"><h2>Upload Files</h2><form class="app-form" data-upload-form data-upload-type="image"><label>Product image<input type="file" name="file" accept="image/*" required></label><button class="btn light" type="submit">Upload Image</button><div class="hidden" data-form-message></div></form><hr><form class="app-form" data-upload-form data-upload-type="file"><label>Product file<input type="file" name="file" required></label><button class="btn light" type="submit">Upload Product File</button><div class="hidden" data-form-message></div></form></div></section><section class="section" style="padding-bottom:0"><div class="dash-card"><h2>Current Products</h2><div id="product-list" class="product-grid">Loading...</div></div></section>`;
  async function loadProducts(){ const list=document.getElementById('product-list'); try{ const {products}=await api('/api/products'); list.innerHTML=(products||[]).map(p=>productCard(p,false)).join('') || '<div class="empty-state">No products yet.</div>'; }catch(err){ list.innerHTML=`<div class="notice error">${safe(err.message)}</div>`; } }
  main.querySelector('[data-product-form]').addEventListener('submit',async e=>{ e.preventDefault(); const form=e.currentTarget, box=form.querySelector('[data-form-message]'); const data=Object.fromEntries(new FormData(form).entries()); try{ await api('/api/products',{method:'POST',body:JSON.stringify(data)}); showMsg(box,'Product created successfully.','success'); form.reset(); loadProducts(); }catch(err){ showMsg(box,err.message,'error'); } });
  main.querySelectorAll('[data-upload-form]').forEach(form=>form.addEventListener('submit',async e=>{ e.preventDefault(); const box=form.querySelector('[data-form-message]'); const type=form.dataset.uploadType === 'image' ? '?type=image' : ''; const fd=new FormData(form); try{ const data=await api(`/api/products/upload${type}`,{method:'POST',body:fd}); showMsg(box,`Uploaded: ${data.fileUrl}`,'success'); }catch(err){ showMsg(box,err.message,'error'); } }));
  loadProducts();
}
async function renderStaffOrders(main){
  main.innerHTML = `<div class="app-title"><div><span class="eyebrow">Payments</span><h1>Orders</h1><p>Payment records from the existing Paystack flow.</p></div></div><div class="dash-card"><div id="order-list">Loading...</div></div>`;
  try{ const {orders}=await api('/api/staff/orders'); document.getElementById('order-list').innerHTML=`<div class="table-wrap"><table class="app-table"><thead><tr><th>Name</th><th>Email</th><th>Product</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead><tbody>${(orders||[]).map(o=>`<tr><td>${safe(o.name||'-')}</td><td>${safe(o.email)}</td><td>${safe(o.productSlug)}</td><td>${money(o.amount)}</td><td><span class="badge ${o.status==='paid'?'success':'warn'}">${safe(o.status)}</span></td><td>${new Date(o.createdAt).toLocaleDateString()}</td></tr>`).join('')}</tbody></table></div>`; }catch(err){ document.getElementById('order-list').innerHTML=`<div class="notice error">${safe(err.message)}</div>`; }
}
async function renderStaffWithdrawals(main){
  main.innerHTML = `<div class="app-title"><div><span class="eyebrow">Financial System</span><h1>Withdrawals</h1><p>Request and track payouts to the company bank account.</p></div></div><section class="workspace-grid"><div class="dash-card"><h2>Request Payout</h2><form class="app-form" data-withdrawal-form><label>Amount (NGN)<input type="number" name="amount" required></label><label>Bank Name<input name="bankName" value="Tyna Systems" required></label><label>Account Number<input name="accountNumber" required></label><label>Account Name<input name="accountName" value="Tyna Systems" required></label><label>Notes<textarea name="notes" placeholder="Optional note"></textarea></label><button class="btn gold" type="submit">Submit Request</button><div class="hidden" data-form-message></div></form></div><div class="dash-card"><h2>Withdrawal History</h2><div id="withdrawal-list" class="module-list">Loading...</div></div></section>`;
  const form=main.querySelector('[data-withdrawal-form]'); form.addEventListener('submit',async e=>{ e.preventDefault(); const box=form.querySelector('[data-form-message]'); try{ await api('/api/staff/withdrawals',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(form).entries()))}); showMsg(box,'Withdrawal request submitted.','success'); form.reset(); loadWithdrawals(); }catch(err){ showMsg(box,err.message,'error'); } });
  async function loadWithdrawals(){ const box=document.getElementById('withdrawal-list'); try{ const {withdrawals}=await api('/api/staff/withdrawals'); box.innerHTML=(withdrawals||[]).map(w=>`<div class="module"><div class="module row"><b>${money(w.amount)}</b><span class="badge ${w.status==='completed'?'success':'info'}">${safe(w.status)}</span></div><small class="muted">${safe(w.bankName)} · ${new Date(w.createdAt).toLocaleDateString()}</small></div>`).join('') || '<div class="empty-state">No requests yet.</div>'; }catch(err){ box.innerHTML=`<div class="notice error">${safe(err.message)}</div>`; } }
  loadWithdrawals();
}
async function renderStaffActivity(main){
  main.innerHTML = `<div class="app-title"><div><span class="eyebrow">Notifications & Activity</span><h1>User Activity Log</h1><p>Registration, login, dashboard, purchase, support and staff actions.</p></div></div><div class="dash-card"><div id="activity-list" class="module-list">Loading...</div></div>`;
  try{ const {activities}=await api('/api/staff/activities'); document.getElementById('activity-list').innerHTML=(activities||[]).map(activityItem).join('') || '<div class="empty-state">No activity recorded.</div>'; }catch(err){ document.getElementById('activity-list').innerHTML=`<div class="notice error">${safe(err.message)}</div>`; }
}
window.addEventListener('hashchange',()=>{ const page=document.body.dataset.appPage; if(page==='staff') initStaff(); if(page==='dashboard') initDashboard(); });
document.addEventListener('DOMContentLoaded',()=>{ const page=document.body.dataset.appPage; if(page==='auth') initAuthPages(); if(page==='dashboard') initDashboard(); if(page==='support') initSupport('support'); if(page==='contact-staff') initSupport('contact-staff'); if(page==='settings') initSettings(); if(page==='staff' || page==='admin') initStaff(); });
