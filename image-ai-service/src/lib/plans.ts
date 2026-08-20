export const PLANS = {
  free: { label: "Free", monthlyTokenLimit: 100000 },
  pro: { label: "Pro", monthlyTokenLimit: 500000 },
} as const;

export const PLAN_MODELS = {
  free: "google/gemini-3.5-flash",
  pro: "google/gemini-3.5-flash",
} as const;

export type Plan = keyof typeof PLANS;

export function getMonthlyTokenLimit(plan: Plan): number {
  return PLANS[plan].monthlyTokenLimit;
}

export function getCurrentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
