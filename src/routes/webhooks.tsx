import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check, ExternalLink, KeyRound, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { sendTestVapiWebhook, sendTestWhatsAppWebhook } from "@/lib/test-webhook";

type TestResult = {
  ok: boolean;
  status: number;
  statusText: string;
  body: string;
  url: string;
  durationMs: number;
  secretConfigured: boolean;
};

export const Route = createFileRoute("/webhooks")({
  head: () => ({ meta: [{ title: "Webhooks — Command Center" }] }),
  component: WebhooksPage,
});

const VAPI_WEBHOOK_URL = "https://resto-command.lovable.app/api/public/vapi-webhook";
const WHATSAPP_WEBHOOK_URL = "https://resto-command.lovable.app/api/public/whatsapp-webhook";

function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`${label} copied`);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="flex gap-2">
      <Input readOnly value={value} className="font-mono text-xs" />
      <Button type="button" variant="outline" size="icon" onClick={onCopy} title={`Copy ${label}`}>
        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}

function WebhooksPage() {
  return (
    <AppLayout title="Webhooks">
      <div className="max-w-3xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              VAPI Webhook
            </CardTitle>
            <CardDescription>
              Paste this URL into your VAPI assistant's Server URL setting and add the
              authentication header below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Server URL (POST)</Label>
              <CopyField value={VAPI_WEBHOOK_URL} label="VAPI URL" />
            </div>

            <div className="space-y-2">
              <Label>Custom header name</Label>
              <CopyField value="x-vapi-secret" label="Header name" />
            </div>

            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
              <div className="flex items-start gap-3">
                <KeyRound className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium">Header value: copy your <code className="px-1 py-0.5 rounded bg-muted text-xs">VAPI_WEBHOOK_SECRET</code></p>
                  <p className="text-muted-foreground">
                    Open your backend secrets, find <strong>VAPI_WEBHOOK_SECRET</strong>, and copy
                    its <strong>exact</strong> value (no spaces, no quotes) into the
                    <code className="mx-1 px-1 py-0.5 rounded bg-muted text-xs">x-vapi-secret</code>
                    header in VAPI. The webhook rejects requests with a mismatched value.
                  </p>
                  <a
                    href="https://dashboard.vapi.ai/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Open VAPI dashboard <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>

            <ol className="list-decimal pl-5 space-y-1.5 text-sm text-muted-foreground">
              <li>In VAPI, open your assistant → <strong>Server</strong> settings.</li>
              <li>Set <strong>Server URL</strong> to the URL above (POST).</li>
              <li>Add a custom header: name <code className="px-1 rounded bg-muted text-xs">x-vapi-secret</code>, value = your <code className="px-1 rounded bg-muted text-xs">VAPI_WEBHOOK_SECRET</code>.</li>
              <li>Save, then trigger a test call. New entries will appear in <strong>Call Logs</strong>.</li>
            </ol>

            <TestWebhookPanel
              title="Send test webhook"
              description="Posts a sample payload to your VAPI endpoint using the configured secret."
              missingSecretLabel="VAPI_WEBHOOK_SECRET not set on server"
              runTest={sendTestVapiWebhook}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>WhatsApp Webhook</CardTitle>
            <CardDescription>Endpoint for incoming WhatsApp messages.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Webhook URL (POST)</Label>
              <CopyField value={WHATSAPP_WEBHOOK_URL} label="WhatsApp URL" />
            </div>

            <div className="space-y-2">
              <Label>Custom header name</Label>
              <CopyField value="x-whatsapp-secret" label="Header name" />
            </div>

            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
              <div className="flex items-start gap-3">
                <KeyRound className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
                <p className="text-muted-foreground">
                  Header value: copy your{" "}
                  <code className="px-1 py-0.5 rounded bg-muted text-xs">
                    WHATSAPP_WEBHOOK_SECRET
                  </code>{" "}
                  from backend secrets and send it as the{" "}
                  <code className="px-1 py-0.5 rounded bg-muted text-xs">
                    x-whatsapp-secret
                  </code>{" "}
                  header.
                </p>
              </div>
            </div>

            <TestWebhookPanel
              title="Send test WhatsApp message"
              description="Posts a sample WhatsApp payload to your endpoint using the configured secret."
              missingSecretLabel="WHATSAPP_WEBHOOK_SECRET not set on server"
              runTest={sendTestWhatsAppWebhook}
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function statusTone(status: number) {
  if (status === 0) return "bg-muted text-foreground border";
  if (status >= 200 && status < 300) return "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30";
  if (status >= 400 && status < 500) return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30";
  return "bg-destructive/15 text-destructive border-destructive/30";
}

function TestWebhookPanel({
  title,
  description,
  missingSecretLabel,
  runTest,
}: {
  title: string;
  description: string;
  missingSecretLabel: string;
  runTest: typeof sendTestVapiWebhook | typeof sendTestWhatsAppWebhook;
}) {
  const sendTest = useServerFn(runTest);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const onClick = async () => {
    setLoading(true);
    try {
      const res = await sendTest();
      setResult(res);
      if (res.ok) toast.success(`Webhook responded ${res.status}`);
      else toast.error(`Webhook responded ${res.status || "error"}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Test failed: ${message}`);
      setResult({
        ok: false,
        status: 0,
        statusText: "Client error",
        body: message,
        url: "",
        durationMs: 0,
        secretConfigured: false,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Button type="button" onClick={onClick} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending…
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" /> Send test
            </>
          )}
        </Button>
      </div>

      {result && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded border font-mono ${statusTone(result.status)}`}
            >
              {result.status || "ERR"} {result.statusText}
            </span>
            <span className="text-muted-foreground">{result.durationMs} ms</span>
            {!result.secretConfigured && (
              <span className="text-amber-600 dark:text-amber-400">
                ⚠ {missingSecretLabel}
              </span>
            )}
          </div>
          {result.body && (
            <pre className="text-xs bg-background border rounded p-2 overflow-x-auto max-h-40 whitespace-pre-wrap break-all">
              {result.body}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
