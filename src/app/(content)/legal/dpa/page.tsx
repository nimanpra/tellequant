import type { Metadata } from "next";
import { PageHero, ContentSection, Prose } from "@/components/marketing/page-hero";

export const metadata: Metadata = {
  title: "Data Processing Addendum",
  description: "GDPR-compliant Data Processing Addendum for Tellequant customers.",
};

export default function DpaPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Data Processing Addendum"
        subtitle="Last updated: 2026-04-18"
      />
      <ContentSection>
        <Prose>
          <p>
            This Data Processing Addendum ("DPA") supplements the Tellequant Terms of Service
            between Tellequant, Inc. ("Processor") and the customer ("Controller"). It applies
            whenever Tellequant processes personal data on the Controller's behalf. Capitalized
            terms follow the GDPR's definitions.
          </p>

          <h2>1. Subject matter and duration</h2>
          <p>
            Tellequant processes personal data to deliver the Service as described in the Terms,
            for the duration of the customer subscription and any reasonable wind-down period.
          </p>

          <h2>2. Nature and purpose of processing</h2>
          <ul>
            <li>Receiving and routing inbound calls.</li>
            <li>Generating transcripts, embeddings, and audio recordings.</li>
            <li>Running outbound campaigns against Controller-provided contact lists.</li>
            <li>Producing analytics, billing, and audit logs.</li>
          </ul>

          <h2>3. Categories of data subjects and personal data</h2>
          <ul>
            <li>Callers: phone number, name (where provided), voice recording, transcript.</li>
            <li>End users of Controller's workspace: name, email, role.</li>
            <li>Contact lists: phone numbers, names, custom fields provided by Controller.</li>
          </ul>

          <h2>4. Obligations of Tellequant</h2>
          <ul>
            <li>Process personal data only on documented Controller instructions.</li>
            <li>Ensure all personnel are bound by confidentiality.</li>
            <li>
              Implement appropriate technical and organizational measures, including those set out
              on our <a href="/security">Security page</a>.
            </li>
            <li>Assist with data-subject requests and DPIAs when reasonably requested.</li>
            <li>Notify the Controller of any Personal Data Breach without undue delay and no later than 72 hours after discovery.</li>
          </ul>

          <h2>5. Sub-processors</h2>
          <p>
            Tellequant engages the sub-processors listed on our{" "}
            <a href="/security">Security page</a>. We will give at least 30 days' notice of new
            sub-processors; Controllers may object in writing for reasonable grounds related to
            data protection.
          </p>

          <h2>6. International transfers</h2>
          <p>
            Where transfers leave the EEA, UK, or Switzerland, Tellequant relies on the latest EU
            Standard Contractual Clauses (Commission Decision 2021/914) and the UK Addendum
            published by the ICO. Controllers may elect EU-only residency.
          </p>

          <h2>7. Security measures</h2>
          <p>
            Tellequant implements the measures described in Annex II, including: TLS 1.3 in
            transit, AES-256 at rest, Postgres row-level security, per-tenant encryption of
            recordings, SHA-256-hashed API keys, HMAC-signed internal RPC, audit logging, annual
            penetration testing, and a SOC 2 Type II program.
          </p>

          <h2>8. Assistance and audits</h2>
          <p>
            Tellequant will assist the Controller in meeting its obligations under Articles 32–36
            GDPR. Once per year, and with 30 days' notice, the Controller may audit Tellequant's
            compliance, or accept a recent third-party certification (e.g., SOC 2 report) in lieu
            of a direct audit.
          </p>

          <h2>9. Return and deletion</h2>
          <p>
            On termination or on written request, Tellequant will return or permanently delete all
            personal data within 30 days, except where storage is required by law.
          </p>

          <h2>10. Liability and precedence</h2>
          <p>
            This DPA forms part of, and is subject to, the liability provisions of the Terms. In
            case of conflict between the Terms and this DPA, this DPA governs with respect to
            personal data.
          </p>

          <h2>Annex I — Parties and processing details</h2>
          <p>
            Parties: as identified in the Order Form. Categories and purposes: as set out in
            Sections 2–3 above. Duration: for the term of the subscription.
          </p>

          <h2>Annex II — Technical and organizational measures</h2>
          <p>
            As set out in Section 7 and on our <a href="/security">Security page</a>, which is
            updated whenever measures change materially.
          </p>

          <h2>Request a signed DPA</h2>
          <p>
            Email <a href="mailto:legal@tellequant.com">legal@tellequant.com</a> with your entity
            name; we'll send a countersignable PDF the same day.
          </p>
        </Prose>
      </ContentSection>
    </>
  );
}
