import { db } from "./db";
import { getCurrentYearMonth } from "./plans";

export async function getMonthlyTokenUsage(userId: string): Promise<number> {
  const yearMonth = getCurrentYearMonth();
  const result = await db.execute({
    sql: `select tokens_used from token_usage where user_id = ? and year_month = ?`,
    args: [userId, yearMonth],
  });

  if (result.rows.length === 0) return 0;
  return Number(result.rows[0].tokens_used) || 0;
}

export async function incrementTokenUsage(
  userId: string,
  tokens: number,
): Promise<void> {
  const yearMonth = getCurrentYearMonth();
  await db.execute({
    sql: `
      insert into token_usage (id, user_id, year_month, tokens_used, updated_at)
      values(
        lower(hex(randomblob(16))), ?, ?, ?, datetime('now'))
      on conflict (user_id, year_month)
      do update set
        tokens_used = tokens_used + excluded.tokens_used,
        updated_at = datetime('now')
        `,
      args: [userId, yearMonth, tokens],
  });
}
