"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TimelineContent } from "@/components/ui/timeline-animation";

export type MembershipPlan = {
  id: string; name: string; price: number; description: string; benefits: string[];
  cardVisual: string; cardAlt: string; available: boolean; featured?: boolean; order: number;
  cta: { label: string; pendingLabel: string; href: string };
};
export function MembershipCTA({ plan }: { plan?: MembershipPlan }) {
  return plan?.available
    ? <a className="btn btn-line member-cta" href={plan.cta.href} aria-label={`${plan.cta.label} — ${plan.name}`}>{plan.cta.label}</a>
    : <button className="btn btn-line member-cta" type="button" disabled aria-describedby="membership-availability">{plan?.cta.pendingLabel ?? "Bientôt disponible"}</button>;
}
export default function PricingSection({ plans }: { plans: readonly MembershipPlan[] }) {
  return <div className="member-plans">{[...plans].sort((a, b) => a.order - b.order).map((plan, index) =>
    <TimelineContent key={plan.id} id={plan.id} animationNum={index} className="member-plan" aria-labelledby={`${plan.id}-title`}>
      <Card className="member-card border-0 bg-transparent shadow-none">
        <img src={plan.cardVisual} alt={plan.cardAlt} width={624} height={405} loading="lazy" decoding="async" />
      </Card>
      <div className="member-plan-body">
        <CardHeader className="p-0 space-y-0">
          <span className="member-level">Niveau {String(plan.order).padStart(2, "0")}</span>
          <h3 className="member-plan-title" id={`${plan.id}-title`}>{plan.name}</h3>
          <p className="member-price">{new Intl.NumberFormat("fr-FR").format(plan.price)}<span> FCFA</span></p>
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
