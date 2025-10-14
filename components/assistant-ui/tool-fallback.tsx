import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, DollarSignIcon, LoaderIcon, AlertCircleIcon, ExternalLinkIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MCPUIRenderer } from "@/components/assistant-ui/mcp-ui-renderer";
import ReactMarkdown from 'react-markdown';

export const ToolFallback: ToolCallMessagePartComponent = ({
  toolName,
  argsText,
  result,
  isLoading
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false); // Show by default for UI resources

  // Check if result contains MCP-UI resource
  const hasUIResource = result && typeof result === 'object' && 'uiResource' in result;
  const metadata = result && typeof result === 'object' && 'metadata' in result ? result.metadata as any : null;
  const hasError = result && typeof result === 'object' && 'error' in result;
  const isSuccess = result && typeof result === 'object' && 'success' in result && result.success;
  const resultText = result && typeof result === 'object' && 'text' in result ? (result as any).text : null;

  // Determine status icon and color
  const getStatusIcon = () => {
    if (isLoading) return <LoaderIcon className="size-4 text-blue-600 animate-spin" />;
    if (hasError) return <AlertCircleIcon className="size-4 text-red-600" />;
    return <CheckIcon className="size-4 text-green-600" />;
  };

  const getStatusText = () => {
    if (isLoading) return 'Calling tool';
    if (hasError) return 'Tool call failed';
    return 'Used tool';
  };

  const getBorderColor = () => {
    if (isLoading) return 'border-blue-200 bg-blue-50/50';
    if (hasError) return 'border-red-200 bg-red-50/50';
    return 'border-green-200 bg-green-50/50';
  };

  return (
    <div className={`aui-tool-fallback-root mb-4 flex w-full flex-col gap-3 rounded-lg border py-3 ${getBorderColor()}`}>
      <div className="aui-tool-fallback-header flex items-center gap-2 px-4">
        {getStatusIcon()}
        <p className="aui-tool-fallback-title flex-grow">
          {getStatusText()}: <b>{toolName}</b>
          {metadata && metadata.price !== undefined && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs bg-white border border-gray-200 rounded-full px-2 py-0.5">
              <DollarSignIcon className="size-3" />
              <span className="font-semibold">${metadata.price.toFixed(4)}</span>
              {metadata.transaction && (
                <span className="text-green-600">• Paid</span>
              )}
            </span>
          )}
        </p>
        {!isLoading && (
          <Button onClick={() => setIsCollapsed(!isCollapsed)} size="sm" variant="ghost">
            {isCollapsed ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </Button>
        )}
      </div>
      {!isCollapsed && (
        <div className="aui-tool-fallback-content flex flex-col gap-2 border-t pt-2">
          {/* Show formatted result text prominently */}
          {resultText && !hasError && (
            <div className="aui-tool-fallback-text px-4 py-3 leading-7">
              <ReactMarkdown>{resultText}</ReactMarkdown>
            </div>
          )}

          {/* Show MCP-UI resource if available */}
          {hasUIResource && (result as any).uiResource && (
            <div className="aui-tool-fallback-ui-resource px-4">
              <MCPUIRenderer resource={(result as any).uiResource} />
            </div>
          )}

          {/* Show raw data in collapsed section */}
          <details className="aui-tool-fallback-details px-4">
            <summary className="cursor-pointer text-sm font-semibold text-muted-foreground hover:text-foreground">
              View raw data
            </summary>
            <div className="aui-tool-fallback-args-root mt-2">
              <p className="text-xs font-semibold text-muted-foreground">Arguments:</p>
              <pre className="aui-tool-fallback-args-value whitespace-pre-wrap text-xs">
                {argsText}
              </pre>
            </div>
            {result !== undefined && (
              <div className="aui-tool-fallback-result-root mt-2 border-t border-dashed pt-2">
                <p className="aui-tool-fallback-result-header text-xs font-semibold text-muted-foreground">
                  Result:
                </p>
                <pre className="aui-tool-fallback-result-content whitespace-pre-wrap text-xs">
                  {typeof result === "string"
                    ? result
                    : JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </details>

          {/* Show payment info if available */}
          {metadata && (metadata.transaction || metadata.price !== undefined) && (
            <div className="px-4 pt-2 border-t bg-white rounded-b-lg">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-4">
                  {metadata.price !== undefined && (
                    <div className="flex items-center gap-1 text-xs">
                      <DollarSignIcon className="size-3 text-gray-500" />
                      <span className="font-semibold">${metadata.price.toFixed(4)} USDC</span>
                      <span className="text-gray-500">on Base</span>
                    </div>
                  )}
                  {metadata.providerId && (
                    <div className="text-xs text-gray-500">
                      Provider: <code className="bg-gray-100 px-1 rounded">{metadata.providerId}</code>
                    </div>
                  )}
                </div>
                {metadata.transaction && (
                  <a
                    href={`https://basescan.org/tx/${metadata.transaction}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
                  >
                    View transaction
                    <ExternalLinkIcon className="size-3" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
