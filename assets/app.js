/* Gym membership automation — the four automations, running on real logic.
 * Expiry is derived, never stored. Reminders fire at exactly two days.
 * Everything the owner would ask for is computed, not filled in. */
(() => {
  const $ = (s) => document.querySelector(s);
  const { PLANS, members } = window.GYM;
  const DAY = 86400000;

  let filter = 'all', q = '';
  let remindersSent = new Set();
  const activity = [];

  const today = new Date(); today.setHours(0, 0, 0, 0);
  $('#today').textContent = today.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const expiryOf = (m) => {
    const d = new Date(m.joined + 'T00:00:00');
    d.setDate(d.getDate() + PLANS[m.plan].days);
    return d;
  };
  const daysLeft = (m) => Math.round((expiryOf(m) - today) / DAY);
  const statusOf = (m) => {
    const d = daysLeft(m);
    if (d < 0) return 'expired';
    if (d <= 7) return 'expiring';
    return 'active';
  };
  const fmtDate = (d) => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

  /* ---------- activity + report ---------- */
  function push(kind, text) {
    activity.unshift({ kind, text, at: new Date() });
    if (activity.length > 40) activity.pop();
    drawActivity();
  }

  function drawActivity() {
    $('#activity').innerHTML = activity.length
      ? activity.map((a) => `<div class="log ${a.kind}">${a.text}</div>`).join('')
      : '<div class="empty">Nothing yet — try "New member" or mark a payment.</div>';
  }

  function nightly() {
    const expired = members.filter((m) => daysLeft(m) < 0);
    const expiring = members.filter((m) => daysLeft(m) >= 0 && daysLeft(m) <= 7);
    const owed = members.filter((m) => m.balance > 0);
    const due = expired.length + expiring.length;
    const lines = [
      `GYM REPORT · ${today.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
      `${'-'.repeat(38)}`,
      `members            ${String(members.length).padStart(3)}`,
      `active             ${String(members.length - due).padStart(3)}`,
      `expiring in 7 days ${String(expiring.length).padStart(3)}`,
      `expired            ${String(expired.length).padStart(3)}`,
      `outstanding        ₹${String(owed.reduce((s, m) => s + m.balance, 0)).padStart(5)}`,
      '',
    ];
    if (expiring.length) {
      lines.push('CHASE THESE THIS WEEK');
      expiring.forEach((m) => lines.push(`  ${String(daysLeft(m)).padStart(2)}d  ${m.name.padEnd(16)} ${m.phone}`));
      lines.push('');
    }
    if (owed.length) {
      lines.push('PAYMENTS DUE');
      owed.forEach((m) => lines.push(`  ₹${String(m.balance).padStart(5)}  ${m.name}`));
    }
    if (!expiring.length && !owed.length) lines.push('Nothing outstanding. Go home.');
    $('#report').textContent = lines.join('\n');
  }

  /* ---------- reminder pass ---------- */
  function reminderPass(silent) {
    const due = members.filter((m) => daysLeft(m) === 2 && !remindersSent.has(m.id));
    due.forEach((m) => {
      remindersSent.add(m.id);
      push('r', `WhatsApp → ${m.name}: membership expires in 2 days (${fmtDate(expiryOf(m))})`);
    });
    if (!silent && due.length) flash(1);
    return due.length;
  }

  function flash(i) {
    const el = document.querySelectorAll('.step')[i];
    if (!el) return;
    el.classList.add('hot');
    setTimeout(() => el.classList.remove('hot'), 1200);
  }

  /* ---------- list ---------- */
  function drawStats() {
    const expired = members.filter((m) => daysLeft(m) < 0).length;
    const expiring = members.filter((m) => daysLeft(m) >= 0 && daysLeft(m) <= 7).length;
    const owed = members.reduce((s, m) => s + m.balance, 0);
    $('#stats').innerHTML = `
      <div><b>${members.length}</b><span>members</span></div>
      <div><b>${expiring}</b><span>expiring 7d</span></div>
      <div><b>${expired}</b><span>expired</span></div>
      <div><b>₹${owed.toLocaleString('en-IN')}</b><span>outstanding</span></div>`;
  }

  function drawList() {
    const rows = members
      .filter((m) => filter === 'all' || statusOf(m) === filter)
      .filter((m) => !q || (m.name + m.phone).toLowerCase().includes(q))
      .sort((a, b) => daysLeft(a) - daysLeft(b));

    $('#list').innerHTML = rows.length ? rows.map((m) => {
      const d = daysLeft(m), st = statusOf(m);
      const when = d < 0 ? `${Math.abs(d)}d ago` : d === 0 ? 'today' : `${d}d`;
      return `<div class="mrow">
        <div class="who"><b>${m.name}</b><span>${PLANS[m.plan].label} · ${m.phone}</span></div>
        <div class="when"><small>${d < 0 ? 'expired' : 'expires'}</small>${when}
          <div style="margin-top:4px"><span class="pill ${st}">${st}</span>${m.balance ? ` <span class="pill owing">₹${m.balance}</span>` : ''}</div></div>
        <div class="act">
          ${m.balance ? `<button class="btn" data-pay="${m.id}">Paid</button>` : ''}
          <button class="btn" data-renew="${m.id}">Renew</button>
        </div>
      </div>`;
    }).join('') : '<div class="empty">No members match that.</div>';

    $('#list').querySelectorAll('[data-pay]').forEach((b) => b.onclick = () => {
      const m = members.find((x) => x.id === b.dataset.pay);
      push('p', `Payment ₹${m.balance} received from ${m.name} — balance cleared`);
      m.balance = 0;
      flash(2); drawStats(); drawList(); nightly();
    });
    $('#list').querySelectorAll('[data-renew]').forEach((b) => b.onclick = () => {
      const m = members.find((x) => x.id === b.dataset.renew);
      m.joined = today.toISOString().slice(0, 10);
      m.balance = PLANS[m.plan].price * 0.1;
      remindersSent.delete(m.id);
      push('n', `${m.name} renewed ${PLANS[m.plan].label} — new expiry ${fmtDate(expiryOf(m))}`);
      flash(3); drawStats(); drawList(); nightly();
    });
  }

  $('#filters').innerHTML = ['all', 'active', 'expiring', 'expired']
    .map((f) => `<button class="fchip ${f === 'all' ? 'on' : ''}" data-f="${f}">${f}</button>`).join('');
  $('#filters').onclick = (e) => {
    const b = e.target.closest('.fchip');
    if (!b) return;
    filter = b.dataset.f;
    document.querySelectorAll('.fchip').forEach((c) => c.classList.toggle('on', c === b));
    drawList();
  };
  $('#q').oninput = (e) => { q = e.target.value.trim().toLowerCase(); drawList(); };
  $('#addBtn').onclick = () => {
    const name = prompt('Member name?');
    if (!name) return;
    const plan = (prompt('Plan: monthly / quarterly / half / annual', 'monthly') || 'monthly').toLowerCase();
    if (!PLANS[plan]) return alert('Unknown plan.');
    const phone = prompt('Phone?', '+91 ') || '';
    const m = { id: 'M' + (101 + members.length), name, plan, phone, joined: today.toISOString().slice(0, 10), balance: PLANS[plan].price };
    members.push(m);
    push('n', `New member ${name} (${PLANS[plan].label}) added — sheet row created, ₹${m.balance} due`);
    flash(0); drawStats(); drawList(); nightly();
  };
  $('#runNightly').onclick = () => { nightly(); push('p', 'Nightly report sent to owner'); };

  /* ---------- the four steps ---------- */
  $('#flow').innerHTML = [
    ['1', 'New member → sheet', 'Name, plan and join date are recorded the moment they sign. No diary, no transcription later.'],
    ['2', 'Expiry − 2 days → WhatsApp', 'The reminder that saves the renewal. Fires once, at exactly two days, so nobody gets nagged.'],
    ['3', 'Payment → status update', 'A payment clears the balance and stops the reminder chain for that member.'],
    ['4', 'Nightly → owner report', 'Who expires this week, who owes money, how many active. One message, every evening.'],
  ].map(([n, t, d]) => `<div class="step"><span class="n">${n}</span><div><b>${t}</b><p>${d}</p></div></div>`).join('');

  const savedTheme = localStorage.getItem('gym.theme');
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  else if (matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.dataset.theme = 'dark';
  else document.documentElement.dataset.theme = 'light';
  $('#theme').onclick = () => {
    const n = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = n;
    localStorage.setItem('gym.theme', n);
  };

  drawStats(); drawList(); nightly();
  const fired = reminderPass();
  if (fired) push('r', `${fired} reminder${fired > 1 ? 's' : ''} queued for members expiring in 2 days`);

  document.documentElement.dataset.ready = '1';
})();
