# Create a Browser Session

> Learn how to create and configure browser sessions in Browserbase

## Overview

A browser session represents a single browser instance running in the cloud. It's the fundamental building block of Browserbase, providing an isolated environment for your web automation tasks.

## Creating a Session

Browser sessions are created through the [Sessions API](/reference/api/create-a-session), which gives you full control over configuration and features. After creation, you'll receive a connection URL to use with your preferred automation framework.

<Warning>
  The create session API is rate limited based on your plan's concurrent session
  limits. See [Concurrency & Rate
  Limits](/guides/concurrency-rate-limits) for details on limits and
  best practices for handling them.
</Warning>

<Tabs>
  <Tab title="Node.js">
    ```typescript  theme={null}
    import { Browserbase } from "@browserbasehq/sdk";

    const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY! });
    const session = await bb.sessions.create({
      projectId: process.env.BROWSERBASE_PROJECT_ID!,
      // Add configuration options here
    });
    ```
  </Tab>

  <Tab title="Python">
    ```python  theme={null}
    import os
    from browserbase import Browserbase

    bb = Browserbase(api_key=os.environ["BROWSERBASE_API_KEY"])
    session = bb.sessions.create(
        project_id=os.environ["BROWSERBASE_PROJECT_ID"],
        # Add configuration options here
    )
    ```
  </Tab>

  <Tab title="cURL">
    ```bash  theme={null}
    curl --request POST \
      --url "https://api.browserbase.com/v1/sessions" \
      --header "Content-Type: application/json" \
      --header "x-bb-api-key: $BROWSERBASE_API_KEY" \
      --data '{
        "projectId": "'$BROWSERBASE_PROJECT_ID'",
        // Add configuration options here
      }'
    ```
  </Tab>
</Tabs>

## Configuration Options

When creating a session, you can configure various settings. For complete API details, see:

* [Create Session API Reference](/reference/api/create-a-session)
* [Node.js SDK Reference](/reference/sdk/nodejs)
* [Python SDK Reference](/reference/sdk/python)

### Basic Settings

* **Region** - Decrease latency by choosing where your browser runs using one of our [browser regions](/guides/multi-region)
* **Viewport** - Set custom screen dimensions for your browser window. Otherwise, the default viewport varies per session
* **Keep Alive** - Enable [longer-running sessions](/guides/long-running-sessions) that run even after disconnection
* **Recording** - Enable/disable [session recording](/features/session-replay) (enabled by default)
* **Logging** - Enable/disable session logging for debugging (enabled by default)

### Advanced Features

* **[Stealth Mode](/features/stealth-mode)** - Configure anti-bot mitigations:

  * Automatic basic fingerprinting (devices, locales, operating systems)
  * Advanced stealth mode (Scale plan only)
  * [Proxy settings](/features/proxies)
  * Captcha solving (enabled by default)

* **[Extensions](/features/browser-extensions)** - Load custom browser extensions to enhance functionality

* **[Browser Context](/features/contexts)** - Configure isolated browsing contexts for session persistence

* **[User Metadata](/features/session-metadata)** - Attach custom data for session organization and filtering

## Next Steps

Once you've created a session, you can:

1. Connect to it using your preferred automation framework - see [Using a Browser Session](/fundamentals/using-browser-session)
2. Monitor it through the [Session Inspector](/features/session-inspector)
3. End it manually or let it timeout - see [Manage a Browser Session](/fundamentals/manage-browser-session)
