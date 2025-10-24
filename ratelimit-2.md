# Using a Browser Session

> Learn how to connect to and interact with browser sessions

## Connecting to a Session

Once you [create a session](/fundamentals/create-browser-session), you'll receive a connection URL that you can use with your preferred automation framework. Here's how to connect using our supported frameworks:

<Tabs>
  <Tab title="Node.js">
    <CodeGroup>
      ```typescript Stagehand theme={null}
      import { Browserbase } from "@browserbasehq/sdk";

      const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY! });

      // Create a session
      const session = await bb.sessions.create({
        projectId: process.env.BROWSERBASE_PROJECT_ID
      });

      // Connect and automate
      const browser = await bb.connect(session.id);
      ```

      ```typescript Playwright theme={null}
      import { chromium } from "playwright-core";
      import { Browserbase } from "@browserbasehq/sdk";

      const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY! });

      // Create a session
      const session = await bb.sessions.create({
        projectId: process.env.BROWSERBASE_PROJECT_ID
      });

      const browser = await chromium.connectOverCDP(session.connectUrl);
      ```

      ```typescript Puppeteer theme={null}
      import puppeteer from "puppeteer-core";
      import { Browserbase } from "@browserbasehq/sdk";

      const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY! });

      // Create a session
      const session = await bb.sessions.create({
        projectId: process.env.BROWSERBASE_PROJECT_ID
      });

      const browser = await puppeteer.connect({
        browserWSEndpoint: session.connectUrl
      });
      ```

      ```typescript Selenium theme={null}
      import { Builder } from 'selenium-webdriver';
      import { Options } from 'selenium-webdriver/chrome';
      import { Browserbase } from "@browserbasehq/sdk";

      class BrowserbaseConnection {
        constructor(sessionId) {
          this.sessionId = sessionId;
        }

        getHeaders() {
          return {
            'x-bb-api-key': process.env.BROWSERBASE_API_KEY,
            'session-id': this.sessionId
          };
        }
      }

      // Create a session
      const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY! });
      const session = await bb.sessions.create({
        projectId: process.env.BROWSERBASE_PROJECT_ID
      });

      // Create connection with custom headers
      const connection = new BrowserbaseConnection(session.id);

      // Configure WebDriver
      const driver = await new Builder()
        .usingServer(session.seleniumRemoteUrl)
        .setChromeOptions(new Options())
        .build();

      // Add custom headers to all requests
      const originalExecute = driver.executor_.execute.bind(driver.executor_);
      driver.executor_.execute = async function (command) {
        command.headers = { ...command.headers, ...connection.getHeaders() };
        return originalExecute(command);
      };
      ```
    </CodeGroup>
  </Tab>

  <Tab title="Python">
    <CodeGroup>
      ```python Stagehand theme={null}
      import os
      from browserbase import Browserbase

      bb = Browserbase(api_key=os.environ["BROWSERBASE_API_KEY"])

      # Create a session
      session = bb.sessions.create(
          project_id=os.environ["BROWSERBASE_PROJECT_ID"]
      )

      # Connect and automate
      browser = bb.connect(session.id)
      page = browser.new_page()
      ```

      ```python Playwright theme={null}
      import os
      from playwright.sync_api import sync_playwright
      from browserbase import Browserbase

      # Create a session
      bb = Browserbase(api_key=os.environ["BROWSERBASE_API_KEY"])
      session = bb.sessions.create(
          project_id=os.environ["BROWSERBASE_PROJECT_ID"]
      )

      with sync_playwright() as playwright:
          browser = playwright.chromium.connect_over_cdp(session.connect_url)
      ```

      ```python Selenium theme={null}
      import os
      from selenium import webdriver
      from selenium.webdriver.remote.webdriver import WebDriver
      from selenium.webdriver.remote.remote_connection import RemoteConnection
      from browserbase import Browserbase

      class BrowserbaseConnection(RemoteConnection):
          """Manage a single session with Browserbase."""

          def __init__(self, session_id, *args, **kwargs):
              self.session_id = session_id
              super().__init__(*args, **kwargs)

          def get_remote_connection_headers(self, parsed_url, keep_alive=False):
              headers = super().get_remote_connection_headers(parsed_url, keep_alive)
              headers.update({
                  "x-bb-api-key": os.environ["BROWSERBASE_API_KEY"],
                  "session-id": self.session_id,
              })
              return headers

      # Create a session
      bb = Browserbase(api_key=os.environ["BROWSERBASE_API_KEY"])
      session = bb.sessions.create(
          project_id=os.environ["BROWSERBASE_PROJECT_ID"]
      )

      # Connect using custom connection class
      connection = BrowserbaseConnection(
          session.id,
          session.selenium_remote_url
      )
      driver = webdriver.Remote(
          command_executor=connection,
          options=webdriver.ChromeOptions()
      )
      ```
    </CodeGroup>
  </Tab>
</Tabs>

### Connection Best Practices

1. **Connection Timeout** - You have 5 minutes to connect to a newly created session before it terminates. To prevent timeouts:

   * Connect promptly after creation
   * Enable [keep alive](/guides/long-running-sessions) for sessions that need to persist
   * Use the connection URL immediately after receiving it

2. **Use Default Context** - Always use the default context and page when possible to ensure proper functionality of stealth features:

<Tabs>
  <Tab title="Node.js">
    <CodeGroup>
      ```typescript Stagehand theme={null}
      const page = await browser.newPage(); // Uses default context automatically
      ```

      ```typescript Playwright theme={null}
      const context = browser.contexts()[0];
      const page = context.pages()[0];
      ```

      ```typescript Puppeteer theme={null}
      const page = (await browser.pages())[0];
      ```

      ```typescript Selenium theme={null}
      // Uses default context automatically
      ```
    </CodeGroup>
  </Tab>

  <Tab title="Python">
    <CodeGroup>
      ```python Stagehand theme={null}
      page = browser.new_page()  # Uses default context automatically
      ```

      ```python Playwright theme={null}
      context = browser.contexts[0]
      page = context.pages[0]
      ```

      ```python Selenium theme={null}
      # Uses default context automatically
      ```
    </CodeGroup>
  </Tab>
</Tabs>

## Controlling the Browser

Once connected, use your preferred framework's APIs to control the browser. Each framework has its own methods for navigation, interaction, and automation.

<CardGroup>
  <Card title="Stagehand" icon="robot" iconType="sharp-solid" href="https://docs.stagehand.dev/">
    Build reliable browser automation with AI-powered element selection and self-healing scripts
  </Card>

  {" "}

  <Card title="Playwright" icon="masks-theater" iconType="sharp-solid" href="https://playwright.dev/">
    Create fast, reliable end-to-end tests with built-in auto-waiting and mobile
    emulation
  </Card>

  {" "}

  <Card title="Puppeteer" icon="code" iconType="sharp-solid" href="https://pptr.dev/">
    Headless Chrome automation with a lightweight API and strong DevTools
    integration
  </Card>

  <Card title="Selenium" icon="vial" iconType="sharp-solid" href="https://www.selenium.dev">
    Industry-standard testing framework supporting all major browsers and programming languages
  </Card>
</CardGroup>

### Browserbase Features

When running browsers in the cloud, certain operations require special handling through our APIs:

<CardGroup>
  <Card title="File Downloads" icon="download" href="/features/downloads">
    Securely retrieve files from your cloud browser session
  </Card>

  <Card title="Screenshots" icon="camera" href="/features/screenshots">
    Capture high-quality browser screenshots with custom settings
  </Card>

  <Card title="PDF Generation" icon="file-pdf" href="/features/screenshots#pdfs">
    Create PDFs with advanced formatting options
  </Card>

  <Card title="File Upload" icon="upload" href="/features/uploads">
    Transfer files directly to your browser session
  </Card>
</CardGroup>

### Live View

The Live View feature gives you real-time visibility into your browser sessions through two powerful interfaces:

#### Session Inspector

The [Session Inspector](/features/session-inspector) provides real-time debugging capabilities:

<Frame>
  <img src="https://mintcdn.com/browserbase/m1Ny8qOvNHvtrY7y/images/getting-started/live_inspector.png?fit=max&auto=format&n=m1Ny8qOvNHvtrY7y&q=85&s=4f91e77cd6749399ad9723c7f63fd77c" data-og-width="2934" width="2934" data-og-height="1146" height="1146" data-path="images/getting-started/live_inspector.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/browserbase/m1Ny8qOvNHvtrY7y/images/getting-started/live_inspector.png?w=280&fit=max&auto=format&n=m1Ny8qOvNHvtrY7y&q=85&s=ed7396bb765893a0cd1c8820be21370a 280w, https://mintcdn.com/browserbase/m1Ny8qOvNHvtrY7y/images/getting-started/live_inspector.png?w=560&fit=max&auto=format&n=m1Ny8qOvNHvtrY7y&q=85&s=e4a08c0ea590ba6623a2c3098793d0ad 560w, https://mintcdn.com/browserbase/m1Ny8qOvNHvtrY7y/images/getting-started/live_inspector.png?w=840&fit=max&auto=format&n=m1Ny8qOvNHvtrY7y&q=85&s=54a5a4a6646f1ab70c34bc5010c82ed3 840w, https://mintcdn.com/browserbase/m1Ny8qOvNHvtrY7y/images/getting-started/live_inspector.png?w=1100&fit=max&auto=format&n=m1Ny8qOvNHvtrY7y&q=85&s=e2f5e4f2571336cd83821f9bdf489872 1100w, https://mintcdn.com/browserbase/m1Ny8qOvNHvtrY7y/images/getting-started/live_inspector.png?w=1650&fit=max&auto=format&n=m1Ny8qOvNHvtrY7y&q=85&s=b97af5b4d7e8103e24369c3d8d842f90 1650w, https://mintcdn.com/browserbase/m1Ny8qOvNHvtrY7y/images/getting-started/live_inspector.png?w=2500&fit=max&auto=format&n=m1Ny8qOvNHvtrY7y&q=85&s=2c05d36ee608da4457dd5f351b14dd83 2500w" />
</Frame>

Monitor your session's activity with:

* Live browser state and interactions
* Real-time network requests and responses
* Console output and error tracking
* Performance metrics and resource usage
* Session recording and replay

#### Embedded View

Integrate the [Live View](/features/session-live-view) directly into your application to show your users their automated browser sessions in real-time. The Live View enables remote control over the browser, unlocking human-in-the-loop possibilities to handle authentication, captcha, or unexpected errors.

## Ending Your Session

While Browserbase automatically handles session termination when you disconnect, understanding how sessions end is important.

For more details about session termination, timeouts, and best practices for managing session lifecycle, see [Manage a Browser Session](/fundamentals/manage-browser-session).
