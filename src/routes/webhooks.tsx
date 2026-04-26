import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check, ExternalLink, KeyRound } from "lucide-react";
import { toast } from "sonner";

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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>WhatsApp Webhook</CardTitle>
            <CardDescription>Endpoint for incoming WhatsApp messages.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label>Webhook URL (POST)</Label>
            <CopyField value={WHATSAPP_WEBHOOK_URL} label="WhatsApp URL" />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
