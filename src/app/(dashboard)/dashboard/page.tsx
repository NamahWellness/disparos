"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  TrendingUp,
  Calendar,
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

const iconColorMap: Record<string, string> = {
  "bg-violet-50": "text-violet-600",
  "bg-green-50": "text-green-600",
  "bg-red-50": "text-red-600",
  "bg-indigo-50": "text-indigo-600",
};

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
}) {
  const iconColor = iconColorMap[color ?? "bg-indigo-50"] ?? "text-indigo-600";
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          </div>
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color ?? "bg-indigo-50"}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
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

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Dashboard" subtitle="Visão geral das campanhas" />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" subtitle="Visão geral das campanhas e disparos" />
      <div className="flex-1 overflow-auto p-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Megaphone} label="Total campanhas" value={data.totalCampaigns} sub={`${data.activeCampaigns} ativas`} />
          <StatCard icon={Send} label="Disparos programados" value={data.scheduledSends} color="bg-violet-50" />
          <StatCard icon={CheckCircle} label="Enviados" value={data.sentSends} color="bg-green-50" />
          <StatCard icon={AlertTriangle} label="Atrasados" value={data.delayed} color="bg-red-50" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Próximos disparos */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-indigo-500" />
                    Próximos 7 dias
                  </CardTitle>
                  <Link href="/sends" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                    Ver todos →
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {data.upcomingSends.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">Nenhum disparo programado</p>
                ) : (
                  <div className="space-y-2.5">
                    {data.upcomingSends.map((send) => (
                      <Link key={send.id} href={`/sends?id=${send.id}`} className="block">
                        <div className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-gray-50 transition-colors">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                            <Send className="h-4 w-4 text-indigo-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {send.subject ?? "Sem título"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {send.campaign?.name} · {formatDate(send.scheduledDate ?? null)}
                              {send.scheduledTime && ` · ${send.scheduledTime}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Badge className={CHANNEL_COLORS[send.channel]}>
                              {CHANNEL_LABELS[send.channel]}
                            </Badge>
                            <Badge className={STATUS_COLORS[send.status]}>
                              {STATUS_LABELS[send.status]}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar stats */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Por canal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.byChannel.map((item) => (
                    <div key={item.channel} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={CHANNEL_COLORS[item.channel]}>
                          {CHANNEL_LABELS[item.channel] ?? item.channel}
                        </Badge>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{item._count}</span>
                    </div>
                  ))}
                  {data.byChannel.length === 0 && (
                    <p className="text-xs text-gray-400">Nenhum dado</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Por status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.byStatus.map((item) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <Badge className={STATUS_COLORS[item.status]}>
                        {STATUS_LABELS[item.status] ?? item.status}
                      </Badge>
                      <span className="text-sm font-semibold text-gray-700">{item._count}</span>
                    </div>
                  ))}
                  {data.byStatus.length === 0 && (
                    <p className="text-xs text-gray-400">Nenhum dado</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Alertas e Top Disparos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data.alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                  Alertas ({data.alerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.alerts.map((send) => (
                    <div key={send.id} className="flex items-start gap-2 rounded-lg bg-amber-50 p-2.5">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-amber-900">{send.subject ?? "Sem título"}</p>
                        <p className="text-xs text-amber-700">
                          {send.campaign?.name}
                          {send.scheduledDate && ` · Programado para ${formatDate(send.scheduledDate)}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {data.pendingApproval > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-500" />
                  Aguardando aprovação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-blue-600">{data.pendingApproval}</p>
                    <p className="text-sm text-gray-500 mt-1">disparos em revisão</p>
                    <Link href="/sends?status=review" className="mt-3 inline-block text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                      Revisar agora →
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {data.topSends.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Top disparos por CTR
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.topSends.map((send, i) => (
                    <div key={send.id} className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-400 w-4">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{send.subject ?? "Sem título"}</p>
                        <p className="text-xs text-gray-500">{send.campaign?.name}</p>
                      </div>
                      <span className="text-sm font-bold text-green-600">
                        {send.metrics?.clickRate != null
                          ? `${(send.metrics.clickRate * 100).toFixed(1)}%`
                          : "-"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
