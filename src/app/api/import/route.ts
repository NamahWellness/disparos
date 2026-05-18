import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as XLSX from "xlsx";
import { parseSheetChannel, parseSheetStatus, parseSheetPhase } from "@/lib/utils";

function parseExcelDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === "number") {
    const d = XLSX.SSF.parse_date_code(val);
    return new Date(d.y, d.m - 1, d.d);
  }
  if (typeof val === "string") {
    const parsed = new Date(val);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

function parseRows(ws: XLSX.WorkSheet, sheetName: string) {
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }) as unknown[][];
  if (rows.length < 2) return [];

  const header = (rows[0] as unknown[]).map((h) => String(h ?? "").toLowerCase());
  const channel = parseSheetChannel(sheetName);

  const getCol = (row: unknown[], ...keys: string[]) => {
    for (const key of keys) {
      const idx = header.findIndex((h) => h.includes(key));
      if (idx !== -1) return row[idx];
    }
    return null;
  };

  return rows.slice(1).map((row, i) => {
    const base = getCol(row, "base", "data", "tipo", "automação");
    const day = getCol(row, "dia");
    const time = getCol(row, "hora");
    const status = getCol(row, "status");
    const phase = getCol(row, "fase");
    const subject = getCol(row, "assunto", "tema", "objetivo");
    const audience = getCol(row, "público", "lista");
    const copy = getCol(row, "copy");
    const sent = getCol(row, "envios");
    const opens = getCol(row, "abertura", "leitura");
    const clicks = getCol(row, "cliques");
    const clickRate = getCol(row, "taxa");

    const scheduledDate = parseExcelDate(day);

    return {
      rowIndex: i + 2,
      sheet: sheetName,
      channel,
      base: base ? String(base) : null,
      scheduledDate,
      scheduledTime: time ? String(time) : null,
      status: parseSheetStatus(status ? String(status) : null),
      phase: parseSheetPhase(phase ? String(phase) : null),
      subject: subject ? String(subject) : null,
      audience: audience ? String(audience) : null,
      copyLink: copy ? String(copy) : null,
      metrics: {
        sent: sent ? Number(sent) : null,
        opens: opens ? Number(opens) : null,
        clicks: clicks ? Number(clicks) : null,
        clickRate: clickRate ? Number(clickRate) : null,
      },
    };
  }).filter((r) => r.subject || r.base || r.audience);
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const wb = XLSX.utils.book_new();

  const sheets = [
    { name: "E-mails", channel: "email" },
    { name: "WhatsApp Grupos", channel: "whatsapp_group" },
    { name: "WhatsApp Individual", channel: "whatsapp" },
    { name: "SMS", channel: "sms" },
    { name: "Push", channel: "push" },
  ];

  const headers = ["BASE/DATA", "DIA", "HORA", "STATUS", "FASE", "ASSUNTO/TEMA", "PÚBLICO/LISTA", "COPY", "ENVIOS", "LEITURA/ABERTURA", "CLIQUES"];
  const example = ["Lista VIP", "2025-06-01", "10:00", "scheduled", "awareness", "Promoção de Junho", "Todos os clientes", "https://link.com/copy", "", "", ""];

  for (const { name } of sheets) {
    const ws = XLSX.utils.aoa_to_sheet([headers, example]);
    ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 2, 16) }));
    XLSX.utils.book_append_sheet(wb, ws, name);
  }

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="modelo_disparos.xlsx"',
    },
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const campaignId = formData.get("campaignId") as string | null;
  const campaignName = formData.get("campaignName") as string | null;
  const campaignMetaRaw = formData.get("campaignMeta") as string | null;
  const campaignMeta = campaignMetaRaw ? JSON.parse(campaignMetaRaw) : null;
  const preview = formData.get("preview") === "true";

  if (!file) return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });

  const sheets: Record<string, ReturnType<typeof parseRows>> = {};
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    sheets[name] = parseRows(ws, name);
  }

  const allRows = Object.entries(sheets).flatMap(([sheet, rows]) =>
    rows.map((r) => ({ ...r, sheet }))
  );

  if (preview) {
    return NextResponse.json({ sheets: Object.keys(sheets), preview: allRows.slice(0, 50), total: allRows.length });
  }

  const importFile = await db.importedFile.create({
    data: {
      campaignId: campaignId || null,
      filename: file.name,
      status: "processing",
      rowsTotal: allRows.length,
    },
  });

  // Resolve campaign ID once — create a single campaign when none is provided
  let resolvedCampaignId = campaignId || null;
  if (!resolvedCampaignId) {
    const name = campaignMeta?.name?.trim() || campaignName?.trim() || file.name.replace(/\.[^/.]+$/, "");
    const campaign = await db.campaign.create({
      data: {
        name,
        description: campaignMeta?.description || null,
        product: campaignMeta?.product || null,
        status: campaignMeta?.status || "active",
        startDate: campaignMeta?.startDate ? new Date(campaignMeta.startDate) : null,
        endDate: campaignMeta?.endDate ? new Date(campaignMeta.endDate) : null,
        color: campaignMeta?.color || "#6366f1",
        tags: campaignMeta?.tags?.length ? JSON.stringify(campaignMeta.tags) : null,
        notes: campaignMeta?.notes || null,
        ownerId: session.user!.id!,
      },
    });
    resolvedCampaignId = campaign.id;
  }

  let ok = 0;
  let errors = 0;

  for (const row of allRows) {
    try {
      const cId = resolvedCampaignId;

      const send = await db.send.create({
        data: {
          campaignId: cId,
          channel: row.channel,
          base: row.base,
          scheduledDate: row.scheduledDate,
          scheduledTime: row.scheduledTime,
          status: row.status,
          phase: row.phase,
          subject: row.subject,
          audience: row.audience,
          copyLink: row.copyLink,
        },
      });

      if (row.metrics.sent || row.metrics.opens || row.metrics.clicks) {
        await db.sendMetrics.create({
          data: {
            sendId: send.id,
            sent: row.metrics.sent,
            opens: row.metrics.opens,
            clicks: row.metrics.clicks,
            clickRate: row.metrics.clickRate,
          },
        });
      }

      await db.importRow.create({
        data: {
          importFileId: importFile.id,
          rowIndex: row.rowIndex,
          sheet: row.sheet,
          data: JSON.stringify(row),
          status: "ok",
          sendId: send.id,
        },
      });

      ok++;
    } catch (e) {
      errors++;
      await db.importRow.create({
        data: {
          importFileId: importFile.id,
          rowIndex: row.rowIndex,
          sheet: row.sheet,
          data: JSON.stringify(row),
          status: "error",
          error: String(e),
        },
      });
    }
  }

  await db.importedFile.update({
    where: { id: importFile.id },
    data: { status: "done", rowsOk: ok, rowsError: errors },
  });

  return NextResponse.json({ importFileId: importFile.id, campaignId: resolvedCampaignId, total: allRows.length, ok, errors });
}
