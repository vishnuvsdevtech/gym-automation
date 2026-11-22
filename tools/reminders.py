#!/usr/bin/env python3
"""The four automations, as a script rather than an n8n canvas.

  1. new member  -> append a row (here: update the JSON store)
  2. 2 days before expiry -> queue a WhatsApp reminder
  3. payment received -> update the status
  4. nightly -> owner summary

Running it prints exactly what would happen, which is the whole point: this is
the same logic an n8n workflow would run, minus the UI and the vendor.
"""
import json
import sys
from datetime import date, datetime, timedelta

STORE = "assets/members.json"
PLAN_DAYS = {"monthly": 30, "quarterly": 90, "half": 180, "annual": 365}


def load():
    with open(STORE) as f:
        return json.load(f)


def expiry(m):
    joined = datetime.strptime(m["joined"], "%Y-%m-%d").date()
    return joined + timedelta(days=PLAN_DAYS[m["plan"]])


def days_left(m):
    return (expiry(m) - date.today()).days


def step_new_member(data, name, plan, phone):
    """1. A new member joins."""
    mid = "M" + str(101 + len(data["members"]))
    data["members"].append({
        "id": mid, "name": name, "plan": plan, "phone": phone,
        "joined": date.today().isoformat(), "balance": 0,
    })
    print(f"[1] NEW MEMBER  {mid}  {name}  {plan}  joined today")


def step_reminders(data):
    """2. Two days before expiry, queue a WhatsApp message."""
    sent = 0
    for m in data["members"]:
        if days_left(m) == 2:
            sent += 1
            print(f"[2] REMINDER    {m['name']:18} expires in 2 days — WhatsApp to {m['phone']}")
    return sent


def step_payment(data, mid, amount):
    """3. Payment arrives, balance clears."""
    for m in data["members"]:
        if m["id"] == mid:
            m["balance"] = max(0, m["balance"] - amount)
            print(f"[3] PAYMENT     {m['name']:18} paid ₹{amount}, balance now ₹{m['balance']}")
            return True
    return False


def step_nightly(data):
    """4. The owner's nightly summary."""
    expired = [m for m in data["members"] if days_left(m) < 0]
    expiring = [m for m in data["members"] if 0 <= days_left(m) <= 7]
    owed = [m for m in data["members"] if m["balance"] > 0]
    print("\n[4] NIGHTLY REPORT")
    print(f"    members {len(data['members'])} · expired {len(expired)} · expiring in 7d {len(expiring)} · owing ₹{sum(m['balance'] for m in owed)}")
    for m in owed:
        print(f"      owes ₹{m['balance']:>5}  {m['name']}")
    for m in expiring:
        print(f"      {days_left(m)}d left   {m['name']:18} {m['phone']}")


def main():
    data = load()
    if "--new" in sys.argv:
        step_new_member(data, "Test Member", "monthly", "+91 90000 00000")
    step_reminders(data)
    if "--pay" in sys.argv:
        step_payment(data, sys.argv[sys.argv.index("--pay") + 1], 1200)
    step_nightly(data)


if __name__ == "__main__":
    main()
