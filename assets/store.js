/* The gym's data: members, plans, payments. Seeded so the demo has texture —
   dates are relative to "today" so expiry logic is live whenever you open it. */
window.GYM = (() => {
  const day = (offset) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + offset);
    return d;
  };

  const PLANS = {
    monthly: { label: 'Monthly', days: 30, price: 1200 },
    quarterly: { label: 'Quarterly', days: 90, price: 3200 },
    half: { label: 'Half-yearly', days: 180, price: 5800 },
    annual: { label: 'Annual', days: 365, price: 10000 },
  };

  // [name, plan, daysUntilExpiry, balance, phone] — expiry is the thing the
  // demo is about, so seed that directly rather than deriving from join date
  const raw = [
    ['Nikhil George', 'monthly', -10, 0, '+91 95260 77321'],      // expired
    ['Ramesh Pillai', 'quarterly', -3, 1200, '+91 94960 11268'],   // expired, owing
    ['Anjali Nair', 'monthly', 2, 0, '+91 98950 33210'],           // reminder today
    ['Priya Kurian', 'monthly', 2, 0, '+91 98470 90211'],          // reminder today
    ['Anoop S', 'monthly', 1, 0, '+91 90480 66990'],
    ['Rahul Menon', 'quarterly', 5, 1200, '+91 98470 11221'],
    ['Sneha Pillai', 'monthly', 6, 0, '+91 97440 21877'],
    ['Divya Iyer', 'monthly', 14, 0, '+91 90370 44556'],
    ['Arjun Das', 'quarterly', 30, 0, '+91 95390 66412'],
    ['Meera Thomas', 'half', 30, 2000, '+91 98460 71990'],
    ['Kiran Raj', 'monthly', 32, 0, '+91 99460 88123'],
    ['Suresh Babu', 'quarterly', 58, 0, '+91 98610 22104'],
    ['Bhavya R', 'half', 75, 0, '+91 97450 33218'],
    ['Vinod Kumar', 'annual', 65, 5000, '+91 90480 55401'],
    ['Lakshmi Varma', 'annual', 180, 0, '+91 94950 33876'],
  ];

  // internal store: joined date, plan, amount owed
  const PLAN_DAYS = { monthly: 30, quarterly: 90, half: 180, annual: 365 };
  const members = raw.map(([name, plan, daysToExpiry, balance, phone], i) => {
    // derive the join date backwards from the intended expiry so the plan
    // length and the displayed expiry can never disagree
    const joined = day(daysToExpiry - PLAN_DAYS[plan]);
    return {
      id: 'M' + String(101 + i),
      name, plan, phone, balance,
      joined: joined.toISOString().slice(0, 10),
    };
  });

  return { PLANS, members, day };
})();
