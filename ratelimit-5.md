# Plans and Pricing

> Your guide to Browserbase plans and pricing

## Plan Overview

Browserbase offers flexible plans that scale with your automation needs—from solo builders to enterprise teams. Your browser hours and proxy bandwidth renew monthly. Sessions are billed by the minute, with the first minute rounded up.

### Plan Pricing & Overage Rates

| Feature                | Free | Developer   | Startup     | Scale    |
| ---------------------- | ---- | ----------- | ----------- | -------- |
| Monthly Price          | \$0  | \$20        | \$99        | Custom   |
| Browser Hours Included | 1    | 100         | 500         | Flexible |
| Browser Hour Overage   | —    | \$0.12/hour | \$0.10/hour | Custom   |
| Proxy GB Included      | 0    | 1 GB        | 5 GB        | Flexible |
| Proxy GB Overage       | —    | \$12/GB     | \$10/GB     | Custom   |

### Included Usage

| Feature                 | Free    | Developer | Startup | Scale    |
| ----------------------- | ------- | --------- | ------- | -------- |
| Max Concurrent Browsers | 1       | 25        | 100     | 250+     |
| Session Creation Limit  | 1       | 25        | 50      | 150+     |
| Session Duration Limit  | 15 mins | 6 hours   | 6 hours | 6+ hours |
| Data Retention          | 7 days  | 7 days    | 30 days | 30+ days |
| Projects                | 1       | Up to 2   | Up to 5 | 5+       |

### Features & Support

| Feature           | Free  | Developer | Startup  | Scale                    |
| ----------------- | ----- | --------- | -------- | ------------------------ |
| Stealth Mode      | —     | Basic     | Basic    | Advanced                 |
| Captcha Solving   | —     | Auto      | Auto     | Auto                     |
| Support           | Email | Standard  | Priority | High Priority            |
| SOC2 Compliance   | Yes   | Yes       | Yes      | Pen Tests & SOC2 Reports |
| Security Features | —     | —         | —        | SSO Available            |
| HIPAA Compliance  | —     | —         | —        | BAA Available            |
| DPA               | —     | —         | —        | DPA Available            |

## Which Plan Should I Choose?

* **Free Plan**: Best for testing or one-off automations.
* **Developer Plan**: Ideal for small projects or early development with moderate concurrency.
* **Startup Plan**: Great for most teams. Supports production workflows with higher concurrency, lower usage costs, and built-in captcha solving.
* **Scale Plan**: Best for teams with large-scale automation needs, Advanced Stealth requirements, or compliance needs.

  <Card title="Upgrade Your Plan" icon="arrow-up" href="/guides/manage-account">
    Manage your account, upgrade your plan, or add team members.
  </Card>

## What Happens After You Hit Your Limit?

If you're on the **Developer** or **Startup** plan, you won't be cut off when you exceed your included usage. Instead, you'll be charged at the overage rate.

* **Browser hours** continue at your plan's overage rate

  * \$0.12/hour on Developer
  * \$0.10/hour on Startup
* **Proxy bandwidth** continues at your plan's overage rate

  * \$12/GB on Developer
  * \$10/GB on Startup

You'll see these additional charges on your monthly invoice. There's no cap—so you can keep scaling without disruption.

> Tip: Monitor your usage from [your dashboard](https://www.browserbase.com/overview) to avoid surprises.

## Session Creation Rate Limit

Each plan also includes a limit on **how many sessions (browsers) you can create per minute**.

If you attempt to create too many sessions in a short time, you might temporarily hit your creation cap—even if you haven't reached your max concurrency yet.

> For example: On the Startup Plan, your session creation limit is 50 per minute and your max concurrency is 100, it will take about 2 minutes to spin up all 100 sessions.

In most workflows, this won't be an issue—especially if your sessions run longer than a minute. If your sessions are short-lived, consider using the [keep-alive feature](/guides/long-running-sessions#keep-alive-sessions) to reconnect and reuse the same browser session instead of creating a new one.

## Need a Custom Plan?

For high-scale workloads or specific compliance needs, book a demo with our team or contact [hello@browserbase.com](mailto:hello@browserbase.com). We'll help tailor a plan that fits your technical and business requirements.

## Understanding Your Monthly Bill

Here's the breakdown of your monthly bill:

* Base Plan Cost
* Proxy Costs
* Browser Time Costs

A Developer Plan with overages appears like this on an invoice:


You can also manage this on your Organization settings page under "Manage Billing": [https://www.browserbase.com/orgs/\{slug}/settings](https://www.browserbase.com/orgs/\{slug}/settings)

<Note>
  We are actively thinking of ways to make this more clear. Do you have opinions
  on where this should live? Reach out to us at
  [support@browserbase.com](mailto:support@browserbase.com) and let us know!
</Note>
