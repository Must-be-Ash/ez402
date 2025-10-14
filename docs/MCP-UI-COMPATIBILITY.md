# MCP-UI Compatibility Issue

## Summary

We encountered a critical compatibility issue with the `mcp-ui` npm package during Phase 4 implementation. The package is built for **Vue.js** applications, while our ez402 project uses **React/Next.js**, making it incompatible with our stack.

## The Problem

### Error Encountered

```
Module not found: Can't resolve 'vue'

./node_modules/.pnpm/mcp-ui@2.0.12/node_modules/mcp-ui/dist/mcp-ui.js:1:1
import { defineComponent as j, computed as $, openBlock as L, ... } from "vue";
```

### Root Cause

The `mcp-ui` package (version 2.0.12) has a hard dependency on Vue.js:

```json
{
  "name": "mcp-ui",
  "version": "2.0.12",
  "peerDependencies": {
    "vue": "^3.0.0"
  }
}
```

This means:
- The package's components are written as Vue Single File Components (SFCs)
- It uses Vue's reactivity system and composition API
- It cannot render in React applications without Vue runtime
- Installing Vue alongside React would create conflicts and bloat

## Our Solution

### Custom MCP-UI Resource Implementation

Instead of using the `mcp-ui` package for rendering, we implemented our own **lightweight MCP-UI resource system** that:

1. **Creates MCP-UI compatible data structures** without external dependencies
2. **Uses native React components** for rendering (sandboxed iframes)
3. **Maintains compatibility** with the MCP-UI specification

### Implementation Details

#### 1. Custom `createUIResource` Function

Located in `lib/mcp/ui-factory.ts`:

```typescript
function createUIResource(config: {
  uri: string;
  content: {
    type: 'rawHtml' | 'externalUrl' | 'remoteDom';
    htmlString?: string;
    url?: string;
  };
  encoding: string;
}) {
  return {
    uri: config.uri,
    content: config.content,
    encoding: config.encoding
  };
}
```

**Benefits:**
- Zero external dependencies
- Lightweight (no Vue runtime overhead)
- Fully compatible with MCP-UI spec
- TypeScript type safety

#### 2. React-Based Renderer

Located in `components/assistant-ui/mcp-ui-renderer.tsx`:

```typescript
export function MCPUIRenderer({ resource }: MCPUIRendererProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Render MCP-UI resources using React and sandboxed iframes
  return (
    <iframe
      ref={iframeRef}
      sandbox="allow-same-origin"
      // ... render logic
    />
  );
}
```

**Benefits:**
- Native React/Next.js integration
- Sandboxed iframe security
- Full control over rendering logic
- No Vue dependencies

#### 3. UI Resource Factory Functions

We created helper functions to generate common UI components:

```typescript
// HTML content
createHTMLResource(htmlString, uri)

// Bar/line/pie charts
createChartResource(data, type)

// Data tables
createTableResource(data, headers)

// Cards with actions
createCardResource(title, content, actions)

// Tool result formatting
formatToolResultWithUI(result)
```

## Comparison: mcp-ui vs Custom Implementation

| Aspect | mcp-ui Package | Our Custom Implementation |
|--------|---------------|--------------------------|
| **Framework** | Vue.js only | React/Next.js native |
| **Dependencies** | Vue runtime + dependencies | Zero external deps |
| **Bundle Size** | ~300KB (Vue + package) | ~5KB (custom code only) |
| **Compatibility** | Vue apps only | Works in ez402 |
| **Customization** | Limited to package features | Full control |
| **Maintenance** | Depends on package updates | We maintain it |
| **Security** | Package-controlled | We control sandboxing |

## Technical Architecture

### MCP-UI Data Flow

```
┌─────────────────────────────────────────────────────────┐
│  Tool Execution (lib/mcp/tools.ts)                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │  executeMCPTool()                                 │  │
│  │  └─→ formatToolResultWithUI(result)              │  │
│  │      └─→ createCardResource() / createChartResource() │
│  │          └─→ createUIResource({ uri, content })  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Tool Result Object                                      │
│  {                                                       │
│    success: true,                                        │
│    data: { ... },                                        │
│    metadata: { price, transaction },                     │
│    uiResource: { uri, content, encoding },  ◄─── MCP-UI │
│    text: "Markdown fallback"                             │
│  }                                                       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Chat Interface (components/assistant-ui)               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  ToolFallback Component                           │  │
│  │  ├─→ Check for uiResource                         │  │
│  │  └─→ <MCPUIRenderer resource={uiResource} />     │  │
│  │      └─→ Render in sandboxed iframe               │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## MCP-UI Specification Compliance

Our implementation follows the MCP-UI specification for resource structure:

```typescript
interface MCPUIResource {
  uri: string;              // Unique identifier (e.g., "ui://chart/123")
  content: {
    type: 'rawHtml' | 'externalUrl' | 'remoteDom';
    htmlString?: string;    // For rawHtml type
    url?: string;          // For externalUrl type
  };
  encoding: string;         // "text" for HTML content
}
```

This ensures compatibility with any MCP clients that expect MCP-UI resources.

## Benefits of Our Approach

### 1. **Framework Independence**
- No Vue.js dependency in a React project
- Can be adapted for other frameworks if needed

### 2. **Lightweight**
- Minimal code footprint
- No runtime overhead from Vue
- Faster page loads

### 3. **Security**
- Full control over iframe sandboxing
- Can customize security policies
- No third-party rendering logic

### 4. **Maintainability**
- Simple, understandable code
- Easy to debug and modify
- No package update breaking changes

### 5. **Customization**
- Can create any UI component we need
- Not limited by package features
- Tailored to ez402 use cases

## Future Considerations

### If a React-Based MCP-UI Package Emerges

If a React-compatible MCP-UI package becomes available in the future, we can:

1. **Evaluate compatibility** with our implementation
2. **Migrate gradually** if it provides significant benefits
3. **Keep our implementation** as a fallback

Our `createUIResource` function creates standard MCP-UI objects, so migration would mainly involve updating the renderer component.

### Extending Our Implementation

We can easily add new UI resource types:

```typescript
// Future additions
createFormResource(fields, onSubmit)
createGraphResource(nodes, edges)
createTimelineResource(events)
createMapResource(locations)
```

## Related Files

| File | Purpose |
|------|---------|
| `lib/mcp/ui-factory.ts` | UI resource creation functions |
| `components/assistant-ui/mcp-ui-renderer.tsx` | React renderer for UI resources |
| `components/assistant-ui/tool-fallback.tsx` | Tool result display with UI resources |
| `lib/mcp/tools.ts` | Tool execution with UI resource generation |
| `app/test-ui/page.tsx` | Visual test page for UI components |
| `test-ui-resources.ts` | Unit tests for UI resource creation |

## Conclusion

While the `mcp-ui` package would have been convenient, its Vue.js dependency made it incompatible with our React/Next.js stack. Our custom implementation:

- ✅ Solves the compatibility issue
- ✅ Reduces bundle size
- ✅ Gives us full control
- ✅ Maintains MCP-UI spec compliance
- ✅ Provides better security
- ✅ Is easier to maintain

This approach demonstrates that **standards matter more than libraries** - by adhering to the MCP-UI specification, we can create interoperable components without being locked into specific packages.

---

**Last Updated:** 2025-10-13
**Phase:** 4 - MCP-UI Interactive Components
**Status:** Resolved ✅
