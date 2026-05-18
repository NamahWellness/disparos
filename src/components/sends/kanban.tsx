"use client";

import { useMemo } from "react";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";
import { SendCard } from "./send-card";
import { Badge } from "@/components/ui/badge";

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

interface KanbanProps {
  sends: Send[];
  onClickSend?: (send: Send) => void;
  showCampaign?: boolean;
}

const STATUS_ORDER = ["idea", "writing", "review", "approved", "scheduled", "sent", "cancelled", "error"];

export function Kanban({ sends, onClickSend, showCampaign }: KanbanProps) {
  const grouped = useMemo(() =>
    STATUS_ORDER.reduce<Record<string, Send[]>>((acc, status) => {
      acc[status] = sends.filter((s) => s.status === status);
      return acc;
    }, {}),
  [sends]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STATUS_ORDER.map((status) => {
        const items = grouped[status];
        if (items.length === 0 && !["idea", "writing", "review", "approved", "scheduled"].includes(status)) return null;
        return (
          <div key={status} className="flex-shrink-0 w-72">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge className={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Badge>
              </div>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                {items.length}
              </span>
            </div>
            <div className="space-y-2.5 min-h-[100px] rounded-xl bg-gray-50/60 p-2">
              {items.map((send) => (
                <SendCard
                  key={send.id}
                  send={send}
                  onClick={onClickSend ? () => onClickSend(send) : undefined}
                  showCampaign={showCampaign}
                />
              ))}
              {items.length === 0 && (
                <div className="flex items-center justify-center h-16 text-xs text-gray-400">
                  Nenhum disparo
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
