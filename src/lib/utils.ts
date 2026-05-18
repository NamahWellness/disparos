import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CHANNEL_LABELS: Record<string, string> = {
  email: "E-mail",
  whatsapp_group: "WhatsApp Grupos",
  whatsapp_individual: "WhatsApp Individual",
  push: "Push",
  call: "Ligação",
  sms: "SMS",
  other: "Outro",
};

export const STATUS_LABELS: Record<string, string> = {
  idea: "Ideia",
  writing: "Escrevendo",
  review: "Em revisão",
  approved: "Aprovado",
  scheduled: "Programado",
  sent: "Enviado",
  cancelled: "Cancelado",
  error: "Erro",
};

export const PHASE_LABELS: Record<string, string> = {
  signup: "Inscrição",
  nurturing: "Nutrição",
  invite: "Convite",
  reminder: "Lembrete",
  event: "Evento",
  post_event: "Pós-evento",
  repechage: "Repescagem",
  welcome: "Boas-vindas",
};

export const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  planning: "Planejamento",
  production: "Em produção",
  active: "Em andamento",
  finished: "Finalizada",
  paused: "Pausada",
  cancelled: "Cancelada",
};

export const STATUS_COLORS: Record<string, string> = {
  idea: "bg-slate-100 text-slate-700",
  writing: "bg-amber-100 text-amber-700",
  review: "bg-blue-100 text-blue-700",
  approved: "bg-emerald-100 text-emerald-700",
  scheduled: "bg-violet-100 text-violet-700",
  sent: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  error: "bg-rose-100 text-rose-700",
};

export const CAMPAIGN_STATUS_COLORS: Record<string, string> = {
  planning: "bg-slate-100 text-slate-700",
  production: "bg-amber-100 text-amber-700",
  active: "bg-blue-100 text-blue-700",
  finished: "bg-green-100 text-green-700",
  paused: "bg-orange-100 text-orange-700",
  cancelled: "bg-red-100 text-red-700",
};

export const CHANNEL_COLORS: Record<string, string> = {
  email: "bg-blue-100 text-blue-700",
  whatsapp_group: "bg-green-100 text-green-700",
  whatsapp_individual: "bg-emerald-100 text-emerald-700",
  push: "bg-purple-100 text-purple-700",
  call: "bg-orange-100 text-orange-700",
  sms: "bg-yellow-100 text-yellow-700",
  other: "bg-gray-100 text-gray-700",
};

export const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  manager: "Gestor de Marketing",
  copywriter: "Copywriter",
  operational: "Operacional",
  viewer: "Visualizador",
};

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("pt-BR");
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleString("pt-BR");
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function parseSheetChannel(sheetName: string): string {
  const lower = sheetName.toLowerCase();
  if (lower.includes("email") || lower.includes("e-mail")) return "email";
  if (lower.includes("grupo")) return "whatsapp_group";
  if (lower.includes("individual")) return "whatsapp_individual";
  if (lower.includes("push")) return "push";
  if (lower.includes("liga") || lower.includes("call")) return "call";
  if (lower.includes("sms")) return "sms";
  return "other";
}

export function parseSheetStatus(val: string | null | undefined): string {
  if (!val) return "idea";
  const lower = val.toLowerCase().replace(/[^a-z]/g, "");
  if (lower.includes("programado") || lower.includes("scheduled")) return "scheduled";
  if (lower.includes("enviado") || lower.includes("sent")) return "sent";
  if (lower.includes("cancelado") || lower.includes("cancelled")) return "cancelled";
  if (lower.includes("escrevendo") || lower.includes("writing")) return "writing";
  if (lower.includes("revisao") || lower.includes("review")) return "review";
  if (lower.includes("aprovado") || lower.includes("approved")) return "approved";
  if (lower.includes("erro") || lower.includes("error")) return "error";
  return "idea";
}

export function parseSheetPhase(val: string | null | undefined): string {
  if (!val) return "";
  const lower = val.toLowerCase().replace(/[^a-z]/g, "");
  if (lower.includes("inscricao") || lower.includes("inscri")) return "signup";
  if (lower.includes("nutricao") || lower.includes("nutri")) return "nurturing";
  if (lower.includes("convite")) return "invite";
  if (lower.includes("lembrete")) return "reminder";
  if (lower.includes("evento")) return "event";
  if (lower.includes("pos") || lower.includes("posvento")) return "post_event";
  if (lower.includes("repescagem")) return "repechage";
  if (lower.includes("boasvindas") || lower.includes("bemvindo")) return "welcome";
  return "";
}
