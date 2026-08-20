import { Agent } from "@mastra/core/agent";
import { PLAN_MODELS, type Plan } from "@/lib/plans";

export const imageSupportAgent = new Agent({
  id: "image-support-agent",
  name: "image-support-agent",
  instructions:
    "あなたは画像生成 AI サービスのサポートエージェントです。" +
    "ユーザーの質問に丁寧に答えてください。",
  model: ({ requestContext }) => {
    const plan = (requestContext?.get("plan") as Plan | undefined) ?? "free";
    return PLAN_MODELS[plan];
  }
});
