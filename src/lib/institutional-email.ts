export const DEFAULT_INSTITUTIONAL_DOMAINS = ["edu.br", "ac.br", "edu", "ac.uk"] as const;

export function normalizeDomain(value: string) {
  return value.trim().toLowerCase().replace(/^@/, "").replace(/^\*\./, "");
}

export function isInstitutionalEmail(email: string, domains = DEFAULT_INSTITUTIONAL_DOMAINS) {
  const domain = email.trim().toLowerCase().split("@")[1];
  if (!domain) return false;
  return domains.some((allowed) => domain === allowed || domain.endsWith(`.${allowed}`));
}

export function formatAcceptedDomains(domains = DEFAULT_INSTITUTIONAL_DOMAINS) {
  return domains.map((domain) => `*.${domain}`).join(", ");
}
