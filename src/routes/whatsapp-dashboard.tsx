import { createFileRoute } from "@tanstack/react-router";
import Dashboard from "@/pages/Dashboard";

export const Route = createFileRoute("/whatsapp-dashboard")({
  component: Dashboard,
});
