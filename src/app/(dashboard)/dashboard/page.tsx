"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import {
  CHANNEL_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  CHANNEL_COLORS,
  formatDate,
} from "@/lib/utils";
import {
  Megaphone,
  Send,
  CheckCircle,
  AlertTriangle,
  Eye,
  ArrowRight,
  Clock,
} from "lucide-react";
import Link from "next/link";

interface DashboardData {
  totalCampaigns: number;
  activeCampaigns: number;
  scheduledSends: number;
  sentSends: number;
  totalSends: number;
  pendingApproval: number;
  delayed: number;
  byChannel: { channel: string; _count: number }[];
  byStatus: { status: string; _count: number }[];
  upcomingSends: {
    id: string;
    channel: string;
    subject?: string;
    scheduledDate?: string;
    scheduledTime?: string;
    status: string;
    campaign?: { id: string; name: string; color?: string };
  }[];
  alerts: {
    id: string;
    subject?: string;
    scheduledDate?: string;
    status: string;
    campaign?: { id: string; name: string };
  }[];
  topSends: {
    id: string;
    subject?: string;
    channel: string;
    metrics?: { clickRate?: number; clicks?: number; sends?: number };
    campaign?: { id: string; name: string };
  }[];
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  sub?: string;
  accent: string;
  href?: string;
}) {
  const inner = (
    <div className={`relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-shadow`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${accent}`} />
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent.replace("bg-", "bg-").replace("-600", "-50")}`}>
        <Icon className={`h-5 w-5 ${accent.replace("bg-", "text-")}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-0.5 leading-none">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function SkeletonDashboard() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" subtitle="Visão geral das campanhas e disparos" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 rounded-2xl bg-gray-100 animate-pulse" />
          <div className="h-72 rounded-2xl bg-gray-100 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonDashboard />;
  if (!data) return null;

  const totalByChannel = data.byChannel.reduce((s, i) => s + i._count, 0);
  const totalByStatus = data.byStatus.reduce((s, i) => s + i._count, 0);

  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" subtitle="Visão geral das campanhas e disparos" />
      <div className="flex-1 overflow-auto p-6 space-y-5">

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Megaphone}
            label="Campanhas"
            value={data.totalCampaigns}
            sub={`${data.activeCampaigns} em andamento`}
            accent="bg-indigo-600"
            href="/campaigns"
          />
          <StatCard
            icon={Send}
            label="Programados"
            value={data.scheduledSends}
            sub={`de ${data.totalSends} disparos`}
            accent="bg-violet-600"
            href="/sends?status=scheduled"
          />
          <StatCard
            icon={CheckCircle}
            label="Enviados"
            value={data.sentSends}
            accent="bg-green-600"
            href="/sends?status=sent"
          />
          <StatCard
            icon={AlertTriangle}
            label="Atrasados"
            value={data.delayed}
            sub={data.delayed > 0 ? "precisam de atenção" : "tudo em dia"}
            accent={data.delayed > 0 ? "bg-red-600" : "bg-gray-400"}
          />
        </div>

        {/* Alertas banner — só aparece se houver */}
        {data.alerts.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-sm font-semibold text-amber-800">
                {data.alerts.length} disparo{data.alerts.length > 1 ? "s" : ""} precisam de atenção
              </p>
              <Link href="/sends" className="ml-auto text-xs font-medium text-amber-700 hover:text-amber-900 flex items-center gap-1">
                Ver todos <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-1.5">
              {data.alerts.slice(0, 3).map((send) => (
                <div key={send.id} className="flex items-center gap-3 rounded-lg bg-white/70 px-3 py-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                  <p className="text-xs font-medium text-gray-800 truncate flex-1">{send.subject ?? "Sem título"}</p>
                  <p className="text-xs text-gray-500 shrink-0">{send.campaign?.name}</p>
                  {send.scheduledDate && (
                    <p className="text-xs text-amber-700 shrink-0">{formatDate(send.scheduledDate)}</p>
                  )}
                </div>
              ))}
              {data.alerts.length > 3 && (
                <p className="text-xs text-amber-600 px-3">+{data.alerts.length - 3} outros</p>
              )}
            </div>
          </div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Próximos 7 dias */}
          <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50">
                  <Clock className="h-4 w-4 text-indigo-600" />
                </div>
                <p className="text-sm font-semibold text-gray-900">Próximos 7 dias</p>
              </div>
              <Link href="/sends" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                Ver todos <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {data.upcomingSends.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Send className="h-8 w-8 text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">Nenhum disparo programado para os próximos 7 dias</p>
                </div>
              ) : (
                data.upcomingSends.map((send) => (
                  <Link key={send.id} href="/sends" className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: send.campaign?.color ?? "#6366f1" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{send.subject ?? "Sem título"}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{send.campaign?.name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-500">
                        {formatDate(send.scheduledDate ?? null)}
                        {send.scheduledTime && ` · ${send.scheduledTime}`}
                      </span>
                      <Badge className={`${STATUS_COLORS[send.status]} text-[10px]`}>
                        {STATUS_LABELS[send.status]}
                      </Badge>
                      <Badge className={`${CHANNEL_COLORS[send.channel]} text-[10px]`}>
                        {CHANNEL_LABELS[send.channel]}
                      </Badge>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">

            {/* Pending approval CTA */}
            {data.pendingApproval > 0 && (
              <Link href="/sends?status=review" className="block">
                <div className="rounded-2xl bg-blue-600 p-5 text-white hover:bg-blue-700 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <Eye className="h-4 w-4 opacity-80" />
                    <p className="text-sm font-medium opacity-90">Aguardando aprovação</p>
                  </div>
                  <p className="text-4xl font-bold mt-1">{data.pendingApproval}</p>
                  <p className="text-xs opacity-70 mt-1">disparo{data.pendingApproval > 1 ? "s" : ""} em revisão</p>
                  <div className="mt-3 flex items-center gap-1 text-xs font-medium">
                    Revisar agora <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            )}

            {/* Por canal */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Por canal</p>
              {data.byChannel.length === 0 ? (
                <p className="text-xs text-gray-400">Nenhum dado</p>
              ) : (
                <div className="space-y-2.5">
                  {data.byChannel.map((item) => {
                    const pct = totalByChannel > 0 ? Math.round((item._count / totalByChannel) * 100) : 0;
                    return (
                      <div key={item.channel}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-700">
                            {CHANNEL_LABELS[item.channel] ?? item.channel}
                          </span>
                          <span className="text-xs font-bold text-gray-900">{item._count}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-gray-100">
                          <div
                            className="h-1.5 rounded-full bg-indigo-500 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Por status */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Por status</p>
              {data.byStatus.length === 0 ? (
                <p className="text-xs text-gray-400">Nenhum dado</p>
              ) : (
                <div className="space-y-2">
                  {data.byStatus.map((item) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <Badge className={`${STATUS_COLORS[item.status]} text-[10px]`}>
                        {STATUS_LABELS[item.status] ?? item.status}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-gray-100">
                          <div
                            className="h-1.5 rounded-full bg-gray-400 transition-all"
                            style={{ width: `${totalByStatus > 0 ? Math.round((item._count / totalByStatus) * 100) : 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-700 w-4 text-right">{item._count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
