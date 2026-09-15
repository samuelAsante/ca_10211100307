export function getAllowedOrigins(): string[] {
  const origins = [
    process.env.FRONTEND_URL,
    process.env.BETTER_AUTH_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8081",
    "http://127.0.0.1:8081",
    "http://localhost:8082",
    ...(process.env.BETTER_AUTH_ADDITIONAL_ORIGINS?.split(",") || []),
  ]
    .map((origin) => origin?.trim())
    .filter((origin): origin is string => Boolean(origin));

  return [...new Set(origins)];
}
