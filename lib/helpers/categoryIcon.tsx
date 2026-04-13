import {
  Briefcase,
  RefreshCw,
  Handshake,
  Wrench,
  FileText,
  Ticket,
  Users,
  Megaphone,
  Gift,
  FolderOpen,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Briefcase,
  RefreshCw,
  Handshake,
  Wrench,
  FileText,
  Ticket,
  Users,
  Megaphone,
  Gift,
  FolderOpen,
};

export function CategoryIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name];
  if (!Icon) return null;
  return <Icon className={className} />;
}
