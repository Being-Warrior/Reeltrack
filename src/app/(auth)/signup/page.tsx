import { SignupForm } from "@/components/signup-form";

export default function SignupPage() {
  const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  return (
    <div className="grid min-h-screen place-items-center px-4 py-16">
      <SignupForm googleEnabled={googleEnabled} />
    </div>
  );
}
