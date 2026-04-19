import type { Metadata } from "next";
import { PageHero, ContentSection, Prose } from "@/components/marketing/page-hero";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The legal agreement governing use of Tellequant.",
};

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Terms of Service"
        subtitle="Last updated: 2026-04-18"
      />
      <ContentSection>
        <Prose>
          <p>
            These Terms of Service ("Terms") govern your access to and use of Tellequant (the
            "Service"), operated by Tellequant, Inc. By using the Service, you agree to these
            Terms. If you don't agree, don't use the Service.
          </p>

          <h2>1. Accounts</h2>
          <p>
            You must provide accurate information and keep your credentials secure. You are
            responsible for activity under your account and for any users you invite to your
            workspace.
          </p>

          <h2>2. The Service</h2>
          <p>
            Tellequant provides software for building and operating AI voice agents. We provision
            telephony infrastructure, run real-time voice pipelines, store transcripts and
            recordings, and expose an API for programmatic access. We do not provide legal,
            medical, or financial advice.
          </p>

          <h2>3. Acceptable use</h2>
          <p>
            You must comply with our <a href="/legal/aup">Acceptable Use Policy</a>, including all
            applicable laws (TCPA, GDPR, TSR, CAN-SPAM, HIPAA where applicable). Prohibited uses
            include: robocall spam without consent, impersonation, illegal harassment, and
            circumvention of do-not-call lists.
          </p>

          <h2>4. Your content</h2>
          <p>
            You retain ownership of the content you upload — agent prompts, knowledge base
            documents, contact lists, transcripts. You grant Tellequant a limited license to
            process this content solely to provide the Service. We will not use your content to
            train AI models.
          </p>

          <h2>5. Fees and billing</h2>
          <p>
            Subscription fees are billed in advance; usage (minutes, tokens) in arrears. Payment
            is due on the invoice date. Overdue amounts accrue 1.5% / month. Fees are
            non-refundable except as required by law or our SLA.
          </p>

          <h2>6. Availability and SLA</h2>
          <p>
            We target 99.95% monthly uptime on Pro and 99.99% on Enterprise. Service credits for
            downtime are governed by the applicable Order Form or linked SLA.
          </p>

          <h2>7. Confidentiality</h2>
          <p>
            Each party will protect the other's confidential information using the same care it
            uses for its own, and no less than reasonable care.
          </p>

          <h2>8. Warranties and disclaimers</h2>
          <p>
            We warrant that the Service will materially conform to its documentation. Otherwise,
            the Service is provided "AS IS" without warranties of merchantability, fitness for a
            particular purpose, or non-infringement, to the extent permitted by law.
          </p>

          <h2>9. Limitation of liability</h2>
          <p>
            Except for liability arising from indemnification obligations, gross negligence, or
            willful misconduct, neither party's total liability will exceed the fees paid in the
            12 months preceding the claim. Neither party is liable for indirect, consequential, or
            punitive damages.
          </p>

          <h2>10. Indemnification</h2>
          <p>
            Tellequant will defend you against third-party claims that the Service infringes
            intellectual property. You will defend Tellequant against claims arising from your
            content or your violation of the Acceptable Use Policy.
          </p>

          <h2>11. Termination</h2>
          <p>
            Either party may terminate for material breach if the other party fails to cure within
            30 days of notice. Upon termination, we will provide 30 days to export your data.
          </p>

          <h2>12. Governing law</h2>
          <p>
            These Terms are governed by the laws of the State of Delaware, USA, without regard to
            conflicts of laws. Disputes will be resolved in the courts of Delaware, or by binding
            arbitration where required by applicable law.
          </p>

          <h2>13. Changes</h2>
          <p>
            We may update these Terms with at least 30 days' notice for material changes. Continued
            use after the effective date constitutes acceptance.
          </p>

          <h2>14. Contact</h2>
          <p>
            Legal notices: <a href="mailto:legal@tellequant.com">legal@tellequant.com</a>.
          </p>
        </Prose>
      </ContentSection>
    </>
  );
}
