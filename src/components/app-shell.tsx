import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { MobileNav } from "@/components/mobile-nav";
import { SiteHeader } from "@/components/site-header";
import { getUnreadNotificationCount } from "@/lib/queries";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.preferences?.onboardingCompleted) redirect("/onboarding");
  const unreadNotifications = await getUnreadNotificationCount(user.id);

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <SiteHeader name={user.name} avatar={user.image} unreadNotifications={unreadNotifications} />
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
      <MobileNav />
    </div>
  );
}
