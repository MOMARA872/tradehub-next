import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="flex items-center gap-1.5 mb-8">
        <span className="text-2xl">🔄</span>
        <span className="font-heading font-extrabold text-2xl text-foreground">TradeHub</span>
      </Link>
      {children}
    </div>
  );
}
