import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";

// Inisialisasi klien Supabase admin dengan SUPABASE_SECRET_KEY khusus di route handler ini
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  console.error("Konfigurasi SUPABASE_URL atau SUPABASE_SECRET_KEY tidak ditemukan di environment.");
}

const supabaseAdmin = createClient<Database>(supabaseUrl || "", supabaseSecretKey || "", {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

interface MayarDetailInvoiceResponse {
  statusCode: number;
  messages: string;
  data?: {
    id: string;
    amount: number;
    status: string;
    description?: string;
  };
}

export async function POST(request: NextRequest) {
  let logId: number | null = null;

  // Helper untuk memperbarui status dan pesan_error di mayar_webhook_log
  const updateLog = async (status: "diterima" | "ditolak", pesanError?: string) => {
    if (!logId) return;
    try {
      await supabaseAdmin
        .from("mayar_webhook_log")
        .update({
          status,
          pesan_error: pesanError || null,
        })
        .eq("id", logId);
    } catch {
      // Abaikan error saat menulis log agar respons ke webhook tetap cepat
    }
  };

  try {
    // Baca payload JSON dari Mayar
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { status: "ok", pesan: "Payload tidak valid atau kosong" },
        { status: 200 }
      );
    }

    const eventName = typeof body.event === "string" ? body.event : "unknown";
    const dataObj = (body.data as Record<string, unknown>) || {};
    const mayarCandidateId = typeof dataObj.id === "string" ? dataObj.id : "";

    // 1. Catat setiap pesan ke tabel mayar_webhook_log
    const { data: logEntry } = await supabaseAdmin
      .from("mayar_webhook_log")
      .insert({
        event: eventName,
        mayar_id: mayarCandidateId || null,
        payload: body as unknown as Json,
        status: "diproses",
      })
      .select("id")
      .maybeSingle();

    if (logEntry) {
      logId = logEntry.id;
    }

    // Periksa tipe event: hanya proses event pembayaran selesai (payment.received)
    if (eventName !== "payment.received") {
      await updateLog("ditolak", `Event diabaikan: event '${eventName}' bukan 'payment.received'`);
      return NextResponse.json(
        { status: "ok", pesan: "Event bukan payment.received, webhook diabaikan" },
        { status: 200 }
      );
    }

    // 2. Jangan percaya isi pesan. Kumpulkan kandidat ID tagihan dari payload
    const candidateIds: string[] = [];
    if (typeof dataObj.id === "string" && dataObj.id.trim()) {
      candidateIds.push(dataObj.id.trim());
    }
    if (typeof dataObj.productId === "string" && dataObj.productId.trim()) {
      candidateIds.push(dataObj.productId.trim());
    }
    if (typeof dataObj.invoiceId === "string" && dataObj.invoiceId.trim()) {
      candidateIds.push(dataObj.invoiceId.trim());
    }

    if (candidateIds.length === 0) {
      await updateLog("ditolak", "ID tagihan tidak ditemukan di dalam payload webhook");
      return NextResponse.json(
        { status: "ok", pesan: "ID tagihan tidak ditemukan" },
        { status: 200 }
      );
    }

    // Cari invoice terkait di database kita
    let targetInvoice: {
      id: string;
      nomor: string;
      mayar_invoice_id: string | null;
      mayar_jumlah: number | null;
      status_bayar: string;
    } | null = null;

    for (const cid of candidateIds) {
      const { data: inv } = await supabaseAdmin
        .from("invoices")
        .select("id, nomor, mayar_invoice_id, mayar_jumlah, status_bayar")
        .eq("mayar_invoice_id", cid)
        .maybeSingle();

      if (inv) {
        targetInvoice = inv;
        break;
      }
    }

    if (!targetInvoice || !targetInvoice.mayar_invoice_id) {
      await updateLog("ditolak", `Tagihan dengan Mayar ID kandidat [${candidateIds.join(", ")}] tidak ada di tabel invoices bengkel`);
      return NextResponse.json(
        { status: "ok", pesan: "Tagihan tidak terdaftar di sistem bengkel" },
        { status: 200 }
      );
    }

    // 2 (lanjutan). Tanya ulang detail status invoice ke server Mayar dengan MAYAR_API_KEY
    const mayarApiKey = process.env.MAYAR_API_KEY;
    const mayarBaseUrl = process.env.MAYAR_BASE_URL || "https://api.mayar.io/hl/v2";

    if (!mayarApiKey) {
      await updateLog("ditolak", "Konfigurasi MAYAR_API_KEY tidak ditemukan di environment server");
      return NextResponse.json(
        { status: "ok", pesan: "Konfigurasi server belum lengkap" },
        { status: 200 }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let verifyResponse: Response;
    try {
      const endpoint = `${mayarBaseUrl.replace(/\/+$/, "")}/invoices/${targetInvoice.mayar_invoice_id}`;
      verifyResponse = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${mayarApiKey}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });
    } catch (fetchErr: unknown) {
      clearTimeout(timeoutId);
      const isTimeout = fetchErr instanceof Error && fetchErr.name === "AbortError";
      const errMsg = isTimeout
        ? "Batas waktu 10 detik terlampaui saat memverifikasi detail invoice ke Mayar"
        : "Gagal menghubungkan ke server Mayar untuk verifikasi detail invoice";
      await updateLog("ditolak", errMsg);
      return NextResponse.json({ status: "ok", pesan: errMsg }, { status: 200 });
    } finally {
      clearTimeout(timeoutId);
    }

    const verifyJson = (await verifyResponse.json().catch(() => null)) as MayarDetailInvoiceResponse | null;

    if (!verifyResponse.ok || !verifyJson || verifyJson.statusCode !== 200 || !verifyJson.data) {
      const msg = verifyJson?.messages || "Respon verifikasi Mayar tidak valid";
      await updateLog("ditolak", `Verifikasi ke API Mayar gagal: ${msg}`);
      return NextResponse.json(
        { status: "ok", pesan: "Verifikasi detail invoice Mayar gagal" },
        { status: 200 }
      );
    }

    const mayarDetail = verifyJson.data;

    // 3. Validasi status harus sudah dibayar ('paid')
    const statusMayar = String(mayarDetail.status || "").toLowerCase();
    if (statusMayar !== "paid") {
      await updateLog("ditolak", `Status invoice di Mayar belum dibayar (status saat ini: '${statusMayar}')`);
      return NextResponse.json(
        { status: "ok", pesan: `Status invoice di Mayar belum paid (status: ${statusMayar})` },
        { status: 200 }
      );
    }

    // 3 (lanjutan). Validasi jumlah dari Mayar sama dengan mayar_jumlah di database kita
    const nominalMayar = Number(mayarDetail.amount);
    const nominalExpected = Number(targetInvoice.mayar_jumlah);

    if (nominalMayar !== nominalExpected) {
      await updateLog(
        "ditolak",
        `Jumlah pembayaran di Mayar (Rp${nominalMayar}) tidak sama dengan mayar_jumlah di database (Rp${nominalExpected})`
      );
      return NextResponse.json(
        { status: "ok", pesan: "Nominal pembayaran tidak cocok dengan data invoice" },
        { status: 200 }
      );
    }

    // Jika invoice sudah lunas, catat idempoten
    if (targetInvoice.status_bayar === "lunas") {
      await updateLog("diterima", "Invoice sudah lunas sebelumnya (proses idempoten)");
      return NextResponse.json(
        { status: "ok", pesan: "Invoice sudah lunas sebelumnya" },
        { status: 200 }
      );
    }

    // Panggil fungsi database tandai_lunas_mayar dengan hak akses admin
    const { data: paymentId, error: rpcErr } = await supabaseAdmin.rpc("tandai_lunas_mayar", {
      p_mayar_invoice_id: targetInvoice.mayar_invoice_id,
      p_invoice: targetInvoice.id,
    });

    if (rpcErr) {
      await updateLog("ditolak", `Fungsi tandai_lunas_mayar gagal: ${rpcErr.message}`);
      return NextResponse.json(
        { status: "ok", pesan: "Gagal menandai lunas invoice di database" },
        { status: 200 }
      );
    }

    // Catat keberhasilan di log dan kirim respons 200 OK dengan cepat
    await updateLog("diterima", `Berhasil ditandai lunas. ID Pembayaran: ${paymentId}`);
    return NextResponse.json(
      { status: "ok", pesan: "Pembayaran berhasil diverifikasi dan dicatat" },
      { status: 200 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan internal tak terduga";
    await updateLog("ditolak", `Kesalahan internal server: ${errorMsg}`);
    // Selalu balas 200 agar Mayar tidak terus mengulang pengiriman webhook yang gagal diproses internal
    return NextResponse.json(
      { status: "ok", pesan: "Webhook diterima dengan catatan kesalahan internal" },
      { status: 200 }
    );
  }
}
