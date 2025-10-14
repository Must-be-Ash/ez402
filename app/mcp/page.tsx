/**
 * MCP Deployment Dashboard
 *
 * View and manage deployed MCP servers
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  RefreshCwIcon,
  ExternalLinkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PlusIcon,
  TrashIcon
} from 'lucide-react';

interface MCPDeployment {
  serverId: string;
  serverName: string;
  deploymentUrl?: string;
  deploymentStatus: 'pending' | 'deployed' | 'failed';
  transportType: 'stdio' | 'http';
  registeredTools: string[];
  lastDeployedAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export default function MCPDashboard() {
  const [deployments, setDeployments] = useState<MCPDeployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeploying, setRedeploying] = useState<string | null>(null);

  // Fetch deployments
  const fetchDeployments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/mcp/deploy');
      const data = await response.json();

      if (data.success) {
        setDeployments(data.deployments);
      }
    } catch (error) {
      console.error('Failed to fetch deployments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Redeploy server
  const handleRedeploy = async (serverId: string) => {
    try {
      setRedeploying(serverId);

      const response = await fetch('/api/mcp/redeploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId })
      });

      const data = await response.json();

      if (data.success) {
        // Refresh deployments
        await fetchDeployments();
      } else {
        alert(`Redeployment failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Redeploy error:', error);
      alert('Redeployment failed');
    } finally {
      setRedeploying(null);
    }
  };

  // Delete deployment
  const handleDelete = async (serverId: string) => {
    if (!confirm(`Are you sure you want to delete deployment ${serverId}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/mcp/deploy?serverId=${serverId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        await fetchDeployments();
      } else {
        alert(`Deletion failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Deletion failed');
    }
  };

  // Load on mount
  useEffect(() => {
    fetchDeployments();
  }, []);

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
      deployed: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      failed: 'bg-red-100 text-red-800 border-red-200'
    };

    const icons = {
      deployed: <CheckCircleIcon className="w-3 h-3" />,
      pending: <ClockIcon className="w-3 h-3" />,
      failed: <XCircleIcon className="w-3 h-3" />
    };

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
          styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800 border-gray-200'
        }`}
      >
        {icons[status as keyof typeof icons]}
        {status}
      </span>
    );
  };

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">MCP Deployments</h1>
          <p className="text-gray-600 mt-1">Manage your deployed MCP servers</p>
        </div>

        <div className="flex gap-2">
          <Button onClick={fetchDeployments} variant="outline" disabled={loading}>
            <RefreshCwIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Link href="/mcp/new">
            <Button>
              <PlusIcon className="w-4 h-4 mr-2" />
              New Deployment
            </Button>
          </Link>
        </div>
      </div>

      {/* Deployments List */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCwIcon className="w-8 h-8 mx-auto animate-spin text-gray-400 mb-2" />
          <p className="text-gray-500">Loading deployments...</p>
        </div>
      ) : deployments.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <p className="text-gray-500 mb-4">No deployments found</p>
          <Link href="/mcp/new">
            <Button>
              <PlusIcon className="w-4 h-4 mr-2" />
              Create your first deployment
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {deployments.map(deployment => (
            <div
              key={deployment.serverId}
              className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{deployment.serverName}</h3>
                    <StatusBadge status={deployment.deploymentStatus} />
                    <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                      {deployment.transportType}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">
                    Server ID: <code className="bg-gray-100 px-1.5 py-0.5 rounded">{deployment.serverId}</code>
                  </p>

                  {/* Deployment URL */}
                  {deployment.deploymentUrl && (
                    <div className="flex items-center gap-2 mb-3">
                      <a
                        href={deployment.deploymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                      >
                        {deployment.deploymentUrl}
                        <ExternalLinkIcon className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {/* Registered Tools */}
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-1">
                      Registered Tools: <span className="font-semibold">{deployment.registeredTools.length}</span>
                    </p>
                    {deployment.registeredTools.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {deployment.registeredTools.slice(0, 5).map(tool => (
                          <span
                            key={tool}
                            className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded"
                          >
                            {tool}
                          </span>
                        ))}
                        {deployment.registeredTools.length > 5 && (
                          <span className="text-xs text-gray-500 px-2 py-0.5">
                            +{deployment.registeredTools.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Error Message */}
                  {deployment.errorMessage && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                      <p className="text-sm text-red-800">
                        <strong>Error:</strong> {deployment.errorMessage}
                      </p>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>
                      Created: {new Date(deployment.createdAt).toLocaleString()}
                    </span>
                    {deployment.lastDeployedAt && (
                      <span>
                        Last deployed: {new Date(deployment.lastDeployedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 ml-4">
                  <Button
                    onClick={() => handleRedeploy(deployment.serverId)}
                    variant="outline"
                    size="sm"
                    disabled={redeploying === deployment.serverId}
                  >
                    <RefreshCwIcon
                      className={`w-4 h-4 mr-1 ${
                        redeploying === deployment.serverId ? 'animate-spin' : ''
                      }`}
                    />
                    Redeploy
                  </Button>

                  <Button
                    onClick={() => handleDelete(deployment.serverId)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <TrashIcon className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">About MCP Deployments</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• MCP servers are deployed to Cloudflare Workers or Google Cloud Run</li>
          <li>• Deployments automatically include all registered x402 endpoints as tools</li>
          <li>• Use the redeploy button to update a server with new endpoints</li>
          <li>• Deployed servers can be accessed via HTTP/SSE for remote MCP clients</li>
        </ul>
      </div>
    </div>
  );
}
