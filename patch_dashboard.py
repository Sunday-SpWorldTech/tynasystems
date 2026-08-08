from pathlib import Path
root=Path('/mnt/data/update_dash')
front=root/'frontend'
app=front/'assets/js/app.js'
s=app.read_text()
# USD formatting utilities replace money function
s=s.replace("function money(n){ return new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(Number(n||0)); }", "const USD_NGN_RATE = Number(window.TYNA_USD_NGN_RATE || 1600);\nfunction money(n){ return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(Number(n||0)); }\nfunction moneyFromNGN(n){ return money(Number(n || 0) / USD_NGN_RATE); }\nfunction productPrice(p={}){ return money(p.priceUSD ?? (p.priceNGN ? Number(p.priceNGN) / USD_NGN_RATE : 0)); }")
# Remove Main Website from user dashboard only
s=s.replace('<div class="sidebar-divider"></div><a href="index.html">${icon(\'home\')} Main Website</a><a href="#" data-logout>${icon(\'logout\')} Logout</a>', '<div class="sidebar-divider"></div><a href="#" data-logout>${icon(\'logout\')} Logout</a>')
# In case exact string different due double quotes/format, fallback simple
s=s.replace('<a href="index.html">${icon(\'home\')} Main Website</a>','')
# Product display USD
s=s.replace('${money(p.priceNGN)}','${productPrice(p)}')
# Staff overview/order/payment/withdrawal display conversions from NGN where backend stores NGN
s=s.replace("money(s.revenueNGN || s.revenue || 0)", "moneyFromNGN(s.revenueNGN || s.revenue || 0)")
s=s.replace('${money(o.amount)}','${moneyFromNGN(o.amount)}')
s=s.replace('${money(w.amount)}','${money(w.amount)}')  # withdrawal is now requested/displayed as USD
# Staff product form: hide NGN backend field, keep auto conversion for backend Paystack compatibility
s=s.replace('<div class="grid grid-2"><label>Price USD<input type="number" name="priceUSD" required value="7"></label><label>Price NGN<input type="number" name="priceNGN" required value="11200"></label></div>', '<label>Price USD<input type="number" name="priceUSD" required value="7" min="0" step="0.01"></label><input type="hidden" name="priceNGN" value="11200">')
# Withdrawal label USD
s=s.replace('Amount (NGN)', 'Amount (USD)')
# Add auto conversion listener before product submit handler
needle="main.querySelector('[data-product-form]').addEventListener('submit',async e=>{ e.preventDefault(); const form=e.currentTarget, box=form.querySelector('[data-form-message]'); const data=Object.fromEntries(new FormData(form).entries()); try{ await api('/api/products',{method:'POST',body:JSON.stringify(data)}); showMsg(box,'Product created successfully.','success'); form.reset(); loadProducts(); }catch(err){ showMsg(box,err.message,'error'); } });"
replacement="const productForm=main.querySelector('[data-product-form]');\n  const syncUsdPrice=()=>{ const usd=Number(productForm.querySelector('[name=priceUSD]')?.value||0); const ngn=productForm.querySelector('[name=priceNGN]'); if(ngn) ngn.value=Math.round(usd * USD_NGN_RATE); };\n  productForm.querySelector('[name=priceUSD]')?.addEventListener('input',syncUsdPrice); syncUsdPrice();\n  productForm.addEventListener('submit',async e=>{ e.preventDefault(); const form=e.currentTarget, box=form.querySelector('[data-form-message]'); syncUsdPrice(); const data=Object.fromEntries(new FormData(form).entries()); try{ await api('/api/products',{method:'POST',body:JSON.stringify(data)}); showMsg(box,'Product created successfully.','success'); form.reset(); syncUsdPrice(); loadProducts(); }catch(err){ showMsg(box,err.message,'error'); } });"
if needle in s:
    s=s.replace(needle,replacement)
else:
    print('WARNING product form handler needle not found')
app.write_text(s)

# CSS dashboard typography: compact home-page-like text in all dashboards
css=front/'assets/css/design-system.css'
cs=css.read_text()
cs += '''\n\n/* Dashboard final typography update: match homepage scale and reduce oversized dashboard text */\n.app-shell h1,.staff-private-page h1{font-size:clamp(1.65rem,3.15vw,2.85rem)!important;line-height:1.12!important;letter-spacing:-.03em!important;margin-bottom:10px!important}.app-shell h2,.staff-private-page h2{font-size:clamp(1.25rem,2.35vw,2rem)!important;line-height:1.1!important;letter-spacing:-.025em!important;margin-bottom:10px!important}.app-shell h3,.staff-private-page h3{font-size:clamp(1rem,1.25vw,1.18rem)!important;line-height:1.22!important}.app-shell p,.app-shell li,.app-shell small,.staff-private-page p,.staff-private-page li,.staff-private-page small{font-size:.92rem!important;line-height:1.55!important}.app-title{align-items:center!important;margin-bottom:18px!important}.app-title p{max-width:680px!important;color:#64748b!important}.app-main{padding:clamp(18px,3vw,34px)!important}.app-sidebar{padding:20px!important}.app-sidebar a{padding:10px 12px!important;font-size:.88rem!important;border-radius:14px!important}.staff-sidebar-note{font-size:.82rem!important;line-height:1.45!important}.kpi-grid{gap:12px!important;margin:16px 0!important}.kpi,.dash-card,.admin-card{padding:18px!important;border-radius:20px!important}.kpi strong{font-size:clamp(1.35rem,2.5vw,1.85rem)!important;letter-spacing:-.03em!important}.product-card img{height:150px!important}.module{padding:13px!important;border-radius:16px!important}.app-form{gap:11px!important}.app-form input,.app-form textarea,.app-form select{padding:10px 12px!important;border-radius:12px!important;font-size:.9rem!important}.app-form textarea{min-height:96px!important}.table th,.table td,.app-table th,.app-table td{padding:11px 12px!important;font-size:.88rem!important}.badge{font-size:.78rem!important;padding:7px 10px!important}.empty-state{padding:20px!important;font-size:.9rem!important}.app-actions{gap:8px!important}.app-shell .btn{padding:10px 14px!important;font-size:.86rem!important}\n@media(max-width:560px){.app-shell h1,.staff-private-page h1{font-size:clamp(1.2rem,6vw,1.55rem)!important}.app-shell h2,.staff-private-page h2{font-size:1.18rem!important}.app-main{padding:16px!important}.kpi,.dash-card,.admin-card{padding:15px!important}.app-sidebar nav{grid-template-columns:1fr!important}}\n'''
css.write_text(cs)

# Update public-facing Naira text/icon to dollar where present
for fname in ['index.html','backend-os.html']:
    p=front/fname
    text=p.read_text()
    text=text.replace('₦20M/year', '$20K/year')
    text=text.replace('<div class="icon">₦</div>', '<div class="icon">$</div>')
    p.write_text(text)

# Optional: withdrawal model defaults now USD for new dashboard entries (does not change Paystack order currency)
wm=root/'backend/src/models/Withdrawal.js'
if wm.exists():
    w=wm.read_text().replace("currency: { type: String, default: 'NGN' }", "currency: { type: String, default: 'USD' }")
    wm.write_text(w)
