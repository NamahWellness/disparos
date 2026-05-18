"use client";

import { useEffect, useState, use, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SendForm } from "@/components/sends/send-form";
import { Kanban } from "@/components/sends/kanban";
import { SendCard } from "@/components/sends/send-card";
import {
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUS_COLORS,
  STATUS_LABELS,
  STATUS_COLORS,
  CHANNEL_LABELS,
  CHANNEL_COLORS,
  formatDate,
  formatDateTime,
} from "@/lib/utils";
import {
  Plus,
  Calendar,
  LayoutGrid,
  List,
  ArrowLeft,
  Edit,
  CheckCircle,
  Send,
  Clock,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

interface SendData {
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
  copyOwner?: { id: string; name: string } | null;
  sendOwner?: { id: string; name: string } | null;
}

interface CampaignDetail {
  id: string;
  name: string;
  description?: string;
  product?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  tags?: string;
  notes?: string;
  color?: string;
  owner: { id: string; name: string; email: string };
  sends: SendData[];
  _count: { sends: number };
}

type ViewMode = "list" | "kanban";

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("list");
  const [showAddSend, setShowAddSend] = useState(false);
  const [editingSend, setEditingSend] = useState<SendData | null>(null);
  const [activeTab, setActiveTab] = useState("sends");

  const load = useCallback(async () => {
    const res = await fetch(`/api/campaigns/${id}`);
    const data = await res.json();
    setCampaign(data);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleCreateSend = async (data: object) => {
    const res = await fetch("/api/sends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, campaignId: id }),
    });
    if (!res.ok) throw new Error("Erro ao criar disparo");
    setShowAddSend(false);
    load();
  };

  const handleEditSend = async (data: object) => {
    if (!editingSend) return;
    const res = await fetch(`/api/sends/${editingSend.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Erro ao editar");
    setEditingSend(null);
    load();
  };

  const handleDeleteSend = async (sendId: string) => {
    if (!confirm("Excluir este disparo?")) return;
    await fetch(`/api/sends/${sendId}`, { method: "DELETE" });
    load();
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Carregando..." />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      </div>
    );
  }

  if (!campaign) return null;

  const tags = (() => { try { return JSON.parse(campaign.tags ?? "[]") as string[]; } catch { return []; } })();

  const sentCount = campaign.sends.filter((s) => s.status === "sent").length;
  const scheduledCount = campaign.sends.filter((s) => s.status === "scheduled").length;
  const pendingCount = campaign.sends.filter((s) => ["idea", "writing", "review"].includes(s.status)).length;

  const totalSent = campaign.sends.reduce((acc, s) => acc + (s.metrics?.sent ?? 0), 0);
  const totalClicks = campaign.sends.reduce((acc, s) => acc + (s.metrics?.clicks ?? 0), 0);

  return (
    <div className="flex flex-col h-full">
      <Header
        title={campaign.name}
        subtitle={campaign.product ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/campaigns">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Voltar
              </Button>
            </Link>
            <Button onClick={() => setShowAddSend(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Novo disparo
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto">
        {/* Campaign header */}
        <div className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: campaign.color ?? "#6366f1" }} />
              <Badge className={CAMPAIGN_STATUS_COLORS[campaign.status]}>
                {CAMPAIGN_STATUS_LABELS[campaign.status]}
              </Badge>
            </div>
            {tags.map((tag) => (
              <span key={tag} className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                {tag}
              </span>
            ))}
            <span className="text-sm text-gray-500">
              {campaign.startDate && formatDate(campaign.startDate)}
              {campaign.endDate && ` → ${formatDate(campaign.endDate)}`}
            </span>
            <span className="text-sm text-gray-500">Responsável: {campaign.owner.name}</span>
          </div>
          {campaign.description && (
            <p className="mt-2 text-sm text-gray-600">{campaign.description}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-white px-6">
          <div className="flex gap-6">
            {["sends", "overview", "history"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "sends" ? "Disparos" : tab === "overview" ? "Visão Geral" : "Histórico"}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === "overview" && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{campaign._count.sends}</p>
                  <p className="text-xs text-gray-500 mt-1">Total disparos</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{sentCount}</p>
                  <p className="text-xs text-gray-500 mt-1">Enviados</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-violet-600">{scheduledCount}</p>
                  <p className="text-xs text-gray-500 mt-1">Programados</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
                  <p className="text-xs text-gray-500 mt-1">Em produção</p>
                </CardContent>
              </Card>
              {totalSent > 0 && (
                <>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-gray-900">{totalSent.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-1">Total enviados</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-gray-900">{totalClicks.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-1">Total cliques</p>
                    </CardContent>
                  </Card>
                </>
              )}
              {campaign.notes && (
                <Card className="col-span-2 lg:col-span-4">
                  <CardHeader><CardTitle>Observações</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{campaign.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === "sends" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">{campaign.sends.length} disparos</p>
                <div className="flex gap-1.5 rounded-lg border border-gray-200 p-1">
                  <button
                    onClick={() => setView("list")}
                    className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${view === "list" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setView("kanban")}
                    className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${view === "kanban" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {campaign.sends.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 mb-3">
                    <Send className="h-6 w-6 text-indigo-400" />
                  </div>
                  <p className="text-gray-600 font-medium">Nenhum disparo ainda</p>
                  <Button className="mt-4" onClick={() => setShowAddSend(true)}>
                    <Plus className="h-4 w-4 mr-1.5" />
                    Criar primeiro disparo
                  </Button>
                </div>
              ) : view === "kanban" ? (
                <Kanban sends={campaign.sends} onClickSend={setEditingSend} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {campaign.sends.map((send) => (
                    <SendCard
                      key={send.id}
                      send={send}
                      onClick={() => setEditingSend(send)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <Card>
              <CardHeader><CardTitle>Histórico de alterações</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400">Histórico disponível em breve.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Modal open={showAddSend} onClose={() => setShowAddSend(false)} title="Novo disparo" size="lg">
        <SendForm campaignId={id} onSave={handleCreateSend} onCancel={() => setShowAddSend(false)} />
      </Modal>

      <Modal open={!!editingSend} onClose={() => setEditingSend(null)} title="Editar disparo" size="lg">
        {editingSend && (
          <div>
            <SendForm
              initial={{
                ...editingSend,
                base: editingSend.base ?? undefined,
                scheduledDate: editingSend.scheduledDate ?? undefined,
                scheduledTime: editingSend.scheduledTime ?? undefined,
                subject: editingSend.subject ?? undefined,
                audience: editingSend.audience ?? undefined,
                copyLink: editingSend.copyLink ?? undefined,
                phase: editingSend.phase ?? undefined,
                copyOwnerId: editingSend.copyOwner?.id,
                sendOwnerId: editingSend.sendOwner?.id,
              }}
              campaignId={id}
              onSave={handleEditSend}
              onCancel={() => setEditingSend(null)}
            />
            <div className="px-6 pb-4 border-t border-gray-100 pt-3">
              <button
                onClick={() => handleDeleteSend(editingSend.id)}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Excluir disparo
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
