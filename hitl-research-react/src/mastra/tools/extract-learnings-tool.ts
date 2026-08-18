import { z } from "zod";
import { createTool } from "@mastra/core/tools";

export const extractLearningsTool = createTool({
  id: "extract-learnings",
  description: "検索結果から重要な学びとフォローアップ質問を抽出する",
  inputSchema: z.object({
    query: z.string().describe("元の調査クエリ"),
    result: z.object({
      title: z.string(),
      url: z.string(),
      content: z.string(),
    }).describe("処理対象の検索結果"),
  }),
  outputSchema: z.object({
    learning: z.string().describe("コンテンツから抽出された重要な学び"),
    followUpQuestions: z.array(z.string()).max(3).describe("より深い調査のためのフォローアップ質問"),
  }),
  execute: async (inputData, context) => {
    const logger = context.mastra?.getLogger();
    try {
      const { query, result } = inputData;
      const learningExtractionAgent = context.mastra!.getAgent("learningExtractionAgent");
      const response = await learningExtractionAgent.generate(
        [
          {
            role: "user",
            content: `ユーザーは「${query}」について調査しています。
            この検索結果から重要な学びとフォローアップ質問を抽出してください：
            タイトル: ${result.title}
            URL: ${result.url}
            内容: ${result.content.substring(0, 1500)}...
            以下の形式のJSONオブジェクトで回答してください：
            - learning: コンテンツから得られた重要な洞察（文字列）
            - followUpQuestions: より深い調査のためのフォローアップ質問（最大1つの配列）`,
          }
        ],
        {
          modelSettings: { maxRetries: 8 },
          structuredOutput: {
            schema: z.object({
              learning: z.string(),
              followUpQuestions: z.array(z.string()).max(1),
            })
          }
        }
      );
      logger?.info("Learning extraction response:", response.object);
      return response.object;
    } catch (error) {
      logger?.error("Error extractiong learnings:", error);
      return {
        learning: "情報抽出中にエラーが発生しました",
        followUpQuestions: [],
      }
    }
  }
});

