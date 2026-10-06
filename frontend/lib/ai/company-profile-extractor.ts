import Anthropic from "@anthropic-ai/sdk";

const SUPPORTED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);

export function isAnalyzableMimeType(mimeType: string): boolean {
  return SUPPORTED_MIME_TYPES.has(mimeType);
}

export interface ExtractedLicense {
  licenseType: string;
  licenseNumber: string | null;
  validFrom: string | null;
  validUntil: string | null;
  notes: string | null;
}

export interface ExtractedAchievement {
  title: string;
  client: string | null;
  category: string | null;
  amount: number | null;
  completedYear: number | null;
  location: string | null;
  description: string | null;
}

export interface ExtractedCompanyProfile {
  name: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  philosophy: string | null;
  specialties: string | null;
  licenses: ExtractedLicense[];
  achievements: ExtractedAchievement[];
}

const EXTRACTION_TOOL_NAME = "submit_company_profile";

const EXTRACTION_TOOL = {
  name: EXTRACTION_TOOL_NAME,
  description: "アップロードされた資格証・許可証・実績書類から読み取れる企業情報を構造化して報告する。",
  input_schema: {
    type: "object" as const,
    properties: {
      name: { type: ["string", "null"], description: "会社名" },
      address: { type: ["string", "null"], description: "本社所在地" },
      phone: { type: ["string", "null"], description: "電話番号" },
      email: { type: ["string", "null"], description: "メールアドレス" },
      description: { type: ["string", "null"], description: "事業概要" },
      philosophy: { type: ["string", "null"], description: "経営理念" },
      specialties: { type: ["string", "null"], description: "得意分野・重点業種" },
      licenses: {
        type: "array",
        description: "入札資格・建設業許可・国家資格・健康診断などの一覧",
        items: {
          type: "object",
          properties: {
            licenseType: { type: "string", description: "資格・許可・免許の名称" },
            licenseNumber: { type: ["string", "null"], description: "許可番号・登録番号" },
            validFrom: { type: ["string", "null"], description: "取得日・交付日 (YYYY-MM-DD)" },
            validUntil: { type: ["string", "null"], description: "有効期限・満了日 (YYYY-MM-DD)" },
            notes: { type: ["string", "null"], description: "等級・業種区分・保有者名など補足" },
          },
          required: ["licenseType"],
        },
      },
      achievements: {
        type: "array",
        description: "過去の工事実績の一覧",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "工事名" },
            client: { type: ["string", "null"], description: "発注者" },
            category: { type: ["string", "null"], description: "工種" },
            amount: { type: ["number", "null"], description: "契約金額（円）" },
            completedYear: { type: ["number", "null"], description: "竣工年" },
            location: { type: ["string", "null"], description: "施工場所" },
            description: { type: ["string", "null"], description: "工事概要" },
          },
          required: ["title"],
        },
      },
    },
    required: ["licenses", "achievements"],
  },
};

export interface AnalyzableFile {
  filename: string;
  mimeType: string;
  base64: string;
}

export async function extractCompanyProfileFromFiles(files: AnalyzableFile[]): Promise<ExtractedCompanyProfile> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEYが設定されていません。管理者に設定を依頼してください。");

  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";

  const fileBlocks: Anthropic.ContentBlockParam[] = files.map((file) =>
    file.mimeType === "application/pdf"
      ? {
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: file.base64 },
        }
      : {
          type: "image",
          source: { type: "base64", media_type: file.mimeType as "image/png" | "image/jpeg" | "image/gif" | "image/webp", data: file.base64 },
        }
  );

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    tools: [EXTRACTION_TOOL],
    tool_choice: { type: "tool", name: EXTRACTION_TOOL_NAME },
    messages: [
      {
        role: "user",
        content: [
          ...fileBlocks,
          {
            type: "text",
            text: "添付の資格証・許可証・実績書類を読み取り、submit_company_profileツールで企業情報を報告してください。書類から読み取れない項目はnullまたは空配列にしてください。金額は数値（円）で、日付はYYYY-MM-DD形式で報告してください。",
          },
        ],
      },
    ],
  });

  const toolUse = response.content.find((block): block is Anthropic.ToolUseBlock => block.type === "tool_use");
  if (!toolUse) throw new Error("AIから解析結果を取得できませんでした。");

  const input = toolUse.input as Record<string, unknown>;
  return {
    name: (input.name as string | null) ?? null,
    address: (input.address as string | null) ?? null,
    phone: (input.phone as string | null) ?? null,
    email: (input.email as string | null) ?? null,
    description: (input.description as string | null) ?? null,
    philosophy: (input.philosophy as string | null) ?? null,
    specialties: (input.specialties as string | null) ?? null,
    licenses: Array.isArray(input.licenses) ? (input.licenses as ExtractedLicense[]) : [],
    achievements: Array.isArray(input.achievements) ? (input.achievements as ExtractedAchievement[]) : [],
  };
}
