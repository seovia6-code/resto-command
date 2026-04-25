import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Command Center" }] }),
  component: SettingsPage,
});

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function SettingsPage() {
  return (
    <AppLayout title="Settings">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-5xl">
        <Section title="Restaurant Profile" desc="Visible to customers in AI replies.">
          <div className="grid gap-1.5">
            <Label htmlFor="name">Restaurant name</Label>
            <Input id="name" defaultValue="Spice Garden" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="phone">Contact number</Label>
            <Input id="phone" defaultValue="+91 98201 11023" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="addr">Address</Label>
            <Textarea id="addr" defaultValue="221B Hill Road, Bandra West, Mumbai" />
          </div>
        </Section>

        <Section title="AI Agent" desc="Tune the assistant's behavior.">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Auto-confirm bookings</p>
              <p className="text-xs text-muted-foreground">Skip manual approval if a table is free.</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">WhatsApp replies</p>
              <p className="text-xs text-muted-foreground">Let AI reply to chats automatically.</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Voice call answering</p>
              <p className="text-xs text-muted-foreground">AI picks up missed and after-hours calls.</p>
            </div>
            <Switch defaultChecked />
          </div>
        </Section>

        <Section title="Hours" desc="Operating hours used by AI replies.">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Opens at</Label>
              <Input type="time" defaultValue="11:00" />
            </div>
            <div className="grid gap-1.5">
              <Label>Closes at</Label>
              <Input type="time" defaultValue="23:30" />
            </div>
          </div>
        </Section>

        <Section title="Notifications" desc="How you'd like to be alerted.">
          <div className="flex items-center justify-between">
            <p className="text-sm">Daily summary email</p>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm">Failed request alerts</p>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm">New booking push</p>
            <Switch />
          </div>
        </Section>

        <div className="lg:col-span-2 flex justify-end">
          <Button>Save changes</Button>
        </div>
      </div>
    </AppLayout>
  );
}
