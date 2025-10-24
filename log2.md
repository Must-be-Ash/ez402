ashnouruzi@C357PRGCH2 ez402 % npm run lint

> ez402@0.1.0 lint
> eslint


/Users/ashnouruzi/ez402/app/api/browserbase/fill-form/route.ts
  115:24  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  150:58  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  161:61  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  220:28  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  238:30  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  290:32  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  306:29  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  351:19  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

/Users/ashnouruzi/ez402/app/api/browserbase/scrape-form/route.ts
  135:19  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

/Users/ashnouruzi/ez402/app/api/chat/sessions/[sessionId]/messages/route.ts
  9:28  warning  'IMessage' is defined but never used  @typescript-eslint/no-unused-vars

/Users/ashnouruzi/ez402/app/api/mcp/reload/route.ts
  18:10  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

/Users/ashnouruzi/ez402/app/api/mcp/tools/route.ts
   11:8   warning  'EndpointModel' is defined but never used  @typescript-eslint/no-unused-vars
  184:35  warning  'score' is defined but never used          @typescript-eslint/no-unused-vars
  203:40  error    Unexpected any. Specify a different type   @typescript-eslint/no-explicit-any

/Users/ashnouruzi/ez402/app/chat/page.tsx
  29:13  error  Do not use an `<a>` element to navigate to `/`. Use `<Link />` from `next/link` instead. See: https://nextjs.org/docs/messages/no-html-link-for-pages  @next/next/no-html-link-for-pages

/Users/ashnouruzi/ez402/components/assistant-ui/mcp-ui-renderer.tsx
  48:3  error  React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render  react-hooks/rules-of-hooks

/Users/ashnouruzi/ez402/components/assistant-ui/thread.tsx
   95:36  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  110:26  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

/Users/ashnouruzi/ez402/components/assistant-ui/tool-fallback.tsx
  19:102  error    Unexpected any. Specify a different type        @typescript-eslint/no-explicit-any
  21:9    warning  'isSuccess' is assigned a value but never used  @typescript-eslint/no-unused-vars
  22:92   error    Unexpected any. Specify a different type        @typescript-eslint/no-explicit-any
  75:40   error    Unexpected any. Specify a different type        @typescript-eslint/no-explicit-any
  77:51   error    Unexpected any. Specify a different type        @typescript-eslint/no-explicit-any

/Users/ashnouruzi/ez402/components/assistant-ui/tool-suggestions.tsx
  17:32  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

/Users/ashnouruzi/ez402/lib/db/models/chat-session.ts
  215:91  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

/Users/ashnouruzi/ez402/lib/mcp/server.ts
  180:11  error    'response' is never reassigned. Use 'const' instead  prefer-const
  245:11  warning  'walletClient' is assigned a value but never used    @typescript-eslint/no-unused-vars

/Users/ashnouruzi/ez402/lib/mcp/tools.ts
   14:3   warning  'createTableResource' is defined but never used  @typescript-eslint/no-unused-vars
   15:3   warning  'createChartResource' is defined but never used  @typescript-eslint/no-unused-vars
   16:3   warning  'createCardResource' is defined but never used   @typescript-eslint/no-unused-vars
   52:23  error    Unexpected any. Specify a different type         @typescript-eslint/no-explicit-any
   92:31  error    Unexpected any. Specify a different type         @typescript-eslint/no-explicit-any
  190:61  error    Unexpected any. Specify a different type         @typescript-eslint/no-explicit-any
  194:31  error    Unexpected any. Specify a different type         @typescript-eslint/no-explicit-any
  220:3   warning  'mcpServer' is defined but never used            @typescript-eslint/no-unused-vars
  222:17  error    Unexpected any. Specify a different type         @typescript-eslint/no-explicit-any
  363:38  error    Unexpected any. Specify a different type         @typescript-eslint/no-explicit-any

/Users/ashnouruzi/ez402/lib/services/browserbase-service.ts
   77:12  warning  'error' is defined but never used         @typescript-eslint/no-unused-vars
  102:45  error    Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

/Users/ashnouruzi/ez402/lib/services/browserbase-session-pool.ts
  131:41  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  146:23  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  258:36  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

/Users/ashnouruzi/ez402/lib/services/endpoint-tester.ts
  109:18  warning  'parseError' is defined but never used  @typescript-eslint/no-unused-vars

/Users/ashnouruzi/ez402/lib/services/mcp-deployer.ts
  115:23  warning  'serverName' is assigned a value but never used   @typescript-eslint/no-unused-vars
  115:35  warning  'environment' is assigned a value but never used  @typescript-eslint/no-unused-vars
  193:23  warning  'serverName' is assigned a value but never used   @typescript-eslint/no-unused-vars
  193:35  warning  'environment' is assigned a value but never used  @typescript-eslint/no-unused-vars

/Users/ashnouruzi/ez402/lib/services/mcp-generator.ts
  165:16  warning  'e' is defined but never used           @typescript-eslint/no-unused-vars
  203:18  warning  'parseError' is defined but never used  @typescript-eslint/no-unused-vars

/Users/ashnouruzi/ez402/test-browserbase-form.ts
  153:19  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

/Users/ashnouruzi/ez402/test-mcp-server.ts
   20:10   warning  'IEndpointConfig' is defined but never used  @typescript-eslint/no-unused-vars
   54:13   error    Unexpected any. Specify a different type     @typescript-eslint/no-explicit-any
  225:13   warning  'server' is assigned a value but never used  @typescript-eslint/no-unused-vars
  233:32   error    Unexpected any. Specify a different type     @typescript-eslint/no-explicit-any
  366:88   error    Unexpected any. Specify a different type     @typescript-eslint/no-explicit-any
  366:101  error    Unexpected any. Specify a different type     @typescript-eslint/no-explicit-any

/Users/ashnouruzi/ez402/test-mcp-simple.ts
  63:13  warning  'convertMCPToolToClaudeTool' is assigned a value but never used  @typescript-eslint/no-unused-vars

/Users/ashnouruzi/ez402/test-x402-payment.ts
  22:7  warning  'USDC_CONTRACT' is assigned a value but never used  @typescript-eslint/no-unused-vars

/Users/ashnouruzi/ez402/test-x402-sepolia.ts
   49:23  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  100:19  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

/Users/ashnouruzi/ez402/workers/mcp-server.ts
   92:13  warning  'message' is assigned a value but never used                    @typescript-eslint/no-unused-vars
  142:1   warning  Assign object to a variable before exporting as module default  import/no-anonymous-default-export
  143:43  warning  'ctx' is defined but never used                                 @typescript-eslint/no-unused-vars