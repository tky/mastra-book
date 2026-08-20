"use client";

import { useState, useEffect, useTransition } from "react";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { updateUserPlan } from "@/app/actions";

type TokenUsage = {
  plan: string;
  used: number;
  limit: number;
  remaining: number;
};

async function fetchTokenUsage(): Promise<TokenUsage> {
  const res = await fetch("/api/token-usage");
  return res.json();
}

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  // isPending: Server Action 実行中は true になる
  const [isPending, startTransition] = useTransition();
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  useEffect(() => {
    fetchTokenUsage().then(setTokenUsage);
  }, []);

  const handlePlanChange = (newPlan: string) => {
    // startTransition でラップすることで isPending を取得できる
    startTransition(async () => {
      await updateUserPlan(newPlan);
      setTokenUsage(await fetchTokenUsage());
    });
  };

  const handleSubmit = () => {
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      {tokenUsage && (
        <div className="mb-2 flex justify-end items-center gap-2">
          <select
            value={tokenUsage.plan}
            onChange={(e) => handlePlanChange(e.target.value)}
            disabled={isPending}
            className="text-xs bg-transparent font-medium
              cursor-pointer disabled:opacity-50"
          >
            <option value="free">Free（10,000 tokens / 月）</option>
            <option value="pro">Pro（500,000 tokens / 月）</option>
          </select>
          <Badge variant="secondary">
            {tokenUsage.used} / {tokenUsage.limit} トークン
          </Badge>
        </div>
      )}
      <Card className="flex-1 overflow-y-auto p-4 mb-4">
        <ul className="space-y-3">
          {messages.map((m) => (
            <li
              key={m.id}
              className={cn("flex", m.role === "user" && "justify-end")}
            >
              <div
                className={cn(
                  "rounded-2xl px-4 py-2 max-w-[80%]",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted",
                )}
              >
                {m.parts?.map((part, i) =>
                  part.type === "text" ? (
                    <span key={i}>{part.text}</span>
                  ) : null,
                )}
              </div>
            </li>
          ))}
        </ul>
      </Card>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={status !== "ready"}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="メッセージを入力..."
          className="flex-1"
        />
        <Button onClick={handleSubmit} disabled={status !== "ready"}>
          送信
        </Button>
      </div>
    </div>
  );
}
