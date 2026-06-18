import { z } from "zod";

const safeId = z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/);
const safeLabel = z.string().trim().min(1).max(120);

const toolSchema = z.object({
  id: safeId,
  name: safeLabel,
  permission: z.enum(["read", "write", "financial", "destructive"]),
  approvalRequired: z.boolean(),
  spendLimit: z.number().min(0).max(10_000_000).optional(),
}).strict();

const policySchema = z.object({
  id: safeId,
  name: safeLabel,
  rule: z.string().trim().min(3).max(1_000),
  enforcement: z.enum(["block", "approve", "log"]),
}).strict();

const profileSchema = z.object({
  id: safeId,
  name: safeLabel,
  behavior: z.enum(["cooperative", "ambiguous", "hostile", "impatient"]),
  objective: z.string().trim().min(3).max(500),
}).strict();

export const agentManifestSchema = z.object({
  agentName: safeLabel,
  endpoint: z
    .string()
    .trim()
    .url()
    .max(300)
    .refine((value) => new URL(value).protocol === "https:", "Endpoint must use HTTPS.")
    .refine((value) => !new URL(value).username && !new URL(value).password, "Credentials are not allowed in endpoint URLs."),
  purpose: z.string().trim().min(20).max(2_000),
  industry: safeLabel,
  model: safeLabel,
  promptVersion: z.string().trim().min(1).max(40),
  autonomy: z.enum(["observe", "recommend", "approval", "bounded"]),
  tools: z.array(toolSchema).max(20),
  policies: z.array(policySchema).max(30),
  syntheticProfiles: z.array(profileSchema).min(1).max(20),
  privateContext: z.string().max(50_000),
}).strict();

export type AgentManifest = z.infer<typeof agentManifestSchema>;

export const MAX_MANIFEST_BYTES = 64 * 1024;

export function validateManifestFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension !== "json") {
    throw new Error("Only declarative .json manifests are accepted. ZIPs, code, and binaries are blocked.");
  }
  if (file.size > MAX_MANIFEST_BYTES) {
    throw new Error("Manifest exceeds the 64 KB safety limit.");
  }
  if (file.type && file.type !== "application/json") {
    throw new Error("The selected file is not identified as JSON.");
  }
}

export function parseAgentManifest(raw: string): AgentManifest {
  if (raw.includes("\0")) throw new Error("Manifest contains invalid binary data.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Manifest is not valid JSON.");
  }

  const result = agentManifestSchema.safeParse(parsed);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const location = firstIssue.path.length ? `${firstIssue.path.join(".")}: ` : "";
    throw new Error(`Manifest rejected. ${location}${firstIssue.message}`);
  }
  return result.data;
}
