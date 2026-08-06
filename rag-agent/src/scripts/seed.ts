import { MDocument } from "@mastra/rag";
import fs from "fs";
import { mastra } from "../mastra";
import { embedMany } from "ai";
import { ModelRouterEmbeddingModel } from "@mastra/core/llm";

const documents = [
  {
    filePath: "src/documents/company_faq.md",
    sourceName: "company_faq",
  },
  {
    filePath: "src/documents/operations_manual.md",
    sourceName: "operations_manual",
  },
  {
    filePath: "src/documents/onboarding_guide.md",
    sourceName: "onboarding_guide",
  }
];

const vectoreStore = mastra.getVector("libSqlVector");

await vectoreStore.createIndex({
  indexName: "company_docs",
  dimension: 3072,
});

for (const { filePath, sourceName } of documents) {
  const text = fs.readFileSync(filePath, "utf-8");
  const doc = MDocument.fromMarkdown(text);

  const chunks = await doc.chunk({
    strategy: "markdown",
    headers: [
      ["#", "title"],
      ["##", "section"],
    ],
  });

  console.log(`${sourceName}; ${chunks.length} チャンクを保存しました`);

  const { embeddings } = await embedMany({
    model: new ModelRouterEmbeddingModel(
      "google/gemini-embedding-001",
    ),
    values: chunks.map((chunk) => chunk.text),
  });

    
  await vectoreStore.upsert({
    indexName: "company_docs",
    vectors: embeddings,
    metadata: chunks.map((chunk) => ({
      text: chunk.text,
      source: sourceName,
      section: chunk.metadata?.title || "",
      createdAt: new Date().toISOString(),
    })),
  });

  console.log("全ドキュメントのデータ取り込みが完了しました");
}
