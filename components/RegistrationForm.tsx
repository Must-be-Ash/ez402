'use client';

/**
 * Registration Form Component
 *
 * Allows API providers to register their endpoints for x402 wrapping
 * Based on PRD Section 7
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { registrationFormSchema, type RegistrationFormInput } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

export function RegistrationForm() {
  const router = useRouter();
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [testError, setTestError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RegistrationFormInput>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: {
      originalEndpoint: '',
      httpMethod: 'GET',
      requestBody: '',
      price: '',
      walletAddress: '',
      authMethod: 'header',
      authHeaderName: '',
      queryParamName: 'key',
      apiKey: '',
      curlExample: '',
      expectedResponse: '',
      description: '',
      mimeType: 'application/json',
      outputSchema: '',
      maxTimeoutSeconds: 60
    }
  });

  const authMethod = form.watch('authMethod');
  const httpMethod = form.watch('httpMethod');

  const handleTestEndpoint = async () => {
    setTestStatus('loading');
    setTestError('');

    try {
      const response = await fetch('/api/test-endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: form.getValues('originalEndpoint'),
          method: form.getValues('httpMethod'),
          authMethod: form.getValues('authMethod'),
          authHeaderName: form.getValues('authHeaderName'),
          queryParamName: form.getValues('queryParamName'),
          apiKey: form.getValues('apiKey'),
          requestBody: form.getValues('requestBody'),
          curlExample: form.getValues('curlExample'),
          expectedResponse: form.getValues('expectedResponse')
        })
      });

      const data = await response.json();

      if (data.success) {
        setTestStatus('success');
        console.log('✅ Test successful! Form validation state:', {
          isValid: form.formState.isValid,
          errors: form.formState.errors,
          isDirty: form.formState.isDirty
        });
      } else {
        setTestStatus('error');
        setTestError(data.error || 'Test failed');
      }
    } catch {
      setTestStatus('error');
      setTestError('Network error');
    }
  };

  const onSubmit = async (data: RegistrationFormInput) => {
    console.log('📝 Form submitted with data:', data);
    console.log('📋 Form errors:', form.formState.errors);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        router.push(`/success?endpoint=${encodeURIComponent(result.wrappedEndpoint)}&providerId=${result.providerId}`);
      } else {
        alert(result.error || 'Registration failed');
        setIsSubmitting(false);
      }
    } catch {
      alert('Network error. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information Section */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>General information about your API endpoint</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Firecrawl search API for web scraping" {...field} />
                  </FormControl>
                  <FormDescription>
                    Describe what your API does. This will be shown to clients.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="originalEndpoint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your API Endpoint</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://api.example.com/v1/search" {...field} />
                  </FormControl>
                  <FormDescription>
                    The original endpoint URL that will be wrapped with x402.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="httpMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>HTTP Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    HTTP method your endpoint expects
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(httpMethod === 'POST' || httpMethod === 'PUT' || httpMethod === 'DELETE') && (
              <FormField
                control={form.control}
                name="requestBody"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Request Body (JSON)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='{"model":"claude-3-5-sonnet-20241022","max_tokens":1024,"messages":[{"role":"user","content":"Hello"}]}'
                        rows={6}
                        className="font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      JSON body to send with {httpMethod} requests
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price per Request (USDC)</FormLabel>
                  <FormControl>
                    <Input placeholder="0.01" {...field} />
                  </FormControl>
                  <FormDescription>
                    How much to charge per API call in USDC. Example: 0.01 = $0.01 per request
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="walletAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receiving Wallet Address</FormLabel>
                  <FormControl>
                    <Input placeholder="0x742d35Cc6634C0532925a3b844Bc454e4438f44e" {...field} />
                  </FormControl>
                  <FormDescription>
                    Your Ethereum wallet address (Base network) where payments will be sent.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Authentication Section */}
        <Card>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>How to authenticate requests to your API</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="authMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Authentication Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select authentication method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="header">Header Authentication</SelectItem>
                      <SelectItem value="query">Query Parameter Authentication</SelectItem>
                      <SelectItem value="none">No Authentication</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {authMethod === 'header' && (
              <FormField
                control={form.control}
                name="authHeaderName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Authentication Header Name</FormLabel>
                    <FormControl>
                      <Input placeholder="X-API-Key" {...field} />
                    </FormControl>
                    <FormDescription>
                      The header name used for authentication (e.g., X-API-Key, Authorization)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {authMethod === 'query' && (
              <FormField
                control={form.control}
                name="queryParamName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Query Parameter Name</FormLabel>
                    <FormControl>
                      <Input placeholder="key" {...field} />
                    </FormControl>
                    <FormDescription>
                      The query parameter name for the API key (e.g., key, apikey, appid, token)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {authMethod !== 'none' && (
              <FormField
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Your API key" {...field} />
                    </FormControl>
                    <FormDescription>
                      🔒 Encrypted with AES-256-GCM before storage
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* Request/Response Specification Section */}
        <Card>
          <CardHeader>
            <CardTitle>Request/Response Specification</CardTitle>
            <CardDescription>Define how to call and validate your API</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="curlExample"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Example cURL Command</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="curl -X GET 'https://api.example.com/v1/search?query=test' -H 'X-API-Key: your-key'"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A working cURL command to test your endpoint
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expectedResponse"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected JSON Response</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='{"results": [], "total": 0}'
                      rows={8}
                      className="font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Example response from your API in JSON format
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={handleTestEndpoint}
                disabled={testStatus === 'loading'}
                variant={testStatus === 'success' ? 'default' : testStatus === 'error' ? 'destructive' : 'secondary'}
              >
                {testStatus === 'loading' && 'Testing...'}
                {testStatus === 'success' && '✓ Test Successful'}
                {testStatus === 'error' && '✗ Test Failed'}
                {testStatus === 'idle' && 'Test Endpoint'}
              </Button>
              {testError && <p className="text-sm text-destructive">{testError}</p>}
            </div>
          </CardContent>
        </Card>

        {/* x402 Metadata Section */}
        <Card>
          <CardHeader>
            <CardTitle>x402 Metadata</CardTitle>
            <CardDescription>Additional configuration for x402 protocol</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="mimeType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Response MIME Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="application/json">application/json</SelectItem>
                      <SelectItem value="text/html">text/html</SelectItem>
                      <SelectItem value="text/plain">text/plain</SelectItem>
                      <SelectItem value="application/xml">application/xml</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="outputSchema"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Output Schema (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='{"field": "type"}'
                      rows={6}
                      className="font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    JSON schema describing the response structure
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxTimeoutSeconds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Timeout (seconds)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={10}
                      max={300}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum time to wait for API response (10-300 seconds)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button
          type="submit"
          disabled={testStatus !== 'success' || isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? 'Registering...' : 'Register Endpoint'}
        </Button>

        {/* Button status message */}
        {testStatus !== 'success' && (
          <p className="text-sm text-center text-muted-foreground">
            ⚠️ Please test your endpoint successfully before registering
          </p>
        )}

        {/* Debug Panel - Development Only */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="bg-slate-50 dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-sm">Debug Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-xs font-mono">
                <p><strong>Test Status:</strong> {testStatus}</p>
                <p><strong>Form Valid:</strong> {form.formState.isValid ? '✅' : '❌'}</p>
                <p><strong>Is Submitting:</strong> {isSubmitting ? 'Yes' : 'No'}</p>
                <p><strong>Button Disabled:</strong> {(testStatus !== 'success' || isSubmitting) ? 'Yes' : 'No'}</p>
                {Object.keys(form.formState.errors).length > 0 && (
                  <div className="mt-2">
                    <p className="text-red-600"><strong>Form Errors:</strong></p>
                    <pre className="text-xs bg-red-50 p-2 rounded mt-1 overflow-auto max-h-40">
                      {JSON.stringify(form.formState.errors, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </Form>
  );
}
