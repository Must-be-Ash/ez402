/**
 * MCP-UI Renderer Component
 *
 * Renders MCP-UI resources in the chat interface
 * Supports HTML, external URLs, and interactive components
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { isMCPUIResource } from '@/lib/mcp/ui-factory';

interface MCPUIResource {
  uri: string;
  content: {
    type: 'rawHtml' | 'externalUrl' | 'remoteDom';
    htmlString?: string;
    url?: string;
  };
  encoding: string;
}

interface MCPUIRendererProps {
  resource: unknown;
  className?: string;
}

/**
 * MCP-UI Renderer Component
 *
 * Renders MCP-UI resources with proper sandboxing and security
 */
export function MCPUIRenderer({ resource, className = '' }: MCPUIRendererProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Validate resource - must be done after all hooks
  const isValid = isMCPUIResource(resource);
  const uiResource = isValid ? (resource as MCPUIResource) : null;

  useEffect(() => {
    if (!uiResource) return;
    if (uiResource.content.type === 'rawHtml' && iframeRef.current) {
      try {
        const iframe = iframeRef.current;
        const doc = iframe.contentDocument || iframe.contentWindow?.document;

        if (doc) {
          doc.open();
          doc.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  body {
                    margin: 0;
                    padding: 0;
                    font-family: system-ui, -apple-system, sans-serif;
                  }
                </style>
              </head>
              <body>
                ${uiResource.content.htmlString || ''}
              </body>
            </html>
          `);
          doc.close();

          // Adjust iframe height based on content
          const resizeIframe = () => {
            if (doc.body) {
              const height = doc.body.scrollHeight;
              iframe.style.height = `${height + 20}px`;
            }
          };

          // Resize after content loads
          setTimeout(resizeIframe, 100);
          doc.addEventListener('DOMContentLoaded', resizeIframe);
        }
      } catch (err) {
        setError('Failed to render HTML content');
        console.error('MCP-UI render error:', err);
      }
    }
  }, [uiResource]);

  // Return error UI if resource is invalid
  if (!isValid || !uiResource) {
    return (
      <div className="rounded border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
        ⚠️ Invalid MCP-UI resource
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
        ❌ {error}
      </div>
    );
  }

  // Render based on content type
  switch (uiResource.content.type) {
    case 'rawHtml':
      return (
        <div className={`mcp-ui-container ${className}`}>
          <iframe
            ref={iframeRef}
            sandbox="allow-same-origin"
            className="w-full rounded border border-gray-200"
            style={{ minHeight: '100px' }}
            title={`MCP-UI: ${uiResource.uri}`}
          />
        </div>
      );

    case 'externalUrl':
      return (
        <div className={`mcp-ui-container ${className}`}>
          <iframe
            src={uiResource.content.url}
            sandbox="allow-scripts allow-same-origin"
            className="h-96 w-full rounded border border-gray-200"
            title={`MCP-UI: ${uiResource.uri}`}
          />
        </div>
      );

    case 'remoteDom':
      return (
        <div className="rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          ℹ️ Remote DOM components not yet implemented
        </div>
      );

    default:
      return (
        <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
          Unknown UI resource type
        </div>
      );
  }
}

/**
 * Hook to check if content contains MCP-UI resource
 */
export function useMCPUIResource(content: unknown): MCPUIResource | null {
  if (isMCPUIResource(content)) {
    return content as MCPUIResource;
  }
  return null;
}
