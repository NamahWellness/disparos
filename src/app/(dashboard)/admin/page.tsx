"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  ROLE_LABELS,
  STATUS_LABELS,
  CHANNEL_LABELS,
  PHASE_LABELS,
  STATUS_COLORS,
  CHANNEL_COLORS,
  formatDate,
} from "@/lib/utils";
import {
  Users,
  Activity,
  FileUp,
  BarChart3,
  Plus,
  Pencil,
  Trash2,
  Megaphone,
  Send,
  Bell,
  Mail,
  MessageSquare,
  Phone,
  Save,
} from "lucide-react";

type Tab = "users" | "activity" | "imports" | "system" | "notifications";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface LogRow {
  id: string;
  action: string;
  createdAt: string;
  user?: { name: string; email: string } | null;
  campaign?: { name: string } | null;
}

interface ImportRow {
  id: string;
  filename: string;
  status: string;
  total?: number | null;
  ok?: number | null;
  errors?: number | null;
  createdAt: string;
  campaign?: { id: string; name: string } | null;
}

interface NotifSettings {
  alertHoursBefore: number;
  emailEnabled: boolean;
  slackEnabled: boolean;
  whatsappEnabled: boolean;
  postmarkApiKey: string;
  postmarkFromEmail: string;
  slackWebhookUrl: string;
  zApiInstanceId: string;
  zApiToken: string;
  zApiPhones: string;
}

interface StatsData {
  users: number;
  campaigns: number;
  sends: number;
  imports: number;
  byRole: { role: string; _count: number }[];
  byStatus: { status: string; _count: number }[];
}

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  manager: "bg-indigo-100 text-indigo-700",
  copywriter: "bg-yellow-100 text-yellow-700",
  operational: "bg-blue-100 text-blue-700",
  viewer: "bg-gray-100 text-gray-700",
};

const IMPORT_STATUS_COLORS: Record<string, string> = {
  done: "bg-green-100 text-green-700",
  error: "bg-red-100 text-red-700",
  processing: "bg-amber-100 text-amber-700",
  pending: "bg-gray-100 text-gray-700",
};

const IMPORT_STATUS_LABELS: Record<string, string> = {
  done: "Concluído",
  error: "Erro",
  processing: "Processando",
  pending: "Pendente",
};

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
    </div>
  );
}

function CleanupTool({ onDone }: { onDone: () => void }) {
  const { toast } = useToast();
  const [pattern, setPattern] = useState("");
  const [preview, setPreview] = useState<{ id: string; name: string; sends: number }[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const handlePreview = async () => {
    if (!pattern.trim()) return;
    setLoading(true);
    setPreview(null);
    setConfirm(false);
    try {
      const res = await fetch("/api/admin/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pattern: pattern.trim(), dryRun: true }),
      });
      const data = await res.json();
      setPreview(data.campaigns ?? []);
    } catch { toast.error("Erro ao buscar"); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pattern: pattern.trim() }),
      });
      const data = await res.json();
      toast.success(`${data.deleted} campanha(s) excluída(s)!`);
      setPreview(null);
      setPattern("");
      setConfirm(false);
      onDone();
    } catch { toast.error("Erro ao excluir"); }
    finally { setLoading(false); }
  };

  return (
    <div className="rounded-2xl border border-red-100 bg-red-50/40 p-5">
      <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Limpeza de campanhas</p>
      <p className="text-xs text-gray-500 mb-4">Busque campanhas por nome para excluir em lote. Use com cautela — a exclusão apaga todos os disparos vinculados.</p>
      <div className="flex gap-2">
        <Input
          value={pattern}
          onChange={(e) => { setPattern(e.target.value); setPreview(null); setConfirm(false); }}
          placeholder="Parte do nome da campanha…"
          className="flex-1"
          onKeyDown={(e) => e.key === "Enter" && handlePreview()}
        />
        <Button type="button" variant="outline" onClick={handlePreview} loading={loading}>
          Buscar
        </Button>
      </div>

      {preview !== null && (
        <div className="mt-3 space-y-2">
          {preview.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma campanha encontrada.</p>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-700">{preview.length} campanha(s) encontrada(s):</p>
              <div className="max-h-40 overflow-y-auto space-y-1 rounded-lg border border-red-200 bg-white p-2">
                {preview.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-xs text-gray-700 px-1">
                    <span className="truncate flex-1">{c.name}</span>
                    <span className="shrink-0 text-gray-400 ml-2">{c.sends} disparo(s)</span>
                  </div>
                ))}
              </div>
              {!confirm ? (
                <Button type="button" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => setConfirm(true)}>
                  Excluir {preview.length} campanha(s)
                </Button>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-red-700">Confirmar exclusão permanente?</span>
                  <Button type="button" onClick={handleDelete} loading={loading} className="bg-red-600 hover:bg-red-700 text-white">
                    Sim, excluir
                  </Button>
                  <button type="button" onClick={() => setConfirm(false)} className="text-sm text-gray-500 hover:text-gray-700">
                    Cancelar
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accentBg,
  accentText,
  accentBar,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accentBg: string;
  accentText: string;
  accentBar: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm p-5 flex items-start gap-4">
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${accentBar}`} />
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accentBg}`}>
        <Icon className={`h-5 w-5 ${accentText}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-0.5 leading-none">{value}</p>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("users");

  // Users
  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteTimer, setDeleteTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Create form
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState("viewer");
  const [createLoading, setCreateLoading] = useState(false);

  // Edit form
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("viewer");
  const [editLoading, setEditLoading] = useState(false);

  // Activity
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Imports
  const [imports, setImports] = useState<ImportRow[]>([]);
  const [importsLoading, setImportsLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Notification settings
  const [notifSettings, setNotifSettings] = useState<NotifSettings>({
    alertHoursBefore: 24,
    emailEnabled: false, slackEnabled: false, whatsappEnabled: false,
    postmarkApiKey: "", postmarkFromEmail: "",
    slackWebhookUrl: "", zApiInstanceId: "", zApiToken: "", zApiPhones: "",
  });
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifTesting, setNotifTesting] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await fetch("/api/admin/logs");
      const data = await res.json();
      setLogs(data);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  const loadImports = useCallback(async () => {
    setImportsLoading(true);
    try {
      const res = await fetch("/api/admin/imports");
      const data = await res.json();
      setImports(data);
    } finally {
      setImportsLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      setStats(data);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadNotifSettings = useCallback(async () => {
    setNotifLoading(true);
    try {
      const res = await fetch("/api/admin/notification-settings");
      if (res.ok) {
        const data = await res.json();
        setNotifSettings({
          alertHoursBefore: data.alertHoursBefore ?? 24,
          emailEnabled: data.emailEnabled ?? false,
          slackEnabled: data.slackEnabled ?? false,
          whatsappEnabled: data.whatsappEnabled ?? false,
          postmarkApiKey: data.postmarkApiKey ?? "",
          postmarkFromEmail: data.postmarkFromEmail ?? "",
          slackWebhookUrl: data.slackWebhookUrl ?? "",
          zApiInstanceId: data.zApiInstanceId ?? "",
          zApiToken: data.zApiToken ?? "",
          zApiPhones: data.zApiPhones ?? "",
        });
      }
    } finally {
      setNotifLoading(false);
    }
  }, []);

  const saveNotifSettings = async () => {
    setNotifSaving(true);
    try {
      const res = await fetch("/api/admin/notification-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...notifSettings,
          postmarkApiKey: notifSettings.postmarkApiKey || null,
          postmarkFromEmail: notifSettings.postmarkFromEmail || null,
          slackWebhookUrl: notifSettings.slackWebhookUrl || null,
          zApiInstanceId: notifSettings.zApiInstanceId || null,
          zApiToken: notifSettings.zApiToken || null,
          zApiPhones: notifSettings.zApiPhones || null,
        }),
      });
      if (res.ok) toast.success("Configurações salvas!");
      else toast.error("Erro ao salvar configurações");
    } finally {
      setNotifSaving(false);
    }
  };

  const testCron = async () => {
    setNotifTesting("cron");
    try {
      const res = await fetch("/api/cron/check-sends");
      const data = await res.json();
      toast.success(`Cron executado: ${data.checked ?? 0} disparos verificados, ${data.notified ?? 0} notificados`);
    } catch {
      toast.error("Erro ao executar cron");
    } finally {
      setNotifTesting(null);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (tab === "activity" && logs.length === 0) loadLogs();
    if (tab === "imports" && imports.length === 0) loadImports();
    if (tab === "system" && !stats) loadStats();
    if (tab === "notifications" && !notifLoading && notifSettings.alertHoursBefore === 24 && !notifSettings.emailEnabled) loadNotifSettings();
  }, [tab, logs.length, imports.length, stats, loadLogs, loadImports, loadStats, loadNotifSettings, notifLoading, notifSettings]);

  function openEdit(user: UserRow) {
    setEditUser(user);
    setEditName(user.name);
    setEditRole(user.role);
  }

  function closeCreate() {
    setCreateOpen(false);
    setCreateName("");
    setCreateEmail("");
    setCreatePassword("");
    setCreateRole("viewer");
  }

  function closeEdit() {
    setEditUser(null);
    setEditName("");
    setEditRole("viewer");
  }

  async function handleCreate() {
    if (!createName || !createEmail || !createPassword) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    setCreateLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createName, email: createEmail, password: createPassword, role: createRole }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Erro ao criar usuário");
        return;
      }
      toast.success("Usuário criado!");
      closeCreate();
      loadUsers();
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleEdit() {
    if (!editUser) return;
    setEditLoading(true);
    try {
      const res = await fetch(`/api/users/${editUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, role: editRole }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Erro ao salvar usuário");
        return;
      }
      toast.success("Usuário salvo!");
      closeEdit();
      loadUsers();
    } finally {
      setEditLoading(false);
    }
  }

  function handleDeleteClick(id: string) {
    if (deleteConfirm === id) {
      // Second click — execute
      if (deleteTimer) clearTimeout(deleteTimer);
      setDeleteConfirm(null);
      performDelete(id);
    } else {
      // First click — arm
      if (deleteTimer) clearTimeout(deleteTimer);
      setDeleteConfirm(id);
      const t = setTimeout(() => setDeleteConfirm(null), 3000);
      setDeleteTimer(t);
    }
  }

  async function performDelete(id: string) {
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Erro ao excluir usuário");
      return;
    }
    toast.success("Usuário excluído!");
    loadUsers();
  }

  const tabs: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "users", label: "Usuários", icon: Users },
    { key: "activity", label: "Atividade", icon: Activity },
    { key: "imports", label: "Importações", icon: FileUp },
    { key: "system", label: "Sistema", icon: BarChart3 },
    { key: "notifications", label: "Notificações", icon: Bell },
  ];

  return (
    <div className="flex flex-col h-full">
      <Header title="Administração" subtitle="Gestão de usuários, atividade e sistema" />

      <div className="flex-1 overflow-auto p-6 space-y-5">
        {/* Tab bar */}
        <div className="flex items-center gap-1 border-b border-gray-200">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === key
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Usuários tab */}
        {tab === "users" && (
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <p className="text-sm font-semibold text-gray-900">Usuários do sistema</p>
              <Button onClick={() => setCreateOpen(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Criar usuário
              </Button>
            </div>
            {usersLoading ? (
              <Spinner />
            ) : (
              <div className="divide-y divide-gray-50">
                {users.map((user) => {
                  const isSelf = user.id === session?.user?.id;
                  return (
                    <div
                      key={user.id}
                      className={`flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors ${isSelf ? "opacity-60" : ""}`}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold">
                        {user.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                          {isSelf && (
                            <span className="text-xs text-gray-400">(você)</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                      <Badge className={ROLE_COLORS[user.role] ?? "bg-gray-100 text-gray-700"}>
                        {ROLE_LABELS[user.role] ?? user.role}
                      </Badge>
                      <span className="text-xs text-gray-400 shrink-0 hidden sm:block">
                        {formatDate(user.createdAt)}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEdit(user)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => !isSelf && handleDeleteClick(user.id)}
                          disabled={isSelf}
                          className={`rounded-lg p-1.5 transition-colors text-xs font-medium ${
                            isSelf
                              ? "text-gray-200 cursor-not-allowed"
                              : deleteConfirm === user.id
                              ? "bg-red-600 text-white hover:bg-red-700 px-2"
                              : "text-gray-400 hover:bg-red-50 hover:text-red-600"
                          }`}
                          title={deleteConfirm === user.id ? "Clique para confirmar" : "Excluir"}
                        >
                          {deleteConfirm === user.id ? (
                            "Confirmar?"
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Atividade tab */}
        {tab === "activity" && (
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <p className="text-sm font-semibold text-gray-900">Registro de atividade</p>
            </div>
            {logsLoading ? (
              <Spinner />
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Activity className="h-8 w-8 text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">Nenhum registro de atividade</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{log.action}</p>
                    </div>
                    <p className="text-xs text-gray-500 shrink-0 hidden sm:block">
                      {log.user?.name ?? "—"}
                    </p>
                    <p className="text-xs text-gray-400 shrink-0 hidden md:block truncate max-w-[160px]">
                      {log.campaign?.name ?? "—"}
                    </p>
                    <p className="text-xs text-gray-400 shrink-0">{formatDate(log.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Importações tab */}
        {tab === "imports" && (
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <p className="text-sm font-semibold text-gray-900">Importações de arquivos</p>
            </div>
            {importsLoading ? (
              <Spinner />
            ) : imports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileUp className="h-8 w-8 text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">Nenhuma importação realizada</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {imports.map((imp) => (
                  <div key={imp.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{imp.filename}</p>
                      <p className="text-xs text-gray-400 truncate">{imp.campaign?.name ?? "—"}</p>
                    </div>
                    <Badge className={IMPORT_STATUS_COLORS[imp.status] ?? "bg-gray-100 text-gray-700"}>
                      {IMPORT_STATUS_LABELS[imp.status] ?? imp.status}
                    </Badge>
                    <div className="flex items-center gap-3 text-xs text-gray-500 shrink-0 hidden sm:flex">
                      <span title="Total">{imp.total ?? 0}</span>
                      <span className="text-green-600 font-medium" title="OK">{imp.ok ?? 0}</span>
                      <span className="text-red-500 font-medium" title="Erros">{imp.errors ?? 0}</span>
                    </div>
                    <p className="text-xs text-gray-400 shrink-0">{formatDate(imp.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notificações tab */}
        {tab === "notifications" && (
          <div className="space-y-5">
            {notifLoading ? <Spinner /> : (
              <>
                {/* Configurações gerais */}
                <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 space-y-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Configurações gerais</p>

                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700 w-48">Antecedência do alerta</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={168}
                        value={notifSettings.alertHoursBefore}
                        onChange={(e) => setNotifSettings((s) => ({ ...s, alertHoursBefore: Number(e.target.value) }))}
                        className="w-24"
                      />
                      <span className="text-sm text-gray-500">horas antes do disparo</span>
                    </div>
                  </div>

                  {/* Channel toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {([
                      { key: "emailEnabled", icon: Mail, label: "E-mail (Postmark)", color: "text-blue-600" },
                      { key: "slackEnabled", icon: MessageSquare, label: "Slack", color: "text-purple-600" },
                      { key: "whatsappEnabled", icon: Phone, label: "WhatsApp (Z-API)", color: "text-green-600" },
                    ] as const).map(({ key, icon: Icon, label, color }) => (
                      <label key={key} className="flex items-center gap-3 rounded-xl border border-gray-100 p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={notifSettings[key]}
                          onChange={(e) => setNotifSettings((s) => ({ ...s, [key]: e.target.checked }))}
                          className="h-4 w-4 rounded accent-indigo-600"
                        />
                        <Icon className={`h-4 w-4 ${color}`} />
                        <span className="text-sm font-medium text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* E-mail */}
                {notifSettings.emailEnabled && (
                  <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <p className="text-sm font-semibold text-gray-900">E-mail — Postmark</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-700">API Key do Postmark</label>
                        <Input
                          type="password"
                          value={notifSettings.postmarkApiKey}
                          onChange={(e) => setNotifSettings((s) => ({ ...s, postmarkApiKey: e.target.value }))}
                          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-700">E-mail remetente</label>
                        <Input
                          type="email"
                          value={notifSettings.postmarkFromEmail}
                          onChange={(e) => setNotifSettings((s) => ({ ...s, postmarkFromEmail: e.target.value }))}
                          placeholder="alertas@suaempresa.com"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Slack */}
                {notifSettings.slackEnabled && (
                  <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-purple-600" />
                      <p className="text-sm font-semibold text-gray-900">Slack — Incoming Webhook</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-700">Webhook URL</label>
                      <Input
                        value={notifSettings.slackWebhookUrl}
                        onChange={(e) => setNotifSettings((s) => ({ ...s, slackWebhookUrl: e.target.value }))}
                        placeholder="https://hooks.slack.com/services/..."
                      />
                    </div>
                  </div>
                )}

                {/* WhatsApp */}
                {notifSettings.whatsappEnabled && (
                  <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-green-600" />
                      <p className="text-sm font-semibold text-gray-900">WhatsApp — Z-API</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-700">Instance ID</label>
                        <Input
                          value={notifSettings.zApiInstanceId}
                          onChange={(e) => setNotifSettings((s) => ({ ...s, zApiInstanceId: e.target.value }))}
                          placeholder="ID da instância Z-API"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-700">Token</label>
                        <Input
                          type="password"
                          value={notifSettings.zApiToken}
                          onChange={(e) => setNotifSettings((s) => ({ ...s, zApiToken: e.target.value }))}
                          placeholder="Token da instância"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-700">Números para notificar (separados por vírgula)</label>
                      <Input
                        value={notifSettings.zApiPhones}
                        onChange={(e) => setNotifSettings((s) => ({ ...s, zApiPhones: e.target.value }))}
                        placeholder='["5511999999999", "5511888888888"]'
                      />
                      <p className="text-xs text-gray-400">Formato JSON: [&quot;5511999999999&quot;, &quot;5511888888888&quot;]</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <Button onClick={saveNotifSettings} loading={notifSaving} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Salvar configurações
                  </Button>
                  <Button
                    variant="outline"
                    onClick={testCron}
                    loading={notifTesting === "cron"}
                    className="flex items-center gap-2"
                  >
                    Testar agora
                  </Button>
                  <p className="text-xs text-gray-400">O cron roda automaticamente todo hora no Vercel.</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Sistema tab */}
        {tab === "system" && (
          <>
            {statsLoading || !stats ? (
              <Spinner />
            ) : (
              <div className="space-y-5">
                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    icon={Users}
                    label="Usuários"
                    value={stats.users}
                    accentBg="bg-indigo-50"
                    accentText="text-indigo-600"
                    accentBar="bg-indigo-600"
                  />
                  <StatCard
                    icon={Megaphone}
                    label="Campanhas"
                    value={stats.campaigns}
                    accentBg="bg-violet-50"
                    accentText="text-violet-600"
                    accentBar="bg-violet-600"
                  />
                  <StatCard
                    icon={Send}
                    label="Disparos"
                    value={stats.sends}
                    accentBg="bg-green-50"
                    accentText="text-green-600"
                    accentBar="bg-green-600"
                  />
                  <StatCard
                    icon={FileUp}
                    label="Importações"
                    value={stats.imports}
                    accentBg="bg-amber-50"
                    accentText="text-amber-600"
                    accentBar="bg-amber-600"
                  />
                </div>

                {/* Distribution cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Distribuição de papéis */}
                  <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                      Distribuição de papéis
                    </p>
                    {stats.byRole.length === 0 ? (
                      <p className="text-xs text-gray-400">Nenhum dado</p>
                    ) : (
                      <div className="space-y-3">
                        {stats.byRole.map((item) => {
                          const total = stats.byRole.reduce((s, r) => s + r._count, 0);
                          const pct = total > 0 ? Math.round((item._count / total) * 100) : 0;
                          return (
                            <div key={item.role}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-gray-700">
                                  {ROLE_LABELS[item.role] ?? item.role}
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

                  {/* Status dos disparos */}
                  <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                      Status dos disparos
                    </p>
                    {stats.byStatus.length === 0 ? (
                      <p className="text-xs text-gray-400">Nenhum dado</p>
                    ) : (
                      <div className="space-y-2.5">
                        {stats.byStatus.map((item) => {
                          const total = stats.byStatus.reduce((s, r) => s + r._count, 0);
                          const pct = total > 0 ? Math.round((item._count / total) * 100) : 0;
                          const colorClass = STATUS_COLORS[item.status] ?? "bg-gray-100 text-gray-700";
                          const barColor = colorClass.includes("green")
                            ? "bg-green-500"
                            : colorClass.includes("amber")
                            ? "bg-amber-500"
                            : colorClass.includes("blue")
                            ? "bg-blue-500"
                            : colorClass.includes("violet")
                            ? "bg-violet-500"
                            : colorClass.includes("red") || colorClass.includes("rose")
                            ? "bg-red-500"
                            : colorClass.includes("emerald")
                            ? "bg-emerald-500"
                            : "bg-gray-400";
                          return (
                            <div key={item.status}>
                              <div className="flex items-center justify-between mb-1">
                                <Badge className={`${colorClass} text-[10px]`}>
                                  {STATUS_LABELS[item.status] ?? item.status}
                                </Badge>
                                <span className="text-xs font-bold text-gray-900">{item._count}</span>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-gray-100">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${barColor}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Ferramentas de limpeza */}
                <CleanupTool onDone={loadStats} />

                {/* Campos configurados */}
                <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                    Campos configurados
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-2">Canais</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(CHANNEL_LABELS).map(([key, label]) => (
                          <Badge key={key} className={CHANNEL_COLORS[key] ?? "bg-gray-100 text-gray-700"}>
                            {label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-2">Status</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(STATUS_LABELS).map(([key, label]) => (
                          <Badge key={key} className={STATUS_COLORS[key] ?? "bg-gray-100 text-gray-700"}>
                            {label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-2">Fases</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(PHASE_LABELS).map(([key, label]) => (
                          <Badge key={key} className="bg-purple-100 text-purple-700">
                            {label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create user modal */}
      <Modal open={createOpen} onClose={closeCreate} title="Criar usuário" size="sm">
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Nome</label>
            <Input
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Nome completo"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">E-mail</label>
            <Input
              type="email"
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Senha</label>
            <Input
              type="password"
              value={createPassword}
              onChange={(e) => setCreatePassword(e.target.value)}
              placeholder="Senha"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Papel</label>
            <Select value={createRole} onChange={(e) => setCreateRole(e.target.value)}>
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={closeCreate} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={createLoading} className="flex-1">
              {createLoading ? "Criando…" : "Criar"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit user modal */}
      <Modal open={!!editUser} onClose={closeEdit} title="Editar usuário" size="sm">
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Nome</label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Nome completo"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Papel</label>
            <Select value={editRole} onChange={(e) => setEditRole(e.target.value)}>
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={closeEdit} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={editLoading} className="flex-1">
              {editLoading ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
