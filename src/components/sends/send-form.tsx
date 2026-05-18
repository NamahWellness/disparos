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

interface User {
  id: string;
  name: string;
  email: string;
}

interface Campaign {
  id: string;
  name: string;
}

interface SendFormProps {
  initial?: SendFormData;
  campaignId?: string;
  onSave: (data: SendFormData) => Promise<void>;
  onCancel: () => void;
}

const PLATFORMS = ["activecampaign", "whatsapp", "push", "sms", "manual", "other"];
const PLATFORM_LABELS: Record<string, string> = {
  activecampaign: "ActiveCampaign",
  whatsapp: "WhatsApp",
  push: "Push",
  sms: "SMS",
  manual: "Manual",
  other: "Outro",
};

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

  useEffect(() => {
    const fetches: [Promise<User[]>, Promise<Campaign[]>] = [
      fetch("/api/users").then((r) => r.json()).catch(() => []),
      campaignId ? Promise.resolve([]) : fetch("/api/campaigns").then((r) => r.json()).catch(() => []),
    ];
    Promise.all(fetches).then(([u, c]) => {
      setUsers(u);
      setCampaigns(c);
    });
  }, [campaignId]);

  const set = (key: keyof SendFormData, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.campaignId) { setError("Campanha é obrigatória"); return; }
    if (!form.channel) { setError("Canal é obrigatório"); return; }
    setLoading(true);
    setError("");
    try {
      await onSave(form);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {!campaignId && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Campanha *</label>
          <Select value={form.campaignId} onChange={(e) => set("campaignId", e.target.value)}>
            <option value="">Selecionar campanha...</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Canal *</label>
          <Select value={form.channel} onChange={(e) => set("channel", e.target.value)}>
            {Object.entries(CHANNEL_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Assunto / Tema / Objetivo</label>
        <Input
          value={form.subject ?? ""}
          onChange={(e) => set("subject", e.target.value)}
          placeholder="Ex: Abertura de inscrições - Lote 1"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fase</label>
          <Select value={form.phase ?? ""} onChange={(e) => set("phase", e.target.value)}>
            <option value="">Nenhuma</option>
            {Object.entries(PHASE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Base / Tipo</label>
          <Input
            value={form.base ?? ""}
            onChange={(e) => set("base", e.target.value)}
            placeholder="Ex: Base, Compradores, Automação..."
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data programada</label>
          <Input type="date" value={form.scheduledDate ?? ""} onChange={(e) => set("scheduledDate", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
          <Input
            value={form.scheduledTime ?? ""}
            onChange={(e) => set("scheduledTime", e.target.value)}
            placeholder="Ex: 08h00"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Público / Lista</label>
        <Input
          value={form.audience ?? ""}
          onChange={(e) => set("audience", e.target.value)}
          placeholder="Ex: Compradores imersão, Base segmentada..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Link da copy</label>
        <Input
          value={form.copyLink ?? ""}
          onChange={(e) => set("copyLink", e.target.value)}
          placeholder="https://docs.google.com/..."
          type="url"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Resp. pela copy</label>
          <Select value={form.copyOwnerId ?? ""} onChange={(e) => set("copyOwnerId", e.target.value)}>
            <option value="">Nenhum</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Resp. pelo disparo</label>
          <Select value={form.sendOwnerId ?? ""} onChange={(e) => set("sendOwnerId", e.target.value)}>
            <option value="">Nenhum</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Plataforma de envio</label>
          <Select value={form.platform ?? ""} onChange={(e) => set("platform", e.target.value)}>
            <option value="">Selecionar...</option>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID externo</label>
          <Input
            value={form.externalId ?? ""}
            onChange={(e) => set("externalId", e.target.value)}
            placeholder="ID na plataforma..."
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
        <Textarea
          value={form.notes ?? ""}
          onChange={(e) => set("notes", e.target.value)}
          rows={2}
          placeholder="Notas internas..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={loading}>
          {initial?.id ? "Salvar alterações" : "Criar disparo"}
        </Button>
      </div>
    </form>
  );
}
