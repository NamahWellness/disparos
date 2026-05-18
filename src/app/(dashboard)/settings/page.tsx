"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ROLE_LABELS } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function SettingsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users").then((r) => r.json()).then((data) => {
      setUsers(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  const updateRole = async (userId: string, newRole: string, currentRole: string) => {
    if (!confirm(`Alterar papel de "${ROLE_LABELS[currentRole]}" para "${ROLE_LABELS[newRole]}"?`)) return;
    await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
  };

  const ROLE_COLORS: Record<string, string> = {
    admin: "bg-red-100 text-red-700",
    manager: "bg-indigo-100 text-indigo-700",
    copywriter: "bg-yellow-100 text-yellow-700",
    operational: "bg-blue-100 text-blue-700",
    viewer: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Configurações" subtitle="Gerencie usuários e permissões" />
      <div className="flex-1 overflow-auto p-6 space-y-6">

        <Card>
          <CardHeader>
            <CardTitle>Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold">
                        {user.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={ROLE_COLORS[user.role]}>{ROLE_LABELS[user.role]}</Badge>
                      <Select
                        value={user.role}
                        onChange={(e) => updateRole(user.id, e.target.value, user.role)}
                        className="w-40 h-8 text-xs"
                      >
                        {Object.entries(ROLE_LABELS).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integrações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Google Sheets", desc: "Importar e exportar planilhas", status: "planned" },
                { name: "Slack", desc: "Notificações de disparos e aprovações", status: "planned" },
                { name: "Asana", desc: "Criar tarefas de produção de copy", status: "planned" },
                { name: "ActiveCampaign", desc: "Sincronizar métricas de e-mail", status: "planned" },
              ].map((integration) => (
                <div key={integration.name} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                  <div>
                    <p className="font-medium text-gray-900">{integration.name}</p>
                    <p className="text-sm text-gray-500">{integration.desc}</p>
                  </div>
                  <Badge className="bg-amber-100 text-amber-700">Em breve</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Automações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                "Quando status → Escrevendo: criar tarefa no Asana para copy",
                "Quando status → Aprovado: notificar canal no Slack",
                "No dia do disparo sem status Programado: marcar como alerta",
                "Após envio: buscar métricas automaticamente do ActiveCampaign",
                "Resumo diário no Slack com disparos do dia",
              ].map((rule) => (
                <div key={rule} className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3">
                  <div className="h-2 w-2 rounded-full bg-amber-400" />
                  <p className="text-sm text-gray-700">{rule}</p>
                  <Badge className="ml-auto bg-amber-100 text-amber-700">Em breve</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
