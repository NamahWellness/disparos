"use client";

import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { SendForm } from "@/components/sends/send-form";
import { SendCard } from "@/components/sends/send-card";
import { Kanban } from "@/components/sends/kanban";
import {
  CHANNEL_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  CHANNEL_COLORS,
  PHASE_LABELS,
  formatDate,
} from "@/lib/utils";
import { Plus, Search, List, LayoutGrid, Filter, ExternalLink, Copy, Trash2 } from "lucide-react";

interface Send {
  id: string;
  channel: string;
  base?: string | null;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  status: string;
  phase?: string | null;
  subject?: string | null;
  audience?: string | null;
  copyLink?: string | null;
  campaign?: { id: string; name: string; color?: string | null };
  metrics?: {
    sent?: number | null;
    opens?: number | null;
    clicks?: number | null;
    clickRate?: number | null;
  } | null;
}

type ViewMode = "list" | "kanban" | "table";

export default function SendsPage() {
  const [sends, setSends] = useState<Send[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [channel, setChannel] = useState("");
  const [status, setStatus] = useState("");
  const [phase, setPhase] = useState("");
  const [view, setView] = useState<ViewMode>("list");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Send | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (channel) params.set("channel", channel);
    if (status) params.set("status", status);
    if (phase) params.set("phase", phase);
    const res = await fetch(`/api/sends?${params}`);
    const data = await res.json();
    setSends(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [debouncedSearch, channel, status, phase]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data: object) => {
    const res = await fetch("/api/sends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Erro ao criar");
    setShowCreate(false);
    load();
  };

  const handleEdit = async (data: object) => {
    if (!editing) return;
    const res = await fetch(`/api/sends/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Erro ao editar");
    setEditing(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este disparo?")) return;
    await fetch(`/api/sends/${id}`, { method: "DELETE" });
    load();
  };

  const handleDuplicate = async (id: string) => {
    await fetch(`/api/sends/${id}/duplicate`, { method: "POST" });
    load();
  };

  const handleBulkStatus = async () => {
    if (!selected.length || !bulkStatus) return;
    await fetch("/api/sends/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selected, status: bulkStatus }),
    });
    setSelected([]);
    setBulkStatus("");
    load();
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Disparos"
        subtitle={`${sends.length} disparos`}
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Novo disparo
          </Button>
        }
      />

      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input className="pl-9" placeholder="Buscar disparos..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={channel} onChange={(e) => setChannel(e.target.value)} className="w-44">
            <option value="">Todos os canais</option>
            {Object.entries(CHANNEL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
            <option value="">Todos os status</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
          <Select value={phase} onChange={(e) => setPhase(e.target.value)} className="w-40">
            <option value="">Todas as fases</option>
            {Object.entries(PHASE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
          <div className="flex gap-1.5 rounded-lg border border-gray-200 p-1">
            {(["list", "kanban", "table"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors ${view === v ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-gray-600"}`}
              >
                {v === "list" && <><List className="h-3.5 w-3.5" />Lista</>}
                {v === "kanban" && <><LayoutGrid className="h-3.5 w-3.5" />Kanban</>}
                {v === "table" && <><Filter className="h-3.5 w-3.5" />Tabela</>}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk actions */}
        {selected.length > 0 && (
          <div className="flex items-center gap-3 rounded-lg bg-indigo-50 px-4 py-2.5">
            <span className="text-sm font-medium text-indigo-700">{selected.length} selecionados</span>
            <Select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} className="w-40 h-8 text-xs">
              <option value="">Alterar status...</option>
              {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
            <Button size="sm" onClick={handleBulkStatus} disabled={!bulkStatus}>Aplicar</Button>
            <button onClick={() => setSelected([])} className="ml-auto text-xs text-indigo-600 hover:text-indigo-700">Limpar</button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : sends.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-gray-600 font-medium">Nenhum disparo encontrado</p>
            <Button className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Criar disparo
            </Button>
          </div>
        ) : view === "kanban" ? (
          <Kanban sends={sends} onClickSend={setEditing} showCampaign />
        ) : view === "table" ? (
          <div className="overflow-auto rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="w-8 px-4 py-3">
                    <input type="checkbox" onChange={(e) => setSelected(e.target.checked ? sends.map((s) => s.id) : [])} />
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Assunto</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Campanha</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Canal</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Data</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Enviados</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Cliques</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">CTR</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {sends.map((send) => (
                  <tr key={send.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(send.id)}
                        onChange={() => toggleSelect(send.id)}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">
                      {send.subject ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{send.campaign?.name ?? "-"}</td>
                    <td className="px-4 py-3">
                      <Badge className={CHANNEL_COLORS[send.channel]}>{CHANNEL_LABELS[send.channel]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={STATUS_COLORS[send.status]}>{STATUS_LABELS[send.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {send.scheduledDate ? formatDate(send.scheduledDate) : "-"}
                      {send.scheduledTime && ` ${send.scheduledTime}`}
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs">{send.metrics?.sent?.toLocaleString() ?? "-"}</td>
                    <td className="px-4 py-3 text-gray-700 text-xs">{send.metrics?.clicks?.toLocaleString() ?? "-"}</td>
                    <td className="px-4 py-3 text-green-600 text-xs font-medium">
                      {send.metrics?.clickRate != null ? `${(send.metrics.clickRate * 100).toFixed(1)}%` : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditing(send)} className="p-1 hover:bg-gray-100 rounded">
                          <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
                        </button>
                        <button onClick={() => handleDuplicate(send.id)} className="p-1 hover:bg-gray-100 rounded">
                          <Copy className="h-3.5 w-3.5 text-gray-400" />
                        </button>
                        <button onClick={() => handleDelete(send.id)} className="p-1 hover:bg-red-50 rounded">
                          <Trash2 className="h-3.5 w-3.5 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {sends.map((send) => (
              <SendCard key={send.id} send={send} onClick={() => setEditing(send)} showCampaign />
            ))}
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Novo disparo" size="lg">
        <SendForm onSave={handleCreate} onCancel={() => setShowCreate(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar disparo" size="lg">
        {editing && (
          <div>
            <SendForm
              initial={{
                ...editing,
                base: editing.base ?? undefined,
                scheduledDate: editing.scheduledDate ?? undefined,
                scheduledTime: editing.scheduledTime ?? undefined,
                subject: editing.subject ?? undefined,
                audience: editing.audience ?? undefined,
                copyLink: editing.copyLink ?? undefined,
                phase: editing.phase ?? undefined,
              }}
              onSave={handleEdit}
              onCancel={() => setEditing(null)}
            />
            <div className="px-6 pb-4 border-t border-gray-100 pt-3 flex gap-3">
              <button onClick={() => { handleDuplicate(editing.id); setEditing(null); }} className="text-sm text-indigo-600 hover:text-indigo-700">
                Duplicar
              </button>
              <button onClick={() => { handleDelete(editing.id); setEditing(null); }} className="text-sm text-red-600 hover:text-red-700">
                Excluir
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
