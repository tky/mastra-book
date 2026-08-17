import { createStep, createWorkflow } from "@mastra/core/workflows";
import { researchDataSchema, researchWorkflow } from "./research-workflow";
import { z } from "zod";

const processResearchResultStep = createStep({
  id: "process-research-result",
  inputSchema: z.object({
    approved: z.boolean(),
    researchData: researchDataSchema,
  }),
  outputSchema: z.object({
    report: z.string().optional(),
    completed: z.boolean(),
  }),
  execute: async({ inputData, mastra }) => {
    const approved = inputData.approved && !!inputData.researchData;
    if(!approved) {
      console.log("リサーチが未承認また不完全なので、ワークフローを終了します");
      return { completed: false }
    }

    try {
      const agent = mastra.getAgent("reportAgent");
      const response = await agent.generate([
        {
          role: "user",
          content: `以下のリサーチ結果に基づいてレポートを生成してください: ${JSON.stringify(inputData.researchData)}`,
        }
      ]);
      return { report: response.text, completed: true };
    } catch (error) {
      console.log("レポート生成エラー", error);
      return { completed: false };
    }
  }
})

export const generateReportWorkflow = createWorkflow({
  id: "generate-report-workflow",
  steps: [researchWorkflow, processResearchResultStep],
  inputSchema: z.object({
    query: z.string(),
  }),
  outputSchema: z.object({
    report: z.string().optional(),
    completed: z.boolean(),
  }),
});

generateReportWorkflow.dowhile(researchWorkflow, async({ inputData }) => {
  const isCompleted = inputData.approved;
  return isCompleted !== true;
}).then(processResearchResultStep)
.commit();
