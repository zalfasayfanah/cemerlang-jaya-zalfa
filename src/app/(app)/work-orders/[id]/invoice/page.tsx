import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { rupiah, tanggal, tanggalWaktu } from "@/lib/format";
import { ambilProfilSaya } from "@/lib/profil";
import { createClient } from "@/lib/supabase/server";
import { TombolBayarOnline } from "./TombolBayarOnline";
import { TombolCetak } from "./TombolCetak";

export default async function InvoiceWorkOrder({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profil = await ambilProfilSaya();
  const bolehBayar = profil.peran === "admin" || profil.peran === "owner";
  const supabase = await createClient();

  // 1. Ambil data Work Order dan Invoice
  const { data: wo, error: errWO } = await supabase
    .from("work_orders")
    .select(`
      id,
      nomor,
      status,
      created_at,
      customers:customer_id (nama, telepon, alamat),
      vehicles:vehicle_id (plat, merek_model, tahun, transmisi, warna),
      invoices (
        id,
        nomor,
        subtotal,
        diskon,
        total,
        terbayar,
        status_bayar,
        dibayar_online_at,
        diterbitkan_at,
        diterbitkan_oleh:profiles (nama)
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (errWO || !wo) {
    notFound();
  }

  // Jika invoice belum terbit, tampilkan pesan informatif
  if (!wo.invoices) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href={`/work-orders/${id}/tagihan`}>
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="size-4" />
              Kembali ke Tagihan
            </Button>
          </Link>
        </div>
        <Card className="py-12 text-center">
          <CardContent className="space-y-4">
            <Receipt className="mx-auto size-12 text-text-muted" />
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-text">Invoice Belum Diterbitkan</h2>
              <p className="text-sm text-text-muted max-w-md mx-auto">
                Work Order <strong>{wo.nomor}</strong> saat ini berstatus{" "}
                <Badge variant="outline">{wo.status}</Badge>. Invoice resmi dapat diterbitkan
                oleh Admin atau Owner setelah status pengerjaan siap diambil.
              </p>
            </div>
            <Link href={`/work-orders/${id}/tagihan`}>
              <Button className="mt-2">Buka Halaman Tagihan</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const invoice = wo.invoices;
  const sisa = Math.max(0, invoice.total - invoice.terbayar);

  // 2. Ambil baris tagihan (Sesuai PRD 6.9: TIDAK memuat penanda penyesuaian, harga master, atau harga modal)
  const { data: rawItems } = await supabase
    .from("billing_items")
    .select("id, nama_item, jenis, jumlah, harga_dipakai")
    .eq("work_order_id", id)
    .order("created_at", { ascending: true });

  const items = rawItems ?? [];

  // 3. Ambil data setelan bengkel
  const { data: bengkel } = await supabase
    .from("workshop_settings")
    .select("nama, alamat, telepon, jam_buka, logo_path")
    .eq("id", 1)
    .maybeSingle();

  // 4. Ambil pembayaran
  const { data: rawPayments } = await supabase
    .from("payments")
    .select(`
      id,
      metode,
      jumlah,
      created_at,
      dicatat_oleh:profiles (nama)
    `)
    .eq("invoice_id", invoice.id)
    .order("created_at", { ascending: true });

  const payments = rawPayments ?? [];

  const customer = Array.isArray(wo.customers) ? wo.customers[0] : wo.customers;
  const vehicle = Array.isArray(wo.vehicles) ? wo.vehicles[0] : wo.vehicles;
  const penerbit = Array.isArray(invoice.diterbitkan_oleh)
    ? invoice.diterbitkan_oleh[0]
    : invoice.diterbitkan_oleh;

  return (
    <div className="space-y-6">
      {/* Tombol Cetak / Navigasi (disembunyikan saat mencetak) */}
      <TombolCetak workOrderId={id}>
        <TombolBayarOnline
          invoiceId={invoice.id}
          initialStatusBayar={invoice.status_bayar}
          initialDibayarOnlineAt={invoice.dibayar_online_at}
          bolehBayar={bolehBayar}
        />
      </TombolCetak>

      {/* Lembar Invoice Cetak A4 */}
      <div className="mx-auto max-w-4xl rounded-xl border bg-card p-8 md:p-12 shadow-sm text-text print:border-none print:shadow-none print:p-0 print:max-w-none">
        {/* Header Bengkel & Identitas Invoice */}
        <div className="flex flex-wrap items-start justify-between gap-6 border-b pb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black text-xl">
                CJ
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-text">
                  {bengkel?.nama ?? "Cemerlang Jaya Motor"}
                </h1>
                <p className="text-xs text-text-muted">Bengkel Perawatan & Perbaikan Mobil</p>
              </div>
            </div>
            <p className="text-xs text-text-muted max-w-xs leading-relaxed">
              {bengkel?.alamat ?? "Jl. Raya Cibubur No. 88, Jakarta Timur"}
              <br />
              Telepon: {bengkel?.telepon ?? "021-8770 1234"}
              {bengkel?.jam_buka && <><br />Jam Operasional: {bengkel.jam_buka}</>}
            </p>
          </div>

          <div className="text-right space-y-1.5">
            <h2 className="text-3xl font-extrabold tracking-tight text-primary">INVOICE</h2>
            <p className="text-sm font-semibold tracking-wide text-text">{invoice.nomor}</p>
            <p className="text-xs text-text-muted">
              Tanggal: {tanggal(invoice.diterbitkan_at)}
            </p>
            <div className="pt-1 flex flex-col items-end">
              <Badge
                variant={
                  invoice.status_bayar === "lunas"
                    ? "default"
                    : invoice.status_bayar === "sebagian"
                      ? "secondary"
                      : "outline"
                }
                className={`text-xs uppercase font-bold tracking-wider px-3 py-1 ${
                  invoice.status_bayar === "lunas"
                    ? "bg-success text-white"
                    : invoice.status_bayar === "sebagian"
                      ? "bg-warning text-black"
                      : "text-danger border-danger"
                }`}
              >
                {invoice.status_bayar === "lunas"
                  ? "LUNAS"
                  : invoice.status_bayar === "sebagian"
                    ? "DIBAYAR SEBAGIAN"
                    : "BELUM BAYAR"}
              </Badge>
              {invoice.dibayar_online_at && (
                <p className="text-[11px] text-text-muted mt-1.5">
                  Dibayar online: {tanggalWaktu(invoice.dibayar_online_at)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Informasi Pelanggan & Kendaraan */}
        <div className="grid grid-cols-2 gap-8 py-6 border-b text-xs">
          <div>
            <h3 className="font-semibold text-text uppercase tracking-wider mb-2 text-[11px] text-text-muted">
              Ditujukan Kepada:
            </h3>
            <p className="text-sm font-bold text-text">{customer?.nama ?? "-"}</p>
            <p className="text-text-muted">{customer?.telepon ?? "-"}</p>
            {customer?.alamat && <p className="text-text-muted mt-0.5">{customer.alamat}</p>}
          </div>

          <div>
            <h3 className="font-semibold text-text uppercase tracking-wider mb-2 text-[11px] text-text-muted">
              Informasi Kendaraan & Layanan:
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <span className="text-text-muted">Nomor Polisi:</span>
              <span className="font-bold text-text">{vehicle?.plat ?? "-"}</span>

              <span className="text-text-muted">Kendaraan:</span>
              <span className="font-medium text-text">{vehicle?.merek_model ?? "-"}</span>

              <span className="text-text-muted">Tahun / Transmisi:</span>
              <span className="text-text">
                {vehicle?.tahun ?? "-"} · {vehicle?.transmisi ?? "-"}
              </span>

              <span className="text-text-muted">Nomor Work Order:</span>
              <span className="font-medium text-text">{wo.nomor}</span>
            </div>
          </div>
        </div>

        {/* Tabel Baris Tagihan (PRD 6.9: Item, Jenis, Jumlah, Harga Satuan, Subtotal) */}
        <div className="py-6">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2">
                <TableHead className="w-12 text-center">No</TableHead>
                <TableHead>Deskripsi Layanan / Spare Part</TableHead>
                <TableHead className="w-24">Kategori</TableHead>
                <TableHead className="w-20 text-right">Jumlah</TableHead>
                <TableHead className="w-32 text-right">Harga Satuan</TableHead>
                <TableHead className="w-36 text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it, idx) => {
                const sub = it.jumlah * it.harga_dipakai;
                return (
                  <TableRow key={it.id} className="border-b">
                    <TableCell className="text-center font-medium text-xs text-text-muted">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-medium text-text text-xs">
                      {it.nama_item}
                    </TableCell>
                    <TableCell className="text-xs text-text-muted">
                      {it.jenis === "part" ? "Spare Part" : "Jasa"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs">
                      {it.jumlah}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs text-text-muted">
                      {rupiah(it.harga_dipakai)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-xs text-text">
                      {rupiah(sub)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Bagian Perhitungan Total */}
        <div className="flex justify-end pt-2 pb-6 border-b">
          <div className="w-72 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-text-muted">Subtotal:</span>
              <span className="font-medium tabular-nums text-text">{rupiah(invoice.subtotal)}</span>
            </div>

            {invoice.diskon > 0 && (
              <div className="flex justify-between text-danger">
                <span>Diskon:</span>
                <span className="font-medium tabular-nums">-{rupiah(invoice.diskon)}</span>
              </div>
            )}

            <div className="flex justify-between border-t pt-2 text-sm font-bold text-text">
              <span>Total Tagihan:</span>
              <span className="tabular-nums text-primary">{rupiah(invoice.total)}</span>
            </div>

            <div className="flex justify-between text-success">
              <span>Sudah Dibayar:</span>
              <span className="tabular-nums font-medium">{rupiah(invoice.terbayar)}</span>
            </div>

            {sisa > 0 && (
              <div className="flex justify-between border-t pt-1 font-bold text-danger text-sm">
                <span>Sisa Tagihan:</span>
                <span className="tabular-nums">{rupiah(sisa)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Riwayat Pembayaran jika ada */}
        {payments.length > 0 && (
          <div className="py-6 border-b text-xs">
            <h3 className="font-semibold text-text uppercase tracking-wider mb-2 text-[11px] text-text-muted">
              Riwayat Pembayaran
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Tanggal</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead className="text-right">Jumlah Dibayar</TableHead>
                  <TableHead className="text-right">Diterima Oleh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-text-muted">{tanggal(p.created_at)}</TableCell>
                    <TableCell className="capitalize font-medium">{p.metode}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-success">
                      {rupiah(p.jumlah)}
                    </TableCell>
                    <TableCell className="text-right text-text-muted">
                      {p.dicatat_oleh?.nama ?? "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Tanda Tangan */}
        <div className="grid grid-cols-2 gap-12 pt-8 pb-4 text-xs">
          <div className="text-center space-y-16">
            <p className="text-text-muted">Pemilik / Pelanggan,</p>
            <div>
              <p className="font-semibold text-text underline decoration-1 underline-offset-4">
                {customer?.nama ?? "Pelanggan"}
              </p>
            </div>
          </div>

          <div className="text-center space-y-16">
            <p className="text-text-muted">
              {bengkel?.nama ?? "Cemerlang Jaya Motor"},
            </p>
            <div>
              <p className="font-semibold text-text underline decoration-1 underline-offset-4">
                {penerbit?.nama ?? "Admin Kasir"}
              </p>
              <p className="text-[10px] text-text-muted">Petugas Kasir</p>
            </div>
          </div>
        </div>

        {/* Catatan Kaki Invoice */}
        <div className="mt-8 border-t pt-4 text-center text-[10px] text-text-muted">
          <p>
            Terima kasih atas kepercayaan Anda mempercayakan perawatan kendaraan di{" "}
            <strong>{bengkel?.nama ?? "Cemerlang Jaya Motor"}</strong>.
          </p>
          <p className="mt-0.5">
            Kuitansi ini adalah bukti pembayaran yang sah. Harap disimpan dengan baik.
          </p>
        </div>
      </div>
    </div>
  );
}
