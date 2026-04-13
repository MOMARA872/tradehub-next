import { Mailbox, Search, Package, MessageSquare, Lock, Star, type LucideIcon } from "lucide-react";

const EMPTY_ICONS: Record<string, LucideIcon> = {
  Mailbox,
  Search,
  Package,
  MessageSquare,
  Lock,
  Star,
};

export function EmptyState({ message, icon = "Mailbox" }: { message: string; icon?: string }) {
  const Icon = EMPTY_ICONS[icon] ?? Mailbox;
  return (
    <div className="flex flex-col items-center justify-center py-16 opacity-60">
      <div className="mb-4"><Icon className="h-12 w-12 text-muted" /></div>
      <p className="text-muted">{message}</p>
    </div>
  );
}
