import type { Notification } from "@/lib/types";

export const NOTIFICATIONS: Notification[] = [
  { id: "notif001", userId: "user001", icon: "💬", text: "New message from Jake Thompson about your vintage camera", link: "/messages", read: false, createdAt: "2025-01-18T14:30:00" },
  { id: "notif002", userId: "user001", icon: "🤝", text: 'Your offer on "Mountain Bike" was accepted!', link: "/offers", read: false, createdAt: "2025-01-18T12:15:00" },
  { id: "notif003", userId: "user001", icon: "⭐", text: "Maria Garcia left you a 5-star review", link: "/reviews", read: false, createdAt: "2025-01-17T18:45:00" },
  { id: "notif004", userId: "user001", icon: "📦", text: 'Your listing "Handmade Pottery Set" got 5 new views', link: "/analytics", read: true, createdAt: "2025-01-17T10:20:00" },
  { id: "notif005", userId: "user001", icon: "🔔", text: 'New listing matches your saved search "vintage electronics"', link: "/saved-searches", read: true, createdAt: "2025-01-16T09:00:00" },
];
