"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { PlanId } from "@/lib/billing/plans";

interface UpgradeProps {
  intent: "upgrade";
  plan: PlanId;
  highlight?: boolean;
  label: string;
}

interface PortalProps {
  intent: "portal";
}

interface ContactProps {
  intent: "contact";
  plan: PlanId;
  highlight?: boolean;
  label: string;
}

interface CurrentProps {
  intent: "current";
  plan: PlanId;
  highlight?: boolean;
  label: string;
}

type Props = UpgradeProps | PortalProps | ContactProps | CurrentProps;

export function BillingActions(props: Props) {
  const [loading, setLoading] = useState(false);

  async function upgrade(plan: PlanId) {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        toast.error(json.error ?? "Could not start checkout");
        return;
      }
      window.location.assign(json.url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  }

  async function openPortal() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.url) {
        toast.error(json.error ?? "Could not open portal");
        return;
      }
      window.location.assign(json.url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Portal failed");
    } finally {
      setLoading(false);
    }
  }

  if (props.intent === "portal") {
    return (
      <Button variant="secondary" size="sm" onClick={openPortal} disabled={loading}>
        {loading ? "Opening…" : "Manage billing"}
      </Button>
    );
  }

  if (props.intent === "current") {
    return (
      <Button
        variant={props.highlight ? "primary" : "secondary"}
        className="mt-6 w-full"
        disabled
      >
        {props.label}
      </Button>
    );
  }

  if (props.intent === "contact") {
    return (
      <Button asChild variant="secondary" className="mt-6 w-full">
        <a href="mailto:sales@tellequant.com?subject=Scale%20plan%20inquiry">{props.label}</a>
      </Button>
    );
  }

  return (
    <Button
      variant={props.highlight ? "primary" : "secondary"}
      className="mt-6 w-full"
      onClick={() => upgrade(props.plan)}
      disabled={loading}
    >
      {loading ? "Redirecting…" : props.label}
    </Button>
  );
}
