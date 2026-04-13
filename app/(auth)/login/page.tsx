import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

function LoginSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-sm space-y-4">
        <div className="h-8 w-32 bg-surface2 rounded animate-pulse mx-auto" />
        <div className="h-10 bg-surface2 rounded animate-pulse" />
        <div className="h-10 bg-surface2 rounded animate-pulse" />
        <div className="h-10 bg-surface2 rounded animate-pulse" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}
