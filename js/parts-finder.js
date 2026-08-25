/* FixorAssist — Genuine Spare Parts finder + lead capture.
   Brand/Model from the public warranty vehicle DB, Year + Part-type dropdowns.
   Lead modal captures Brand/Model/Year/Part + Name/Email/Mobile → WhatsApp.
   Triggered by the hero finder ("FIND MY PART") and any [data-parts-order] button. */
(function () {
  var API = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:3005' : 'https://15.207.113.110.nip.io';
  var WA = '919717758510';
  var PARTS = ['Engine Parts', 'Brake System', 'Suspension & Steering', 'Electrical & Battery',
    'Filters & Fluids', 'AC & Cooling', 'Transmission & Clutch', 'Lights & Indicators',
    'Body & Exterior', 'Tyres & Wheels', 'Other'];

  var _brands = null;
  function loadBrands() {
    if (_brands) return Promise.resolve(_brands);
    return fetch(API + '/public/warranty/makes').then(function (r) { return r.json(); })
      .then(function (d) { _brands = (d.makes || []).map(function (m) { return m.make; }); return _brands; })
      .catch(function () { _brands = []; return _brands; });
  }
  function loadModels(make) {
    return fetch(API + '/public/warranty/models?make=' + encodeURIComponent(make)).then(function (r) { return r.json(); })
      .then(function (d) { return d.models || []; }).catch(function () { return []; });
  }
  function fillSelect(sel, items, placeholder) {
    sel.innerHTML = '<option value="">' + placeholder + '</option>';
    items.forEach(function (it) { var o = document.createElement('option'); o.value = it; o.textContent = it; sel.appendChild(o); });
  }

  // ---- Hero finder dropdowns (optional; present on the parts page) ----
  var hBrand = document.getElementById('pfBrand');
  var hModel = document.getElementById('pfModel');
  var hYear = document.getElementById('pfYear');
  var hFuel = document.getElementById('pfFuel');
  var hPart = document.getElementById('pfPart');
  var findBtn = document.getElementById('pfFind');

  var YEARS = []; for (var y = 2026; y >= 2005; y--) YEARS.push(String(y));

  if (hBrand) {
    loadBrands().then(function (b) { fillSelect(hBrand, b, 'Select Brand'); });
    if (hYear) fillSelect(hYear, YEARS, 'Select Year');
    if (hModel) { hModel.disabled = true; }
    if (hBrand) hBrand.addEventListener('change', function () {
      if (!hModel) return;
      hModel.innerHTML = '<option value="">Loading…</option>'; hModel.disabled = true;
      if (!hBrand.value) { hModel.innerHTML = '<option value="">Select a brand first</option>'; return; }
      loadModels(hBrand.value).then(function (m) { fillSelect(hModel, m, 'Select Model'); hModel.disabled = false; });
    });
    // "Other" → reveal a manual text field
    var hOtherWrap = document.getElementById('pfPartOtherWrap');
    var hOther = document.getElementById('pfPartOther');
    if (hPart && hOtherWrap) hPart.addEventListener('change', function () {
      var isOther = hPart.value === 'Other';
      hOtherWrap.style.display = isOther ? '' : 'none';
      if (isOther) setTimeout(function () { hOther.focus(); }, 50);
    });
  }
  function heroPart() {
    if (!hPart) return '';
    if (hPart.value === 'Other') { var t = document.getElementById('pfPartOther'); return (t && t.value.trim()) || 'Other'; }
    return hPart.value;
  }

  // ---- Lead modal (self-contained: brand/model/part + name/email/mobile) ----
  var css = ''
    + '.pfm-overlay{position:fixed;inset:0;z-index:1000;display:none;align-items:center;justify-content:center;background:rgba(12,12,14,.55);backdrop-filter:blur(3px);padding:20px;overflow-y:auto}'
    + '.pfm-overlay.open{display:flex}'
    + '.pfm-modal{background:#fff;border-radius:18px;width:100%;max-width:460px;box-shadow:0 30px 70px rgba(0,0,0,.35);padding:26px;position:relative;font-family:"Poppins",system-ui,sans-serif;animation:pfmIn .22s ease;max-height:92vh;overflow-y:auto}'
    + '@keyframes pfmIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}'
    + '.pfm-close{position:absolute;top:14px;right:16px;background:none;border:0;font-size:26px;line-height:1;color:#8a8e94;cursor:pointer}'
    + '.pfm-close:hover{color:#e1181e}'
    + '.pfm-eyebrow{display:inline-block;font-size:11.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#e1181e;background:#fdecec;padding:5px 12px;border-radius:999px;margin-bottom:10px}'
    + '.pfm-modal h3{font-size:21px;font-weight:800;color:#0c0c0e;margin:0 0 4px;line-height:1.2}'
    + '.pfm-sub{font-size:13px;color:#5d6167;font-weight:300;margin:0 0 16px}'
    + '.pfm-row{display:flex;flex-direction:column;gap:6px;margin-bottom:12px}'
    + '.pfm-grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}'
    + '.pfm-row label{font-size:12.5px;font-weight:600;color:#31343a}'
    + '.pfm-row input,.pfm-row select{font-family:inherit;font-size:14.5px;padding:11px 12px;border:1.5px solid #e7e8ea;border-radius:10px;color:#0c0c0e;width:100%;background:#fff}'
    + '.pfm-row input:focus,.pfm-row select:focus{outline:0;border-color:#e1181e;box-shadow:0 0 0 3px #fdecec}'
    + '.pfm-row select:disabled{background:#f4f4f5;color:#9a9da2}'
    + '.pfm-err{color:#c40f15;font-size:12.5px;min-height:16px;margin-bottom:6px}'
    + '.pfm-submit{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;background:#25d366;color:#fff;font-family:inherit;font-weight:700;font-size:15.5px;border:0;border-radius:12px;padding:14px;cursor:pointer;transition:.2s;box-shadow:0 8px 22px rgba(37,211,102,.3)}'
    + '.pfm-submit:hover{background:#1da851;transform:translateY(-1px)}'
    + '.pfm-submit svg{width:19px;height:19px;flex:none}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var wa = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.86L2 22l5.35-1.36c1.42.77 3.02 1.19 4.69 1.19h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2zm5.71 14.02c-.24.68-1.17 1.24-1.93 1.4-.52.11-1.19.2-3.46-.74-2.9-1.2-4.77-4.15-4.92-4.35-.14-.19-1.18-1.57-1.18-3 0-1.43.75-2.13 1.02-2.42.27-.29.58-.36.78-.36.19 0 .39 0 .56.01.18.01.42-.07.66.5.24.58.83 2.01.9 2.16.07.15.12.32.02.51-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.02 1.12.99 2.06 1.3 2.35 1.45.29.15.46.13.63-.08.17-.2.72-.84.92-1.13.19-.29.39-.24.66-.15.27.1 1.7.8 1.99.95.29.15.48.22.55.34.07.13.07.71-.17 1.39z"/></svg>';

  var overlay = document.createElement('div');
  overlay.className = 'pfm-overlay';
  overlay.innerHTML = ''
    + '<div class="pfm-modal" role="dialog" aria-modal="true" aria-label="Spare part enquiry">'
    + '  <button class="pfm-close" aria-label="Close">&times;</button>'
    + '  <span class="pfm-eyebrow">Genuine Spare Parts</span>'
    + '  <h3>Find Your Part</h3>'
    + '  <p class="pfm-sub">Tell us your vehicle and the part you need — we’ll connect on WhatsApp.</p>'
    + '  <div class="pfm-grid2">'
    + '    <div class="pfm-row"><label>Car Brand *</label><select id="mBrand"><option value="">Select Brand</option></select></div>'
    + '    <div class="pfm-row"><label>Model *</label><select id="mModel" disabled><option value="">Select a brand first</option></select></div>'
    + '  </div>'
    + '  <div class="pfm-grid2">'
    + '    <div class="pfm-row"><label>Year</label><select id="mYear"><option value="">Select Year</option></select></div>'
    + '    <div class="pfm-row"><label>Fuel</label><select id="mFuel"><option value="">Select Fuel</option><option>Petrol</option><option>Diesel</option></select></div>'
    + '  </div>'
    + '  <div class="pfm-row"><label for="mPart">Part Needed *</label><input id="mPart" list="mPartList" placeholder="Select or type part" autocomplete="off"><datalist id="mPartList"></datalist></div>'
    + '  <div class="pfm-row"><label for="mName">Full Name *</label><input id="mName" type="text" placeholder="Your name"></div>'
    + '  <div class="pfm-grid2">'
    + '    <div class="pfm-row"><label for="mEmail">Email *</label><input id="mEmail" type="email" placeholder="you@example.com"></div>'
    + '    <div class="pfm-row"><label for="mPhone">Mobile *</label><input id="mPhone" type="tel" maxlength="10" placeholder="10-digit"></div>'
    + '  </div>'
    + '  <div class="pfm-err" id="mErr"></div>'
    + '  <button class="pfm-submit" id="mSubmit">' + wa + ' Send on WhatsApp</button>'
    + '</div>';
  document.body.appendChild(overlay);

  var mBrand = overlay.querySelector('#mBrand');
  var mModel = overlay.querySelector('#mModel');
  var mYear = overlay.querySelector('#mYear');
  var mFuel = overlay.querySelector('#mFuel');
  var mPart = overlay.querySelector('#mPart');
  var errEl = overlay.querySelector('#mErr');

  fillSelect(mYear, YEARS, 'Select Year');
  mPart.list.innerHTML = PARTS.map(function (p) { return '<option value="' + p + '"></option>'; }).join('');
  loadBrands().then(function (b) { fillSelect(mBrand, b, 'Select Brand'); });

  mBrand.addEventListener('change', function () {
    mModel.innerHTML = '<option value="">Loading…</option>'; mModel.disabled = true;
    if (!mBrand.value) { mModel.innerHTML = '<option value="">Select a brand first</option>'; return; }
    loadModels(mBrand.value).then(function (m) { fillSelect(mModel, m, 'Select Model'); mModel.disabled = false; });
  });

  function close() { overlay.classList.remove('open'); errEl.textContent = ''; }
  overlay.querySelector('.pfm-close').addEventListener('click', close);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  function open(prefill) {
    prefill = prefill || {};
    // prefill brand → then model → then set part/year
    if (prefill.brand) {
      mBrand.value = prefill.brand;
      mModel.innerHTML = '<option value="">Loading…</option>'; mModel.disabled = true;
      loadModels(prefill.brand).then(function (m) {
        fillSelect(mModel, m, 'Select Model'); mModel.disabled = false;
        if (prefill.model) mModel.value = prefill.model;
      });
    }
    if (prefill.year) mYear.value = prefill.year;
    if (prefill.fuel) mFuel.value = prefill.fuel;
    if (prefill.part) mPart.value = prefill.part;
    overlay.classList.add('open');
    setTimeout(function () { (mBrand.value ? overlay.querySelector('#mName') : mBrand).focus(); }, 60);
  }

  if (findBtn) findBtn.addEventListener('click', function () {
    open({ brand: hBrand && hBrand.value, model: hModel && hModel.value, year: hYear && hYear.value, fuel: hFuel && hFuel.value, part: heroPart() });
  });
  // any Order Now / order button
  document.querySelectorAll('[data-parts-order]').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); open({}); });
  });

  overlay.querySelector('#mSubmit').addEventListener('click', function () {
    var brand = mBrand.value, model = mModel.value, year = mYear.value, fuel = mFuel.value, part = (mPart.value || '').trim();
    var name = overlay.querySelector('#mName').value.trim();
    var email = overlay.querySelector('#mEmail').value.trim();
    var phone = (overlay.querySelector('#mPhone').value || '').replace(/\D/g, '').slice(-10);
    if (!brand) { errEl.textContent = 'Please select your car brand.'; return; }
    if (!model) { errEl.textContent = 'Please select your model.'; return; }
    if (!part) { errEl.textContent = 'Please select or type the part you need.'; return; }
    if (!name) { errEl.textContent = 'Please enter your name.'; return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { errEl.textContent = 'Enter a valid email address.'; return; }
    if (!/^[6-9]\d{9}$/.test(phone)) { errEl.textContent = 'Enter a valid 10-digit mobile number.'; return; }
    errEl.textContent = '';
    var modelClean = model.replace(new RegExp('^' + brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s+', 'i'), '');
    var lines = ['Hi FixorAssist, I need a genuine spare part.'];
    lines.push('Vehicle: ' + [brand, modelClean].filter(Boolean).join(' '));
    if (year) lines.push('Year: ' + year);
    if (fuel) lines.push('Fuel: ' + fuel);
    lines.push('Part: ' + part);
    lines.push('Name: ' + name);
    lines.push('Email: ' + email);
    lines.push('Phone: ' + phone);
    window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
    close();
  });
})();
