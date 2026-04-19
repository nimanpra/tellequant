import type { Metadata } from "next";
import { PageHero, ContentSection, Prose } from "@/components/marketing/page-hero";

export const metadata: Metadata = {
  title: "Acceptable Use Policy",
  description: "What you can and can't do with Tellequant.",
};

export default function AupPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Acceptable Use Policy"
        subtitle="Last updated: 2026-04-18"
      />
      <ContentSection>
        <Prose>
          <p>
            This Acceptable Use Policy ("AUP") defines activities that are prohibited on
            Tellequant. It applies to anyone using the Service, and it supplements the{" "}
            <a href="/legal/terms">Terms of Service</a>. Violating the AUP may result in
            suspension, termination, and reporting to relevant authorities.
          </p>

          <h2>1. Prohibited activities</h2>
          <h3>Illegal content and conduct</h3>
          <ul>
            <li>Threats, harassment, hate speech, or incitement to violence.</li>
            <li>Content that sexually exploits minors or constitutes CSAM.</li>
            <li>Infringement of intellectual property or privacy rights.</li>
            <li>Fraud, phishing, or identity theft.</li>
          </ul>

          <h3>Telephony abuse</h3>
          <ul>
            <li>Robocalls or SMS to numbers without prior express consent (TCPA).</li>
            <li>Calls to numbers on national or internal do-not-call registries.</li>
            <li>
              Impersonation of a real person, government agency, emergency service, or licensed
              professional.
            </li>
            <li>Calls outside permitted hours under applicable state or national law.</li>
            <li>Neighbor spoofing, CNAM spoofing, or other number-manipulation techniques.</li>
          </ul>

          <h3>Platform abuse</h3>
          <ul>
            <li>Reverse engineering, scraping, or bypassing rate limits.</li>
            <li>Using the Service to train competing AI models.</li>
            <li>Reselling Tellequant under a different brand without a reseller agreement.</li>
            <li>Attempting to access another workspace's data.</li>
          </ul>

          <h3>Malware, abuse of infrastructure, disruption</h3>
          <ul>
            <li>Distributing malware, spyware, or other harmful software.</li>
            <li>Running denial-of-service, brute-force, or credential-stuffing attacks.</li>
            <li>Using the Service to host or proxy illegal content.</li>
          </ul>

          <h2>2. Required disclosures</h2>
          <p>
            Every AI agent must, on request or at the start of a call if required by local law,
            disclose that the caller is speaking with an automated system. We make this trivially
            easy: add the default <code>{"{{disclosure}}"}</code> tag to the greeting.
          </p>

          <h2>3. Consent and opt-out</h2>
          <ul>
            <li>You must keep documented proof of consent for every number you dial.</li>
            <li>
              Every outbound campaign must honor opt-outs: verbal ("take me off your list"), DTMF,
              and SMS STOP. Tellequant writes opt-outs back to your contacts table in real time.
            </li>
            <li>Opt-outs propagate across campaigns in the same workspace automatically.</li>
          </ul>

          <h2>4. High-risk industries</h2>
          <p>
            Some verticals require extra controls: healthcare (HIPAA BAA required), financial
            services, credit & collections (FDCPA), political campaigns, and legal notices.
            Contact <a href="mailto:compliance@tellequant.com">compliance@tellequant.com</a> before
            deploying in any of these spaces.
          </p>

          <h2>5. Reporting violations</h2>
          <p>
            Report suspected AUP violations to{" "}
            <a href="mailto:abuse@tellequant.com">abuse@tellequant.com</a>. We investigate within
            24 hours and take action where warranted.
          </p>

          <h2>6. Enforcement</h2>
          <p>
            Violations may result in immediate suspension of affected agents, numbers, or
            workspaces, and where necessary, termination. Willful or repeat violations are
            reported to carriers and, in egregious cases, law enforcement.
          </p>

          <h2>7. Changes</h2>
          <p>
            We update the AUP as regulations and abuse patterns evolve. Material changes are
            announced 30 days in advance.
          </p>
        </Prose>
      </ContentSection>
    </>
  );
}
