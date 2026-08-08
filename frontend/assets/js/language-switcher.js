/** Floating language/currency controls with Azure Translator integration. */
const TynaPageTranslator = {
  cache: new Map(),
  observer: null,
  timer: null,
  busy: false,
  currentCode: localStorage.getItem('tynaLanguageCode') || 'en',
  originalText: new WeakMap(),
  originalAttrs: new WeakMap(),

  isIgnored(node) {
    const parent = node.parentElement;
    return !parent || parent.closest('script,style,noscript,code,pre,textarea,[data-no-translate],[data-tyna-switcher]');
  },

  collect(root = document.body) {
    const items = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (this.isIgnored(node)) continue;
      const value = node.nodeValue;
      if (!value || !value.trim() || !/[A-Za-zÀ-ÿ]/.test(value)) continue;
      if (!this.originalText.has(node)) this.originalText.set(node, value);
      items.push({ type: 'text', node, value: this.originalText.get(node).trim() });
    }
    root.querySelectorAll?.('[placeholder],[title],[aria-label]').forEach(el => {
      if (el.closest('[data-no-translate],[data-tyna-switcher]')) return;
      const saved = this.originalAttrs.get(el) || {};
      ['placeholder','title','aria-label'].forEach(attr => {
        const value = el.getAttribute(attr);
        if (!value || !/[A-Za-zÀ-ÿ]/.test(value)) return;
        if (!(attr in saved)) saved[attr] = value;
        items.push({ type: 'attr', node: el, attr, value: saved[attr] });
      });
      this.originalAttrs.set(el, saved);
    });
    return items;
  },

  restore() {
    this.collect().forEach(item => {
      if (item.type === 'text') {
        const source = this.originalText.get(item.node);
        if (source != null) item.node.nodeValue = source;
      } else {
        const source = this.originalAttrs.get(item.node)?.[item.attr];
        if (source != null) item.node.setAttribute(item.attr, source);
      }
    });
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
  },

  async request(texts, to) {
    const missing = [];
    const indexes = [];
    const output = new Array(texts.length);
    texts.forEach((text, index) => {
      const key = `${to}|${text}`;
      if (this.cache.has(key)) output[index] = this.cache.get(key);
      else { missing.push(text); indexes.push(index); }
    });
    for (let start = 0; start < missing.length; start += 75) {
      const part = missing.slice(start, start + 75);
      const response = await fetch(`${window.TYNA_API_URL || ''}/api/translator/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, texts: part })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.ok) throw new Error(payload.message || 'Translation service is unavailable.');
      payload.translations.forEach((value, localIndex) => {
        const globalMissingIndex = start + localIndex;
        const originalIndex = indexes[globalMissingIndex];
        output[originalIndex] = value;
        this.cache.set(`${to}|${part[localIndex]}`, value);
      });
    }
    return output;
  },

  async translate(to = this.currentCode) {
    this.currentCode = to || 'en';
    localStorage.setItem('tynaLanguageCode', this.currentCode);
    localStorage.setItem('appLanguage', this.currentCode);
    if (this.currentCode === 'en') { this.restore(); return; }
    if (this.busy) return;
    this.busy = true;
    document.documentElement.setAttribute('data-translating', 'true');
    try {
      const items = this.collect();
      const values = items.map(item => item.value);
      const translated = await this.request(values, this.currentCode);
      items.forEach((item, index) => {
        const value = translated[index];
        if (typeof value !== 'string') return;
        if (item.type === 'text') {
          const original = this.originalText.get(item.node) || '';
          const left = original.match(/^\s*/)?.[0] || '';
          const right = original.match(/\s*$/)?.[0] || '';
          item.node.nodeValue = `${left}${value}${right}`;
        } else item.node.setAttribute(item.attr, value);
      });
      document.documentElement.lang = this.currentCode;
      document.documentElement.dir = ['ar','fa','he','ur'].includes(this.currentCode.split('-')[0]) ? 'rtl' : 'ltr';
    } catch (error) {
      console.error('Azure translation failed:', error);
      document.dispatchEvent(new CustomEvent('translationError', { detail: { message: error.message } }));
    } finally {
      this.busy = false;
      document.documentElement.removeAttribute('data-translating');
    }
  },

  watch() {
    if (this.observer || !document.body) return;
    this.observer = new MutationObserver(mutations => {
      if (this.busy || this.currentCode === 'en' || mutations.every(m => m.target.closest?.('[data-tyna-switcher]'))) return;
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.translate(this.currentCode), 350);
    });
    this.observer.observe(document.body, { childList: true, subtree: true });
  }
};

const LanguageCurrencySwitcher = {
  ensureStyles() {
    if (document.getElementById('tyna-switcher-styles')) return;
    const style = document.createElement('style');
    style.id = 'tyna-switcher-styles';
    style.textContent = `
      .lang-currency-switcher{position:fixed;top:96px;right:16px;z-index:10020;display:flex;align-items:center;font-family:inherit;max-width:calc(100vw - 32px);pointer-events:none}
      body.staff-private-page .lang-currency-switcher,body[data-app-page] .lang-currency-switcher,body.dashboard-page .lang-currency-switcher{top:16px;right:26px} body[data-app-page] .app-main{padding-top:82px!important}
      .lang-currency-switcher *{box-sizing:border-box}.lc-controls{display:flex;gap:7px;align-items:center;pointer-events:auto;max-width:100%}
      .lc-item{position:relative}.lc-btn{height:36px;display:inline-flex;align-items:center;gap:6px;padding:0 11px;border:1px solid rgba(15,23,42,.14);border-radius:999px;background:rgba(255,255,255,.96);color:#172033;box-shadow:0 8px 24px rgba(2,8,23,.14);font:inherit;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap;backdrop-filter:blur(12px)}
      .lc-btn:hover,.lc-btn[aria-expanded=true]{border-color:#d8a52f;box-shadow:0 10px 28px rgba(2,8,23,.2)}.lc-arrow{width:13px;height:13px}.lc-btn[aria-expanded=true] .lc-arrow{transform:rotate(180deg)}
      .lc-menu{position:absolute;z-index:10030;top:calc(100% + 9px);right:0;width:320px;max-height:min(520px,72vh);overflow:hidden;border:1px solid #e4e7ec;border-radius:16px;background:#fff;color:#172033;box-shadow:0 20px 55px rgba(2,8,23,.25);display:none}.lc-menu.open{display:block}
      .lc-menu-head{padding:13px 14px 9px;border-bottom:1px solid #eef0f3;font-size:13px;font-weight:900}.lc-search-wrap{padding:9px 11px;border-bottom:1px solid #eef0f3}.lc-search{width:100%;height:40px;border:1px solid #d7dce3;border-radius:10px;padding:0 11px;font:inherit;font-size:13px;color:#172033;outline:none}.lc-search:focus{border-color:#d8a52f;box-shadow:0 0 0 3px rgba(216,165,47,.14)}
      .lc-options{max-height:390px;overflow:auto;padding:7px}.lc-option{width:100%;display:flex;align-items:center;gap:10px;padding:9px;border:0;border-radius:10px;background:transparent;color:#172033;text-align:left;font:inherit;cursor:pointer}.lc-option:hover{background:#f5f7fa}.lc-option.active{background:#fff7df;color:#7a5100}.lc-flag{font-size:19px}.lc-option-text{min-width:0;display:flex;flex-direction:column;gap:1px}.lc-option-text strong{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lc-option-text small{font-size:10px;color:#667085}.lc-empty{padding:18px;text-align:center;color:#667085;font-size:12px}
      .lc-toast{position:fixed;right:18px;top:168px;z-index:10040;max-width:320px;padding:10px 13px;border-radius:11px;background:#7f1d1d;color:#fff;font-size:12px;font-weight:700;box-shadow:0 12px 30px rgba(0,0,0,.22)}
      html[data-translating=true] .lc-lang-btn{opacity:.72;cursor:wait}
      @media(max-width:900px){.lang-currency-switcher{top:76px;right:10px}.lc-label{display:none}.lc-menu{width:min(310px,calc(100vw - 20px))}}
      @media(max-width:520px){.lang-currency-switcher{top:68px;right:8px;max-width:calc(100vw - 16px)}.lc-btn{height:34px;padding:0 9px}.lc-controls{gap:5px}.lc-current-country{display:none}}
      .tyna-price-usd{display:block;font-weight:900}.tyna-price-local{display:block;margin-top:3px;font-size:.66em;line-height:1.25;color:#667085;font-weight:700}.app-shell .tyna-price-local,.dashboard-page .tyna-price-local{font-size:.72em}
      @media print{.lang-currency-switcher{display:none!important}}
    `;
    document.head.appendChild(style);
  },

  getCurrencySymbol(code) { return i18n.getCurrencies()[code]?.symbol || code; },
  locales() {
    const list = Array.isArray(window.TYNA_LANGUAGE_LOCALES) ? window.TYNA_LANGUAGE_LOCALES : [];
    return [{ countryCode:'US', country:'United States', flag:'🇺🇸', locale:'en-US', languageCode:'en', languageName:'English' }, ...list.filter(x => x.countryCode !== 'US')];
  },

  create() {
    this.ensureStyles();
    const wrap = document.createElement('div');
    wrap.className = 'lang-currency-switcher';
    wrap.dataset.tynaSwitcher = 'true';
    wrap.dataset.noTranslate = 'true';
    const countries = i18n.getCountries(), currencies = i18n.getCurrencies(), locales = this.locales();
    const selectedLocale = localStorage.getItem('tynaLocale') || 'en-US';
    const selected = locales.find(x => x.locale === selectedLocale) || locales[0];
    TynaPageTranslator.currentCode = localStorage.getItem('tynaLanguageCode') || selected.languageCode || 'en';

    wrap.innerHTML = `<div class="lc-controls">
      <div class="lc-item"><button class="lc-btn lc-lang-btn" type="button" aria-expanded="false"><span>🌐</span><span class="lc-label">Language</span><span class="lc-current-country">${selected.flag}</span><span class="lc-current-lang">${selected.languageCode.toUpperCase()}</span><svg class="lc-arrow" viewBox="0 0 16 16"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
      <div class="lc-menu lc-lang-menu"><div class="lc-menu-head">Select language or country</div><div class="lc-search-wrap"><input class="lc-search lc-lang-search" type="search" placeholder="Search 240+ country languages…"></div><div class="lc-options lc-lang-options">${locales.map(x=>`<button class="lc-option ${x.locale===selected.locale?'active':''}" type="button" data-locale="${x.locale}" data-language="${x.languageCode}" data-search="${`${x.country} ${x.countryCode} ${x.languageName} ${x.languageCode}`.toLowerCase()}"><span class="lc-flag">${x.flag}</span><span class="lc-option-text"><strong>${x.languageName} — ${x.country}</strong><small>${x.languageCode.toUpperCase()} · ${x.locale}</small></span></button>`).join('')}</div></div></div>
      <div class="lc-item"><button class="lc-btn lc-currency-btn" type="button" aria-expanded="false"><span class="lc-current-symbol">${this.getCurrencySymbol(i18n.currentCurrency)}</span><span class="lc-current-currency">${i18n.currentCurrency}</span><svg class="lc-arrow" viewBox="0 0 16 16"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
      <div class="lc-menu lc-currency-menu"><div class="lc-menu-head">Select from 170 currencies</div><div class="lc-search-wrap"><input class="lc-search lc-currency-search" type="search" placeholder="Type currency name or code…" autocomplete="off" spellcheck="false"></div><div class="lc-options lc-currency-options">${Object.entries(currencies).sort(([a],[b])=>a.localeCompare(b)).map(([code,c])=>{const country=countries.find(x=>x.currency===code);const flag=country?.flag||'💱';const countryName=country?.name||'International unit';return `<button class="lc-option ${code===i18n.currentCurrency?'active':''}" type="button" data-currency-option="${code}" data-search="${`${code} ${c.name} ${countryName}`.toLowerCase()}"><span class="lc-flag">${flag}</span><span class="lc-option-text"><strong>${code} — ${c.name}</strong><small>${countryName}</small></span></button>`}).join('')}</div></div></div>
    </div>`;

    const langBtn=wrap.querySelector('.lc-lang-btn'),currBtn=wrap.querySelector('.lc-currency-btn'),langMenu=wrap.querySelector('.lc-lang-menu'),currMenu=wrap.querySelector('.lc-currency-menu');
    const closeAll=()=>{[langMenu,currMenu].forEach(x=>x.classList.remove('open'));[langBtn,currBtn].forEach(x=>x.setAttribute('aria-expanded','false'));};
    const toggle=(btn,menu)=>e=>{e.stopPropagation();const open=!menu.classList.contains('open');closeAll();if(open){menu.classList.add('open');btn.setAttribute('aria-expanded','true');setTimeout(()=>menu.querySelector('.lc-search')?.focus(),20)}};
    langBtn.addEventListener('click',toggle(langBtn,langMenu));currBtn.addEventListener('click',toggle(currBtn,currMenu));
    wrap.querySelectorAll('[data-locale]').forEach(btn=>btn.addEventListener('click',async e=>{e.stopPropagation();localStorage.setItem('tynaLocale',btn.dataset.locale);localStorage.setItem('tynaLanguageCode',btn.dataset.language);localStorage.setItem('appLanguage',btn.dataset.language);wrap.querySelector('.lc-current-country').textContent=btn.querySelector('.lc-flag').textContent;wrap.querySelector('.lc-current-lang').textContent=btn.dataset.language.toUpperCase();wrap.querySelectorAll('[data-locale]').forEach(x=>x.classList.toggle('active',x===btn));closeAll();await TynaPageTranslator.translate(btn.dataset.language)}));
    wrap.querySelectorAll('[data-currency-option]').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();i18n.setCurrency(btn.dataset.currencyOption);wrap.querySelector('.lc-current-currency').textContent=btn.dataset.currencyOption;wrap.querySelector('.lc-current-symbol').textContent=this.getCurrencySymbol(btn.dataset.currencyOption);wrap.querySelectorAll('[data-currency-option]').forEach(x=>x.classList.toggle('active',x.dataset.currencyOption===btn.dataset.currencyOption));closeAll()}));
    const wireSearch=(input,selector)=>{input.addEventListener('click',e=>e.stopPropagation());input.addEventListener('input',()=>{const q=input.value.trim().toLowerCase();const options=[...wrap.querySelectorAll(selector)];let shown=0;options.forEach(opt=>{const hay=opt.dataset.search||'';const visible=!q||hay.includes(q);opt.hidden=!visible;opt.style.order=visible?(hay.startsWith(q)?'0':'1'):'2';if(visible)shown++});const box=input.closest('.lc-menu').querySelector('.lc-options');box.style.display='flex';box.style.flexDirection='column';box.querySelector('.lc-empty')?.remove();if(!shown){const empty=document.createElement('div');empty.className='lc-empty';empty.textContent='No matching option found';box.appendChild(empty)}})};
    wireSearch(wrap.querySelector('.lc-lang-search'),'[data-locale]');wireSearch(wrap.querySelector('.lc-currency-search'),'[data-currency-option]');
    document.addEventListener('click',closeAll);wrap.addEventListener('keydown',e=>{if(e.key==='Escape')closeAll()});
    return wrap;
  },

  async hydrateAzureLanguages(wrap) {
    try {
      const base = window.TYNA_API_URL || ((location.hostname==='localhost'||location.hostname==='127.0.0.1') ? 'http://localhost:5000' : '');
      const res = await fetch(`${base}/api/translator/languages`);
      const data = await res.json();
      if(!res.ok || !data.ok) return;
      const box = wrap.querySelector('.lc-lang-options');
      const existing = new Set([...box.querySelectorAll('[data-language]')].map(x=>x.dataset.language));
      Object.entries(data.translation||{}).forEach(([code,meta])=>{
        if(existing.has(code)) return;
        const b=document.createElement('button'); b.className='lc-option'; b.type='button'; b.dataset.locale=code; b.dataset.language=code; b.dataset.search=`${code} ${meta.name||''} ${meta.nativeName||''}`.toLowerCase();
        b.innerHTML=`<span class="lc-flag">🌐</span><span class="lc-option-text"><strong>${meta.name||code}</strong><small>${meta.nativeName||code} · ${code.toUpperCase()}</small></span>`;
        b.addEventListener('click',async e=>{e.stopPropagation();localStorage.setItem('tynaLocale',code);localStorage.setItem('tynaLanguageCode',code);localStorage.setItem('appLanguage',code);wrap.querySelector('.lc-current-country').textContent='🌐';wrap.querySelector('.lc-current-lang').textContent=code.toUpperCase();wrap.querySelectorAll('[data-locale]').forEach(x=>x.classList.toggle('active',x===b));wrap.querySelectorAll('.lc-menu').forEach(x=>x.classList.remove('open'));await TynaPageTranslator.translate(code)});
        box.appendChild(b);
      });
    } catch {}
  },

  mount() {
    if (document.querySelector('[data-tyna-switcher]')) return;
    const widget=this.create();
    document.body.appendChild(widget);
    this.hydrateAzureLanguages(widget);
    TynaPageTranslator.watch();
    if (TynaPageTranslator.currentCode !== 'en') setTimeout(()=>TynaPageTranslator.translate(TynaPageTranslator.currentCode),250);
  }
};

window.TynaPageTranslator = TynaPageTranslator;
window.LanguageCurrencySwitcher = LanguageCurrencySwitcher;
document.addEventListener('currencyChanged',()=>{const w=document.querySelector('[data-tyna-switcher]');if(!w)return;w.querySelector('.lc-current-currency').textContent=i18n.currentCurrency;w.querySelector('.lc-current-symbol').textContent=LanguageCurrencySwitcher.getCurrencySymbol(i18n.currentCurrency)});
document.addEventListener('translationError',e=>{document.querySelector('.lc-toast')?.remove();const el=document.createElement('div');el.className='lc-toast';el.textContent=e.detail?.message||'Translation failed.';document.body.appendChild(el);setTimeout(()=>el.remove(),5000)});

window.addEventListener('DOMContentLoaded',()=>{try{LanguageCurrencySwitcher.mount()}catch(error){console.error('Tyna selector mount failed',error)}});
