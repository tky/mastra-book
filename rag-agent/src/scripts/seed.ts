import { MDocument } from "@mastra/rag";
import fs from "fs";

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
    
}
