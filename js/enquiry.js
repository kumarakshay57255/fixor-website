/* FixorAssist — reusable enquiry popup → redirects to WhatsApp.
   Trigger: any element with [data-enquiry] (value = context label, optional).
   e.g. <a href="#" data-enquiry="Car Service & Maintenance">Book Now</a>          */
(function () {
  var WA = '919717758510';

  var css = ''
    + '.enq-overlay{position:fixed;inset:0;z-index:1000;display:none;align-items:center;justify-content:center;background:rgba(12,12,14,.55);backdrop-filter:blur(3px);padding:20px}'
    + '.enq-overlay.open{display:flex}'
    + '.enq-modal{background:#fff;border-radius:18px;width:100%;max-width:440px;box-shadow:0 30px 70px rgba(0,0,0,.35);padding:28px 26px;position:relative;font-family:"Poppins",system-ui,sans-serif;animation:enqIn .22s ease}'
    + '@keyframes enqIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}'
    + '.enq-close{position:absolute;top:14px;right:16px;background:none;border:0;font-size:26px;line-height:1;color:#8a8e94;cursor:pointer}'
    + '.enq-close:hover{color:#e1181e}'
    + '.enq-eyebrow{display:inline-block;font-size:11.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#e1181e;background:#fdecec;padding:5px 12px;border-radius:999px;margin-bottom:12px}'
    + '.enq-modal h3{font-size:22px;font-weight:800;color:#0c0c0e;margin:0 0 6px;line-height:1.2}'
    + '.enq-sub{font-size:13.5px;color:#5d6167;font-weight:300;margin:0 0 18px}'
    + '.enq-field{display:flex;flex-direction:column;gap:6px;margin-bottom:13px}'
    + '.enq-field label{font-size:12.5px;font-weight:600;color:#31343a}'
    + '.enq-field input,.enq-field textarea,.enq-field select{font-family:inherit;font-size:14.5px;padding:12px 13px;border:1.5px solid #e7e8ea;border-radius:10px;color:#0c0c0e;width:100%;background:#fff}'
    + '.enq-field textarea{resize:vertical;min-height:64px}'
    + '.enq-field input:focus,.enq-field textarea:focus,.enq-field select:focus{outline:0;border-color:#e1181e;box-shadow:0 0 0 3px #fdecec}'
    + '.enq-err{color:#c40f15;font-size:12.5px;min-height:16px;margin-bottom:8px}'
    + '.enq-submit{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;background:#25d366;color:#fff;font-family:inherit;font-weight:700;font-size:15.5px;border:0;border-radius:12px;padding:14px;cursor:pointer;transition:.2s;box-shadow:0 8px 22px rgba(37,211,102,.3)}'
    + '.enq-submit:hover{background:#1da851;transform:translateY(-1px)}'
    + '.enq-submit svg{width:19px;height:19px;flex:none}';

  var wa = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.86L2 22l5.35-1.36c1.42.77 3.02 1.19 4.69 1.19h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2zm5.71 14.02c-.24.68-1.17 1.24-1.93 1.4-.52.11-1.19.2-3.46-.74-2.9-1.2-4.77-4.15-4.92-4.35-.14-.19-1.18-1.57-1.18-3 0-1.43.75-2.13 1.02-2.42.27-.29.58-.36.78-.36.19 0 .39 0 .56.01.18.01.42-.07.66.5.24.58.83 2.01.9 2.16.07.15.12.32.02.51-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.02 1.12.99 2.06 1.3 2.35 1.45.29.15.46.13.63-.08.17-.2.72-.84.92-1.13.19-.29.39-.24.66-.15.27.1 1.7.8 1.99.95.29.15.48.22.55.34.07.13.07.71-.17 1.39z"/></svg>';

  var html = ''
    + '<div class="enq-modal" role="dialog" aria-modal="true" aria-label="Enquiry form">'
    + '  <button class="enq-close" aria-label="Close">&times;</button>'
    + '  <span class="enq-eyebrow" id="enqEyebrow">Enquire Now</span>'
    + '  <h3>Talk to FixorAssist</h3>'
    + '  <p class="enq-sub" id="enqSub">Share your details and we’ll connect with you on WhatsApp right away.</p>'
    + '  <div class="enq-field"><label for="enqService">Service you need *</label><select id="enqService"><option value="Roadside Assistance">Roadside Assistance</option><option value="Vehicle Inspection">Vehicle Inspection</option><option value="Service & Maintenance">Service &amp; Maintenance</option><option value="Genuine Spare Parts">Genuine Spare Parts</option><option value="Insurance Claim">Insurance Claim</option><option value="Extended Warranty">Extended Warranty</option><option value="Other">Other</option></select></div>'
    + '  <div class="enq-field"><label for="enqName">Full Name *</label><input id="enqName" type="text" placeholder="Your name" autocomplete="name"></div>'
    + '  <div class="enq-field"><label for="enqPhone">Mobile Number *</label><input id="enqPhone" type="tel" maxlength="10" placeholder="10-digit number" autocomplete="tel"></div>'
    + '  <div class="enq-field"><label for="enqCity">City</label><input id="enqCity" type="text" placeholder="Your city"></div>'
    + '  <div class="enq-field"><label for="enqMsg">Requirement</label><textarea id="enqMsg" placeholder="Tell us what you need (optional)"></textarea></div>'
    + '  <div class="enq-err" id="enqErr"></div>'
    + '  <button class="enq-submit" id="enqSubmit">' + wa + ' Send on WhatsApp</button>'
    + '</div>';

  var overlay, ctx = '';

  function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  ready(function () {
    var style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
    overlay = document.createElement('div'); overlay.className = 'enq-overlay'; overlay.id = 'enqOverlay';
    overlay.innerHTML = html; document.body.appendChild(overlay);

    var errEl = overlay.querySelector('#enqErr');
    function close() { overlay.classList.remove('open'); errEl.textContent = ''; }
    overlay.querySelector('.enq-close').addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

    function open(context) {
      ctx = context || '';
      overlay.querySelector('#enqSub').textContent = ctx
        ? 'Enquiry for ' + ctx + ' — share your details and we’ll connect on WhatsApp.'
        : 'Share your details and we’ll connect with you on WhatsApp right away.';
      // pre-select the Service dropdown based on the card clicked
      var sel = overlay.querySelector('#enqService');
      var c = ctx.toLowerCase();
      var match = c ? Array.prototype.filter.call(sel.options, function (o) {
        var v = o.value.toLowerCase();
        return v !== 'other' && (c === v || c.indexOf(v) > -1 || v.indexOf(c) > -1);
      })[0] : null;
      sel.value = match ? match.value : 'Other';
      overlay.classList.add('open');
      setTimeout(function () { overlay.querySelector('#enqName').focus(); }, 60);
    }

    // wire all triggers (delegated — also covers dynamically-added buttons)
    document.addEventListener('click', function (e) {
      var el = e.target.closest ? e.target.closest('[data-enquiry]') : null;
      if (el) { e.preventDefault(); open(el.getAttribute('data-enquiry') || ''); }
    });

    overlay.querySelector('#enqSubmit').addEventListener('click', function () {
      var name = overlay.querySelector('#enqName').value.trim();
      var phone = (overlay.querySelector('#enqPhone').value || '').replace(/\D/g, '').slice(-10);
      var city = overlay.querySelector('#enqCity').value.trim();
      var msg = overlay.querySelector('#enqMsg').value.trim();
      if (!name) { errEl.textContent = 'Please enter your name.'; return; }
      if (!/^[6-9]\d{9}$/.test(phone)) { errEl.textContent = 'Enter a valid 10-digit mobile number.'; return; }
      errEl.textContent = '';
      var service = overlay.querySelector('#enqService').value;
      var lines = ['Hi FixorAssist, I’d like to enquire about ' + service + '.'];
      lines.push('Service: ' + service);
      lines.push('Name: ' + name);
      lines.push('Phone: ' + phone);
      if (city) lines.push('City: ' + city);
      if (msg) lines.push('Requirement: ' + msg);
      window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
      close();
    });
  });
})();
