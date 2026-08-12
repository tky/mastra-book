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

export const researchDataSchema = z.object({
  queries: z.array(z.string()),
  searchResults: z.array(
    z.object({
      title: z.string(),
      url: z.string(),
      content: z.string(),
    }),
  ),
  learnings: z.array(
    z.object({
      learning: z.string(),
      followUpQuestions: z.array(z.string()),
      source: z.string(),
    }),
  ),
  completedQueries: z.array(z.string()),
  phase: z.enum(["initial", "follow-up"]),
});

const researchStep = createStep({
  id: "research",
  inputSchema: z.object({
    query: z.string(),
  }),
  outputSchema: z.object({
    researchData: researchDataSchema,
    summary: z.string(),
  }),

  execute: async({ inputData, mastra }) => {
    const { query } = inputData;
    try {
      const agent = mastra.getAgent("researchAgent");
      const result = await agent.generate(
        `こちらのトピックをリサーチしてください ${query}`,
        {
          maxSteps: 15,
          modelSettings: { maxRetries: 8 },
          structuredOutput: {
            schema: researchDataSchema,
            jsonPromptInjection: true,
          },
        },
      );

      const researchData = result.object;
      const summary = `Research completed on "${query};" \n\n ${JSON.stringify(researchData, null, 2)} \n\n`;

      return {
        researchData,
        summary,
      };
    } catch (error: any) {
      return {
        researchData: {
          queries: [],
          searchResults: [],
          learnings: [],
          completedQueries: [],
          phase: "initial" as const,
        },
        summary: `Error: ${error.message}`
      }
    }
  }
});


export const researchWorkflow = createWorkflow({
  id: "research-workflow",
  inputSchema: z.object({
    query: z.string().describe("検索したい内容を教えてください!"),
  }),

  outputSchema: z.object({
    researchData: z.object({
      queries: z.array(z.string()),
      searchResults: z.array(
        z.object({
          title: z.string(),
          url: z.string(),
          relevance: z.string(),
        }),
      ),
      learnings: z.array(
        z.object({
          learning: z.string(),
          followUpQuestions: z.array(z.string()),
          source: z.string(),
        }),
      ),
      completedQueries: z.array(z.string()),
      phase: z.enum(["initial", "follow-up"]),
    }),
    summary: z.string(),
  }),

  steps: [getUserQueryStep, researchStep],
});

researchWorkflow.then(getUserQueryStep).then(researchStep).commit();
