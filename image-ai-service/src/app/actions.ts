"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function updateUserPlan(plan: string): Promise<void> {
  const hrds = await headers();
  await auth.api.updateUser({
    headers: hrds,
    body: { plan },
  });
}
