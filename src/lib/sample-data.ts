export const stats = {
  totalCalls: 1284,
  totalWhatsApp: 2156,
  totalBookings: 487,
  totalOrders: 932,
  totalRevenue: 48230,
  failedRequests: 27,
};

export const callVsWhatsApp = [
  { day: "Mon", calls: 142, whatsapp: 220 },
  { day: "Tue", calls: 168, whatsapp: 245 },
  { day: "Wed", calls: 155, whatsapp: 268 },
  { day: "Thu", calls: 189, whatsapp: 295 },
  { day: "Fri", calls: 234, whatsapp: 380 },
  { day: "Sat", calls: 256, whatsapp: 412 },
  { day: "Sun", calls: 198, whatsapp: 336 },
];

export const dailyBookings = [
  { day: "Mon", bookings: 48 },
  { day: "Tue", bookings: 56 },
  { day: "Wed", bookings: 62 },
  { day: "Thu", bookings: 71 },
  { day: "Fri", bookings: 92 },
  { day: "Sat", bookings: 105 },
  { day: "Sun", bookings: 83 },
];

export const dailyOrders = [
  { day: "Mon", orders: 98 },
  { day: "Tue", orders: 112 },
  { day: "Wed", orders: 124 },
  { day: "Thu", orders: 138 },
  { day: "Fri", orders: 172 },
  { day: "Sat", orders: 195 },
  { day: "Sun", orders: 156 },
];

export const dailyRevenue = [
  { day: "Mon", revenue: 4200 },
  { day: "Tue", revenue: 5100 },
  { day: "Wed", revenue: 5800 },
  { day: "Thu", revenue: 6400 },
  { day: "Fri", revenue: 8900 },
  { day: "Sat", revenue: 9800 },
  { day: "Sun", revenue: 8030 },
];

export type Booking = {
  id: string;
  name: string;
  phone: string;
  guests: number;
  date: string;
  time: string;
  status: "confirmed" | "pending" | "cancelled";
  source: "Call" | "WhatsApp" | "Web";
};

export const bookings: Booking[] = [
  { id: "B-1042", name: "Aarav Sharma", phone: "+91 98201 11023", guests: 4, date: "2026-04-25", time: "20:00", status: "confirmed", source: "WhatsApp" },
  { id: "B-1041", name: "Priya Patel", phone: "+91 98765 22310", guests: 2, date: "2026-04-25", time: "19:30", status: "confirmed", source: "Call" },
  { id: "B-1040", name: "Rohan Mehta", phone: "+91 99876 54231", guests: 6, date: "2026-04-25", time: "21:00", status: "pending", source: "WhatsApp" },
  { id: "B-1039", name: "Neha Kapoor", phone: "+91 90123 45678", guests: 3, date: "2026-04-26", time: "13:00", status: "confirmed", source: "Web" },
  { id: "B-1038", name: "Vikram Singh", phone: "+91 91234 56789", guests: 8, date: "2026-04-26", time: "20:30", status: "cancelled", source: "Call" },
  { id: "B-1037", name: "Ananya Iyer", phone: "+91 99001 23456", guests: 2, date: "2026-04-26", time: "19:00", status: "confirmed", source: "WhatsApp" },
  { id: "B-1036", name: "Karan Desai", phone: "+91 98109 87654", guests: 5, date: "2026-04-27", time: "20:00", status: "pending", source: "Call" },
];

export type Order = {
  id: string;
  customer: string;
  items: number;
  total: number;
  type: "Dine-in" | "Takeaway" | "Delivery";
  status: "preparing" | "ready" | "delivered" | "cancelled";
  time: string;
};

export const orders: Order[] = [
  { id: "O-5821", customer: "Aarav Sharma", items: 4, total: 1240, type: "Dine-in", status: "preparing", time: "12 min ago" },
  { id: "O-5820", customer: "Sneha Rao", items: 2, total: 580, type: "Delivery", status: "ready", time: "18 min ago" },
  { id: "O-5819", customer: "Manish Gupta", items: 6, total: 2150, type: "Dine-in", status: "delivered", time: "32 min ago" },
  { id: "O-5818", customer: "Pooja Verma", items: 3, total: 890, type: "Takeaway", status: "ready", time: "41 min ago" },
  { id: "O-5817", customer: "Rahul Joshi", items: 1, total: 320, type: "Delivery", status: "delivered", time: "1 hr ago" },
  { id: "O-5816", customer: "Divya Nair", items: 5, total: 1680, type: "Dine-in", status: "cancelled", time: "1 hr ago" },
  { id: "O-5815", customer: "Aditya Bose", items: 2, total: 740, type: "Delivery", status: "delivered", time: "2 hrs ago" },
];

export type Call = {
  id: string;
  caller: string;
  phone: string;
  duration: string;
  intent: "Booking" | "Order" | "Enquiry" | "Complaint";
  outcome: "Resolved" | "Booked" | "Missed" | "Failed";
  time: string;
};

export const calls: Call[] = [
  { id: "C-9012", caller: "Aarav Sharma", phone: "+91 98201 11023", duration: "2m 14s", intent: "Booking", outcome: "Booked", time: "5 min ago" },
  { id: "C-9011", caller: "Unknown", phone: "+91 99999 88123", duration: "0m 18s", intent: "Enquiry", outcome: "Missed", time: "22 min ago" },
  { id: "C-9010", caller: "Priya Patel", phone: "+91 98765 22310", duration: "1m 47s", intent: "Order", outcome: "Resolved", time: "38 min ago" },
  { id: "C-9009", caller: "Vikram Singh", phone: "+91 91234 56789", duration: "3m 02s", intent: "Complaint", outcome: "Resolved", time: "1 hr ago" },
  { id: "C-9008", caller: "Karan Desai", phone: "+91 98109 87654", duration: "0m 52s", intent: "Booking", outcome: "Failed", time: "2 hrs ago" },
  { id: "C-9007", caller: "Neha Kapoor", phone: "+91 90123 45678", duration: "1m 33s", intent: "Enquiry", outcome: "Resolved", time: "3 hrs ago" },
];

export type Chat = {
  id: string;
  contact: string;
  phone: string;
  lastMessage: string;
  intent: "Booking" | "Order" | "Enquiry" | "Menu";
  status: "Active" | "Resolved" | "Pending";
  time: string;
};

export const chats: Chat[] = [
  { id: "W-7721", contact: "Ananya Iyer", phone: "+91 99001 23456", lastMessage: "Table booked for 2 at 7 PM ✅", intent: "Booking", status: "Resolved", time: "2 min ago" },
  { id: "W-7720", contact: "Rohan Mehta", phone: "+91 99876 54231", lastMessage: "Can I get the dessert menu?", intent: "Menu", status: "Active", time: "8 min ago" },
  { id: "W-7719", contact: "Sneha Rao", phone: "+91 98876 12345", lastMessage: "Order placed — paneer tikka x2", intent: "Order", status: "Resolved", time: "24 min ago" },
  { id: "W-7718", contact: "Pooja Verma", phone: "+91 97000 11223", lastMessage: "Do you have outdoor seating?", intent: "Enquiry", status: "Pending", time: "45 min ago" },
  { id: "W-7717", contact: "Aditya Bose", phone: "+91 96123 45678", lastMessage: "Order delivered, thank you!", intent: "Order", status: "Resolved", time: "1 hr ago" },
  { id: "W-7716", contact: "Divya Nair", phone: "+91 95432 11098", lastMessage: "Need to cancel my booking", intent: "Booking", status: "Pending", time: "2 hrs ago" },
];
