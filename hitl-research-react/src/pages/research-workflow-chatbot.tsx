// AI Elements UIコンポーネント
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolOutput,
} from "@/components/ai-elements/tool";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputTools,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
// AI SDK・Mastra
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type ToolUIPart } from "ai";
import type { WorkflowDataPart } from "@mastra/ai-sdk";
// React・アイコン
import { useMemo, useState } from "react";
import { AlertCircle, Atom, CheckCircle2, Globe, Leaf, Sparkles, XCircle } from "lucide-react";

// WorkflowDataPartからワークフロー全体のデータ型とステップステータス型を抽出
type WorkflowData = WorkflowDataPart["data"];
type StepStatus = WorkflowData["steps"][string]["status"];

// ワークフローステータス → AI SDKのツールUI状態への変換テーブル
const STATUS_MAP: Record<string, ToolUIPart["state"]> = {
  running: "input-available",
  waiting: "input-available",
  suspended: "input-available",
  success: "output-available",
  failed: "output-error",
  bailed: "output-error",
};

// ステータスからUI状態を取得、未知のステータスはフォールバック
const getStepState = (status: StepStatus): ToolUIPart["state"] => {
  return STATUS_MAP[status] || "input-available";
};

// ステップIDを日本語ラベルに変換
const STEP_LABELS: Record<string, string> = {
  "get-user-query": "クエリ入力",
  research: "リサーチ実行",
  approval: "結果確認",
  "process-research-result": "レポート生成",
};

// ワークフロー開始前に表示するサンプルクエリ
const SUGGESTION_ITEMS = [
  { icon: Sparkles, text: "2026年のAI技術トレンド" },
  { icon: Atom, text: "量子コンピューティングの最新動向" },
  { icon: Leaf, text: "持続可能なエネルギー技術" },
  { icon: Globe, text: "Web3とブロックチェーン" },
];

const DisplayStep = ({
  step,
  title,
}: {
  step: WorkflowData["steps"][string];
  title: string;
}) => {
  return (
    // suspendedまたはsuccessのときだけ自動で開く
    <Tool
      defaultOpen={step.status === "suspended" || step.status === "success"}
    >
      {/* ステップのラベルとUI状態を表示 */}
      <ToolHeader
        title={STEP_LABELS[title] || title}
        type="tool-data-workflow"
        state={getStepState(step.status)}
      />
       {/* suspended時：入力待ちの通知エリア */}
      <ToolContent>
        {step.status === "suspended" && step.suspendPayload && (
          <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <div className="flex-1">
                <div className="mb-1 font-semibold text-yellow-900 dark:text-yellow-100">
                  入力待ち
                </div>
                 {/* suspendPayloadの構造に応じて表示を出し分け */}
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  {typeof step.suspendPayload === "object" &&
                  step.suspendPayload !== null &&
                  "message" in step.suspendPayload
                    ? typeof step.suspendPayload.message === "object" &&
                      step.suspendPayload.message !== null &&
                      "query" in step.suspendPayload.message
                      ? String(
                          (step.suspendPayload.message as { query: string })
                            .query
                        )
                      : String(step.suspendPayload.message ?? "")
                    : JSON.stringify(step.suspendPayload)}
                </div>
                {/* summaryがあれば追加表示（approval時） */}
                {typeof step.suspendPayload === "object" &&
                  "summary" in step.suspendPayload && (
                    <div className="mt-2 whitespace-pre-wrap text-sm text-yellow-700 dark:text-yellow-300">
                      {String(step.suspendPayload.summary)}
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}
        {/* ステップの出力結果、失敗時はエラーメッセージ */}
        <ToolOutput
          output={step.output}
          errorText={
            step.status === "failed" ? "ステップが失敗しました" : undefined
          }
        />
      </ToolContent>
    </Tool>
  );
};

const ResearchWorkflowChatbot = () => {
  const [query, setQuery] = useState("");
  const [currentQuery, setCurrentQuery] = useState("");

  const { messages, sendMessage, setMessages, status } = useChat({
    // ワークフロー実行のAPIエンドポイントを指定、JWTトークンをヘッダーに付与
    transport: new DefaultChatTransport({
      api: `http://localhost:4111/workflow/generate-report-workflow`,
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_MASTRA_JWT_TOKEN}`,
      },
      prepareSendMessagesRequest: ({ messages }) => {
        const lastMessage = messages[messages.length - 1].parts.find(
          (part) => part.type === "text"
        )?.text;
        const metadata = messages[messages.length - 1].metadata as {
          runId?: string;
          query?: string;
          approved?: boolean;
        };

        // Approve/Rejectの場合
        if (lastMessage === "Approve" || lastMessage === "Reject") {
          return {
            body: {
              runId: metadata.runId,
              step: "research-workflow.approval",
              resumeData: {
                approved: lastMessage === "Approve",
              },
            },
          };
        }

        // クエリ入力の場合（再開）
        if (metadata.runId && metadata.query) {
          return {
            body: {
              runId: metadata.runId,
              step: "research-workflow.get-user-query",
              resumeData: {
                query: metadata.query,
              },
            },
          };
        }

        // 新規開始（クエリ付き）
        return {
          body: {
            inputData: {
              query: metadata.query,
            },
          },
        };
      },
    }),
  });

  // 現在のワークフロー状態を取得
  const currentWorkflow = useMemo(() => {
    const parts = messages.flatMap((m) => m.parts);
    for (let i = parts.length - 1; i >= 0; i -= 1) {
      const part = parts[i];
      if (part.type === "data-workflow") {
        return (part as WorkflowDataPart).data as WorkflowData;
      }
    }
    return null;
  }, [messages]);

  // 最新のrunIdを取得（ワークフロー再開や承認/却下のAPI呼び出しに必要）
  const prevRunId = useMemo(() => {
    const parts = messages.flatMap((m) => m.parts);
    for (let i = parts.length - 1; i >= 0; i -= 1) {
      const part = parts[i];
      if (part.type === "data-workflow") {
        return (part as WorkflowDataPart).id;
      }
    }
    return undefined;
  }, [messages]);

  // サスペンド状態のステップを特定
  const suspendedStep = useMemo(() => {
    if (!currentWorkflow) return null;
    const steps = Object.entries(currentWorkflow.steps);
    return steps.find(([, step]) => step.status === "suspended");
  }, [currentWorkflow]);

  // クエリ入力でサスペンド中
  const isWaitingForQuery =
    (suspendedStep?.[0] === "get-user-query" ||
      (suspendedStep?.[0] === "research-workflow" &&
        (suspendedStep?.[1].suspendPayload as Record<string, unknown> | null)
          ?.summary == null)) &&
    status === "ready";

  // 承認待ちでサスペンド中
  const isWaitingForApproval =
    (suspendedStep?.[0] === "approval" ||
      (suspendedStep?.[0] === "research-workflow" &&
        (suspendedStep?.[1].suspendPayload as Record<string, unknown> | null)
          ?.summary != null)) &&
    status === "ready";

  // ワークフロー開始可能
  const canStart = !currentWorkflow && status === "ready";

  // ワークフロー完了
  const isCompleted =
    currentWorkflow?.status === "success" && status === "ready";

  // PromptInputからのメッセージ送信
  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    if (!hasText) return;

    const queryText = message.text!;

    // クエリ修正待ちの場合
    if (isWaitingForQuery && prevRunId) {
      sendMessage({
        text: queryText,
        metadata: { runId: prevRunId, query: queryText },
      });
    } else if (canStart || isCompleted) {
      // 新規開始（完了後の再開含む）
      if (isCompleted) setMessages([]);
      sendMessage({
        text: queryText,
        metadata: { query: queryText },
      });
    }

    setCurrentQuery(queryText);
    setQuery("");
  };

  // サジェスションクリック
  const handleSuggestionClick = (suggestion: string) => {
    sendMessage({
      text: suggestion,
      metadata: { query: suggestion },
    });
    setCurrentQuery(suggestion);
  };

  // 検索結果の承認
  const handleApprove = () => {
    if (!isWaitingForApproval) return;
    sendMessage({
      text: "Approve",
      metadata: { runId: prevRunId },
    });
  };

  // 検索結果の却下
  const handleReject = () => {
    if (!isWaitingForApproval) return;
    sendMessage({
      text: "Reject",
      metadata: { runId: prevRunId },
    });
  };

  // リセット
  const handleReset = () => {
    setMessages([]);
    setQuery("");
    setCurrentQuery("");
  };

  // プレースホルダーテキスト
  const placeholderText = isWaitingForQuery
    ? "もう少し具体的なトピックを入力してください..."
    : "リサーチしたいトピックを入力してください...";

  // 入力欄の有効/無効状態
  const isInputDisabled = !canStart && !isWaitingForQuery && !isCompleted;
  // 送信ボタンの有効/無効状態
  const isSubmitDisabled =
    !query.trim() || status === "streaming" || isInputDisabled;

  // ウェルカムスクリーン
  if (canStart && messages.length === 0) {
    return (
      <div className="flex h-screen flex-col justify-end gap-6 px-12 py-10 bg-[#F5F5F5] dark:bg-background">
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-black">
            <span className="font-serif text-[28px] italic text-white">R</span>
          </div>
          <h1 className="font-serif text-[32px] italic text-foreground">何をリサーチしましょうか？</h1>
          <p className="text-sm text-[#888888]">トピックを入力するか、下のサジェストから選んでください</p>
        </div>
        {/* サジェストボタン群 */}
        <div className="flex flex-wrap justify-center gap-2">
          {SUGGESTION_ITEMS.map(({ icon: Icon, text }) => (
            <button
              key={text}
              onClick={() => handleSuggestionClick(text)}
              className="flex items-center gap-2 rounded-full border border-[#E0E0E0] bg-white px-3.5 py-2 text-xs text-[#333333] hover:bg-gray-50"
            >
              <Icon className="h-3.25 w-3.25 text-[#888888]" />
              {text}
            </button>
          ))}
        </div>

        {/* 入力欄 */}
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputBody>
            <PromptInputTextarea
              placeholder={placeholderText}
              onChange={(event) => setQuery(event.target.value)}
              value={query}
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools />
            <PromptInputSubmit disabled={isSubmitDisabled} status={status} />
          </PromptInputFooter>
        </PromptInput>
        <p className="text-center text-[11px] text-[#AAAAAA]">
          AIが生成する情報には誤りが含まれる場合があります。重要な情報は必ずご確認ください。
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col gap-6 px-12 py-10 bg-[#F5F5F5] dark:bg-background">
      {/* トップバー */}
      <div className="flex items-center justify-between">
        {currentQuery && (
          <span className="rounded-full border border-[#E0E0E0] bg-white px-4 py-2 text-[13px] font-medium text-[#333333]">
            {currentQuery}
          </span>
        )}
        <span className="ml-auto rounded-md bg-[#F0F0F0] px-3 py-1.5 text-xs font-medium text-[#666666]">
          {isCompleted ? "完了" : isWaitingForApproval ? "入力待ち" : "実行中"}
        </span>
      </div>

      {/* 会話エリア */}
      <Conversation className="min-h-0 flex-1">
        <ConversationContent>
          {messages.map((message) => (
            <div key={message.id}>
              {message.parts.map((part, index) => {
                // ユーザーメッセージ
                if (part.type === "text" && message.role === "user") {
                  return (
                    <Message key={index} from={message.role}>
                      <MessageContent>
                        <MessageResponse>{part.text}</MessageResponse>
                      </MessageContent>
                    </Message>
                  );
                }

                // ワークフローステップ
                if (part.type === "data-workflow") {
                  const workflow = (part as WorkflowDataPart)
                    .data as WorkflowData;
                  const steps = Object.entries(workflow.steps);

                  return (
                    <Message key={index} from="assistant">
                      <MessageContent>
                        <div className="space-y-4">
                          {steps.map(([stepId, step]) => (
                            <DisplayStep
                              key={stepId}
                              step={step}
                              title={stepId}
                            />
                          ))}
                        </div>
                      </MessageContent>
                    </Message>
                  );
                }

                // AIエージェントメッセージ
                if (part.type === "text" && message.role === "assistant") {
                  return (
                    <Message key={index} from={message.role}>
                      <MessageContent>
                        <MessageResponse>{part.text}</MessageResponse>
                      </MessageContent>
                    </Message>
                  );
                }
                return null;
              })}
            </div>
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* 下部アクション */}
      <div>
        {/* 承認待ち通知 */}
        {isWaitingForApproval && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                リサーチ結果を確認してください。十分な内容であれば「承認」を、追加のリサーチが必要な場合は「却下」を選択してください。
              </p>
            </div>
          </div>
        )}

        {/* 承認待ちの場合はボタン表示 */}
        {isWaitingForApproval ? (
          <div className="flex gap-3">
            <Button onClick={handleApprove} className="flex-1">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              承認
            </Button>
            <Button
              onClick={handleReject}
              variant="destructive"
              className="flex-1"
            >
              <XCircle className="mr-2 h-4 w-4" />
              却下
            </Button>
          </div>
        ) : (
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputBody>
              <PromptInputTextarea
                placeholder={placeholderText}
                onChange={(event) => setQuery(event.target.value)}
                value={query}
                disabled={isInputDisabled}
              />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools />
              <PromptInputSubmit disabled={isSubmitDisabled} status={status} />
            </PromptInputFooter>
          </PromptInput>
        )}

        {/* 完了時のリセットボタン */}
        {isCompleted && (
          <div className="mt-3 flex justify-center">
            <button
              onClick={handleReset}
              className="text-sm text-muted-foreground underline hover:text-foreground"
            >
              新しいリサーチを開始
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="text-center text-[11px] text-[#AAAAAA]">
        AIが生成する情報には誤りが含まれる場合があります。重要な情報は必ずご確認ください。
      </p>
    </div>
  );
};

export default ResearchWorkflowChatbot;
