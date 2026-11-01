type ApprovedClaims = Map<string, number>;

const APPROVED_CLAIMS_KEY = Symbol.for ("logger-adapter.approved-claims");

function approvedClaims(): ApprovedClaims {
  const holder = globalThis as Record<symbol, ApprovedClaims|undefined>;
  holder[APPROVED_CLAIMS_KEY] ??= new Map();
  return holder[APPROVED_CLAIMS_KEY];
}

function claimApproved(group: string): boolean {
  return (approvedClaims().get(group) ?? 0) > 0;
}

function withApprovedClaim<T>(group: string | null, run: () => T): T {
  if (!group) return run();
  const claims = approvedClaims();
  claims.set(group, (claims.get(group) ?? 0) + 1);
  try {
    return run();
  } finally {
    const remaining = (claims.get(group) ?? 1) - 1;
    if (remaining > 0) claims.set(group, remaining);
    else claims.delete(group);
  }
}

export { claimApproved, withApprovedClaim };
