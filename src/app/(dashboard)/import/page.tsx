"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TagInput } from "@/components/ui/tag-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CHANNEL_LABELS,
  STATUS_LABELS,
  PHASE_LABELS,
  STATUS_COLORS,
  CHANNEL_COLORS,
  CAMPAIGN_STATUS_LABELS,
  formatDate,
} from "@/lib/utils";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, ArrowRight, Download, ChevronDown, ChevronUp } from "lucide-react";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"];

interface CampaignMeta {
  name: string;
  description: string;
  product: string;
  status: string;
  startDate: string;
  endDate: string;
  color: string;
  tags: string[];
  notes: string;
}

interface PreviewRow {
  rowIndex: number;
  sheet: string;
  channel: string;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  status: string;
  phase?: string | null;
  subject?: string | null;
  audience?: string | null;
}

interface PreviewData {
  sheets: string[];
  preview: PreviewRow[];
  total: number;
}

interface ImportResult {
  importFileId: string;
  campaignId?: string;
  total: number;
  ok: number;
  errors: number;
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<CampaignMeta>({
    name: "", description: "", product: "", status: "active",
    startDate: "", endDate: "", color: "#6366f1", tags: [], notes: "",
  });
  const [showDetails, setShowDetails] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/tags").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setTagSuggestions(d); }).catch(() => {});
  }, []);

  const setMt = (key: keyof CampaignMeta, value: unknown) =>
    setMeta((m) => ({ ...m, [key]: value }));

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith(".xlsx") || f.name.endsWith(".xls"))) {
      setFile(f);
      setMeta((m) => ({ ...m, name: f.name.replace(/\.[^/.]+$/, "") }));
    }
  }, []);

  const buildFormData = (isPreview: boolean) => {
    const fd = new FormData();
    fd.append("file", file!);
    fd.append("preview", String(isPreview));
    if (!isPreview) {
      fd.append("campaignMeta", JSON.stringify(meta));
    }
    return fd;
  };

  const handlePreview = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/import", { method: "POST", body: buildFormData(true) });
    if (!res.ok) { setError("Erro ao processar arquivo"); setLoading(false); return; }
    setPreview(await res.json());
    setStep("preview");
    setLoading(false);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/import", { method: "POST", body: buildFormData(false) });
    if (!res.ok) { setError("Erro ao importar"); setLoading(false); return; }
    setResult(await res.json());
    setStep("done");
    setLoading(false);
  };

  const reset = () => {
    setStep("upload"); setFile(null); setPreview(null); setResult(null);
    setMeta({ name: "", description: "", product: "", status: "active", startDate: "", endDate: "", color: "#6366f1", tags: [], notes: "" });
    setShowDetails(false);
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Importar planilha" subtitle="Importe campanhas a partir da planilha modelo" />
      <div className="flex-1 overflow-auto p-6">
        {/* Steps */}
        <div className="flex items-center gap-3 mb-8">
          {[{ key: "upload", label: "Upload" }, { key: "preview", label: "Preview" }, { key: "done", label: "Concluído" }].map((s, i) => (
            <div key={s.key} className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step === s.key ? "bg-indigo-600 text-white" :
                (["upload", "preview", "done"].indexOf(step) > i) ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
              }`}>
                {(["upload", "preview", "done"].indexOf(step) > i) ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-sm font-medium ${step === s.key ? "text-indigo-700" : "text-gray-400"}`}>{s.label}</span>
              {i < 2 && <ArrowRight className="h-4 w-4 text-gray-300" />}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />{error}
          </div>
        )}

        {step === "upload" && (
          <div className="max-w-xl space-y-4">
            <Card>
              <CardHeader><CardTitle>Selecionar arquivo</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors ${
                    drag ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                  }`}
                >
                  <FileSpreadsheet className={`h-9 w-9 mb-2 ${drag ? "text-indigo-500" : "text-gray-300"}`} />
                  {file ? (
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700">Arraste a planilha aqui</p>
                      <p className="text-xs text-gray-400 mt-0.5">ou clique para selecionar · .xlsx, .xls</p>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) { setFile(f); setMt("name", f.name.replace(/\.[^/.]+$/, "")); }
                    }}
                  />
                </div>

                {/* Campaign name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da campanha</label>
                  <Input value={meta.name} onChange={(e) => setMt("name", e.target.value)} placeholder="Nome da campanha a criar…" />
                </div>

                {/* Details toggle */}
                <button
                  type="button"
                  onClick={() => setShowDetails((v) => !v)}
                  className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {showDetails ? "Ocultar detalhes da campanha" : "Adicionar detalhes da campanha"}
                </button>

                {showDetails && (
                  <div className="space-y-3 pt-1 border-t border-gray-100">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label>
                      <Input value={meta.description} onChange={(e) => setMt("description", e.target.value)} placeholder="Descreva a campanha…" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Produto / Evento</label>
                        <Input value={meta.product} onChange={(e) => setMt("product", e.target.value)} placeholder="Ex: Imersão Maio 2026" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                        <Select value={meta.status} onChange={(e) => setMt("status", e.target.value)}>
                          {Object.entries(CAMPAIGN_STATUS_LABELS).map(([v, l]) => (
                            <option key={v} value={v}>{l}</option>
                          ))}
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Data de início</label>
                        <Input type="date" value={meta.startDate} onChange={(e) => setMt("startDate", e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Data de fim</label>
                        <Input type="date" value={meta.endDate} onChange={(e) => setMt("endDate", e.target.value)} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Cor</label>
                      <div className="flex gap-2 flex-wrap">
                        {COLORS.map((c) => (
                          <button key={c} type="button" onClick={() => setMt("color", c)}
                            className={`h-7 w-7 rounded-full transition-transform ${meta.color === c ? "scale-125 ring-2 ring-offset-2 ring-gray-400" : ""}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Tags</label>
                      <TagInput value={meta.tags} onChange={(tags) => setMt("tags", tags)} suggestions={tagSuggestions} />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
                      <Input value={meta.notes} onChange={(e) => setMt("notes", e.target.value)} placeholder="Notas internas…" />
                    </div>
                  </div>
                )}

                <Button className="w-full" onClick={handlePreview} disabled={!file} loading={loading}>
                  <Upload className="h-4 w-4 mr-1.5" />
                  Visualizar preview
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Formato esperado</CardTitle>
                  <a href="/api/import" download="modelo_disparos.xlsx" className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700">
                    <Download className="h-3.5 w-3.5" />
                    Baixar planilha modelo
                  </a>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">Abas por canal (E-mails, WhatsApp Grupos, etc.) com colunas:</p>
                <div className="flex flex-wrap gap-1.5">
                  {["BASE/DATA", "DIA", "HORA", "STATUS", "FASE", "ASSUNTO/TEMA", "PÚBLICO/LISTA", "COPY", "ENVIOS", "LEITURA/ABERTURA", "CLIQUES"].map((col) => (
                    <span key={col} className="rounded bg-gray-100 px-2 py-1 text-xs font-mono text-gray-600">{col}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "preview" && preview && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{preview.total} linhas encontradas</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <p className="text-sm text-gray-500">Abas: {preview.sheets.join(", ")}</p>
                  {meta.name && (
                    <span className="text-sm text-gray-500">· Campanha: <strong>{meta.name}</strong></span>
                  )}
                  {meta.tags.length > 0 && (
                    <div className="flex gap-1">
                      {meta.tags.map((t) => (
                        <span key={t} className="inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("upload")}>Voltar</Button>
                <Button onClick={handleImport} loading={loading}>
                  <Upload className="h-4 w-4 mr-1.5" />
                  Importar {preview.total} disparos
                </Button>
              </div>
            </div>

            <div className="overflow-auto rounded-xl border border-gray-200 bg-white">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Aba</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Canal</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Assunto</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Fase</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Público</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.preview.map((row, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-xs text-gray-500">{row.sheet}</td>
                      <td className="px-4 py-2.5"><Badge className={CHANNEL_COLORS[row.channel]}>{CHANNEL_LABELS[row.channel]}</Badge></td>
                      <td className="px-4 py-2.5 text-gray-900 max-w-xs truncate">{row.subject ?? "-"}</td>
                      <td className="px-4 py-2.5"><Badge className={STATUS_COLORS[row.status]}>{STATUS_LABELS[row.status]}</Badge></td>
                      <td className="px-4 py-2.5 text-xs text-gray-500">{row.phase ? (PHASE_LABELS[row.phase] ?? row.phase) : "-"}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                        {row.scheduledDate ? formatDate(row.scheduledDate) : "-"}
                        {row.scheduledTime && ` ${row.scheduledTime}`}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-500 truncate max-w-xs">{row.audience ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.total > 50 && (
                <div className="px-4 py-3 text-xs text-gray-400 text-center border-t border-gray-100">
                  Mostrando 50 de {preview.total} linhas
                </div>
              )}
            </div>
          </div>
        )}

        {step === "done" && result && (
          <div className="max-w-md">
            <Card>
              <CardContent className="p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Importação concluída!</h2>
                <div className="grid grid-cols-3 gap-4 mt-6 mb-6">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-2xl font-bold text-gray-900">{result.total}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                  <div className="rounded-lg bg-green-50 p-3">
                    <p className="text-2xl font-bold text-green-600">{result.ok}</p>
                    <p className="text-xs text-gray-500">Importados</p>
                  </div>
                  <div className="rounded-lg bg-red-50 p-3">
                    <p className="text-2xl font-bold text-red-600">{result.errors}</p>
                    <p className="text-xs text-gray-500">Erros</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button onClick={reset}>Importar outra planilha</Button>
                  {result.campaignId ? (
                    <Button variant="outline" onClick={() => window.location.href = `/campaigns/${result.campaignId}`}>
                      Ver campanha criada
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => window.location.href = "/campaigns"}>
                      Ver campanhas
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
