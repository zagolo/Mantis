import type { CampaignConfig } from "../../shared/schemas.js";

const INVENTION =
  /\d+%|\$\d[\d,]*|\bguaranteed\b|\bcase study\b|\bincreased revenue\b|\bcustomer \w+ (saw|achieved|saved)\b/i;

export function cueClaimsApproved(cue: string, campaign: CampaignConfig): boolean {
  const text = cue.trim();
  if (!text) {
    return true;
  }
  let remaining = text.toLowerCase();
  // One approved statement must not authorize an extra invented promise in
  // the same cue. Remove approved spans, then check the remaining language.
  const approved = campaign.approved_claims.map(claim => claim.text.toLowerCase().trim())
    .filter(Boolean).sort((a, b) => b.length - a.length);
  for (const claim of approved) {
    remaining = remaining.replaceAll(claim, "");
  }
  return !INVENTION.test(remaining);
}
