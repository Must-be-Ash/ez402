"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import {
  AssistantChatTransport,
  useChatRuntime,
} from "@assistant-ui/react-ai-sdk";
import { Thread } from "@/components/assistant-ui/thread";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Chat Interface Error</h2>
        <p className="text-muted-foreground mb-4">
          There was an issue with the chat interface. This is likely a temporary issue with tool call arguments.
        </p>
        <div className="space-x-2">
          <button 
            onClick={resetErrorBoundary}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
          >
            Refresh Page
          </button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-muted-foreground">Error Details</summary>
            <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

export const Assistant = () => {
  const runtime = useChatRuntime({
    transport: new AssistantChatTransport({
      api: "/api/chat",
    }),
  });

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Assistant UI Error:', error, errorInfo);
      }}
    >
      <AssistantRuntimeProvider runtime={runtime}>
        <div className="grid h-full grid-cols-[200px_1fr] gap-x-2 px-4 py-4">
          <ThreadList />
          <Thread />
        </div>
      </AssistantRuntimeProvider>
    </ErrorBoundary>
  );
};
