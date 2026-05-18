"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { CAMPAIGN_STATUS_LABELS } from "@/lib/utils";

interface Campaign {
  id?: string;
  name?: string;
  description?: string;
  product?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  tags?: string[];
  notes?: string;
  color?: string;
}

interface CampaignFormProps {
  initial?: Campaign;
  onSave: (data: Campaign) => Promise<void>;
  onCancel: () => void;
}

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"];

export function CampaignForm({ initial, onSave, onCancel }: CampaignFormProps) {
  const [form, setForm] = useState<Campaign>({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    product: initial?.product ?? "",
    startDate: initial?.startDate?.slice(0, 10) ?? "",
    endDate: initial?.endDate?.slice(0, 10) ?? "",
    status: initial?.status ?? "planning",
    tags: initial?.tags ?? [],
    notes: initial?.notes ?? "",
    color: initial?.color ?? "#6366f1",
  });
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof Campaign, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  const addTag = () => {
    if (!tagInput.trim()) return;
    set("tags", [...(form.tags ?? []), tagInput.trim()]);
    setTagInput("");
  };

  const removeTag = (tag: string) => set("tags", form.tags?.filter((t) => t !== tag));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) { setError("Nome é obrigatório"); return; }
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
        <Input
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Ex: Imersão Maio 2026"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
        <Textarea
          value={form.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Descreva a campanha..."
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Produto / Evento</label>
          <Input
            value={form.product ?? ""}
            onChange={(e) => set("product", e.target.value)}
            placeholder="Ex: Imersão Desatando Nós"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
            {Object.entries(CAMPAIGN_STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data de início</label>
          <Input type="date" value={form.startDate ?? ""} onChange={(e) => set("startDate", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data de fim</label>
          <Input type="date" value={form.endDate ?? ""} onChange={(e) => set("endDate", e.target.value)} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => set("color", c)}
              className={`h-7 w-7 rounded-full transition-transform ${form.color === c ? "scale-125 ring-2 ring-offset-2 ring-gray-400" : ""}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
            placeholder="Adicionar tag..."
          />
          <Button type="button" variant="outline" size="sm" onClick={addTag}>+</Button>
        </div>
        {(form.tags?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {form.tags?.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="hover:text-indigo-900">×</button>
              </span>
            ))}
          </div>
        )}
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
          {initial?.id ? "Salvar alterações" : "Criar campanha"}
        </Button>
      </div>
    </form>
  );
}
