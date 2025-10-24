# Concurrency & Rate Limits

> Session limits and rate controls for concurrent browsers

## Key Limits

Browser automation becomes powerful when you can run multiple browser sessions simultaneously. Whether you're scraping data at scale, running parallel tests, or serving multiple users, understanding concurrency and rate limits is critical.

To ensure system stability and fair resource allocation, two key limits apply:

* **Max Concurrent Browsers**: The maximum number of browser sessions that you can run at the same time
* **Session Creation Limit**: The maximum number of new browser sessions you can create within any 60-second period

If either limit is reached, your request will receive a 429 (too many requests) error.

<Note>
  **One Minute Minimum:** each browser session requires dedicated resources and
  has a minimum runtime of one minute, even if closed before.
</Note>

## Limits by Plan

These limits depends on your plan:

<div className="my-6">
  <table className="w-full border-collapse">
    <thead>
      <tr className="bg-gray-50 dark:bg-gray-800">
        <th className="border p-4 text-left">Plan</th>
        <th className="border p-4 text-left">Free</th>
        <th className="border p-4 text-left">Developer</th>
        <th className="border p-4 text-left">Startup</th>
        <th className="border p-4 text-left">Scale</th>
      </tr>
    </thead>

    <tbody>
      <tr>
        <td className="border p-4">Max Concurrent Browsers</td>
        <td className="border p-4">1</td>
        <td className="border p-4">25</td>
        <td className="border p-4">100 </td>
        <td className="border p-4">250+</td>
      </tr>

      <tr>
        <td className="border p-4">Session Creation Limit per minute</td>
        <td className="border p-4">5</td>
        <td className="border p-4">25</td>
        <td className="border p-4">50</td>
        <td className="border p-4">150+</td>
      </tr>
    </tbody>
  </table>
</div>

## Limits and Concurrency per Project

Concurrency is assigned to the Organization level - so if you're on the Developer plan, you have 25 total concurrent browsers allotted to your Organization, to be distributed to your projects as you see fit.

With one project, all concurrent browsers simply go to that one project. When you create a second project, 1 concurrent browser is automatically added to your second project (since you need at least one browser per project). This subtracts from your first project.

If you have two projects, here's how the concurrency will assign by default:

* **Developer plan**: Project 1 (24 browsers) + Project 2 (1 browser)
* **Startup plan**: Project 1 (99 browsers) + Project 2 (1 browser)
* **Scale plan**: Fully custom

### Adjust Concurrency

You can adjust the concurrency for your projects in the dashboard. Go to your organization page, then click on the triple dots next to the project you want to adjust and select "Update concurrency". Then you can adjust the concurrency for each project.

<Frame>
  <video src="https://mintcdn.com/browserbase/F5DWxYwlGvdIpHjk/images/concurrency-rate-limits/concurrency.mp4?fit=max&auto=format&n=F5DWxYwlGvdIpHjk&q=85&s=f76755ee816bc16e102c7d59645414ae" alt="Update Concurrency" loop autoPlay muted controls data-path="images/concurrency-rate-limits/concurrency.mp4" />
</Frame>

## Reaching Limits: 429s

When reaching the session concurrency limit of your plan, any subsequent request to create a new session will return an HTTP `429 Too Many Requests` error. That means the request was effectively dropped.

For example, if you have a Developer plan (with a limit of 25 concurrent sessions) you can create up to 25 sessions in a 60 second window. If you try to create a 26th session within that window, it will be rate limited and return an HTTP 429 error.

To check the status of your rate limit, you can look at the headers of the response:

* `x-ratelimit-limit` - How many requests you can make.
* `x-ratelimit-remaining` - How many requests remain in the time window.
* `x-ratelimit-reset` - How many seconds must pass before the rate limit resets.
* `retry-after` - If the max has been reached, this is the number of seconds you must wait before you can make another request. This is documented [here](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After).

```text  theme={null}
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
x-ratelimit-limit: 25
x-ratelimit-remaining: 0
x-ratelimit-reset: 45
retry-after: 45
```

## Avoiding Rate Limits

To avoid rate limits, you can either run fewer concurrent sessions or close sessions explicitly - as opposed to letting them time out.

<Tip>
  For production systems, consider implementing retry logic that respects these
  headers, using exponential backoff and circuit breakers to handle high
  concurrency.
</Tip>

If you need more concurrency, you can upgrade to a plan that allows for a higher limits. See [Plans & Pricing](/guides/plans-and-pricing) for more details. Or reach out to us at [support@browserbase.com](mailto:support@browserbase.com) with any questions.
