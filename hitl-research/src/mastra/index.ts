
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { Observability, MastraStorageExporter, MastraPlatformExporter, SensitiveDataFilter } from '@mastra/observability';
import { researchWorkflow } from './workflows/research-workflow';
import { queryEvaluationAgent } from './agents/query-evaluation-agent';
import {researchAgent} from './agents/research-agent';
import {evaluationAgent} from './agents/evaluation-agent';
import {learningExtractionAgent} from './agents/learning-extraction-agent';

export const mastra = new Mastra({
  workflows: { researchWorkflow },
  agents: { queryEvaluationAgent, researchAgent, evaluationAgent, learningExtractionAgent },
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

