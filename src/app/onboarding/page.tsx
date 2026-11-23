import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { getOnboardingCatalog } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.preferences?.onboardingCompleted) redirect("/home");

  const catalog = await getOnboardingCatalog();
  return <OnboardingWizard genres={catalog.genres} titles={catalog.titles} />;
}
