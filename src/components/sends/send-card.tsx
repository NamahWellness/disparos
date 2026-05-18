"use client";

import { Badge } from "@/components/ui/badge";
import {
  CHANNEL_LABELS,
  STATUS_LABELS,
  PHASE_LABELS,
  STATUS_COLORS,
  CHANNEL_COLORS,
  formatDate,
  cn,
} from "@/lib/utils";
import { Calendar, Clock, Users, ExternalLink, Mail, MessageSquare, Bell, Phone } from "lucide-react";

const CHANNEL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  whatsapp_group: MessageSquare,
  whatsapp_individual: MessageSquare,
  push: Bell,
  call: Phone,
  sms: MessageSquare,
  other: Mail,
};

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

interface SendCardProps {
  send: Send;
  onClick?: () => void;
  showCampaign?: boolean;
}

export function SendCard({ send, onClick, showCampaign }: SendCardProps) {
  const Icon = CHANNEL_ICONS[send.channel] ?? Mail;

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-all",
        onClick && "cursor-pointer hover:border-indigo-200"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", CHANNEL_COLORS[send.channel])}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{send.subject ?? "Sem título"}</p>
            {showCampaign && send.campaign && (
              <p className="text-xs text-gray-500 truncate">{send.campaign.name}</p>
            )}
          </div>
        </div>
        <Badge className={STATUS_COLORS[send.status]}>{STATUS_LABELS[send.status]}</Badge>
      </div>

      <div className="space-y-1.5">
        {send.scheduledDate && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            {formatDate(send.scheduledDate)}
            {send.scheduledTime && (
              <>
                <Clock className="h-3 w-3 ml-1" />
                {send.scheduledTime}
              </>
            )}
          </div>
        )}
        {send.audience && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Users className="h-3 w-3" />
            <span className="truncate">{send.audience}</span>
          </div>
        )}
        {send.phase && (
          <div className="flex items-center gap-1.5">
            <Badge className="bg-gray-100 text-gray-600 text-xs">
              {PHASE_LABELS[send.phase] ?? send.phase}
            </Badge>
            <Badge className={cn("text-xs", CHANNEL_COLORS[send.channel])}>
              {CHANNEL_LABELS[send.channel]}
            </Badge>
          </div>
        )}
      </div>

      {send.metrics && (send.metrics.sent ?? 0) > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs font-semibold text-gray-900">{send.metrics.sent?.toLocaleString()}</p>
            <p className="text-[10px] text-gray-400">Enviados</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900">{send.metrics.opens?.toLocaleString() ?? "-"}</p>
            <p className="text-[10px] text-gray-400">Aberturas</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900">
              {send.metrics.clickRate != null ? `${(send.metrics.clickRate * 100).toFixed(1)}%` : "-"}
            </p>
            <p className="text-[10px] text-gray-400">CTR</p>
          </div>
        </div>
      )}

      {send.copyLink && (
        <div className="mt-2">
          <a
            href={send.copyLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
          >
            <ExternalLink className="h-3 w-3" />
            Ver copy
          </a>
        </div>
      )}
    </div>
  );
}
