import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { business } from "@/data/business";

export const metadata: Metadata = {
  title: `Cookie Policy | ${business.name}`,
  description: `How ${business.name} uses cookies and similar technologies, and how you can control them.`,
};

export default function CookiePolicyPage() {
  return (
    <LegalLayout
      title="Cookie Policy"
      intro={`This policy explains how we use cookies and similar technologies, and how you can control them. It should be read together with our Privacy Policy.`}
    >
      <h2>1. What are cookies?</h2>
      <p>
        Cookies are small text files stored on your device when you visit a
        website. We also use browser storage (localStorage / sessionStorage) for
        similar purposes, such as remembering your cart and your cookie choices.
      </p>

      <h2>2. Categories of cookies we use</h2>

      <h3>Strictly necessary</h3>
      <p>
        These are required for the store to work — for example keeping you
        signed in, remembering the items in your cart, and storing your cookie
        preferences. They are always on and do not need consent.
      </p>

      <h3>Analytics (optional)</h3>
      <p>
        With your consent, we collect anonymised information about how the store
        is used — such as which pages are viewed and which products are opened —
        so we can improve it. These are only set after you click
        &quot;Accept&quot; in the cookie banner, and you can withdraw consent at
        any time.
      </p>

      <h2>3. Third-party content</h2>
      <p>
        We embed a <strong>Google Maps</strong> map on the site to show our
        store location. When it loads, Google may set its own cookies and
        receive your IP address. This is provided by Google under its own{" "}
        <a
          href="https://policies.google.com/privacy"
          target="_blank"
          rel="noopener noreferrer"
        >
          privacy policy
        </a>
        . Product images may be served from a content delivery network (CDN).
      </p>

      <h2>4. Managing your choices</h2>
      <ul>
        <li>
          Use the cookie banner shown on your first visit to accept or reject
          optional analytics cookies.
        </li>
        <li>
          You can change your choice at any time using the &quot;Cookie
          settings&quot; link in the footer.
        </li>
        <li>
          You can also block or delete cookies in your browser settings, though
          some features (like staying signed in) may then not work.
        </li>
      </ul>

      <h2>5. More information</h2>
      <p>
        For details on how we handle personal data, see our{" "}
        <Link href="/privacy-policy">Privacy Policy</Link>. Questions? Email{" "}
        <a href={`mailto:${business.email}`}>{business.email}</a>.
      </p>
    </LegalLayout>
  );
}
