"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CreditCard, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { tanggalWaktu } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";

interface TombolBayarOnlineProps {
  invoiceId: string;
  initialStatusBayar: string;
  initialDibayarOnlineAt: string | null;
  bolehBayar: boolean;
}

export function TombolBayarOnline({
  invoiceId,
  initialStatusBayar,
  initialDibayarOnlineAt,
  bolehBayar,
}: TombolBayarOnlineProps) {
  const router = useRouter();
  const [statusBayar, setStatusBayar] = useState(initialStatusBayar);
  const [dibayarOnlineAt, setDibayarOnlineAt] = useState<string | null>(initialDibayarOnlineAt);
  const [sedangMembuat, setSedangMembuat] = useState(false);
  const [sedangPolling, setSedangPolling] = useState(false);
  const [sisaDetik, setSisaDetik] = useState(300); // 5 menit

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Bersihkan timer saat unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const hentikanPolling = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setSedangPolling(false);
  };

  const periksaStatus = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("invoices")
        .select("status_bayar, dibayar_online_at")
        .eq("id", invoiceId)
        .maybeSingle();

      if (error) {
        return false;
      }

      if (data && data.status_bayar === "lunas") {
        setStatusBayar("lunas");
        setDibayarOnlineAt(data.dibayar_online_at);
        hentikanPolling();
        toast.success("Pembayaran Mayar berhasil diverifikasi! Invoice telah lunas.");
        router.refresh();
        return true;
      }
    } catch {
      // Abaikan error jaringan sementara saat polling
    }
    return false;
  };

  const mulaiPolling = () => {
    hentikanPolling();
    setSedangPolling(true);
    setSisaDetik(300);

    // Hitung mundur sisa detik
    countdownRef.current = setInterval(() => {
      setSisaDetik((prev) => {
        if (prev <= 1) {
          hentikanPolling();
          toast.info(
            "Waktu pemeriksaan otomatis (5 menit) selesai. Silakan muat ulang halaman bila pembayaran sudah selesai."
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cek status invoice setiap 5 detik
    timerRef.current = setInterval(async () => {
      const lunas = await periksaStatus();
      if (lunas) {
        hentikanPolling();
      }
    }, 5000);
  };

  const handleBayarOnline = async () => {
    if (sedangMembuat || sedangPolling) return;

    try {
      setSedangMembuat(true);
      const res = await fetch("/api/pembayaran/buat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: invoiceId }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal membuat tautan pembayaran Mayar");
      }

      // Buka tautan Mayar di tab baru
      if (json.link) {
        window.open(json.link, "_blank", "noopener,noreferrer");
      }

      toast.success("Tautan pembayaran Mayar dibuka. Memeriksa status pembayaran...");

      // Mulai polling 5 detik selama 5 menit
      mulaiPolling();
    } catch (err: unknown) {
      const pesan = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(pesan);
    } finally {
      setSedangMembuat(false);
    }
  };

  // Jika invoice sudah lunas
  if (statusBayar === "lunas") {
    return (
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <Badge className="bg-success text-white hover:bg-success/90 gap-1.5 py-1 px-3 text-xs font-semibold">
          <CheckCircle2 className="size-3.5" />
          Lunas
        </Badge>
        {dibayarOnlineAt && (
          <span className="text-xs text-text-muted">
            Dibayar online: <strong className="text-text">{tanggalWaktu(dibayarOnlineAt)}</strong>
          </span>
        )}
      </div>
    );
  }

  // Tombol hanya untuk Admin dan Owner bila belum lunas
  if (!bolehBayar) {
    return null;
  }

  const menit = Math.floor(sisaDetik / 60);
  const detik = sisaDetik % 60;
  const stringWaktu = `${menit}:${detik < 10 ? "0" : ""}${detik}`;

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      {sedangPolling ? (
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs">
          <Loader2 className="size-3.5 animate-spin text-primary" />
          <span className="font-medium text-text">
            Memeriksa pembayaran Mayar ({stringWaktu})...
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[11px]"
            onClick={() => periksaStatus()}
          >
            Cek Sekarang
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          onClick={handleBayarOnline}
          disabled={sedangMembuat}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
        >
          {sedangMembuat ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Menyiapkan Pembayaran...
            </>
          ) : (
            <>
              <CreditCard className="size-4" />
              Bayar Online
              <ExternalLink className="size-3.5 opacity-80" />
            </>
          )}
        </Button>
      )}
    </div>
  );
}
