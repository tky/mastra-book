import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { Observability, MastraStorageExporter, MastraPlatformExporter, SensitiveDataFilter } from '@mastra/observability';
import { researchWorkflow } from './workflows/research-workflow';
import { queryEvaluationAgent } from './agents/query-evaluation-agent';
import {researchAgent} from './agents/research-agent';
import {evaluationAgent} from './agents/evaluation-agent';
import {learningExtractionAgent} from './agents/learning-extraction-agent';
import {generateReportWorkflow} from './workflows/generate-report-workflow';
import {reportAgent} from './agents/report-agent';
import { MastraJwtAuth } from "@mastra/auth";
import { workflowRoute } from "@mastra/ai-sdk";

export const mastra = new Mastra({
  workflows: { researchWorkflow, generateReportWorkflow },
  agents: { queryEvaluationAgent, researchAgent, evaluationAgent, learningExtractionAgent, reportAgent },
  server: {
    auth: new MastraJwtAuth({
      secret: process.env.MASTRA_JWT_SECRET,
      public: [
          /^\/swagger-ui/,
          "/api/openapi.json",
        ],
    }),
    apiRoutes: [
      workflowRoute({
        path: "/workflow/:workflowId",
      })
    ],
  },
  storage: new LibSQLStore({
    id: "mastra-storage",
    url: "file:../mastra.db",
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "debug",
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: "mastra",
        exporters: [
          new MastraStorageExporter(),
          new MastraPlatformExporter(),
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter(),
        ],
      },
    },
  }),
});

