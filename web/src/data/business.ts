/**
 * Central business details used across the site (footer, legal pages, contact).
 *
 * NOTE: Replace the placeholder values marked with `TODO:` with the real,
 * verified business details before going live. Legal/consumer-protection
 * pages rely on these being accurate.
 */
export const business = {
  name: "J's Ashanti's",
  legalName: "J's Ashanti's", // TODO: replace with the registered company/business name
  tagline:
    "Home and kitchen appliances, cookware and household essentials in Ghana.",
  // Contact
  email: "support@jsashanti.com", // TODO: confirm the real support email address
  phone: "+233 (0) 20 194 4235",
  phoneHref: "tel:+233201944235",
  // Physical / registered address
  address: {
    line1: "Accra Mall",
    line2: "Tetteh Quarshie Interchange, Spintex Road",
    city: "Accra",
    country: "Ghana",
  },
  // Registration – required for consumer transparency in Ghana.
  registrationNumber: "", // TODO: add the RGD business registration number
  // Jurisdiction whose laws govern the site (used in Terms & policies)
  jurisdiction: "the Republic of Ghana",
  currency: "GHS",
} as const;

export const businessAddressString = [
  business.address.line1,
  business.address.line2,
  business.address.city,
  business.address.country,
]
  .filter(Boolean)
  .join(", ");

/** Date the legal documents were last reviewed. Update when you edit them. */
export const legalLastUpdated = "10 September 2026";
