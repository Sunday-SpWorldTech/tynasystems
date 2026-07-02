
const API_URL = window.TYNA_API_URL || ((location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.hostname === '' || location.protocol === 'file:') ? 'http://localhost:5000' : '');
const API_FALLBACK_URL = 'https://tynasystems-backend.onrender.com';
function shouldRetryWithLiveBackend(base){ return /localhost:5000|127\.0\.0\.1:5000/.test(String(base || '')); }
const TOKEN_KEY = 'tyna_token';
const USER_KEY = 'tyna_user';
const tools = [
  {id:'notion', name:'Notion', url:'https://www.notion.so/', desc:'Company brain for SOPs, docs, dashboards, client hubs and internal knowledge.'},
  {id:'clickup', name:'ClickUp', url:'https://clickup.com/', desc:'Company engine for tasks, project timelines, ownership, deadlines and automation.'},
  {id:'crm-tools', name:'CRM Tools', url:'tools.html#crm-tools', local:true, desc:'Custom CRM, Salesforce, Make.com and Zapier automation for pipelines, client records, role-based access and integrations.'},
  {id:'web-development-tools', name:'Web Development Tools', url:'developer-tools.html', local:true, desc:'Professional website, dashboard and backend build stack: VS Code, React, Node, Express, MongoDB, UI/UX, GitHub and Render.'}
];

const pageGalleries = {
  tools: [
    {
      image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
      title: 'African-led documentation teams',
      text: 'Collaborative planning with a team mix that feels African-first while still including global black and white professionals.'
    },
    {
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
      title: 'ClickUp execution standups',
      text: 'Diverse operations teams reviewing deadlines, delivery and accountability together.'
    },
    {
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
      title: 'Workflow clarity in action',
      text: 'Cross-functional staff using clean systems, dashboards and shared ownership.'
    },
    {
      image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
      title: 'Mixed teams around one process',
      text: 'Professional teamwork that visually blends black and white people in one coordinated workflow.'
    },
    {
      image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80',
      title: 'Founder systems workshops',
      text: 'Structured planning sessions focused on operations, project delivery and internal visibility.'
    },
    {
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
      title: 'Operating rhythm meetings',
      text: 'Modern, people-centered coordination using the same tools the Tyna Systems team recommends.'
    }
  ],
  support: [
    {
      image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80',
      title: 'Support teams that listen',
      text: 'A polished customer support setting with African and American team energy working side by side.'
    },
    {
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
      title: 'Ticket follow-up with context',
      text: 'Professional team review sessions designed to resolve issues quickly and clearly.'
    },
    {
      image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
      title: 'Workspace assistance',
      text: 'Support for founders, teams and staff inside one organized operating environment.'
    },
    {
      image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
      title: 'Problem solving in real time',
      text: 'Diverse professionals reviewing systems, tasks and user requests together.'
    },
    {
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
      title: 'Support planning sessions',
      text: 'Coordinated standups that keep service delivery responsive and calm.'
    },
    {
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80',
      title: 'Client-first communication',
      text: 'Warm, credible support visuals with mixed black and white teams in professional spaces.'
    }
  ],
  privacy: [
    {
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
      title: 'Secure team collaboration',
      text: 'A diverse team discussing information governance and responsible data handling.'
    },
    {
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
      title: 'Data kept visible and controlled',
      text: 'Professional systems that protect user information while enabling clear operations.'
    },
    {
      image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
      title: 'Trust through process',
      text: 'Mixed teams reviewing workflows, permissions and communication standards.'
    },
    {
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
      title: 'Operational transparency',
      text: 'Visual storytelling for privacy practices built around collaborative work.'
    },
    {
      image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80',
      title: 'Responsible client care',
      text: 'African-majority teams with international collaboration, reflecting the requested image balance.'
    },
    {
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
      title: 'Internal privacy reviews',
      text: 'Professional meetings that reinforce consent, access and security awareness.'
    }
  ],
  terms: [
    {
      image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
      title: 'Clear agreements and delivery',
      text: 'Professional teams aligning on scope, timelines and expectations.'
    },
    {
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
      title: 'Transparent client terms',
      text: 'Structured operations that help clients understand what they are buying and receiving.'
    },
    {
      image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
      title: 'Team accountability',
      text: 'Diverse teams coordinating work, billing and deliverable ownership.'
    },
    {
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
      title: 'Professional service planning',
      text: 'Mixed black and white professionals working through service conditions together.'
    },
    {
      image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80',
      title: 'Implementation expectations',
      text: 'Visual support for done-for-you builds, timelines and structured delivery.'
    },
    {
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
      title: 'Real-world execution',
      text: 'Modern office collaboration that fits the legal and commercial pages.'
    }
  ],
  faq: [
    {
      image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80',
      title: 'Questions answered clearly',
      text: 'Helpful, diverse teams guiding founders through systems and next steps.'
    },
    {
      image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
      title: 'Founder onboarding support',
      text: 'Professional visuals showing how teams coordinate around recurring questions.'
    },
    {
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
      title: 'Mixed teams, shared answers',
      text: 'African-majority collaboration with international representation inside the same scene.'
    },
    {
      image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
      title: 'Operational Q&A workshops',
      text: 'Team meetings designed around clarity, systems adoption and implementation confidence.'
    },
    {
      image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
      title: 'Supportive implementation sessions',
      text: 'Professional environments that match a Frequently Asked Questions page.'
    },
    {
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80',
      title: 'Confidence before you book',
      text: 'Warm and credible imagery that helps users understand the service quickly.'
    }
  ]
};

function getToken(){return localStorage.getItem(TOKEN_KEY)}
function getUser(){try{return JSON.parse(localStorage.getItem(USER_KEY)||'null')}catch{return null}}
function isLoggedIn(){return Boolean(getToken())}
function isStaffUser(){return ['staff','admin'].includes(getUser()?.role)}
function authUrl(target='dashboard.html'){return `login.html?redirect=${encodeURIComponent(target)}`}
function normalizeProtectedTarget(target=''){ const raw=String(target||'').trim(); return raw.includes('demo-checkout.html') ? 'dashboard.html#products' : (raw || 'dashboard.html'); }
function safe(v=''){return String(v ?? '').replace(/[&<>\"]/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
function showMsg(el, text, type='success'){ if(!el) return alert(text); el.className=`notice ${type}`; el.textContent=text; el.classList.remove('hidden'); }
async function api(path, options={}){ const headers={...(options.headers||{})}; if(!(options.body instanceof FormData)) headers['Content-Type']='application/json'; if(getToken()) headers.Authorization=`Bearer ${getToken()}`; const request=async(base)=>{ const res=await fetch(`${base}${path}`,{...options,headers}); const data=await res.json().catch(()=>({})); if(!res.ok) throw new Error(data.message||'Request could not be completed. Please try again.'); return data; }; try{return await request(API_URL);}catch(err){ if(shouldRetryWithLiveBackend(API_URL)) return request(API_FALLBACK_URL); throw new Error(err.message || 'Service is currently unavailable. Please try again.'); } }

function nav(){
  const accountLinks = `<a href="login.html" class="btn ghost small">Login</a><a href="joinfree.html" class="btn gold small">Join Free</a>`;
  const buildMenu = '';
  const resourcesMenu = `
    <div class="menu-wrap">
      <button class="menu-trigger" type="button" aria-haspopup="true" aria-expanded="false">Resources <span class="menu-caret">▾</span></button>
      <div class="menu-dropdown" role="menu" aria-label="Resources menu">
        <a href="backend-os.html" role="menuitem">What We Build</a>
        <a href="demo-checkout.html" role="menuitem" data-protected-link="demo-checkout.html">Demo $6.99 Download</a>
        <a href="tools.html" role="menuitem">Tools We Use</a>
        <a href="developer-tools.html" role="menuitem">Web Development Tools</a>
        <a href="client-results.html" role="menuitem">Client Results</a>
        <a href="book-call.html" role="menuitem">Book a Call</a>
        <a href="support.html" role="menuitem">Support</a>
        <a href="partners.html" role="menuitem">Partners</a>
        <a href="community.html" role="menuitem">Community</a>
        <a href="frequent-questions.html" role="menuitem">Frequent Questions</a>
        <a href="internships.html" role="menuitem">Internship Opportunity</a>
      </div>
    </div>`;
  return `<header class="topbar"><div class="container nav"><a href="index.html" class="brand"><div class="brand-mark"><img src="assets/images/logo.webp" alt="Tyna Systems"></div><span>TYNA<small>SYSTEMS</small></span></a><button class="mobile-toggle" aria-label="Open menu" aria-expanded="false">☰</button><nav class="navlinks" aria-label="Main navigation"><a href="index.html">Home</a><a href="about.html">About</a><a href="services.html">Services</a><a href="backend-os.html">Backend OS</a><a href="implementation.html">Implementation</a><a href="tyna-coding-academy.html">Coding Academy</a>${buildMenu}<a href="developer-tools.html#developer-pricing">Pricing</a>${resourcesMenu}<a href="contact.html">Contact</a><span class="nav-actions demo-and-account">${accountLinks}</span></nav></div></header>`;
}

function socialIcon(name){
  const icons = {
    linkedin:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.2 8.7H2.4V21h2.8V8.7ZM3.8 3a1.7 1.7 0 1 0 0 3.4A1.7 1.7 0 0 0 3.8 3Zm6.1 5.7H7.2V21H10v-6.3c0-1.7.7-3.3 2.6-3.3 1.9 0 2 1.8 2 3.4V21h2.8v-7c0-3.5-1.5-5.6-4.5-5.6-1.5 0-2.5.8-3 1.6V8.7Z"/></svg>',
    instagram:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.25" y="3.25" width="17.5" height="17.5" rx="5.2"/><circle cx="12" cy="12" r="4.1"/><circle cx="17.4" cy="6.6" r="1"/></svg>',
    twitter:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.9 3H22l-6.8 7.8L23 21h-6.1l-4.8-6.2L6.6 21H3.5l7.2-8.2L1.3 3h6.2l4.4 5.8L18.9 3Zm-1.1 16h1.7L6.2 4.9H4.4L17.8 19Z"/></svg>'
  };
  return icons[name] || '';
}

function footer(){
  const account='<a href="login.html">Login</a><a href="joinfree.html">Join Free</a>';
  return `<footer class="footer"><div class="container"><div class="footer-grid"><div><a href="index.html" class="brand"><div class="brand-mark"><img src="assets/images/logo.webp" alt="Tyna Systems"></div><span>TYNA<small>SYSTEMS</small></span></a><p style="margin-top:16px">We build operating systems for Founders so their businesses can run without them.</p><div class="footer-socials" aria-label="Tyna Systems social media links"><a href="https://www.linkedin.com/company/tyna-systems/" target="_blank" rel="noopener" aria-label="LinkedIn">${socialIcon('linkedin')}</a><a href="https://www.instagram.com/" target="_blank" rel="noopener" aria-label="Instagram">${socialIcon('instagram')}</a><a href="https://x.com/TinaAus46478452" target="_blank" rel="noopener" aria-label="Twitter or X">${socialIcon('twitter')}</a></div></div><div><h3>Company</h3><a href="about.html">About</a><a href="client-results.html">Client Results</a><a href="contact.html">Contact</a><a href="partners.html">Partners</a><a href="frequent-questions.html">Frequent Questions</a><a href="community.html">Community</a><a href="internships.html">Internship Opportunity</a><a href="tyna-coding-academy.html">Coding Academy</a>${account}</div><div><h3>What We Build</h3><a href="backend-os.html">Backend OS</a><a href="implementation.html">Implementation</a><a href="services.html">Services</a><a href="book-call.html">Book a Call</a></div><div><h3>Tools We Use</h3><a href="tools.html#notion">Notion</a><a href="tools.html#clickup">ClickUp</a><a href="tools.html#crm-tools">CRM Tools</a><a href="developer-tools.html">Web Development Tools</a></div><div><h3>Legal</h3><a href="support.html">Support</a><a href="privacy-policy.html">Privacy Policy</a><a href="terms.html">Terms &amp; Conditions</a></div></div><div class="bottom"><div>© 2026 Tyna Systems LLC. Built for Founders.</div><div class="footer-clock" aria-live="polite"><span class="footer-clock-label">Current time</span><span id="footer-current-time">Loading…</span></div></div></div></footer>`;
}


function fallbackAcademyCourses(){
  return [
    {id:'html-foundations',title:'HTML Foundations',track:'Frontend',level:'basic',lessons:8,description:'Structure professional pages with semantic HTML, forms, links, images and clean sections.'},
    {id:'css-professional-ui',title:'CSS Professional UI',track:'Frontend',level:'basic',lessons:10,description:'Build responsive layouts, cards, hero sections, grids and modern UI spacing.'},
    {id:'javascript-core',title:'JavaScript Core',track:'Frontend',level:'basic',lessons:12,description:'Learn DOM control, events, forms and API calls for real websites.'},
    {id:'python-for-builders',title:'Python for Builders',track:'Programming',level:'basic',lessons:12,description:'Understand Python syntax, logic, files and practical builder scripts.'},
    {id:'django-backend',title:'Django Backend Development',track:'Backend',level:'advanced',lessons:12,description:'Build Python Django web apps with routes, templates, models, admin panel and deployment-ready structure.'},
    {id:'react-frontend',title:'React Frontend Apps',track:'Advanced',level:'advanced',lessons:14,description:'Create components, routes, state, forms and dashboard interfaces.'},
    {id:'node-express-api',title:'Node.js + Express API',track:'Backend',level:'advanced',lessons:14,description:'Build REST APIs, routes, middleware and backend services.'},
    {id:'mongodb-backend',title:'MongoDB Backend Systems',track:'Backend',level:'advanced',lessons:10,description:'Design schemas and save users, progress, orders and platform data.'},
    {id:'premium-school-1',title:'Premium School 1',track:'Premium',level:'premium',lessons:16,description:'Build a complete professional website connected to backend-ready structure.'},
    {id:'premium-school-2',title:'Premium School 2',track:'Premium',level:'premium',lessons:18,description:'Build dashboards, auth flow and protected workspaces.'},
    {id:'premium-school-3',title:'Premium School 3',track:'Premium',level:'premium',lessons:20,description:'Complete a job-ready platform project and qualify for certificate review.'}
  ];
}
const academyLearningPages = {
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
function academyPageFor(courseId){ return academyLearningPages[courseId] || `academy-${courseId}.html`; }

function academyCard(course){
  const levelClass = course.level === 'basic' ? 'success' : (course.level === 'advanced' ? 'info' : 'warn');
  return `<article class="product-card"><div class="product-media"><img loading="lazy" decoding="async" src="https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80" alt="${safe(course.title)} coding lessons"></div><div class="product-body"><div class="badges"><span class="badge ${levelClass}">${safe(course.level)}</span><span class="badge info">${safe(course.lessons)} lessons</span></div><h3>${safe(course.title)}</h3><p>${safe(course.description)}</p><small class="muted">Track: ${safe(course.track)}</small><div class="app-actions" style="margin-top:14px"><a class="btn dark small" href="${academyPageFor(course.id)}">Open Learning Page</a></div></div></article>`;
}
async function initAcademyPublic(){
  const grid=document.getElementById('academy-course-grid');
  if(!grid) return;
  try{
    const data=await api('/api/academy/courses');
    const courses=data.courses?.length ? data.courses : fallbackAcademyCourses();
    grid.innerHTML=courses.map(academyCard).join('');
  }catch(err){
    grid.innerHTML=fallbackAcademyCourses().map(academyCard).join('') + `<div class="notice info">Backend preview note: ${safe(err.message)}. Courses will load from API after deployment.</div>`;
  }
}

function closeMenus(){
  document.querySelectorAll('.menu-wrap.open').forEach(wrap=>{
    wrap.classList.remove('open');
    const trigger = wrap.querySelector('.menu-trigger');
    if(trigger) trigger.setAttribute('aria-expanded','false');
  });
}

function mountLayout(){
  document.body.insertAdjacentHTML('afterbegin', nav());
  document.body.insertAdjacentHTML('beforeend', footer());
  const toggle=document.querySelector('.mobile-toggle');
  toggle?.addEventListener('click',()=>{
    const links=document.querySelector('.navlinks');
    links?.classList.toggle('open');
    toggle.setAttribute('aria-expanded', links?.classList.contains('open')?'true':'false');
  });
  document.querySelectorAll('.menu-wrap').forEach(wrap=>{
    const trigger = wrap.querySelector('.menu-trigger');
    trigger?.addEventListener('click', e=>{
      e.stopPropagation();
      const willOpen = !wrap.classList.contains('open');
      closeMenus();
      wrap.classList.toggle('open', willOpen);
      trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });
  });
  document.addEventListener('click', closeMenus);
  guardProtectedLinks();
  initFooterClock();
  initAcademyPublic();
}

function guardProtectedLinks(){ document.querySelectorAll('a[data-protected-link], a[href*="demo-checkout.html#full-template"]').forEach(link=>{ link.addEventListener('click',e=>{ const target=normalizeProtectedTarget(link.dataset.protectedLink||link.getAttribute('href')||'dashboard.html'); if(!isLoggedIn()){ e.preventDefault(); location.href=authUrl(target); } else if((link.dataset.protectedLink||link.getAttribute('href')||'').includes('demo-checkout.html')){ e.preventDefault(); location.href='dashboard.html#products'; } }); }); }
function initFooterClock(){ const el=document.getElementById('footer-current-time'); if(!el) return; const update=()=>{ const now=new Date(); const formatted=new Intl.DateTimeFormat(undefined,{weekday:'short', year:'numeric', month:'short', day:'numeric', hour:'numeric', minute:'2-digit', second:'2-digit', timeZoneName:'short'}).format(now); el.textContent=formatted; }; update(); window.clearInterval(window.__tynaFooterClock); window.__tynaFooterClock=window.setInterval(update,1000); }
function mountTools(){ document.querySelectorAll('[data-tool-grid]').forEach(grid=>{ grid.innerHTML=tools.map(t=>`<a id="${t.id}" class="card tool-card ${t.local?'developer-tool-link':''}" href="${t.url}" ${t.local?'':'target="_blank" rel="noopener sponsored" data-affiliate-placeholder="true"'}><img src="assets/images/logos/${t.id}.svg" alt="${t.name} SVG logo"><div><h3>${t.name}</h3><p>${t.desc}</p></div></a>`).join(''); }); }
function mountPageGalleries(){
  document.querySelectorAll('[data-page-gallery]').forEach(grid=>{
    const key = grid.dataset.pageGallery;
    const cards = pageGalleries[key] || [];
    grid.innerHTML = cards.map(card=>`<article class="media-card gallery-card"><img loading="lazy" decoding="async" src="${card.image}" alt="${safe(card.title)}"><div class="media-body"><h3>${safe(card.title)}</h3><p>${safe(card.text)}</p></div></article>`).join('');
  });
}

function fileLinks(files=[]){ return files.length ? `<div class="dev-files">${files.map(f=>`<a class="badge info" href="${safe(f.url)}" target="_blank" rel="noreferrer">📎 ${safe(f.originalName || f.filename)} (${Math.round((f.size||0)/1024)} KB)</a>`).join('')}</div>` : ''; }
function renderPublicDevChat(request){
  const chat=document.querySelector('[data-dev-chat]');
  const follow=document.querySelector('[data-dev-followup-form]');
  if(!chat || !request) return;
  chat.innerHTML = `<div class="notice success"><b>Request ID:</b> ${safe(request.id)}<br>Save this ID to continue your chat later.</div>${(request.messages||[]).map(m=>`<div class="chat-bubble ${m.sender==='developer'?'developer':'student'}"><b>${m.sender==='developer'?'Sunday Prince Augustine':safe(m.name||request.studentName)}</b><p>${safe(m.message||'')}</p>${fileLinks(m.files||[])}<small>${new Date(m.createdAt||Date.now()).toLocaleString()}</small></div>`).join('')}`;
  if(follow){ follow.classList.remove('hidden'); follow.querySelector('input[name="requestId"]').value=request.id; }
}
function initDeveloperPage(){
  const createForm=document.querySelector('[data-dev-request-form]');
  createForm?.addEventListener('submit',async e=>{
    e.preventDefault();
    const form=e.currentTarget; const box=form.querySelector('[data-form-message]'); const fd=new FormData(form);
    try{ const data=await api('/api/developer/requests',{method:'POST',body:fd}); showMsg(box,`Request sent successfully. Your request ID is ${data.request.id}`,'success'); renderPublicDevChat(data.request); form.reset(); location.hash='developer-chat'; }
    catch(err){ showMsg(box,err.message,'error'); }
  });
  const loadForm=document.querySelector('[data-dev-load-form]');
  loadForm?.addEventListener('submit',async e=>{
    e.preventDefault(); const form=e.currentTarget; const box=form.querySelector('[data-form-message]'); const id=new FormData(form).get('requestId');
    try{ const data=await api(`/api/developer/requests/${encodeURIComponent(id)}`); showMsg(box,'Chat loaded.','success'); renderPublicDevChat(data.request); }
    catch(err){ showMsg(box,err.message,'error'); }
  });
  const followForm=document.querySelector('[data-dev-followup-form]');
  followForm?.addEventListener('submit',async e=>{
    e.preventDefault(); const form=e.currentTarget; const box=form.querySelector('[data-form-message]'); const fd=new FormData(form); const id=fd.get('requestId'); fd.delete('requestId');
    try{ const data=await api(`/api/developer/requests/${encodeURIComponent(id)}/messages`,{method:'POST',body:fd}); showMsg(box,'Message sent to developer.','success'); renderPublicDevChat(data.request); form.reset(); form.querySelector('input[name="requestId"]').value=id; }
    catch(err){ showMsg(box,err.message,'error'); }
  });
}

function initForms(){ document.querySelectorAll('[data-api-form]').forEach(form=>{ const target=form.dataset.apiForm; const msg=form.querySelector('[data-form-message]'); form.addEventListener('submit',async e=>{ e.preventDefault(); const payload=Object.fromEntries(new FormData(form).entries()); try{ const data=await api(target,{method:'POST',body:JSON.stringify(payload)}); form.reset(); showMsg(msg,data.message||'Submitted successfully.','success'); }catch(err){ showMsg(msg,err.message,'error'); } }); }); }


const paymentCategories = {
  'Developer Services': [
    'Starter Business Website - $299', 'Custom Business Website - $599', 'Website + Web App - $1,200', 'Custom Business Web App - $2,500', 'Website + Mobile App - $3,500', 'Backend API System - $999', 'Admin/User Dashboard System - $1,500', 'E-commerce Platform - $1,800', 'LMS / Coding Academy Platform - $2,800', 'Authentication & Google Login - $199', 'Payment Integration - $250', 'Maintenance Plan - $49/mo'
  ],
  'Notion Systems': [
    'Download Platform Preview', 'Full Template', 'Done-For-You Build', 'Business OS', 'Founder Command Center', 'Operations SOP Hub', 'Finance Tracker', 'Project Management Workspace', 'Client Portal', 'Team Wiki', 'CRM Notion Template', 'Notion Automation Setup'
  ],
  'CRM Systems': [
    'CRM Discovery Audit', 'Custom CRM Starter', 'Custom CRM Pro', 'Multi-Tenant CRM', 'Salesforce Setup', 'Salesforce Automation', 'Make.com CRM Automation', 'Zapier CRM Integration', 'Lead Capture Forms', 'Pipeline Dashboard', 'Role-Based Access Setup', 'CRM Maintenance'
  ]
};
function populateProjectPaymentCategories(){
  document.querySelectorAll('select[name="projectCategory"]').forEach(select=>{
    if(select.dataset.populated==='true') return;
    select.innerHTML = '<option value="">Select category</option>' + Object.keys(paymentCategories).map(cat=>`<option value="${safe(cat)}">${safe(cat)}</option>`).join('');
    select.dataset.populated='true';
  });
  document.querySelectorAll('select[name="projectType"][data-professional-types]').forEach(select=>{
    const old = select.value;
    const options = Object.entries(paymentCategories).map(([group, items])=>`<optgroup label="${safe(group)}">${items.map(item=>`<option value="${safe(item)}">${safe(item)}</option>`).join('')}</optgroup>`).join('');
    select.innerHTML = '<option value="">Select payment item</option>' + options + '<option value="Custom Negotiated Project">Custom Negotiated Project</option>';
    if(old) select.value=old;
  });
}
function initCertificateVerificationPage(){
  const form=document.querySelector('[data-certificate-verify-form]');
  if(!form) return;
  form.addEventListener('submit', async e=>{
    e.preventDefault();
    const box=form.querySelector('[data-form-message]');
    const result=document.querySelector('[data-certificate-result]');
    const id=String(new FormData(form).get('certificateId')||'').trim();
    try{
      showMsg(box,'Checking certificate...','info');
      const data=await api(`/api/academy/certificates/verify/${encodeURIComponent(id)}`);
      const cert=data.certificate||{};
      result.innerHTML=`<div class="notice success"><b>Valid certificate.</b><br>Name: ${safe(cert.name||cert.fullName||'Awarded student')}<br>Status: ${safe(cert.certificateStatus||'awarded')}<br>Certificate ID: ${safe(cert.certificateId||id)}</div>`;
      showMsg(box,'Certificate verified.','success');
    }catch(err){
      result.innerHTML=`<div class="notice error"><b>Certificate not verified.</b><br>${safe(err.message)}</div>`;
      showMsg(box,'Certificate not found or not awarded yet.','error');
    }
  });
}

async function startProjectPayment(payload){
  const data=await api('/api/payments/project/initialize',{method:'POST',body:JSON.stringify(payload)});
  if(data.authorization_url) location.href=data.authorization_url;
  else throw new Error('Project payment could not start. Check Paystack USD settings.');
}

async function startPayment(productSlug='backend-os-demo'){ if(!isLoggedIn()){ location.href=authUrl('dashboard.html#products'); return; } const data=await api('/api/payments/initialize',{method:'POST',body:JSON.stringify({productSlug})}); if(data.authorization_url) location.href=data.authorization_url; else throw new Error('Payment could not start. Check Paystack settings.'); }
function initPayments(){
  populateProjectPaymentCategories();
  document.querySelectorAll('[data-start-payment]').forEach(btn=>{ const msg=document.querySelector('[data-payment-message]'); btn.addEventListener('click',async()=>{ try{ showMsg(msg,'Starting secure checkout...','success'); await startPayment(btn.dataset.startPayment); }catch(err){ showMsg(msg,err.message,'error'); } }); });
  document.querySelectorAll('[data-project-payment-form]').forEach(form=>{
    const msg=form.querySelector('[data-form-message]');
    const amount=form.querySelector('input[name="amountUSD"]');
    form.addEventListener('submit',async e=>{ e.preventDefault(); const payload=Object.fromEntries(new FormData(form).entries()); payload.amountUSD=Number(payload.amountUSD||0); try{ showMsg(msg,'Starting secure USD checkout...','success'); await startProjectPayment(payload); }catch(err){ showMsg(msg,err.message,'error'); } });
  });
  const qs=new URLSearchParams(location.search); const ref=qs.get('reference')||qs.get('trxref'); const box=document.querySelector('[data-payment-verify]'); if(box && ref){ api(`/api/payments/verify/${encodeURIComponent(ref)}`).then(data=>{ box.innerHTML=`<div class="notice success"><b>Payment verified.</b><br>${safe(data.message||'Your payment has been confirmed. Your full project payment has been recorded successfully.')}</div>`; }).catch(err=>{ box.innerHTML=`<div class="notice error">${safe(err.message)}</div>`; }); } }

async function initMaintenanceBanner(){
  const publicPage = !document.body.dataset.appPage;
  if(!publicPage) return;
  try{
    const {maintenance}=await api('/api/settings/maintenance');
    if(maintenance?.enabled){
      const banner=document.createElement('div');
      banner.className='notice warn maintenance-public-banner';
      banner.innerHTML=`<b>Maintenance mode:</b> ${safe(maintenance.message || 'Tyna Systems is under professional maintenance.')}`;
      document.body.prepend(banner);
    }
  }catch{}
}

function chatFileLinks(files=[]){ return (files||[]).map(f=>`<a class="chat-attachment" href="${safe(f.url)}" target="_blank" rel="noreferrer">📎 ${safe(f.originalName||f.filename||'attachment')}</a>`).join(''); }
function initContactChatWidget(){
  const savedRoom = localStorage.getItem('tyna_public_chat_room') || '';
  const widget = document.createElement('div');
  widget.className = 'floating-contact-chat';
  const visitorId = localStorage.getItem('tyna_public_chat_visitor') || `visitor_${Date.now()}_${Math.random().toString(16).slice(2)}`; localStorage.setItem('tyna_public_chat_visitor', visitorId);
  widget.innerHTML = `<button class="floating-chat-button" type="button" data-chat-toggle>💬 Support</button><div class="floating-chat-panel" data-chat-panel><div class="floating-chat-head"><div><b>Tyna Support</b><small>Send a message. Screenshot is optional.</small></div><button type="button" data-chat-close>×</button></div><div class="floating-chat-body" data-chat-body><div class="empty-state">Hi, how can we help you today?</div></div><form class="floating-chat-form public-whatsapp-compose" data-public-chat-form><div class="public-chat-identity"><input name="name" placeholder="Name (optional)"><input name="email" type="email" placeholder="Email (optional)"><input type="hidden" name="visitorId" value="${safe(visitorId)}"></div><div class="chat-compose-row"><label class="chat-file-picker compact" title="Attach file (optional)">📎<input name="files" type="file" accept="image/*,.pdf,.txt,.doc,.docx" multiple></label><textarea name="message" rows="1" placeholder="Type your message..." required></textarea><button class="btn gold" type="submit">Send</button></div><div class="hidden" data-form-message></div></form></div>`;
  document.body.appendChild(widget);
  const panel = widget.querySelector('[data-chat-panel]');
  const body = widget.querySelector('[data-chat-body]');
  const form = widget.querySelector('[data-public-chat-form]');
  let publicChatTimer=null;
  widget.querySelector('[data-chat-toggle]').addEventListener('click',()=>{ panel.classList.add('open'); const room=localStorage.getItem('tyna_public_chat_room'); if(room){ widget.classList.add('chat-started'); loadPublicChat(room); } clearInterval(publicChatTimer); publicChatTimer=setInterval(()=>{ const r=localStorage.getItem('tyna_public_chat_room'); if(panel.classList.contains('open') && r) loadPublicChat(r); }, 8000); });
  widget.querySelector('[data-chat-close]').addEventListener('click',()=>{ panel.classList.remove('open'); clearInterval(publicChatTimer); });
  function render(thread){
    body.innerHTML=(thread.messages||[]).map(m=>{ const support=['staff','admin','developer','social_worker'].includes(m.sender); return `<div class="public-chat-msg ${support?'staff':'visitor'}"><b>${support?'Tyna Support':safe(m.name||'You')}</b>${m.message?`<p>${safe(m.message)}</p>`:''}${chatFileLinks(m.files)}<small>${new Date(m.createdAt||Date.now()).toLocaleString()}</small></div>`; }).join('') || '<div class="empty-state">No messages yet.</div>';
    body.scrollTop=body.scrollHeight;
    if(thread.status==='closed') body.insertAdjacentHTML('beforeend','<div class="notice warn">This chat has been closed by staff.</div>');
  }
  async function loadPublicChat(room){
    try{ const {thread}=await api(`/api/chat/public/${encodeURIComponent(room)}`); render(thread); }catch{}
  }
  form.addEventListener('submit',async e=>{ e.preventDefault(); const box=form.querySelector('[data-form-message]'); const fd=new FormData(form); if(!String(fd.get('message')||'').trim() && !form.querySelector('[name=files]').files.length){ showMsg(box,'Type a message to start chat. File upload is optional.','error'); return; } try{ const room=localStorage.getItem('tyna_public_chat_room'); const endpoint=room?`/api/chat/public/${encodeURIComponent(room)}/messages`:'/api/chat/public'; const response=await api(endpoint,{method:'POST',body:fd}); localStorage.setItem('tyna_public_chat_room', response.thread.id); widget.classList.add('chat-started'); render(response.thread); form.message.value=''; form.files.value=''; showMsg(box,'Sent','success'); }catch(err){ showMsg(box,err.message,'error'); } });
}


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

document.addEventListener('DOMContentLoaded',()=>{ initAdSense(); mountLayout(); initMaintenanceBanner(); mountTools(); mountPageGalleries(); initForms(); initDeveloperPage(); initPayments(); initCertificateVerificationPage(); initContactChatWidget(); });

