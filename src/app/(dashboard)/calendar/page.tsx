"use client";

import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { SendForm } from "@/components/sends/send-form";
import {
  CHANNEL_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  CHANNEL_COLORS,
} from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Send {
  id: string;
  channel: string;
  subject?: string | null;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  status: string;
  phase?: string | null;
  audience?: string | null;
  copyLink?: string | null;
  campaign?: { id: string; name: string; color?: string | null };
}

export default function CalendarPage() {
  const [sends, setSends] = useState<Send[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selected, setSelected] = useState<Send | null>(null);
  const [editingSend, setEditingSend] = useState<Send | null>(null);

  const load = useCallback(async () => {
    const from = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const to = format(endOfMonth(currentMonth), "yyyy-MM-dd");
    const res = await fetch(`/api/sends?from=${from}&to=${to}`);
    const data = await res.json();
    setSends(Array.isArray(data) ? data : []);
  }, [currentMonth]);

  useEffect(() => { load(); }, [load]);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getSendsForDay = (day: Date) =>
    sends.filter((s) => s.scheduledDate && isSameDay(new Date(s.scheduledDate), day));

  const firstDayOfWeek = getDay(startOfMonth(currentMonth));

  const handleEditSend = async (data: object) => {
    if (!editingSend) return;
    await fetch(`/api/sends/${editingSend.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setEditingSend(null);
    load();
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Calendário" subtitle="Visualize os disparos por data" />
      <div className="flex-1 overflow-auto p-6">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="rounded-lg border border-gray-200 px-3 text-sm hover:bg-gray-50"
            >
              Hoje
            </button>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {/* Week headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
              <div key={d} className="py-3 text-center text-xs font-medium text-gray-500">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {/* Empty cells for first week */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[120px] border-b border-r border-gray-100 p-2 bg-gray-50/50" />
            ))}

            {days.map((day) => {
              const daySends = getSendsForDay(day);
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[120px] border-b border-r border-gray-100 p-2 ${
                    !isSameMonth(day, currentMonth) ? "bg-gray-50/50" : ""
                  }`}
                >
                  <div className={`mb-1.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                    isToday ? "bg-indigo-600 text-white" : "text-gray-700"
                  }`}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-0.5">
                    {daySends.slice(0, 3).map((send) => (
                      <button
                        key={send.id}
                        onClick={() => setEditingSend(send)}
                        className="block w-full text-left"
                      >
                        <div
                          className="truncate rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
                          style={{ backgroundColor: send.campaign?.color ?? "#6366f1" }}
                          title={send.subject ?? "Sem título"}
                        >
                          {send.scheduledTime && `${send.scheduledTime} `}
                          {send.subject ?? CHANNEL_LABELS[send.channel]}
                        </div>
                      </button>
                    ))}
                    {daySends.length > 3 && (
                      <p className="text-[10px] text-gray-400 px-1">+{daySends.length - 3} mais</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-3">
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <div key={v} className="flex items-center gap-1.5">
              <Badge className={STATUS_COLORS[v]}>{l}</Badge>
            </div>
          ))}
        </div>
      </div>

      <Modal open={!!editingSend} onClose={() => setEditingSend(null)} title="Editar disparo" size="lg">
        {editingSend && (
          <SendForm
            initial={{
              ...editingSend,
              scheduledDate: editingSend.scheduledDate ?? undefined,
              scheduledTime: editingSend.scheduledTime ?? undefined,
              subject: editingSend.subject ?? undefined,
              audience: editingSend.audience ?? undefined,
              copyLink: editingSend.copyLink ?? undefined,
              phase: editingSend.phase ?? undefined,
            }}
            campaignId={editingSend.campaign?.id}
            onSave={handleEditSend}
            onCancel={() => setEditingSend(null)}
          />
        )}
      </Modal>
    </div>
  );
}
