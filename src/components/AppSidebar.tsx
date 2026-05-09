import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CalendarCheck,
  ShoppingBag,
  PhoneCall,
  MessageCircle,
  MessagesSquare,
  BarChart3,
  Settings,
  ChefHat,
  Webhook,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Bookings", url: "/bookings", icon: CalendarCheck },
  { title: "Orders", url: "/orders", icon: ShoppingBag },
  { title: "Call Logs", url: "/calls", icon: PhoneCall },
  { title: "WhatsApp Chats", url: "/chats", icon: MessageCircle },
  { title: "WhatsApp Dashboard", url: "/whatsapp-dashboard", icon: MessagesSquare },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Webhooks", url: "/webhooks", icon: Webhook },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <ChefHat className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">Command Center</span>
              <span className="text-xs text-muted-foreground">AI Restaurant</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                    >
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
