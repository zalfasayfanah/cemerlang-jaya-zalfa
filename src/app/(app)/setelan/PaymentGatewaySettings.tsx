"use client";

import { useEffect, useState } from "react";
import { Check, CheckCircle2, Copy, FileText, Globe, KeyRound, ShieldAlert, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { tanggalWaktu } from "@/lib/format";

export interface MayarWebhookLogRow {
  id: string;
  event: string;
  status: string;
  payload: Record<string, unknown> | null;
  created_at: string;
}

interface PaymentGatewaySettingsProps {
  terhubung: boolean;
  webhookLogs: MayarWebhookLogRow[];
}

export function PaymentGatewaySettings({
  terhubung,
  webhookLogs,
}: PaymentGatewaySettingsProps) {
  const [webhookUrl, setWebhookUrl] = useState("/api/webhook/mayar");
  const [tersalin, setTersalin] = useState(false);
  const [detailPayload, setDetailPayload] = useState<MayarWebhookLogRow | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWebhookUrl(`${window.location.origin}/api/webhook/mayar`);
    }
  }, []);

  const salinUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setTersalin(true);
      toast.success("URL webhook berhasil disalin ke clipboard!");
      setTimeout(() => setTersalin(false), 2000);
    } catch {
      toast.error("Gagal menyalin URL webhook");
    }
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Globe className="size-5 text-primary" />
              Payment Gateway (Mayar)
            </CardTitle>
            <CardDescription className="text-xs text-text-muted mt-1">
              Pengaturan integrasi pembayaran online Mayar API V2 mode sandbox khusus Owner.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/40 bg-primary/5 text-primary text-xs font-semibold">
              Mode Sandbox
            </Badge>
            {terhubung ? (
              <Badge className="bg-success text-white hover:bg-success/90 gap-1 text-xs">
                <CheckCircle2 className="size-3.5" />
                Terhubung
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1 text-xs">
                <ShieldAlert className="size-3.5" />
                Belum Terhubung
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Status Lingkungan & Kunci */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border bg-surface/50 p-4 text-xs">
          <div className="space-y-1">
            <span className="font-semibold text-text flex items-center gap-1.5">
              <KeyRound className="size-4 text-text-muted" />
              Status Kredensial Server:
            </span>
            <p className="text-text-muted leading-relaxed">
              {terhubung ? (
                <span className="text-success font-medium">
                  ✓ Kunci MAYAR_API_KEY tersedia di server. Nilai dirahasiakan dan tidak pernah ditampilkan ke antarmuka.
                </span>
              ) : (
                <span className="text-danger font-medium">
                  ✕ Kunci MAYAR_API_KEY belum tersedia di variabel lingkungan server (.env.local).
                </span>
              )}
            </p>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-text">Lingkungan API:</span>
            <p className="text-text-muted leading-relaxed">
              Menggunakan <strong>Mayar API V2 Sandbox</strong> (endpoint sandbox Mayar) untuk simulasi transaksi tanpa uang riil.
            </p>
          </div>
        </div>

        {/* URL Webhook */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-text block">
            URL Webhook Notifikasi Mayar:
          </label>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={webhookUrl}
              className="font-mono text-xs bg-muted/30 select-all"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={salinUrl}
              className="gap-1.5 shrink-0"
            >
              {tersalin ? (
                <>
                  <Check className="size-3.5 text-success" />
                  Tersalin
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  Salin URL
                </>
              )}
            </Button>
          </div>
          <p className="text-[11px] text-text-muted">
            Salin tautan ini dan pasang pada menu <strong>Pengaturan Webhook</strong> di Dashboard Sandbox Mayar Anda.
          </p>
        </div>

        {/* Tabel 10 Baris Terakhir mayar_webhook_log */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-text uppercase tracking-wider">
              Log Webhook Terakhir (Maks. 10 Baris)
            </h3>
            <span className="text-[11px] text-text-muted">
              Total catatan: {webhookLogs.length}
            </span>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 text-xs">
                  <TableHead className="w-40">Waktu Diterima</TableHead>
                  <TableHead className="w-48">Event</TableHead>
                  <TableHead className="w-28 text-center">Status</TableHead>
                  <TableHead className="text-right">Payload</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhookLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-xs text-text-muted">
                      Belum ada pesan webhook yang diterima dari Mayar.
                    </TableCell>
                  </TableRow>
                ) : (
                  webhookLogs.map((log) => {
                    const statusDiterima = log.status === "diterima";
                    return (
                      <TableRow key={log.id} className="text-xs">
                        <TableCell className="text-text-muted font-mono text-[11px]">
                          {tanggalWaktu(log.created_at)}
                        </TableCell>
                        <TableCell className="font-medium text-text font-mono text-[11px]">
                          {log.event}
                        </TableCell>
                        <TableCell className="text-center">
                          {statusDiterima ? (
                            <Badge className="bg-success text-white hover:bg-success text-[10px] gap-1 px-2 py-0.5">
                              <CheckCircle2 className="size-3" />
                              Diterima
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-[10px] gap-1 px-2 py-0.5">
                              <XCircle className="size-3" />
                              Ditolak
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[11px] gap-1 text-primary hover:text-primary"
                            onClick={() => setDetailPayload(log)}
                          >
                            <FileText className="size-3" />
                            Detail JSON
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Modal / Ringkasan JSON Payload */}
        {detailPayload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-xl bg-card border p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h4 className="font-semibold text-sm text-text">Detail Payload Webhook</h4>
                  <p className="text-[11px] text-text-muted font-mono mt-0.5">
                    {detailPayload.event} · {tanggalWaktu(detailPayload.created_at)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="size-8 p-0"
                  onClick={() => setDetailPayload(null)}
                >
                  ✕
                </Button>
              </div>
              <div className="max-h-72 overflow-auto rounded-lg bg-muted/60 p-3 text-[11px] font-mono text-text">
                <pre>{JSON.stringify(detailPayload.payload, null, 2)}</pre>
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDetailPayload(null)}
                >
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
