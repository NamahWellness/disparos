"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { CampaignForm } from "@/components/campaigns/campaign-form";
import { useToast } from "@/components/ui/toast";
import {
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUS_COLORS,
  formatDate,
} from "@/lib/utils";
import { Plus, Search, MoreHorizontal, Copy, Trash2, Edit, Send, ExternalLink, X } from "lucide-react";
import Link from "next/link";

interface Campaign {
  id: string;
  name: string;
  description?: string;
  product?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  tags?: string;
  color?: string;
  owner: { id: string; name: string; email: string };
  _count: { sends: number };
  createdAt: string;
}

export default function CampaignsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);


  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/campaigns?${params}`);
    const data = await res.json();
    setCampaigns(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [debouncedSearch, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data: object) => {
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erro ao criar campanha");
      setShowCreate(false);
      load();
      toast.success("Campanha criada!");
    } catch {
      toast.error("Erro ao salvar campanha");
      throw new Error("Erro ao criar campanha");
    }
  };

  const handleEdit = async (data: object) => {
    if (!editing) return;
    try {
      const res = await fetch(`/api/campaigns/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erro ao editar");
      setEditing(null);
      load();
      toast.success("Campanha salva!");
    } catch {
      toast.error("Erro ao salvar campanha");
      throw new Error("Erro ao editar");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/campaigns/${id}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error("Erro ao duplicar");
      load();
      toast.success("Campanha duplicada!");
    } catch {
      toast.error("Erro ao salvar campanha");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza? Isso apagará todos os disparos da campanha.")) return;
    try {
      await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
      load();
      toast.success("Campanha excluída!");
    } catch {
      toast.error("Erro ao salvar campanha");
    }
  };

  const parseTags = (c: Campaign): string[] => {
    try { return JSON.parse(c.tags ?? "[]") as string[]; }
    catch { return []; }
  };

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Campanhas"
        subtitle={`${campaigns.length} campanhas encontradas`}
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Nova campanha
          </Button>
        }
      />

      <div className="p-6 space-y-4">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              className="pl-9 pr-8"
              placeholder="Buscar campanhas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-48">
            <option value="">Todos os status</option>
            {Object.entries(CAMPAIGN_STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 mb-4">
              <Send className="h-7 w-7 text-indigo-400" />
            </div>
            <p className="text-gray-700 font-medium">Nenhuma campanha encontrada</p>
            <p className="text-sm text-gray-400 mt-1">Crie a primeira campanha para começar</p>
            <Button className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Criar campanha
            </Button>
          </div>
        ) : (
          <>
          {openMenuId && (
            <div className="fixed inset-0 z-[5]" onClick={() => setOpenMenuId(null)} />
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {campaigns.map((c) => {
              const campaignTags = parseTags(c);
              return (
              <div
                key={c.id}
                className="relative rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer"
                onClick={() => router.push(`/campaigns/${c.id}`)}
              >
                <div className="h-1.5" style={{ backgroundColor: c.color ?? "#6366f1" }} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/campaigns/${c.id}`}
                        className="hover:text-indigo-600 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <h3 className="font-semibold text-gray-900 truncate">{c.name}</h3>
                      </Link>
                      {c.product && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{c.product}</p>
                      )}
                    </div>
                    <div className="relative ml-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === c.id ? null : c.id); }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <MoreHorizontal className="h-4 w-4 text-gray-400" />
                      </button>
                      {openMenuId === c.id && (
                        <div className="absolute right-0 top-9 z-10 w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-lg" onClick={(e) => e.stopPropagation()}>
                          <Link
                            href={`/campaigns/${c.id}`}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }}
                          >
                            <ExternalLink className="h-4 w-4" />
                            Ver detalhes
                          </Link>
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditing(c); setOpenMenuId(null); }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Edit className="h-4 w-4" />
                            Editar
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDuplicate(c.id); setOpenMenuId(null); }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Copy className="h-4 w-4" />
                            Duplicar
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(c.id); setOpenMenuId(null); }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {c.description && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{c.description}</p>
                  )}

                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={CAMPAIGN_STATUS_COLORS[c.status]}>
                      {CAMPAIGN_STATUS_LABELS[c.status]}
                    </Badge>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-500">{c._count.sends} disparos</span>
                  </div>

                  {campaignTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {campaignTags.slice(0, 3).map((tag) => (
                        <span key={tag} className="inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
                    <span>
                      {c.startDate ? formatDate(c.startDate) : "Sem data"}
                      {c.endDate ? ` → ${formatDate(c.endDate)}` : ""}
                    </span>
                    <span>{c.owner.name}</span>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
          </>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nova campanha" size="lg">
        <CampaignForm onSave={handleCreate} onCancel={() => setShowCreate(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar campanha" size="lg">
        {editing && (
          <CampaignForm
            initial={{
              ...editing,
              tags: parseTags(editing),
            }}
            onSave={handleEdit}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  );
}
