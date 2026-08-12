import { createWorkflow , createStep} from "@mastra/core/workflows";
import { z } from "zod";

const getUserQueryStep = createStep({
  id: "get-user-query",
  inputSchema: z.object({
    query: z.string(),
  }),

  outputSchema: z.object({
    query: z.string(),
  }),
  resumeSchema: z.object({
    query: z.string(),
  }),

  suspendSchema: z.object({
    message: z.string(),
  }),

  execute: async({ inputData, resumeData, suspend, mastra }) => {
    const query = resumeData?.query ?? inputData.query;

    const agent = mastra.getAgent("queryEvaluationAgent");

    const result = await agent.generate(
      `クエリ: ${query} このクエリは検索可能ですか？`,
      {
        structuredOutput: {
          schema: z.object({
            isSearchable: z.boolean(),
          }),
          jsonPromptInjection: true,
        },
      },
    );

    const isSearchable = result.object?.isSearchable ?? false;
    if (resumeData) {
      return { query: resumeData.query };
    }

    if (!isSearchable) {
      return await suspend({
        message: `${inputData.query} 少し物足りないです。もう少し具体的にしてもらえますか？`
      });
    }
    return { query }
  }
});

export const researchWorkflow = createWorkflow({
  id: "research-workflow",
  inputSchema: z.object({
    query: z.string().describe("検索したい内容を教えてください!"),
  }),

  outputSchema: z.object({
    query: z.string().describe("検索可能なクエリ"),
  }),

  steps: [getUserQueryStep],
});

researchWorkflow.then(getUserQueryStep).commit();
