import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="grid min-h-screen place-items-center px-4 py-16">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
