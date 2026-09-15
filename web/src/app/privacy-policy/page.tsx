import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { business, businessAddressString } from "@/data/business";

export const metadata: Metadata = {
  title: `Privacy Policy | ${business.name}`,
  description: `How ${business.name} collects, uses and protects your personal data, in line with Ghana's Data Protection Act, 2012 (Act 843).`,
};

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      intro={`${business.name} respects your privacy. This policy explains what personal data we collect, why we collect it, and the rights you have under Ghana's Data Protection Act, 2012 (Act 843).`}
    >
      <h2>1. Who we are</h2>
      <p>
        {business.legalName} (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates this
        online store, selling home and kitchen appliances and household
        essentials. We are the data controller responsible for your personal
        data. You can reach us at{" "}
        <a href={`mailto:${business.email}`}>{business.email}</a> or{" "}
        <a href={business.phoneHref}>{business.phone}</a>. Our address is{" "}
        {businessAddressString}.
      </p>

      <h2>2. What data we collect</h2>
      <p>We only collect the data we need to run the store and fulfil your orders:</p>
      <ul>
        <li>
          <strong>Account data:</strong> your name, email address and password
          (passwords are stored securely and never in plain text).
        </li>
        <li>
          <strong>Order &amp; delivery data:</strong> full name, delivery
          address, phone number and email, so we can process and deliver your
          order.
        </li>
        <li>
          <strong>Payment data:</strong> payment is handled by our payment
          provider. We store a payment reference and status only — we do not
          store your card or mobile-money credentials.
        </li>
        <li>
          <strong>Reviews:</strong> the name and review text you choose to
          submit for a product.
        </li>
        <li>
          <strong>Usage &amp; analytics data:</strong> anonymised page views and
          interactions, collected <em>only</em> if you accept analytics cookies.
          See our{" "}
          <Link href="/cookie-policy">Cookie Policy</Link>.
        </li>
      </ul>

      <h2>3. How we use your data</h2>
      <ul>
        <li>To create and manage your account.</li>
        <li>To process, deliver and support your orders.</li>
        <li>To respond to your enquiries and reviews.</li>
        <li>
          To understand how the store is used and improve it (only with your
          analytics-cookie consent).
        </li>
        <li>To meet our legal and accounting obligations.</li>
      </ul>
      <p>
        We do <strong>not</strong> sell your personal data, and we do not use it
        for automated decision-making or profiling.
      </p>

      <h2>4. Legal basis</h2>
      <p>
        We process your data on the basis of performing our contract with you
        (fulfilling orders), your consent (analytics and marketing), and our
        legitimate interest in operating a secure, functioning store, as
        permitted under Act 843.
      </p>

      <h2>5. Sharing your data</h2>
      <p>We share data only with the service providers needed to run the store:</p>
      <ul>
        <li>Our payment provider, to process transactions.</li>
        <li>Delivery partners, to fulfil your order.</li>
        <li>
          Hosting and infrastructure providers, and (where enabled) an image CDN
          for product images.
        </li>
      </ul>
      <p>
        We require these partners to protect your data and to use it only for
        the services they provide to us.
      </p>

      <h2>6. Data retention</h2>
      <p>
        We keep your data only for as long as necessary: account data for as
        long as your account is active, and order records for as long as
        required by Ghanaian tax and accounting law. You can ask us to delete
        your account at any time.
      </p>

      <h2>7. Your rights</h2>
      <p>Under Act 843 you have the right to:</p>
      <ul>
        <li>access the personal data we hold about you;</li>
        <li>ask us to correct inaccurate data;</li>
        <li>ask us to delete your data where we are not legally required to keep it;</li>
        <li>object to or withdraw consent for analytics/marketing processing;</li>
        <li>lodge a complaint with the Data Protection Commission of Ghana.</li>
      </ul>
      <p>
        To exercise any of these rights, email us at{" "}
        <a href={`mailto:${business.email}`}>{business.email}</a>.
      </p>

      <h2>8. Data security</h2>
      <p>
        We use appropriate technical and organisational measures — including
        encrypted connections (HTTPS), hashed passwords and access controls — to
        protect your data against loss, misuse or unauthorised access.
      </p>

      <h2>9. Children</h2>
      <p>
        Our store is not intended for children under 18. We do not knowingly
        collect data from children.
      </p>

      <h2>10. Changes to this policy</h2>
      <p>
        We may update this policy from time to time. The &quot;last updated&quot;
        date at the top shows when it was last revised.
      </p>

      <h2>11. Contact us</h2>
      <p>
        Questions about this policy or your data? Contact us at{" "}
        <a href={`mailto:${business.email}`}>{business.email}</a> or{" "}
        <a href={business.phoneHref}>{business.phone}</a>.
      </p>
    </LegalLayout>
  );
}
