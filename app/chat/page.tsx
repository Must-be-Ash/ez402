/**
 * Chat Page
 *
 * AI chat interface with Claude integration and MCP tools
 * Uses assistant-ui for the chat UI components
 */

import { Assistant } from '@/app/assistant';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Chat - ez402',
  description: 'Chat with Claude AI and interact with x402 endpoints via MCP tools',
};

export default function ChatPage() {
  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-border bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">ez402 AI Chat</h1>
            <p className="text-sm text-muted-foreground">
              Powered by Claude with x402 MCP tools
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Home
            </a>
            <a
              href="/register"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Register Endpoint
            </a>
          </div>
        </div>
      </header>

      {/* Chat Interface */}
      <main className="flex-1 min-h-0">
        <Assistant />
      </main>
    </div>
  );
}
