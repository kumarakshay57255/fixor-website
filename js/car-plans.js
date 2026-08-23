/* FixorAssist — Car RSA membership cards (credit-card style, DB-driven).
   Self-contained: injects its own CSS, fetches /plans, renders into #carPlans.
   Buy button uses [data-enquiry] which the shared enquiry.js picks up. */
(function () {
  var API = 'https://15.207.113.110.nip.io';
  var wrap = document.getElementById('carPlans');
  if (!wrap) return;
  var msg = document.getElementById('carPlansMsg');

  var inr = function (n) { return '₹' + Number(n).toLocaleString('en-IN'); };
  var gst = function (p) { return Math.round(Number(p) * 1.18); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  }); };

  var css = ''
    + '.cp-grid{display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-start;gap:26px;margin-top:56px}'
    + '.cp-card{width:344px;max-width:100%;background:#fff;border-radius:18px;padding:22px;box-shadow:0 4px 16px rgba(15,15,20,.08);display:flex;flex-direction:column;border:1px solid #eef0f2;transition:transform .25s ease,box-shadow .25s ease}'
    + '.cp-card.pop{border:1.5px solid #e1181e;box-shadow:0 16px 40px rgba(225,24,30,.15)}'
    /* zig-zag: middle card lifts up, outer cards sit lower */
    + '.cp-card.zig-down{margin-top:38px}'
    + '.cp-card:hover{transform:translateY(-6px);box-shadow:0 22px 50px rgba(15,15,20,.16)}'
    + '.cp-card svg{width:100%;height:100%;display:block}'
    + '.cp-name{font-size:19px;font-weight:800;color:#0c0c0e;margin:18px 0 2px}'
    + '.cp-tag{font-size:13px;color:#8a8e94;margin:0 0 8px;font-weight:300}'
    + '.cp-price{font-size:14px;color:#5d6167;margin:0 0 16px;font-weight:300}'
    + '.cp-price .cp-amt{font-size:24px;font-weight:800;color:#e1181e;vertical-align:middle}'
    + '.cp-feats{list-style:none;margin:0 0 10px;padding:0;flex:1;display:flex;flex-direction:column;gap:12px}'
    + '.cp-feats li{display:flex;gap:10px;font-size:14px;color:#3a3d43;font-weight:300;line-height:1.5}'
    + '.cp-feats .cp-chk{width:20px;height:20px;flex:none;color:#e1181e;margin-top:1px}'
    + '.cp-feats b{font-weight:600;color:#0c0c0e}'
    /* differentiator features get a highlighted pill, coloured per tier */
    + '.cp-feats li.cp-diff{border-radius:10px;padding:9px 11px;margin:-2px 0}'
    /* SILVER (default) — red */
    + '.cp-feats li.cp-diff{background:#fff5f5;border:1px solid #fbdada}'
    + '.cp-feats li.cp-diff b{color:#e1181e}'
    + '.cp-feats li.cp-diff .cp-chk{color:#e1181e}'
    /* GOLD — golden */
    + '.tier-gold .cp-feats li.cp-diff{background:#fdf6e3;border:1px solid #ecd48f}'
    + '.tier-gold .cp-feats li.cp-diff b{color:#a9781a}'
    + '.tier-gold .cp-feats li.cp-diff .cp-chk{color:#c9962a}'
    /* DIAMOND — deep blue/navy */
    + '.tier-diamond .cp-feats li.cp-diff{background:#eef2fb;border:1px solid #bcc9ee}'
    + '.tier-diamond .cp-feats li.cp-diff b{color:#1e3a8a}'
    + '.tier-diamond .cp-feats li.cp-diff .cp-chk{color:#2b4db8}'
    + '.cp-fd{color:#8a8e94}'
    + '.cp-btn{margin-top:8px;display:block;text-align:center;font-weight:700;font-size:15px;border-radius:12px;padding:14px;border:2px solid #e1181e;color:#e1181e;text-decoration:none;transition:.2s;cursor:pointer}'
    + '.cp-btn:hover{background:#e1181e;color:#fff}'
    + '.cp-btn.solid{background:#e1181e;color:#fff}'
    + '.cp-btn.solid:hover{background:#c40f15}'
    + '@media (max-width:1080px){.cp-card.zig-down{margin-top:0}}'
    + '#carPlansMsg{text-align:center;color:#8a8e94;margin-top:24px}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var A = 'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';
  var ICONS = {
    shield: '<svg viewBox="0 0 24 24" ' + A + '><path d="M12 2 4 5v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V5z"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 3l2.7 5.4 6 .9-4.3 4.2 1 6L12 16.6 6.6 19.5l1-6L3.3 9.3l6-.9z"/></svg>',
    diamond: '<svg viewBox="0 0 24 24" ' + A + '><path d="M6 3h12l3 6-9 12L3 9z"/><path d="M3 9h18M9 3 7 9l5 12M15 3l2 6-5 12"/></svg>',
    ribbon: '<svg viewBox="0 0 24 24" ' + A + '><circle cx="12" cy="8" r="5"/><path d="M8.5 12.5 6 21l6-3 6 3-2.5-8.5"/></svg>',
    contactless: '<svg viewBox="0 0 24 24" ' + A + '><path d="M8 7a9 9 0 0 1 0 10M12 5a13 13 0 0 1 0 14M4 9a5 5 0 0 1 0 6"/></svg>',
    check: '<svg viewBox="0 0 24 24" ' + A + '><path d="m5 12 5 5L20 6"/></svg>',
  };
  var TIERS = [
    { m: 'SILVER', g: ['#C9D1D9', '#6B7785', '#3F4854'], icon: 'shield' },
    { m: 'GOLD', g: ['#F4D17A', '#D9A431', '#8B6210'], icon: 'star' },
    { m: 'DIAMOND', g: ['#2B3550', '#141C33', '#070C1C'], icon: 'diamond' },
    { m: 'PLATINUM', g: ['#1E2D52', '#0F1B3D', '#06122E'], icon: 'diamond' },
  ];
  var DEF = { g: ['#F63C3C', '#D52F2F', '#9A1F1F'], icon: 'ribbon' };
  function theme(code) {
    var c = String(code || '').toUpperCase();
    for (var i = 0; i < TIERS.length; i++) if (c.indexOf(TIERS[i].m) !== -1) return TIERS[i];
    return DEF;
  }
  function benefits(p) {
    var a = [];
    a.push(p.serviceCallsIncluded == null ? 'UNLIMITED CALLS' : (p.serviceCallsIncluded + ' CALLS'));
    if (p.towingKmIncluded != null) a.push(p.towingKmIncluded + 'KM TOW');
    if (p.code === 'F-GOLD') a.push('PRIORITY');
    else if (p.code === 'F-PLATINUM') a.push('PAN-INDIA');
    else if (p.code === 'F-SILVER') a.push('ESSENTIAL');
    return a.join(' · ');
  }
  function creditCard(p) {
    var t = theme(p.code);
    var bg = 'linear-gradient(135deg,' + t.g[0] + ' 0%,' + t.g[1] + ' 55%,' + t.g[2] + ' 100%)';
    var W = '#fff', D = 'rgba(255,255,255,.55)';
    var chips = ''; for (var i = 0; i < 4; i++) chips += '<span style="width:46%;height:46%;background:rgba(122,88,0,.4);border-radius:1px"></span>';
    var pop = p.highlighted ? '<span style="position:absolute;top:12px;right:78px;display:inline-flex;align-items:center;gap:4px;background:#FFE5A0;color:#7A5800;font-size:9px;font-weight:800;letter-spacing:1px;padding:2px 6px;border-radius:4px"><span style="width:10px;height:10px;display:inline-flex">' + ICONS.star + '</span> POPULAR</span>' : '';
    return '<div style="position:relative;border-radius:16px;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;aspect-ratio:1.6/1;padding:18px;background:' + bg + ';box-shadow:0 8px 16px rgba(0,0,0,.25)">'
      + '<div style="display:flex;align-items:center;justify-content:space-between">'
        + '<img src="assets/img/logo-mark-footer.png" alt="FixorAssist" style="height:30px;width:auto">'
        + '<span style="display:inline-flex;align-items:center;gap:6px;color:' + W + '"><span style="width:15px;height:15px;display:inline-flex">' + ICONS[t.icon] + '</span><span style="font-size:12px;font-weight:700;letter-spacing:1.5px">' + esc(p.code) + '</span></span>'
      + '</div>'
      + '<div style="display:flex;align-items:center;gap:12px"><span style="display:flex;flex-wrap:wrap;align-content:space-between;justify-content:space-between;width:34px;height:26px;background:rgba(255,215,140,.85);border-radius:4px;padding:2px">' + chips + '</span><span style="width:20px;height:20px;display:inline-flex;color:' + W + ';transform:rotate(90deg)">' + ICONS.contactless + '</span></div>'
      + '<div style="color:' + W + ';font-size:13px;font-weight:700;letter-spacing:1.8px;margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(benefits(p)) + '</div>'
      + '<div style="display:flex;align-items:flex-end;justify-content:space-between">'
        + '<div><div style="color:' + D + ';font-size:8px;font-weight:700;letter-spacing:1.2px">VALID FOR</div><div style="color:' + W + ';font-size:11px;font-weight:700;letter-spacing:1.5px;margin-top:2px">' + esc(p.validityDays) + ' DAYS</div></div>'
        + '<div style="text-align:right"><div style="color:' + D + ';font-size:8px;font-weight:700;letter-spacing:1.2px">MEMBER</div><div style="color:' + W + ';font-size:11px;font-weight:700;letter-spacing:1.5px;margin-top:2px">FIXOR MEMBER</div></div>'
      + '</div>' + pop + '</div>';
  }
  function planHTML(p, commonTitles) {
    var total = gst(p.priceInr);
    var feats = (p.features || []).map(function (f) {
      // a feature is a "difference" if its title isn't common to all three plans
      var diff = !commonTitles[String(f.title || '').toLowerCase().trim()];
      if (/\d+\s*bikes/i.test(f.description || '')) diff = true; // pill the multi-bike (Diamond) row
      var descHTML = f.description ? esc(f.description).replace(/(unlimited|\d+\s*bikes)/ig, '<b style="color:#e1181e;font-weight:700">$1</b>') : '';
      return '<li' + (diff ? ' class="cp-diff"' : '') + '><span class="cp-chk">' + ICONS.check + '</span><span><b>' + esc(f.title) + '</b>' + (descHTML ? '<span class="cp-fd"> — ' + descHTML + '</span>' : '') + '</span></li>';
    }).join('');
    var code = String(p.code || '').toUpperCase();
    var tier = code.indexOf('GOLD') > -1 ? ' tier-gold' : (code.indexOf('DIAMOND') > -1 ? ' tier-diamond' : ' tier-silver');
    // zig-zag: the popular (middle) card stays up, the others drop down
    var zig = p.highlighted ? '' : ' zig-down';
    return '<div class="cp-card' + (p.highlighted ? ' pop' : '') + tier + zig + '">'
      + creditCard(p)
      + '<h3 class="cp-name">' + esc(p.name) + '</h3>'
      + (p.tagline ? '<p class="cp-tag">' + esc(p.tagline) + '</p>' : '')
      + '<p class="cp-price"><span class="cp-amt">' + inr(p.priceInr) + '</span> + 18% GST · <b>' + inr(total) + '</b> total</p>'
      + '<ul class="cp-feats">' + feats + '</ul>'
      + '<a href="#" data-enquiry="Car Roadside Assistance" class="cp-btn' + (p.highlighted ? ' solid' : '') + '">Get ' + esc(p.name) + '</a>'
      + '</div>';
  }

  fetch(API + '/plans').then(function (r) { return r.json(); }).then(function (d) {
    var plans = ((d && d.plans) || []).filter(function (p) { return p.active !== false; });
    if (!plans.length) { if (msg) msg.textContent = 'No plans available right now.'; return; }
    if (msg) msg.style.display = 'none';
    // a feature title is "common" only if it appears in EVERY plan; the rest
    // are the differences between plans and get colour-highlighted.
    var counts = {};
    plans.forEach(function (p) {
      var seen = {};
      (p.features || []).forEach(function (f) {
        var k = String(f.title || '').toLowerCase().trim();
        if (k && !seen[k]) { seen[k] = 1; counts[k] = (counts[k] || 0) + 1; }
      });
    });
    var commonTitles = {};
    Object.keys(counts).forEach(function (k) { if (counts[k] === plans.length) commonTitles[k] = 1; });
    wrap.innerHTML = plans.map(function (p) { return planHTML(p, commonTitles); }).join('');
  }).catch(function (e) { if (msg) msg.textContent = "Couldn't load plans: " + e.message; });
})();
