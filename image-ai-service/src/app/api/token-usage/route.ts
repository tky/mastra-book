import { auth } from "@/lib/auth";
import { PLANS, getMonthlyTokenLimit, getCurrentYearMonth } from "@/lib/plans";
import { getMonthlyTokenUsage } from "@/lib/token-usage";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userPlan = (session.user as { plan?: string }).plan ?? "free";
  const plan = (userPlan in PLANS ? userPlan: "free") as keyof typeof PLANS;
  const limit = getMonthlyTokenLimit(plan);
  const used = await getMonthlyTokenUsage(session.user.id);

  return NextResponse.json({
    plan,
    limit,
    used,
    remaining: Math.max(0, limit - used),
    yearMonth: getCurrentYearMonth(),
  });
}
