# Automating Form Submissions

> Enhancing Efficiency and Accuracy

## Overview

Automate form submissions to handle repetitive tasks like logins, registrations, and checkouts with greater speed and accuracy. Browserbase lets you interact with forms across websites while maintaining proper authentication.

**Common Use Cases**

* Login automation
* Registration forms
* Data Entry
* Survey and application submissions
* Order placement and checkout processes

## Implementation

<Steps>
  <Step title="Create a session">
    Create a Browserbase session and [authenticate](/guides/authentication) if needed. Use [browser contexts](/features/contexts) to persist authentication across pages.
  </Step>

  <Step title="Navigate to the form">
    Go to the target page and wait for form elements to fully load before interacting with them.
  </Step>

  <Step title="Fill form fields">
    Identify and populate form elements (text inputs, dropdowns, radio buttons, checkboxes) with your data.
  </Step>

  <Step title="Submit and verify">
    Trigger the submit button and check for success messages or validation errors.
  </Step>
</Steps>

## Google Form Submission

To demonstrate how to automate form submissions using Browserbase, you can use a sample Google Form designed specifically for this tutorial: [Google Form](https://forms.gle/f4yNQqZKBFCbCr6j7)

This form collects responses in various formats:

* Text input
* Radio button
* Checkboxes

<Card title="Follow Along: Form Fill Example" icon="pen-to-square" iconType="sharp-solid" href="https://github.com/browserbase/example-form-fill">Step-by-step code for automating form completion workflows</Card>

### Code Example

<Tabs>
  <Tab title="Node.js">
    <CodeGroup>
      ```typescript Stagehand theme={null}
      import { Stagehand } from "@browserbasehq/stagehand";
      import { z } from "zod";
      import dotenv from "dotenv";

      dotenv.config();

      async function main() {
      	const stagehand = new Stagehand({
      		env: "BROWSERBASE",
              verbose: 0,
      	});

      	await stagehand.init();
      	const page = stagehand.page;

      	async function fillForm(inputs: any) {
      		// Navigate to the form
      		await page.goto("https://forms.gle/f4yNQqZKBFCbCr6j7");

      		// You can use the observe method to find the selector with an act command to fill it in
      		const superpowerSelector = await page.observe({
                  instruction: `Find the superpower field: ${inputs.superpower}`,
                  returnAction: true
              });
      		console.log(superpowerSelector);
      		await page.act(superpowerSelector[0]);

      		// You can also explicitly specify the action to take
      		await page.act({action: "Select the features used: " + inputs.features_used.join(", ")});
      		await page.act({action: "Fill in the coolest_build field with the following value: " + inputs.coolest_build});

      		await page.act({action: "Click the submit button"});
      		await page.waitForTimeout(5000);

      		// Extract to log the status of the form
      		const status = await page.extract({instruction: "Extract the status of the form", schema: z.object({status: z.string()})});
      		console.log(status);

      		await stagehand.close();
      	}

      	const inputs = {
      		"superpower": "Invisibility",
      		"features_used": [
      			"Stealth Mode",
      			"Proxies",
      			"Session Replay"
      		],
      		"coolest_build": "A bot that automates form submissions across multiple sites.",
      	}
      	
      	await fillForm(inputs);
      }

      main().catch(console.error);
      ```

      ```typescript Playwright theme={null}
      import { chromium } from "playwright-core";
      import Browserbase from "@browserbasehq/sdk";
      import { config } from "dotenv";
      config();

      async function createSession() {
          const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY! });
          const session = await bb.sessions.create({
              projectId: process.env.BROWSERBASE_PROJECT_ID!,
              // Add configuration options here
            });
          return session;
      }

      async function fillForm(inputs: any) {
          const session = await createSession()
          const browser = await chromium.connectOverCDP(session.connectUrl);

          // Getting the default context to ensure the sessions are recorded.
          const defaultContext = browser.contexts()[0];
          const page = defaultContext?.pages()[0];

          console.log(`View sessionreplay at https://browserbase.com/sessions/${session.id}`,);
          // Navigate to page
          await page.goto("https://forms.gle/f4yNQqZKBFCbCr6j7");

          // fill superpower
          await page.locator(`[role="radio"][data-value="${inputs.superpower}"]`).click();
          await page.waitForTimeout(1000);

          // fill features_used
          for (const feature of inputs.features_used) {
              await page.locator(`[role="checkbox"][aria-label="${feature}"]`).click();
          }
          await page.waitForTimeout(1000);

          // fill coolest_build
          await page.locator('input[jsname="YPqjbf"]').fill(inputs.coolest_build);
          await page.waitForTimeout(1000);

          // click submit button
          await page.locator('div[role="button"]:has-text("Submit")').click();

          // wait 10 seconds
          await page.waitForTimeout(10000);

          console.log("Shutting down...");
          await page.close();
          await browser.close();
      }

      const inputs = {
          "superpower": "Invisibility",
          "features_used": [
              "Stealth Mode",
              "Proxies",
              "Session Replay"
          ],
          "coolest_build": "A bot that automates form submissions across multiple sites.",
      }
      fillForm(inputs);
      ```
    </CodeGroup>
  </Tab>

  <Tab title="Python">
    ```python Playwright theme={null}
    import os
    from playwright.sync_api import sync_playwright
    from browserbase import Browserbase
    from dotenv import load_dotenv

    load_dotenv()

    def create_session():
        """Creates a Browserbase session."""
        bb = Browserbase(api_key=os.environ["BROWSERBASE_API_KEY"])
        session = bb.sessions.create(
            project_id=os.environ["BROWSERBASE_PROJECT_ID"],
            # Add configuration options here if needed
        )
        return session

    def fill_form(inputs):
        """Automates form filling using Playwright with Browserbase."""
        session = create_session()
        print(f"View session replay at https://browserbase.com/sessions/{session.id}")

        with sync_playwright() as p:
            browser = p.chromium.connect_over_cdp(session.connect_url)

            # Get the default browser context and page
            context = browser.contexts[0]
            page = context.pages[0]

            print(f"View session replay at https://browserbase.com/sessions/{session.id}")

            # Navigate to the form page
            page.goto("https://forms.gle/f4yNQqZKBFCbCr6j7")

            # Select superpower
            page.locator(f'[role="radio"][data-value="{inputs["superpower"]}"]').click()
            page.wait_for_timeout(1000)

            # Select features used
            for feature in inputs["features_used"]:
                page.locator(f'[role="checkbox"][aria-label="{feature}"]').click()
            page.wait_for_timeout(1000)

            # Fill in coolest build
            page.locator('input[jsname="YPqjbf"]').fill(inputs["coolest_build"])
            page.wait_for_timeout(1000)

            # Click submit button
            page.locator('div[role="button"]:has-text("Submit")').click()

            # Wait 10 seconds
            page.wait_for_timeout(10000)

            print("Shutting down...")
            page.close()
            browser.close()

    if __name__ == "__main__":
        inputs = {
            "superpower": "Invisibility",
            "features_used": [
                "Stealth Mode",
                "Proxies",
                "Session Replay"
            ],
            "coolest_build": "A bot that automates form submissions across multiple sites.",
        }
        fill_form(inputs)
    ```
  </Tab>
</Tabs>

<Note>
  This example form is for testing purposes - feel free to submit responses multiple times while experimenting.
</Note>

## Best Practices

### Add wait time between interactions

Adding adequate waits between form interactions ensures the form has time to load and the elements are ready for interaction. This is especially important for forms that have a lot of content or require additional resources to load.

<Tabs>
  <Tab title="Node.js">
    ```typescript  theme={null}
    await page.waitForTimeout(1000);
    ```
  </Tab>

  <Tab title="Python">
    ```python  theme={null}
    await page.wait_for_timeout(1000)
    ```
  </Tab>
</Tabs>

### Implement Error Handling

Implement error handling for missing elements or validation failures

<Tabs>
  <Tab title="Node.js">
    ```typescript  theme={null}
    try {
        await page.waitForTimeout(1000);
    } catch (error) {
        console.error("Error waiting for timeout:", error);
    }
    ```
  </Tab>

  <Tab title="Python">
    ```python  theme={null}
    try:
        await page.wait_for_timeout(1000)
    except Exception as e:
        print(f"Error waiting for timeout: {e}")
    ```
  </Tab>
</Tabs>

### Verify Submissions

Verify submissions with confirmation messages or URL changes

<Tabs>
  <Tab title="Node.js">
    ```typescript  theme={null}
    await page.waitForSelector("text=Your response has been recorded.")
    ```
  </Tab>

  <Tab title="Python">
    ```python  theme={null}
    await page.wait_for_selector("text=Your response has been recorded.")
    ```
  </Tab>
</Tabs>

## Next Steps

Now that you understand how to automate form submissions using Browserbase, you can try it out for yourself.

<CardGroup cols={2}>
  <Card title="Session Live View" icon="magnifying-glass" href="/features/session-live-view">
    Learn how to watch test sessions in real time
  </Card>

  <Card title="Uploads" icon="upload" href="/features/uploads">
    Learn how to upload files with Browserbase
  </Card>
</CardGroup>
