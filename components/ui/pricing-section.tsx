"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TimelineContent } from "@/components/ui/timeline-animation";
import type { Variants } from "motion/react";

export type MembershipPlan = {
  id: string; name: string; amount: number; amountLabel: string; amountNote?: string;
  description: string; benefits: string[];
  cardVisual: string; cardAlt: string; available: boolean; featured?: boolean; order: number;
  cta: { label: string; pendingLabel: string; href: string };
};

/** Courbe « luxe » : sortie longue et sans rebond, comme les transitions du site. */
const luxeEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* Mise au point progressive : le voile se lève niveau par niveau, sans glissement brusque. */
const revealVariants: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(8px)" },
  visible: (i: number) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.12, duration: 0.8, ease: luxeEase },
  }),
};

export function MembershipCTA({ plan }: { plan?: MembershipPlan }) {
  return plan?.available
    ? <a className="btn btn-line member-cta" href={plan.cta.href} aria-label={`${plan.cta.label} — ${plan.name}`}>{plan.cta.label}</a>
    : <button className="btn btn-line member-cta" type="button" disabled aria-describedby="membership-availability">{plan?.cta.pendingLabel ?? "Bientôt disponible"}</button>;
}
export default function PricingSection({ plans }: { plans: readonly MembershipPlan[] }) {
  return <div className="member-plans">{[...plans].sort((a, b) => a.order - b.order).map((plan, index) =>
    <TimelineContent key={plan.id} id={plan.id} animationNum={index} customVariants={revealVariants}
      className={plan.featured ? "member-plan is-featured" : "member-plan"} aria-labelledby={`${plan.id}-title`}>
      <Card className="member-card border-0 bg-transparent shadow-none">
        <img src={plan.cardVisual} alt={plan.cardAlt} width={1081} height={708} loading="lazy" decoding="async" />
      </Card>
      <div className="member-plan-body">
        <CardHeader className="p-0 space-y-0">
          <span className="member-plan-head">
            <span className="member-level">Niveau {String(plan.order).padStart(2, "0")}</span>
            {!plan.available && <span className="member-flag">{plan.cta.pendingLabel}</span>}
          </span>
          <h3 className="member-plan-title" id={`${plan.id}-title`}>{plan.name}</h3>
          {/* Libellé imprimé sur la carte : ce montant est un crédit, pas un tarif d'adhésion. */}
          <p className="member-amount-label">{plan.amountLabel}</p>
          <p className="member-price">{new Intl.NumberFormat("fr-FR").format(plan.amount)}<span> FCFA</span></p>
          {plan.amountNote && <p className="member-amount-note">{plan.amountNote}</p>}
          <p className="member-description">{plan.description}</p>
        </CardHeader>
        <CardContent className="p-0 flex flex-col flex-1">
          <div className="member-benefits">
            <h4>Privilèges membres</h4>
            {plan.benefits.length ? <ul>{plan.benefits.map(benefit => <li key={benefit}>{benefit}</li>)}</ul>
              : <p>Les privilèges de cette formule seront précisés à l’ouverture du programme.</p>}
          </div>
          <MembershipCTA plan={plan} />
        </CardContent>
      </div>
    </TimelineContent>
  )}</div>;
}
