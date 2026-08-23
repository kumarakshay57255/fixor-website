/* FixorAssist Extended Warranty — quote + buy (Razorpay) + WhatsApp */
(function () {
  var API = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:3005'
    : 'https://15.207.113.110.nip.io';
  var WA_NUMBER = '919717758510';

  // (mobile nav toggle is handled by the inline header script)

  // ---- elements ----
  var makeSel = document.getElementById('q-make');
  var modelSel = document.getElementById('q-model');
  var variantSel = document.getElementById('q-variant');
  var nameIn = document.getElementById('q-name');
  var phoneIn = document.getElementById('q-phone');
  var emailIn = document.getElementById('q-email');
  var regIn = document.getElementById('q-regno');
  var kmIn = document.getElementById('q-km');
  var coverTabs = document.getElementById('cover-tabs');
  var periodTabs = document.getElementById('period-tabs');
  var priceBox = document.getElementById('price-box');
  var pBase = document.getElementById('price-base');
  var pGst = document.getElementById('price-gst');
  var pTotal = document.getElementById('price-total');
  var pPlanLabel = document.getElementById('price-plan-label');
  var pMeta = document.getElementById('price-meta');
  var errEl = document.getElementById('q-err');
  var btnBuy = document.getElementById('btn-buy');
  var btnWa = document.getElementById('btn-wa');
  var ctaRow = document.getElementById('cta-row');
  var successEl = document.getElementById('q-success');

  if (!makeSel) return;

  var state = { cover: 'ENGINE_TRANSMISSION', period: 12, premium: false, quote: null };
  var premiumByMake = {};

  function setErr(msg) { errEl.textContent = msg || ''; }
  function fmt(n) {
    n = Number(n);
    return '₹' + (n % 1 === 0
      ? n.toLocaleString('en-IN')
      : n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }

  async function apiGet(path) { var r = await fetch(API + path); if (!r.ok) throw new Error('GET ' + path); return r.json(); }
  async function apiPost(path, body) {
    var r = await fetch(API + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    var j = await r.json().catch(function () { return {}; });
    if (!r.ok) throw Object.assign(new Error((j.error && j.error.message) || 'Request failed'), { data: j });
    return j;
  }

  // ---- load makes ----
  (async function () {
    try {
      var d = await apiGet('/public/warranty/makes');
      makeSel.innerHTML = '<option value="">Select brand</option>';
      d.makes.forEach(function (m) {
        premiumByMake[m.make] = !!m.premium;
        var o = document.createElement('option'); o.value = m.make; o.textContent = m.make + (m.premium ? ' (Premium)' : '');
        makeSel.appendChild(o);
      });
    } catch (e) { makeSel.innerHTML = '<option value="">Could not load brands</option>'; }
  })();

  makeSel.addEventListener('change', async function () {
    var make = makeSel.value;
    modelSel.innerHTML = '<option value="">Loading…</option>'; modelSel.disabled = true;
    variantSel.innerHTML = '<option value="">Select a model first</option>'; variantSel.disabled = true;
    state.premium = !!premiumByMake[make];
    applyAvailability();
    state.quote = null; renderPrice();
    if (!make) { modelSel.innerHTML = '<option value="">Select a brand first</option>'; return; }
    try {
      var d = await apiGet('/public/warranty/models?make=' + encodeURIComponent(make));
      modelSel.innerHTML = '<option value="">Select model</option>';
      d.models.forEach(function (m) { var o = document.createElement('option'); o.value = m; o.textContent = m; modelSel.appendChild(o); });
      modelSel.disabled = false;
    } catch (e) { modelSel.innerHTML = '<option value="">Could not load models</option>'; }
  });

  modelSel.addEventListener('change', async function () {
    var make = makeSel.value, model = modelSel.value;
    variantSel.innerHTML = '<option value="">Any / not sure</option>'; variantSel.disabled = true;
    state.quote = null;
    if (!model) { refreshQuote(); return; }
    try {
      var d = await apiGet('/public/warranty/variants?make=' + encodeURIComponent(make) + '&model=' + encodeURIComponent(model));
      (d.variants || []).forEach(function (v) {
        var o = document.createElement('option'); o.value = v.variant;
        o.textContent = v.variant + (v.cc ? ' · ' + v.cc + 'cc' : '') + (v.fuel ? ' · ' + v.fuel : '');
        variantSel.appendChild(o);
      });
      variantSel.disabled = false;
    } catch (e) {}
    refreshQuote();
  });

  variantSel.addEventListener('change', refreshQuote);

  // ---- cover / period tabs ----
  function bindTabs(container, attr, onPick) {
    container.querySelectorAll('.pill-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.disabled || btn.classList.contains('active')) return;
        container.querySelectorAll('.pill-tab').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        onPick(btn.getAttribute(attr));
      });
    });
  }
  function setActive(container, attr, val) {
    container.querySelectorAll('.pill-tab').forEach(function (b) { b.classList.toggle('active', b.getAttribute(attr) === String(val)); });
  }
  bindTabs(coverTabs, 'data-cover', function (v) { state.cover = v; applyAvailability(); refreshQuote(); });
  bindTabs(periodTabs, 'data-period', function (v) { state.period = parseInt(v, 10); refreshQuote(); });

  // Periods offered for the current segment + cover:
  //   Normal · Engine+Transmission → 6, 12
  //   Normal · Comprehensive       → 6, 12, 24, 36
  //   Premium (either cover)       → 12, 24, 36   (no 6-month)
  // Unavailable period tabs are HIDDEN (not just disabled) to avoid confusion.
  function allowedPeriods() {
    if (state.premium) return [12, 24, 36];
    return state.cover === 'COMPREHENSIVE' ? [6, 12, 24, 36] : [6, 12];
  }
  function applyAvailability() {
    var allowed = allowedPeriods();
    periodTabs.querySelectorAll('.pill-tab').forEach(function (b) {
      var p = parseInt(b.getAttribute('data-period'), 10);
      b.style.display = allowed.indexOf(p) > -1 ? '' : 'none';
      b.disabled = false;
    });
    if (allowed.indexOf(state.period) === -1) {
      state.period = allowed.indexOf(12) > -1 ? 12 : allowed[0];
      setActive(periodTabs, 'data-period', state.period);
    }
  }

  // ---- quote ----
  var quoteTimer = null;
  function refreshQuote() { clearTimeout(quoteTimer); quoteTimer = setTimeout(doQuote, 150); }
  async function doQuote() {
    var make = makeSel.value, model = modelSel.value;
    if (!make || !model) { state.quote = null; renderPrice(); return; }
    setErr('');
    try {
      var q = await apiPost('/public/warranty/quote', {
        make: make, model: model, variant: variantSel.value || undefined,
        cover: state.cover, periodMonths: state.period,
      });
      state.quote = q; renderPrice();
    } catch (e) {
      state.quote = null; renderPrice();
      setErr(e.message || 'Could not fetch price for this selection.');
    }
  }

  function renderPrice() {
    var q = state.quote;
    if (!q || !q.ok) { priceBox.classList.add('hidden'); updateBuyState(); return; }
    pPlanLabel.textContent = q.coverLabel + ' · ' + q.periodMonths + ' months';
    pBase.textContent = fmt(q.priceInr);
    pGst.textContent = fmt(q.gstInr);
    pTotal.textContent = fmt(q.totalInr);
    pMeta.textContent = (q.segment === 'PREMIUM' ? 'Premium plan · ' : (q.cc ? q.cc + 'cc · ' : '')) + 'Inclusive of 18% GST';
    priceBox.classList.remove('hidden');
    updateBuyState();
  }

  // ---- validation ----
  function cleanPhone() { return (phoneIn.value || '').replace(/\D/g, '').slice(-10); }
  function validPhone() { return /^[6-9]\d{9}$/.test(cleanPhone()); }
  function validEmail() { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test((emailIn.value || '').trim()); }
  function formReady() {
    return makeSel.value && modelSel.value && state.quote && state.quote.ok &&
      (nameIn.value || '').trim() && validPhone() && validEmail() && (regIn.value || '').trim();
  }
  function updateBuyState() { btnBuy.setAttribute('aria-disabled', formReady() ? 'false' : 'true'); }
  [nameIn, phoneIn, emailIn, regIn].forEach(function (el) { el.addEventListener('input', updateBuyState); });

  function firstLast() {
    var parts = (nameIn.value || '').trim().split(/\s+/);
    return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '' };
  }
  function orderBody() {
    var fl = firstLast();
    return {
      firstName: fl.firstName, lastName: fl.lastName, phone: cleanPhone(),
      email: (emailIn.value || '').trim(), regNo: (regIn.value || '').trim().toUpperCase(),
      make: makeSel.value, model: modelSel.value, variant: variantSel.value || undefined,
      cover: state.cover, periodMonths: state.period,
      km: (kmIn && kmIn.value) || undefined,
    };
  }

  function whyInvalid() {
    if (!makeSel.value || !modelSel.value) return 'Please select your car brand and model.';
    if (!state.quote || !state.quote.ok) return 'Please pick a valid cover and period.';
    if (!(nameIn.value || '').trim()) return 'Please enter your name.';
    if (!validPhone()) return 'Enter a valid 10-digit mobile number.';
    if (!validEmail()) return 'Enter a valid email address.';
    if (!(regIn.value || '').trim()) return 'Enter your vehicle registration number.';
    return '';
  }

  // ---- Buy (Razorpay / mock) ----
  btnBuy.addEventListener('click', async function () {
    var why = whyInvalid();
    if (why) { setErr(why); return; }
    setErr(''); btnBuy.textContent = 'Processing…'; btnBuy.setAttribute('aria-disabled', 'true');
    try {
      var res = await apiPost('/public/warranty/order', orderBody());
      var order = res.order, leadId = res.leadId;
      if (res.mockCheckout) { // local dev path
        await verifyAndFinish(order.orderId, res.mockCheckout.paymentId, res.mockCheckout.signature, leadId);
        return;
      }
      if (typeof Razorpay === 'undefined') { setErr('Payment library failed to load. Please try WhatsApp.'); resetBuy(); return; }
      var rzp = new Razorpay({
        key: order.keyId, amount: Math.round(order.amountInr * 100), currency: order.currency || 'INR',
        name: 'FixorAssist', description: 'Extended Warranty — ' + res.quote.coverLabel + ' (' + res.quote.periodMonths + 'm)',
        order_id: order.orderId,
        prefill: { name: (nameIn.value || '').trim(), email: (emailIn.value || '').trim(), contact: cleanPhone() },
        theme: { color: '#e1181e' },
        handler: function (r) { verifyAndFinish(r.razorpay_order_id, r.razorpay_payment_id, r.razorpay_signature, leadId); },
        modal: { ondismiss: function () { resetBuy(); setErr('Payment cancelled.'); } },
      });
      rzp.on('payment.failed', function () { resetBuy(); setErr('Payment failed. Please try again or use WhatsApp.'); });
      rzp.open();
    } catch (e) { resetBuy(); setErr(e.message || 'Could not start payment. Please try WhatsApp.'); }
  });

  async function verifyAndFinish(orderId, paymentId, signature, leadId) {
    try {
      await apiPost('/public/warranty/verify', { orderId: orderId, paymentId: paymentId, signature: signature, leadId: leadId });
      ctaRow.style.display = 'none'; priceBox.style.display = 'none'; successEl.style.display = 'block';
      successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (e) { resetBuy(); setErr('Payment received but confirmation failed. Our team will contact you — ' + (e.message || '')); }
  }
  function resetBuy() { btnBuy.textContent = 'Buy Now — Pay Securely'; updateBuyState(); }

  // ---- WhatsApp ----
  btnWa.addEventListener('click', function () {
    var q = state.quote;
    var veh = [makeSel.value, modelSel.value, variantSel.value].filter(Boolean).join(' ');
    var lines = ['Hi FixorAssist, I want an Extended Warranty for my car.'];
    if (veh) lines.push('Vehicle: ' + veh + (regIn.value ? ' (' + regIn.value.toUpperCase() + ')' : ''));
    if (kmIn && kmIn.value) lines.push('KM driven: ' + kmIn.value);
    if (q && q.ok) lines.push('Plan: ' + q.coverLabel + ', ' + q.periodMonths + ' months — ' + fmt(q.totalInr) + ' (incl. GST)');
    if ((nameIn.value || '').trim()) lines.push('Name: ' + nameIn.value.trim());
    if (validPhone()) lines.push('Phone: ' + cleanPhone());
    window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
  });

  applyAvailability();
  updateBuyState();
})();
