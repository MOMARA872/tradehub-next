import Link from "next/link";
import { RefreshCw } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="flex items-center gap-1.5 mb-8">
        <RefreshCw className="h-6 w-6" />
        <span className="font-heading font-extrabold text-2xl text-foreground">TradeHub</span>
      </Link>
      {children}
    </div>
  );
}
