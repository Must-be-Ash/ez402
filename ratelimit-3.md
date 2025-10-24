# Manage a Browser Session

> Learn how to manage session termination and inspect completed sessions

While Browserbase automatically handles session termination when you disconnect, understanding how sessions end helps you debug failed runs, manage long-running sessions, optimize resource usage, and investigate timeouts or errors.

## Session Termination

Browser sessions can end in these ways:

1. **Automatic Timeout**
   Sessions have a default timeout configured at the project level, which can be customized when creating a session. For longer-running tasks, enable [keep alive](/guides/long-running-sessions).

2. **Manual Termination**
   You can end sessions explicitly by closing the browser programmatically (`browser.close()` or `driver.quit()`), using the Sessions API, or releasing keep-alive sessions when no longer needed.

3. **Unhandled Errors**
   Unhandled errors in your automation code can cause your script to disconnect from the browser, ending the session prematurely. Common scenarios include network interruptions, uncaught exceptions, or exceeded resource limits.

   To prevent premature termination, make sure to implement proper error handling and cleanup in your code.

## Session Timeout Settings

Configure timeouts at two levels:

**Project Level**
Set the default timeout for all sessions in your [project settings](https://browserbase.com/settings). This acts as the fallback when no session-specific timeout is set.

**Session Level**
Override the project timeout for specific sessions when [creating them](/fundamentals/create-browser-session#configuration-options). This gives you fine-grained control over individual session durations.

## Debugging Completed Sessions

The [Session Inspector](/features/session-inspector) is your primary tool for analyzing completed sessions. It provides comprehensive debugging capabilities:

<CardGroup>
  <Card title="Session Replay" icon="play" href="/features/session-replay">
    Record and replay browser activity to understand what happened
  </Card>

  <Card title="Network Monitor" icon="wifi" href="/features/session-inspector#network">
    Inspect HTTP traffic, responses, and timing
  </Card>

  <Card title="Console & Logs" icon="terminal" href="/features/session-inspector#console">
    Review JavaScript output and debug messages
  </Card>

  <Card title="Performance" icon="gauge-high" href="/features/session-inspector#performance">
    Track CPU, memory usage, and other metrics
  </Card>
</CardGroup>

## Measuring Usage

Track and analyze your browser session usage through multiple interfaces:

**Dashboard**
Your central hub at [browserbase.com/overview](https://browserbase.com/overview) shows total browser minutes, active sessions, usage trends, and billing information.

**Sessions List**
Browse your session history at [browserbase.com/sessions](https://browserbase.com/sessions) to view duration, status, and resource consumption for individual sessions.

For programmatic access to these metrics, see the [Measuring Usage Guide](/guides/measuring-usage).
