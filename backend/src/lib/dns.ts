import dns from "node:dns";

// Prefer IPv4 so Groq lookups do not hang on unreachable AAAA records.
dns.setDefaultResultOrder("ipv4first");
