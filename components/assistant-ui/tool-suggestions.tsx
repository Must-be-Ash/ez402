"use client";

import { useState, useEffect, useRef } from "react";
import { Lightbulb, DollarSignIcon, SearchIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Tool {
  name: string;
  description: string;
  metadata: {
    providerId: string;
    price: number;
    method: string;
  };
  inputSchema: {
    properties: Record<string, any>;
  };
}

interface ToolSuggestionsProps {
  onSelectTool: (toolPrompt: string) => void;
}

export function ToolSuggestions({ onSelectTool }: ToolSuggestionsProps) {
  const [tools, setTools] = useState<Tool[]>([]);
  const [filteredTools, setFilteredTools] = useState<Tool[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Fetch available tools on mount
  useEffect(() => {
    const fetchTools = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/mcp/tools");
        const data = await response.json();
        setTools(data.tools || []);
        setFilteredTools(data.tools || []);
      } catch (error) {
        console.error("Failed to fetch tools:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTools();
  }, []);

  // Filter tools based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTools(tools);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = tools.filter(
      (tool) =>
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.metadata.providerId.toLowerCase().includes(query)
    );
    setFilteredTools(filtered);
  }, [searchQuery, tools]);

  const handleToolClick = (tool: Tool) => {
    // Generate a prompt to use this tool
    const prompt = `Use the ${tool.name} tool to ${tool.description.toLowerCase()}`;
    onSelectTool(prompt);
    setIsOpen(false);
    setSearchQuery("");
  };

  // Quick action templates
  const quickActions = [
    {
      title: "List Available Tools",
      description: "Show me all available x402 tools",
      prompt: "What x402 tools are available and what do they do?",
    },
    {
      title: "Check Pricing",
      description: "Compare tool prices",
      prompt: "What are the prices for each available tool?",
    },
    {
      title: "Test Endpoint",
      description: "Try a sample tool call",
      prompt: "Can you test one of the available tools with sample data?",
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 text-muted-foreground hover:text-foreground"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Lightbulb className="size-4" />
        <span className="hidden sm:inline">Quick Actions</span>
      </Button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-[400px] rounded-md border bg-popover p-4 shadow-md z-50">
          <div className="flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Tool Suggestions</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
            >
              <XIcon className="size-4" />
            </Button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <SearchIcon className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-sm"
            />
          </div>

          {/* Quick Actions */}
          {!searchQuery && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Quick Actions
              </p>
              <div className="flex flex-col gap-1">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="h-auto justify-start px-3 py-2 text-left"
                    onClick={() => {
                      onSelectTool(action.prompt);
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">
                        {action.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {action.description}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Tool List */}
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Available Tools ({filteredTools.length})
            </p>
            <div className="max-h-[300px] overflow-y-auto">
              {isLoading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Loading tools...
                </div>
              ) : filteredTools.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {searchQuery
                    ? "No tools found matching your search"
                    : "No tools available"}
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {filteredTools.map((tool, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="h-auto w-full justify-start px-3 py-2 text-left hover:bg-muted"
                      onClick={() => handleToolClick(tool)}
                    >
                      <div className="flex w-full flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {tool.name}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <DollarSignIcon className="size-3" />
                            {tool.metadata.price.toFixed(4)}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {tool.description}
                        </span>
                        <div className="mt-0.5 flex items-center gap-2 text-xs">
                          <code className="rounded bg-muted px-1 py-0.5 text-xs">
                            {tool.metadata.method}
                          </code>
                          <span className="text-muted-foreground">
                            {tool.metadata.providerId}
                          </span>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
