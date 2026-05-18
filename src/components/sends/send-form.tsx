"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  CHANNEL_LABELS,
  STATUS_LABELS,
  PHASE_LABELS,
} from "@/lib/utils";
import {
  Mail, Users, MessageCircle, Bell, Phone, MessageSquare, Layers,
  ChevronDown, ChevronUp, Link2, CalendarDays, Clock, User2, Send,
} from "lucide-react";

interface SendFormData {
  id?: string;
  campaignId?: string;
  channel?: string;
  base?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  status?: string;
  phase?: string;
  subject?: string;
  audience?: string;
  copyLink?: string;
  copyOwnerId?: string;
  sendOwnerId?: string;
  platform?: string;
  externalId?: string;
  notes?: string;
}

interface User { id: string; name: string; email: string }
interface Campaign { id: string; name: string }

interface SendFormProps {
  initial?: SendFormData;
  campaignId?: string;
  onSave: (data: SendFormData) => Promise<void>;
  onCancel: () => void;
}

const CHANNEL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  whatsapp_group: Users,
  whatsapp_individual: MessageCircle,
  push: Bell,
  call: Phone,
  sms: MessageSquare,
  other: Layers,
};

const STATUS_CHIP_STYLES: Record<string, { base: string; active: string }> = {
  idea:      { base: "border-gray-200 text-gray-500 hover:border-gray-300",       active: "bg-gray-100 border-gray-400 text-gray-800 font-semibold" },
  writing:   { base: "border-blue-200 text-blue-500 hover:border-blue-300",       active: "bg-blue-100 border-blue-500 text-blue-800 font-semibold" },
  review:    { base: "border-amber-200 text-amber-600 hover:border-amber-300",    active: "bg-amber-100 border-amber-500 text-amber-800 font-semibold" },
  approved:  { base: "border-emerald-200 text-emerald-600 hover:border-emerald-300", active: "bg-emerald-100 border-emerald-500 text-emerald-800 font-semibold" },
  scheduled: { base: "border-indigo-200 text-indigo-600 hover:border-indigo-300", active: "bg-indigo-100 border-indigo-500 text-indigo-800 font-semibold" },
  sent:      { base: "border-green-200 text-green-600 hover:border-green-300",    active: "bg-green-100 border-green-500 text-green-800 font-semibold" },
  cancelled: { base: "border-gray-200 text-gray-400 hover:border-gray-300",       active: "bg-gray-100 border-gray-400 text-gray-600 font-semibold" },
  error:     { base: "border-red-200 text-red-500 hover:border-red-300",          active: "bg-red-100 border-red-500 text-red-800 font-semibold" },
};

const PLATFORMS = ["activecampaign", "whatsapp", "push", "sms", "manual", "other"];
const PLATFORM_LABELS: Record<string, string> = {
  activecampaign: "ActiveCampaign", whatsapp: "WhatsApp", push: "Push",
  sms: "SMS", manual: "Manual", other: "Outro",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
      {children}
    </p>
  );
}

export function SendForm({ initial, campaignId, onSave, onCancel }: SendFormProps) {
  const [form, setForm] = useState<SendFormData>({
    campaignId: initial?.campaignId ?? campaignId ?? "",
    channel: initial?.channel ?? "email",
    base: initial?.base ?? "",
    scheduledDate: initial?.scheduledDate?.slice(0, 10) ?? "",
    scheduledTime: initial?.scheduledTime ?? "",
    status: initial?.status ?? "idea",
    phase: initial?.phase ?? "",
    subject: initial?.subject ?? "",
    audience: initial?.audience ?? "",
    copyLink: initial?.copyLink ?? "",
    copyOwnerId: initial?.copyOwnerId ?? "",
    sendOwnerId: initial?.sendOwnerId ?? "",
    platform: initial?.platform ?? "",
    externalId: initial?.externalId ?? "",
    notes: initial?.notes ?? "",
  });

  const [users, setUsers] = useState<User[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(
    !!(initial?.platform || initial?.externalId || initial?.notes)
  );

  useEffect(() => {
    Promise.all([
      fetch("/api/users").then((r) => r.json()).catch(() => []),
      campaignId ? Promise.resolve([]) : fetch("/api/campaigns").then((r) => r.json()).catch(() => []),
    ]).then(([u, c]) => { setUsers(u); setCampaigns(c); });
  }, [campaignId]);

  const set = (key: keyof SendFormData, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.campaignId) { setError("Selecione uma campanha"); return; }
    if (!form.channel) { setError("Selecione um canal"); return; }
    setLoading(true);
    setError("");
    try { await onSave(form); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Erro ao salvar"); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* ── Canal ── */}
        <div>
          <SectionLabel>Canal</SectionLabel>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {Object.entries(CHANNEL_LABELS).map(([value, label]) => {
              const Icon = CHANNEL_ICONS[value] ?? Layers;
              const active = form.channel === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => set("channel", value)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all text-center ${
                    active
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 text-gray-500 hover:border-indigo-200 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="text-[10px] font-medium leading-tight">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Status ── */}
        <div>
          <SectionLabel>Status</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {Object.entries(STATUS_LABELS).map(([value, label]) => {
              const styles = STATUS_CHIP_STYLES[value] ?? STATUS_CHIP_STYLES.idea;
              const active = form.status === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => set("status", value)}
                  className={`rounded-full border px-3 py-1 text-xs transition-all ${
                    active ? styles.active : styles.base
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Campanha ── */}
        {!campaignId && (
          <div>
            <SectionLabel>Campanha</SectionLabel>
            <Select value={form.campaignId} onChange={(e) => set("campaignId", e.target.value)}>
              <option value="">Selecionar campanha...</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
        )}

        {/* ── Conteúdo ── */}
        <div>
          <SectionLabel>Conteúdo</SectionLabel>
          <div className="space-y-3">
            <Input
              value={form.subject ?? ""}
              onChange={(e) => set("subject", e.target.value)}
              placeholder="Assunto / Tema / Objetivo"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                value={form.audience ?? ""}
                onChange={(e) => set("audience", e.target.value)}
                placeholder="Público / Lista"
              />
              <Input
                value={form.base ?? ""}
                onChange={(e) => set("base", e.target.value)}
                placeholder="Base / Tipo (ex: VIP, Automação)"
              />
            </div>
          </div>
        </div>

        {/* ── Fase ── */}
        <div>
          <SectionLabel>Fase do funil</SectionLabel>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => set("phase", "")}
              className={`rounded-full border px-3 py-1 text-xs transition-all ${
                !form.phase
                  ? "bg-gray-100 border-gray-400 text-gray-700 font-semibold"
                  : "border-gray-200 text-gray-400 hover:border-gray-300"
              }`}
            >
              Nenhuma
            </button>
            {Object.entries(PHASE_LABELS).map(([value, label]) => {
              const active = form.phase === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => set("phase", value)}
                  className={`rounded-full border px-3 py-1 text-xs transition-all ${
                    active
                      ? "bg-violet-100 border-violet-500 text-violet-800 font-semibold"
                      : "border-violet-200 text-violet-500 hover:border-violet-300"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Agendamento ── */}
        <div>
          <SectionLabel>Agendamento</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <CalendarDays className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              <Input
                type="date"
                value={form.scheduledDate ?? ""}
                onChange={(e) => set("scheduledDate", e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="relative">
              <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              <Input
                value={form.scheduledTime ?? ""}
                onChange={(e) => set("scheduledTime", e.target.value)}
                placeholder="Ex: 10:00"
                className="pl-9"
              />
            </div>
          </div>
        </div>

        {/* ── Copy & Responsáveis ── */}
        <div>
          <SectionLabel>Copy & Responsáveis</SectionLabel>
          <div className="space-y-3">
            <div className="relative">
              <Link2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              <Input
                value={form.copyLink ?? ""}
                onChange={(e) => set("copyLink", e.target.value)}
                placeholder="Link da copy (Google Docs, Notion…)"
                type="url"
                className="pl-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <User2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                <Select
                  value={form.copyOwnerId ?? ""}
                  onChange={(e) => set("copyOwnerId", e.target.value)}
                  className="pl-9"
                >
                  <option value="">Resp. pela copy</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </Select>
              </div>
              <div className="relative">
                <Send className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                <Select
                  value={form.sendOwnerId ?? ""}
                  onChange={(e) => set("sendOwnerId", e.target.value)}
                  className="pl-9"
                >
                  <option value="">Resp. pelo disparo</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* ── Avançado ── */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {showAdvanced ? "Ocultar campos avançados" : "Campos avançados (plataforma, ID externo, notas)"}
          </button>
          {showAdvanced && (
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Select value={form.platform ?? ""} onChange={(e) => set("platform", e.target.value)}>
                  <option value="">Plataforma de envio</option>
                  {PLATFORMS.map((p) => <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>)}
                </Select>
                <Input
                  value={form.externalId ?? ""}
                  onChange={(e) => set("externalId", e.target.value)}
                  placeholder="ID externo na plataforma"
                />
              </div>
              <Textarea
                value={form.notes ?? ""}
                onChange={(e) => set("notes", e.target.value)}
                rows={2}
                placeholder="Observações internas…"
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={loading}>
          {initial?.id ? "Salvar alterações" : "Criar disparo"}
        </Button>
      </div>
    </form>
  );
}
