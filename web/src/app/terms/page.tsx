import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { business } from "@/data/business";

export const metadata: Metadata = {
  title: `Terms & Conditions | ${business.name}`,
  description: `The terms and conditions governing use of the ${business.name} online store.`,
};

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms & Conditions"
      intro={`These terms govern your use of the ${business.name} website and your purchase of products from us. By using the site or placing an order, you agree to these terms.`}
    >
      <h2>1. About us</h2>
      <p>
        This store is operated by {business.legalName}. You can contact us at{" "}
        <a href={`mailto:${business.email}`}>{business.email}</a> or{" "}
        <a href={business.phoneHref}>{business.phone}</a>.
      </p>

      <h2>2. Using our site</h2>
      <ul>
        <li>You must be at least 18 years old to place an order.</li>
        <li>
          You agree to provide accurate account and delivery information and to
          keep your login details secure.
        </li>
        <li>
          You may not misuse the site, attempt to gain unauthorised access, or
          use it for any unlawful purpose.
        </li>
      </ul>

      <h2>3. Products and pricing</h2>
      <ul>
        <li>
          All prices are shown in Ghana Cedis ({business.currency}) and include
          applicable taxes unless stated otherwise.
        </li>
        <li>
          We try to describe and picture products accurately, but colours and
          finishes may vary slightly from images on your screen.
        </li>
        <li>
          If we discover a genuine pricing or description error, we will contact
          you before processing your order and you may cancel it.
        </li>
        <li>Product availability is not guaranteed and stock may sell out.</li>
      </ul>

      <h2>4. Orders and payment</h2>
      <ul>
        <li>
          Placing an order is an offer to buy. A contract is formed when we
          confirm and accept your order.
        </li>
        <li>
          Payment is processed through our payment provider. We may cancel an
          order if payment is not completed or is declined.
        </li>
      </ul>

      <h2>5. Delivery</h2>
      <p>
        We will agree delivery arrangements and timescales with you at checkout
        or by contacting you. Risk in the goods passes to you on delivery.
      </p>

      <h2>6. Returns and refunds</h2>
      <p>
        Your right to return items and receive refunds is set out in our{" "}
        <Link href="/refund-policy">Refund &amp; Return Policy</Link>, which
        forms part of these terms.
      </p>

      <h2>7. Reviews and user content</h2>
      <p>
        If you submit a product review, it must be honest and based on your own
        experience. Do not post unlawful, misleading or offensive content. We
        may remove content that breaches these terms.
      </p>

      <h2>8. Our liability</h2>
      <p>
        We provide the site with reasonable care and skill. To the extent
        permitted by law, we are not liable for indirect or consequential loss.
        Nothing in these terms limits your statutory rights as a consumer or our
        liability for death or personal injury caused by our negligence.
      </p>

      <h2>9. Privacy</h2>
      <p>
        We handle your personal data as described in our{" "}
        <Link href="/privacy-policy">Privacy Policy</Link> and{" "}
        <Link href="/cookie-policy">Cookie Policy</Link>.
      </p>

      <h2>10. Governing law</h2>
      <p>
        These terms are governed by the laws of {business.jurisdiction}, and any
        disputes are subject to the jurisdiction of its courts.
      </p>

      <h2>11. Changes</h2>
      <p>
        We may update these terms from time to time. The version shown here,
        with the &quot;last updated&quot; date, is the one that applies.
      </p>

      <h2>12. Contact</h2>
      <p>
        Questions about these terms? Email{" "}
        <a href={`mailto:${business.email}`}>{business.email}</a>.
      </p>
    </LegalLayout>
  );
}
