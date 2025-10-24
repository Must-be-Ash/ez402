# Long Running Sessions

## How are sessions terminated?

By default, Browserbase sessions automatically terminate in two scenarios:

1. When a developer disconnects from the session
2. When the session reaches its default timeout period

This behavior is designed to optimize session management and resource utilization. However, in certain scenarios, you may need to maintain a session for an extended period.

We introduced session keep alive and custom timeout to address this need.

| Property           | Description                                                           |
| ------------------ | --------------------------------------------------------------------- |
| **Keep Alive**     | Allowing you to reconnect to the same session after a disconnect      |
| **Custom Timeout** | Extending the lifetime of a session beyond its default timeout period |

<Note>
  Session keep alive is only available on paid plans.
</Note>

## Why keep sessions alive?

Custom timeouts and session keep alive supports a broad spectrum of use cases. Key benefits include:

* Avoid interrupting long-running tasks and workflows.
* Connect, disconnect, and reconnect to the same session.
* Keep working with a session without worrying about it timing out.
* Reusing existing sessions is more performant than creating new ones.

## Keep Alive Sessions

The `keepAlive` feature allows you to keep sessions alive across disconnects, permitting you to continue using it as long as needed.

### Create a Keep Alive Session

Setting `keepAlive` to `true` will keep the session available for later use. You can reconnect to the keep alive session using the same connection URL as the original session.

Let's walk through an example of how to keep a session alive:

<Tabs>
  <Tab title="Node.js">
    ```typescript SDK theme={null}
    const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY! });
    const session = await bb.sessions.create({
      projectId: process.env.BROWSERBASE_PROJECT_ID!,
      keepAlive: true,
    });
    ```
  </Tab>

  <Tab title="Python">
    ```python SDK theme={null}
    bb = Browserbase(api_key=os.environ["BROWSERBASE_API_KEY"])
    session = bb.sessions.create(
      project_id=BROWSERBASE_PROJECT_ID, 
      keep_alive=True
    )
    ```
  </Tab>
</Tabs>

Next time we run the script, we'll be able to reconnect to the same session after a disconnect. This enables us to reuse the same session for multiple runs.

### Stop a Keep Alive Session

In order to stop the session, use the Browserbase API or the SDK as shown here:

<Tabs>
  <Tab title="Node.js">
    <CodeGroup>
      ```typescript SDK theme={null}
      import Browserbase from "browserbase";

      const BROWSERBASE_API_KEY = process.env.BROWSERBASE_API_KEY!;
      const BROWSERBASE_PROJECT_ID = process.env.BROWSERBASE_PROJECT_ID!;

      const bb = new Browserbase({
        apiKey: BROWSERBASE_API_KEY,
      });

      // Create a session with keep alive set.
      // Then, end it by closing it.
      (async () => {
        const session = await bb.sessions.create({
          keepAlive: true,
          projectId: BROWSERBASE_PROJECT_ID,
        });

        await bb.sessions.update(session.id, {
          status: "REQUEST_RELEASE",
          projectId: BROWSERBASE_PROJECT_ID,
        });
      })();
      ```

      ```typescript API theme={null}
      const options = {
        method: "POST",
        headers: {
          "X-BB-API-Key": "<your-api-key>",
          "Content-Type": "application/json",
        },
        body: '{"projectId":"<your-project-id>", "keepAlive": true, "sessionId": "<your-session-id>", "status": "REQUEST_RELEASE"}',
      };

      fetch("https://api.browserbase.com/v1/sessions", options)
        .then((response) => response.json())
        .then((response) => console.log(response))
        .catch((err) => console.error(err));
      ```
    </CodeGroup>
  </Tab>

  <Tab title="Python">
    <CodeGroup>
      ```python SDK theme={null}
      from browserbase import Browserbase
      import os

      # Initialize the SDK
      BROWSERBASE_API_KEY = os.environ["BROWSERBASE_API_KEY"]
      BROWSERBASE_PROJECT_ID = os.environ["BROWSERBASE_PROJECT_ID"]

      bb = Browserbase(api_key=BROWSERBASE_API_KEY)

      # Create a session with keep alive set

      session = bb.sessions.create(keep_alive=True, project_id=BROWSERBASE_PROJECT_ID)

      # Manually complete the session to end it

      bb.sessions.update(session.id, status="REQUEST_RELEASE", project_id=BROWSERBASE_PROJECT_ID)
      ```

      ```python API theme={null}
      # Stop a session
      import os
      from pprint import pprint

      import requests

      API_KEY = os.environ["BROWSERBASE_API_KEY"]
      PROJECT_ID = os.environ["BROWSERBASE_PROJECT_ID"]

      SESSION_ID = "<The id of the session to stop>"

      headers = {"x-bb-api-key": API_KEY}
      json = {
          "projectId": PROJECT_ID,
          "status": "REQUEST_RELEASE",
      }

      response = requests.post(
          f"https://api.browserbase.com/v1/sessions/{SESSION_ID}",
          json=json,
          headers=headers,
      )

      # Raise an exception if there wasn't a good response from the endpoint.
      response.raise_for_status()

      # print the response
      pprint(response.json())
      ```
    </CodeGroup>
  </Tab>
</Tabs>

<Note>
  We recommend that you stop your keep alive sessions explicitly when no longer
  needed. They will time out eventually, but you may be charged for the unneeded
  browser minutes used.
</Note>

## Session Timeouts

After the script is past the default timeout, we'll see a `TimeoutError`: `Timeout _____ms exceeded`

Browserbase has a project wide settings for session timeout. We can change to session timeout project wide to a different value in the toggle.

<Frame>
    <img src="https://mintcdn.com/browserbase/m1Ny8qOvNHvtrY7y/images/long-running-sessions/defaulttimeout.png?fit=max&auto=format&n=m1Ny8qOvNHvtrY7y&q=85&s=d3961ec954c993aa99735ca3bf0e472d" alt="" data-og-width="2048" width="2048" data-og-height="516" height="516" data-path="images/long-running-sessions/defaulttimeout.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/browserbase/m1Ny8qOvNHvtrY7y/images/long-running-sessions/defaulttimeout.png?w=280&fit=max&auto=format&n=m1Ny8qOvNHvtrY7y&q=85&s=5b0bb7830178ecd6dbd6340a4648ff13 280w, https://mintcdn.com/browserbase/m1Ny8qOvNHvtrY7y/images/long-running-sessions/defaulttimeout.png?w=560&fit=max&auto=format&n=m1Ny8qOvNHvtrY7y&q=85&s=60bb8e96dae67e6299add60133fb6398 560w, https://mintcdn.com/browserbase/m1Ny8qOvNHvtrY7y/images/long-running-sessions/defaulttimeout.png?w=840&fit=max&auto=format&n=m1Ny8qOvNHvtrY7y&q=85&s=98b78b3cf42fbd47214e7be637c42228 840w, https://mintcdn.com/browserbase/m1Ny8qOvNHvtrY7y/images/long-running-sessions/defaulttimeout.png?w=1100&fit=max&auto=format&n=m1Ny8qOvNHvtrY7y&q=85&s=5ef9a2e854667eedffefb469b68401f0 1100w, https://mintcdn.com/browserbase/m1Ny8qOvNHvtrY7y/images/long-running-sessions/defaulttimeout.png?w=1650&fit=max&auto=format&n=m1Ny8qOvNHvtrY7y&q=85&s=9b2512f73467a89ee18a21f70af21c06 1650w, https://mintcdn.com/browserbase/m1Ny8qOvNHvtrY7y/images/long-running-sessions/defaulttimeout.png?w=2500&fit=max&auto=format&n=m1Ny8qOvNHvtrY7y&q=85&s=be39ad1344d2f5d01393b6eed99378e4 2500w" />
</Frame>

<Frame>
  <img style={{ maxHeight:"300px" }} src="https://mintcdn.com/browserbase/m1Ny8qOvNHvtrY7y/images/long-running-sessions/toggle.png?fit=max&auto=format&n=m1Ny8qOvNHvtrY7y&q=85&s=be3ed147f0ea4bfa4b48f901aeb0a500" data-og-width="936" width="936" data-og-height="660" height="660" data-path="images/long-running-sessions/toggle.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/browserbase/m1Ny8qOvNHvtrY7y/images/long-running-sessions/toggle.png?w=280&fit=max&auto=format&n=m1Ny8qOvNHvtrY7y&q=85&s=fee0f2df5f20807b49a8e5d29d3eeecf 280w, https://mintcdn.com/browserbase/m1Ny8qOvNHvtrY7y/images/long-running-sessions/toggle.png?w=560&fit=max&auto=format&n=m1Ny8qOvNHvtrY7y&q=85&s=946b4ee97926099f4bc94d3e690d8d23 560w, https://mintcdn.com/browserbase/m1Ny8qOvNHvtrY7y/images/long-running-sessions/toggle.png?w=840&fit=max&auto=format&n=m1Ny8qOvNHvtrY7y&q=85&s=44620a5e455be69e86a87dee81668961 840w, https://mintcdn.com/browserbase/m1Ny8qOvNHvtrY7y/images/long-running-sessions/toggle.png?w=1100&fit=max&auto=format&n=m1Ny8qOvNHvtrY7y&q=85&s=972e2eaf634c933f732e5df7187183a9 1100w, https://mintcdn.com/browserbase/m1Ny8qOvNHvtrY7y/images/long-running-sessions/toggle.png?w=1650&fit=max&auto=format&n=m1Ny8qOvNHvtrY7y&q=85&s=404815429b31e91b4f3faf9ba229c72f 1650w, https://mintcdn.com/browserbase/m1Ny8qOvNHvtrY7y/images/long-running-sessions/toggle.png?w=2500&fit=max&auto=format&n=m1Ny8qOvNHvtrY7y&q=85&s=48a5f5ede1c80c211c445d46e92150ed 2500w" />
</Frame>

### Custom session timeout

We can also set a custom timeout for a created session through code.

If you'd like to set a custom timeout that isn't shown in the toggle, you can set a custom timeout in the `createSession` function.

To set a custom timeout for your session, specify the `timeout` option in the API request body or
with the SDK.

<Tabs>
  <Tab title="Node.js">
    <CodeGroup>
      ```typescript SDK theme={null}
      import Browserbase from "browserbase";

      const BROWSERBASE_API_KEY = process.env.BROWSERBASE_API_KEY!;
      const BROWSERBASE_PROJECT_ID = process.env.BROWSERBASE_PROJECT_ID!;

      const bb = new Browserbase({
        apiKey: BROWSERBASE_API_KEY,
      });

      // Creates a session with a timeout of 3600 seconds
      (async () => {
        const session = await bb.sessions.create({
          timeout: 3600,
        });
      })();
      ```

      ```typescript API theme={null}
      const options = {
        method: "POST",
        headers: {
          "X-BB-API-Key": "<your-api-key>",
          "Content-Type": "application/json",
        },
        body: '{"projectId":"<your-project-id>", "timeout": 3600}',
      };

      fetch("https://api.browserbase.com/v1/sessions", options)
        .then((response) => response.json())
        .then((response) => console.log(response))
        .catch((err) => console.error(err));
      ```
    </CodeGroup>
  </Tab>

  <Tab title="Python">
    <CodeGroup>
      ```python SDK theme={null}
      from browserbase import Browserbase
      import os

      BROWSERBASE_API_KEY = os.environ["BROWSERBASE_API_KEY"]
      BROWSERBASE_PROJECT_ID = os.environ["BROWSERBASE_PROJECT_ID"]

      bb = Browserbase(
          api_key=BROWSERBASE_API_KEY,
      )

      # Creates a session with a timeout of 3600 seconds
      session = bb.sessions.create(
          project_id=BROWSERBASE_PROJECT_ID,
          api_timeout=3600
      )
      ```

      ```python API theme={null}
      import os
      from pprint import pprint

      import requests

      BROWSERBASE_API_KEY = os.environ["BROWSERBASE_API_KEY"]
      BROWSERBASE_PROJECT_ID = os.environ["BROWSERBASE_PROJECT_ID"]

      headers = {"x-bb-api-key": BROWSERBASE_API_KEY}
      json = {
          "projectId": BROWSERBASE_PROJECT_ID,
          "api_timeout": 3600,
      }

      response = requests.post(
          "https://api.browserbase.com/v1/sessions", json=json, headers=headers
      )

      # Raise an exception if there wasn't a good response from the endpoint.
      response.raise_for_status()

      # print the response
      pprint(response.json())
      ```
    </CodeGroup>
  </Tab>
</Tabs>

Here the timeout has been set to 3600 seconds (1 hour), overriding the default. That means
that unless explicitly closed beforehand, the session will continue running for an hour before
terminating. At disconnect, it will end.

Setting a custom timeout won't keep the session alive after disconnecting. To allow reconnecting
to a session after disconnecting, it needs to be configured for keep alive.

<Note>
  The maximum duration of a session is 6 hours. Once a session times out, it can
  no longer be used.
</Note>

## Related Guides

<CardGroup cols="3">
  <Card title="Creating a Session" icon="user-secret" href="/fundamentals/create-browser-session">
    Learn how to create a session with Browserbase
  </Card>

  <Card title="Browser Contexts" icon="browser" href="/features/contexts">
    Persist cookies and session data across multiple sessions
  </Card>

  <Card title="Session Inspector" icon="network-wired" href="/features/session-inspector">
    Watch your session in real time and debug issues after the session has ended
  </Card>
</CardGroup>
