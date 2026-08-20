import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { imageSupportAgent } from "./agents/image-support-agent";

export const mastra = new Mastra({
  agents: { "image-support-agent": imageSupportAgent },
  storage: new LibSQLStore({
    id: "mastra-storage",
    url: "file:./mastra.db",
  }),
});
