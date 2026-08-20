import { handleChatStream } from "@mastra/ai-sdk";
import { createUIMessageStreamResponse } from "ai";
import { mastra } from "@/mastra";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "UnAuthorized" }, { status: 401 });
  }

  const params = await req.json();

  const stream = await handleChatStream({
    mastra,
    agentId: "image-support-agent",
    version: "v6",
    params
  });

  return createUIMessageStreamResponse({ stream });
}
