import PricingSection, { type MembershipPlan } from "@/components/ui/pricing-section";
export default function DemoOne({ plans }: { plans: MembershipPlan[] }) {
  return <PricingSection plans={plans} />;
}
