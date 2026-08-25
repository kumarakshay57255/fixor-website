/* FixorAssist — Warranty Claim form. Brand/Model/Variant from the public
   warranty vehicle DB; submit builds a WhatsApp message with all details.   */
(function () {
  var API = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:3005' : 'https://15.207.113.110.nip.io';
  var WA = '919717758510';

  var $ = function (id) { return document.getElementById(id); };
  var brand = $('cBrand'), model = $('cModel'), variant = $('cVariant');
  if (!brand) return;
  var errEl = $('cErr');

  function fill(sel, items, ph) {
    sel.innerHTML = '<option value="">' + ph + '</option>';
    items.forEach(function (it) { var o = document.createElement('option'); o.value = it; o.textContent = it; sel.appendChild(o); });
  }

  fetch(API + '/public/warranty/makes').then(function (r) { return r.json(); }).then(function (d) {
    fill(brand, (d.makes || []).map(function (m) { return m.make; }), 'Select Brand');
  }).catch(function () { brand.innerHTML = '<option value="">Select Brand</option>'; });

  brand.addEventListener('change', function () {
    model.innerHTML = '<option value="">Loading…</option>'; model.disabled = true;
    variant.innerHTML = '<option value="">Select a model first</option>'; variant.disabled = true;
    if (!brand.value) { model.innerHTML = '<option value="">Select a brand first</option>'; return; }
    fetch(API + '/public/warranty/models?make=' + encodeURIComponent(brand.value)).then(function (r) { return r.json(); }).then(function (d) {
      fill(model, d.models || [], 'Select Model'); model.disabled = false;
    }).catch(function () { model.innerHTML = '<option value="">Could not load models</option>'; });
  });

  model.addEventListener('change', function () {
    variant.innerHTML = '<option value="">Any / not sure</option>'; variant.disabled = true;
    if (!model.value) return;
    fetch(API + '/public/warranty/variants?make=' + encodeURIComponent(brand.value) + '&model=' + encodeURIComponent(model.value)).then(function (r) { return r.json(); }).then(function (d) {
      (d.variants || []).forEach(function (v) {
        var o = document.createElement('option'); o.value = v.variant;
        o.textContent = v.variant + (v.cc ? ' · ' + v.cc + 'cc' : '') + (v.fuel ? ' · ' + v.fuel : '');
        variant.appendChild(o);
      });
      variant.disabled = false;
    }).catch(function () {});
  });

  function val(id) { return ($(id).value || '').trim(); }
  function cleanPhone() { return (val('cPhone')).replace(/\D/g, '').slice(-10); }

  function validate() {
    if (!brand.value) return 'Please select your car brand.';
    if (!model.value) return 'Please select your model.';
    if (!val('cReg')) return 'Please enter your registration number.';
    if (!val('cSystem')) return 'Please select the affected system / part.';
    if (!val('cDesc')) return 'Please describe the problem.';
    if (!val('cName')) return 'Please enter your name.';
    if (!/^[6-9]\d{9}$/.test(cleanPhone())) return 'Enter a valid 10-digit mobile number.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val('cEmail'))) return 'Enter a valid email address.';
    return '';
  }

  function message() {
    var veh = [brand.value, model.value, variant.value].filter(Boolean).join(' ');
    var lines = ['Hi FixorAssist, I want to submit an Extended Warranty claim.'];
    lines.push('Vehicle: ' + veh + ' (' + val('cReg').toUpperCase() + ')');
    if (val('cCert')) lines.push('Certificate No: ' + val('cCert'));
    if (val('cCover')) lines.push('Cover: ' + val('cCover'));
    lines.push('Affected: ' + val('cSystem'));
    lines.push('Problem: ' + val('cDesc'));
    if (val('cCentre')) lines.push('Service Centre: ' + val('cCentre'));
    if (val('cJob')) lines.push('Job Card: ' + val('cJob'));
    lines.push('Name: ' + val('cName'));
    lines.push('Phone: ' + cleanPhone());
    lines.push('Email: ' + val('cEmail'));
    return lines.join('\n');
  }

  function submit(openWa) {
    var why = validate();
    if (why) { errEl.textContent = why; window.scrollTo({ top: errEl.getBoundingClientRect().top + window.scrollY - 200, behavior: 'smooth' }); return; }
    errEl.textContent = '';
    if (openWa) window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(message()), '_blank', 'noopener');
    $('claimForm').style.display = 'none';
    $('cDone').style.display = 'block';
    $('cDone').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  $('cWa').addEventListener('click', function () { submit(true); });
  $('cSubmit').addEventListener('click', function () { submit(true); });
})();
