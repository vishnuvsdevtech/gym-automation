# The Diary That Writes Itself

**Live:** https://vishnuvsdevtech.github.io/gym-automation/

A working prototype of the gym-membership automation sold at ₹10–15k to small gyms:
a 120-member gym running on a paper diary, where the money leaks through renewals
nobody chased.

## The four automations

| # | Trigger | Action |
|---|---|---|
| 1 | New member joins | name, plan, join date recorded — no transcription later |
| 2 | 2 days before expiry | WhatsApp reminder, **once**, at exactly 2 days |
| 3 | Payment received | balance clears, reminder chain stops |
| 4 | Every night | owner report: expiring this week, who owes, active count |

Expiry is **derived** from join date + plan length, never stored. Change a date and
the status, the reminder queue and the nightly report all follow.

## What is real and what is not

- **Real:** the logic. Filters, search, payment clearing, renewal, reminder
  de-duplication, the nightly arithmetic.
- **Not real:** WhatsApp. Messages are composed and logged, not sent. The official
  Business API needs Meta approval and per-message pricing; unofficial libraries
  get numbers banned. **That integration is the actual work, and the actual cost.**
- **Not needed:** n8n. The original pitch sells an n8n workflow. `tools/reminders.py`
  does the same four steps in Python — a cron job, a store, an API call.

## Running the Python version

```bash
python3 tools/reminders.py            # runs the reminder pass + nightly report
python3 tools/reminders.py --new      # simulate a new member
python3 tools/reminders.py --pay M102 # simulate a payment
```

## If you build this for real

1. **WhatsApp first.** Decide between the Cloud API (reliable, needs approval and
   a business number) and an unofficial library (banned numbers). This decides
   whether the product works.
2. **One client, one month, free.** The second installation costs a fraction of
   the first, so prove the workflow before pricing it.
3. **Support is the business.** A gym owner will call when a reminder doesn't
   fire. Ten clients is a part-time job.
4. **Charge for setup, then optionally per month** — the recurring fee is what
   makes it a business rather than a series of favours.
