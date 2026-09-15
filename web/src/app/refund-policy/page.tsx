import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { business } from "@/data/business";

export const metadata: Metadata = {
  title: `Refund & Return Policy | ${business.name}`,
  description: `${business.name}'s returns, refunds and exchange policy for online orders in Ghana.`,
};

export default function RefundPolicyPage() {
  return (
    <LegalLayout
      title="Refund & Return Policy"
      intro={`We want you to be happy with your purchase. This policy explains when and how you can return an item and receive a refund or exchange.`}
    >
      <h2>1. Your right to return</h2>
      <p>
        You may request a return within <strong>7 days</strong> of receiving
        your order if the item is faulty, damaged, incorrect, or not as
        described. This is in addition to your rights under Ghanaian consumer
        law, which are not affected by this policy.
      </p>

      <h2>2. Conditions for a return</h2>
      <ul>
        <li>The item must be in its original condition and packaging.</li>
        <li>You must provide proof of purchase (order number or receipt).</li>
        <li>
          For hygiene and safety reasons, certain items (e.g. items that have
          been used with food) may only be returned if faulty.
        </li>
      </ul>

      <h2>3. How to start a return</h2>
      <ol>
        <li>
          Contact us at{" "}
          <a href={`mailto:${business.email}`}>{business.email}</a> or{" "}
          <a href={business.phoneHref}>{business.phone}</a> with your order
          number and the reason for the return.
        </li>
        <li>We will confirm whether your item qualifies and how to return it.</li>
        <li>
          Return the item to us using the instructions we provide.
        </li>
      </ol>

      <h2>4. Refunds</h2>
      <ul>
        <li>
          Once we receive and inspect the returned item, we will let you know
          whether your refund is approved.
        </li>
        <li>
          Approved refunds are issued to your original payment method, normally
          within <strong>14 days</strong> of us receiving the item.
        </li>
        <li>
          If the return is due to our error (wrong or faulty item), we cover the
          return delivery cost. Otherwise, return delivery is your
          responsibility.
        </li>
      </ul>

      <h2>5. Faulty or damaged items</h2>
      <p>
        If an item arrives faulty or damaged, contact us as soon as possible.
        You are entitled to a repair, replacement or refund. Where a
        manufacturer&apos;s warranty applies, we will help you make a claim.
      </p>

      <h2>6. Cancellations</h2>
      <p>
        If you need to cancel an order, contact us immediately. If the order has
        not yet been dispatched, we will cancel it and refund you in full.
      </p>

      <h2>7. Non-returnable situations</h2>
      <p>
        We may decline a return if the item has been damaged through misuse, is
        missing parts not due to our error, or is returned outside the return
        window without a valid reason.
      </p>

      <h2>8. Contact</h2>
      <p>
        For any questions about returns or refunds, email{" "}
        <a href={`mailto:${business.email}`}>{business.email}</a>. See also our{" "}
        <Link href="/terms">Terms &amp; Conditions</Link>.
      </p>
    </LegalLayout>
  );
}
