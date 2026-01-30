-- Seed documents migration - only runs if documents table is empty
-- This ensures seed data is only added for fresh databases

INSERT INTO documents (title, slug, content, excerpt, category_id, is_published, created_by, updated_by)
SELECT 'New Employee Onboarding', 'onboarding', '# New Employee Onboarding

Welcome to Unstable Studios! This guide will help you get set up.

## Day 1 Checklist

- [ ] Get your Tailscale invite
- [ ] Set up 1Password
- [ ] Join Slack channels
- [ ] Review company handbook

## Tools Access

1. **Tailscale** - VPN access to internal resources
2. **Slack** - Team communication
3. **GitHub** - Code repositories
4. **Gusto** - Payroll and benefits

## Questions?

Reach out to your manager or in #general on Slack.
', 'Guide for new team members getting started',
   (SELECT id FROM categories WHERE slug = 'hr'), 1, 'system', 'system'
WHERE NOT EXISTS (SELECT 1 FROM documents LIMIT 1);

INSERT INTO documents (title, slug, content, excerpt, category_id, is_published, created_by, updated_by)
SELECT 'Invoice Process', 'invoices', '# Invoice Process

How to create and send invoices through QuickBooks.

## Creating an Invoice

1. Log into QuickBooks
2. Navigate to **Sales > Invoices**
3. Click **Create Invoice**
4. Fill in client details and line items
5. Review and send

## Payment Terms

- Standard terms: Net 30
- Enterprise clients: Net 45

## Following Up

If payment is overdue, send a friendly reminder at:
- 7 days past due
- 14 days past due
- 30 days past due (escalate to management)
', 'Step-by-step guide for creating invoices',
   (SELECT id FROM categories WHERE slug = 'finance'), 1, 'system', 'system'
WHERE NOT EXISTS (SELECT 1 FROM documents WHERE slug = 'invoices');

INSERT INTO documents (title, slug, content, excerpt, category_id, is_published, created_by, updated_by)
SELECT 'Tax Deadlines', 'tax-deadlines', '# Tax Deadlines 2025

Important tax dates to remember.

| Date | Event |
|------|-------|
| Jan 15 | Q4 estimated tax due |
| Apr 15 | Tax return + Q1 estimated |
| Jun 15 | Q2 estimated tax due |
| Sep 15 | Q3 estimated tax due |

## Reminders

- Quarterly payroll tax filings
- Annual W-2 distribution (Jan 31)
- 1099 distribution (Jan 31)
', 'Key tax dates and filing deadlines',
   (SELECT id FROM categories WHERE slug = 'finance'), 1, 'system', 'system'
WHERE NOT EXISTS (SELECT 1 FROM documents WHERE slug = 'tax-deadlines');
