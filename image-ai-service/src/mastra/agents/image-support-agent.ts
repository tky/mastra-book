import { Agent } from "@mastra/core/agent";

export const imageSupportAgent = new Agent({
  id: "image-support-agent",
  name: "image-support-agent",
  instructions:
    "あなたは画像生成 AI サービスのサポートエージェントです。" +
    "ユーザーの質問に丁寧に答えてください。",
  model: "google/gemini-3.5-flash-lite",
});
