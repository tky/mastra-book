import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { tavily } from "@tavily/core";
import "dotenv/config";

const client = tavily({ apiKey: process.env.TAVILY_API_KEY || "" });

export const searchTool = createTool({
  id: "search-tool",
  description: "特定のクエリに関するWeb情報を検索し、要約されたコンテンツを返します",
  inputSchema: z.object({
    query: z.string().describe("実行する検索クエリ"),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
      title: z.string().describe("検索結果のタイトル"),
      url: z.string().describe("検索結果のURL"),
      content: z.string().describe("検索結果の要約コンテンツ"),
    })
    ).describe("検索結果のリスト"),
    error: z.string().optional().describe("エラーメッセージ（存在する場合）"),
  }),
  execute: async (inputData, context) => {
    const logger = context?.mastra?.getLogger();
    logger?.info("Web検索ツールを実行中");
    const { query } = inputData;
    try {
      if (!process.env.TAVILY_API_KEY) {
        logger?.error("エラー：TAVILY_API_KEYが見つかりません");
        return { results: [], error: "APIキーが見つかりません" }
      }
      logger?.info(`Webを検索中: ${query}`);
      const response = await client.search(query);
      if (!response.results || response.results.length === 0) {
        return { results: [], error: "検索結果が見つかりませんでした"};
      }

      const processedResults = response.results.slice(0, 3).map((result) => ({
        title: result.title || "",
        url: result.url,
        content: result.content ? result.content.substring(0, 1000) : "コンテンツがありません",
      }))

      return {
        results: processedResults
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message: "不明なエラー";
      return {
        results: [],
        error: errorMessage
      }
    }
  }
});

