import Link from "next/link";
import { legalLastUpdated } from "@/data/business";

/**
 * Shared layout + typography for the static legal / policy pages.
 * Uses scoped child selectors so each page can be written as plain semantic HTML.
 */
export function LegalLayout({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 mt-24">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm">
        <Link
          href="/"
          className="text-blue-700 dark:text-blue-400 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          &larr; Back to store
        </Link>
      </nav>

      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        Last updated: {legalLastUpdated}
      </p>
      {intro && (
        <p className="mt-4 text-base text-neutral-700 dark:text-neutral-300">
          {intro}
        </p>
      )}

      <div
        className="mt-8 space-y-6 text-neutral-800 dark:text-neutral-200 leading-relaxed
          [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-neutral-900 dark:[&_h2]:text-neutral-100
          [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1
          [&_p]:text-base
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1
          [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1
          [&_a]:text-blue-700 dark:[&_a]:text-blue-400 [&_a]:underline [&_a]:underline-offset-2"
      >
        {children}
      </div>
    </div>
  );
}
