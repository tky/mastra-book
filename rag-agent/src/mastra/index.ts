import { Mastra } from "@mastra/core";
import { LibSQLVector } from "@mastra/libsql";
import path from "path";
import { fileURLToPath } from "url";
import { ragAgent } from "./agents/rag-agent";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const libSqlVector = new LibSQLVector({
  id: "libsql-vector",
  url: `file:${path.join(__dirname, "../../vector.db")}`,
});

export const mastra = new Mastra({
  agents: { ragAgent },
  vectors: { libSqlVector },
});
