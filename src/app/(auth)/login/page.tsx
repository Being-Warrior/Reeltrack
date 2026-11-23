import { Suspense } from "react";
import { LoginForm } from "@/components/auth-forms";

export default function LoginPage() {
  const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  return (
    <div className="grid min-h-screen place-items-center px-4 py-16">
      <Suspense>
        <LoginForm googleEnabled={googleEnabled} />
      </Suspense>
    </div>
  );
}
