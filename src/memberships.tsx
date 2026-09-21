import { createRoot } from "react-dom/client";
import PricingSection, { MembershipCTA, type MembershipPlan } from "@/components/ui/pricing-section";

declare global { interface Window { ABAA_MEMBERSHIPS?: MembershipPlan[] } }
const plans = window.ABAA_MEMBERSHIPS;
const root = document.querySelector('[data-memberships]');
if (root && plans?.length) {
  root.classList.remove('member-plans');
  createRoot(root).render(<PricingSection plans={plans} />);
  const openPlan = [...plans].sort((a, b) => a.order - b.order).find(plan => plan.available);
  document.querySelectorAll('[data-membership-status]').forEach(node => {
    node.textContent = openPlan ? 'Demandes d’adhésion ouvertes' : 'Bientôt disponible';
  });
  document.querySelectorAll<HTMLElement>('[data-membership-preview]').forEach(node => { node.hidden = !!openPlan; });
  document.querySelectorAll<HTMLElement>('[data-membership-open]').forEach(node => { node.hidden = !openPlan; });
  const closing = document.querySelector('[data-membership-closing-cta]');
  if (closing) createRoot(closing).render(<MembershipCTA plan={openPlan} />);
}
