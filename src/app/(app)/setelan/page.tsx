import { redirect } from "next/navigation";
import { ambilProfilSaya } from "@/lib/profil";
import { createClient } from "@/lib/supabase/server";
import { FormSetelan } from "./FormSetelan";
import { PaymentGatewaySettings, type MayarWebhookLogRow } from "./PaymentGatewaySettings";

export default async function HalamanSetelan() {
  const profil = await ambilProfilSaya();
  if (profil.peran !== "owner") {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  const { data: settings, error } = await supabase
    .from("workshop_settings")
    .select("id, nama, alamat, telepon, jam_buka, logo_path, galeri_paths, updated_at")
    .eq("id", 1)
    .single();

  if (error || !settings) {
    return (
      <div className="p-6 text-center text-danger">
        Setelan bengkel gagal dimuat. Pastikan tabel workshop_settings telah terisi.
      </div>
    );
  }

  // Cek ketersediaan variabel lingkungan di server tanpa mengekspos nilainya
  const terhubung = Boolean(process.env.MAYAR_API_KEY);

  // Ambil 10 baris terakhir dari mayar_webhook_log (hanya Owner yang berhak baca lewat RLS)
  const { data: rawLogs } = await supabase
    .from("mayar_webhook_log")
    .select("id, event, status, payload, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  const webhookLogs = (rawLogs ?? []) as unknown as MayarWebhookLogRow[];

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-text">Setelan Bengkel</h1>
        <p className="text-sm text-muted-foreground">
          Kelola profil bengkel, identitas visual (logo), galeri halaman depan, dan payment gateway.
        </p>
      </div>

      <FormSetelan settings={settings} />

      {/* Bagian Payment Gateway khusus Owner */}
      <PaymentGatewaySettings
        terhubung={terhubung}
        webhookLogs={webhookLogs}
      />
    </div>
  );
}
