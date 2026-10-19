import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface MayarItem {
  quantity: number;
  rate: number;
  description: string;
}

interface MayarCreateInvoiceResponse {
  statusCode: number;
  messages: string;
  data?: {
    id: string;
    transactionId?: string;
    link: string;
    expiredAt?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verifikasi pengguna login dan perannya dari tabel profiles (hanya Admin atau Owner)
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { pesan: "Akses ditolak: Anda harus login terlebih dahulu" },
        { status: 401 }
      );
    }

    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("role, aktif")
      .eq("id", user.id)
      .maybeSingle();

    if (
      profErr ||
      !profile ||
      !profile.aktif ||
      (profile.role !== "admin" && profile.role !== "owner")
    ) {
      return NextResponse.json(
        { pesan: "Akses ditolak: Hanya Admin atau Owner yang diizinkan membuat link pembayaran" },
        { status: 403 }
      );
    }

    // 2. Terima dan validasi ID invoice dari body request
    const body = (await request.json().catch(() => null)) as {
      invoice_id?: string;
      id?: string;
    } | null;
    const invoiceId = body?.invoice_id || body?.id;

    if (!invoiceId || typeof invoiceId !== "string") {
      return NextResponse.json(
        { pesan: "ID invoice wajib disertakan dan harus berupa teks valid" },
        { status: 400 }
      );
    }

    // Ambil data invoice, sisa tagihan, dan data pelanggan langsung dari database
    const { data: invoice, error: invErr } = await supabase
      .from("invoices")
      .select(`
        id,
        nomor,
        total,
        terbayar,
        diskon,
        status_bayar,
        mayar_invoice_id,
        mayar_link,
        mayar_jumlah,
        work_order_id,
        work_orders:work_order_id (
          id,
          nomor,
          customers:customer_id (
            id,
            nama,
            email,
            telepon
          )
        )
      `)
      .eq("id", invoiceId)
      .maybeSingle();

    if (invErr || !invoice) {
      return NextResponse.json(
        { pesan: "Data invoice tidak ditemukan di database" },
        { status: 404 }
      );
    }

    const total = Number(invoice.total);
    const terbayar = Number(invoice.terbayar);
    const sisaTagihan = total - terbayar;

    // Tolak bila invoice sudah lunas
    if (invoice.status_bayar === "lunas" || sisaTagihan <= 0) {
      return NextResponse.json(
        { pesan: "Invoice ini sudah lunas, tidak memerlukan pembuatan link pembayaran" },
        { status: 400 }
      );
    }

    const customer = invoice.work_orders?.customers;
    if (!customer) {
      return NextResponse.json(
        { pesan: "Data pelanggan untuk invoice ini tidak ditemukan" },
        { status: 400 }
      );
    }

    // Tolak bila email pelanggan kosong
    const customerEmail = customer.email?.trim();
    if (!customerEmail) {
      return NextResponse.json(
        { pesan: "Email pelanggan belum terisi. Silakan lengkapi email pelanggan terlebih dahulu di menu Pelanggan" },
        { status: 400 }
      );
    }

    // 3. Bila invoice sudah punya mayar_link dan mayar_jumlah sama dengan sisa tagihan, kembalikan tautan yang ada
    if (
      invoice.mayar_link &&
      invoice.mayar_jumlah != null &&
      Number(invoice.mayar_jumlah) === sisaTagihan
    ) {
      return NextResponse.json({
        link: invoice.mayar_link,
        mayar_invoice_id: invoice.mayar_invoice_id,
        jumlah: sisaTagihan,
      });
    }

    // 4. Bila belum ada atau jumlahnya berbeda, buat invoice baru di Mayar
    // Ambil item dari billing_items
    const { data: rawBillingItems, error: itemsErr } = await supabase
      .from("billing_items")
      .select("nama_item, jumlah, harga_dipakai")
      .eq("work_order_id", invoice.work_order_id);

    if (itemsErr) {
      return NextResponse.json(
        { pesan: "Gagal mengambil rincian item tagihan dari database" },
        { status: 500 }
      );
    }

    const billingItems = rawBillingItems || [];
    let items: MayarItem[] = [];

    if (billingItems.length > 0) {
      items = billingItems.map((bi) => ({
        quantity: bi.jumlah,
        rate: Number(bi.harga_dipakai),
        description: bi.nama_item,
      }));

      // Kurangkan diskon bila ada
      const diskon = Number(invoice.diskon || 0);
      if (diskon > 0) {
        items.push({
          quantity: 1,
          rate: -diskon,
          description: "Diskon Invoice",
        });
      }

      // Kurangkan pembayaran sebelumnya bila sebagian sudah dibayar
      if (terbayar > 0) {
        items.push({
          quantity: 1,
          rate: -terbayar,
          description: "Pembayaran Sebagian Sebelumnya",
        });
      }
    } else {
      items = [
        {
          quantity: 1,
          rate: sisaTagihan,
          description: `Tagihan ${invoice.nomor}`,
        },
      ];
    }

    // Pastikan total item sama persis dengan sisa tagihan
    const totalItemCalculated = items.reduce(
      (acc, curr) => acc + curr.quantity * curr.rate,
      0
    );
    if (totalItemCalculated !== sisaTagihan) {
      items = [
        {
          quantity: 1,
          rate: sisaTagihan,
          description: `Pelunasan Invoice ${invoice.nomor}`,
        },
      ];
    }

    const mayarApiKey = process.env.MAYAR_API_KEY;
    const mayarBaseUrl = process.env.MAYAR_BASE_URL || "https://api.mayar.io/hl/v2";

    if (!mayarApiKey) {
      return NextResponse.json(
        { pesan: "Konfigurasi Mayar belum lengkap: MAYAR_API_KEY tidak ditemukan di environment" },
        { status: 500 }
      );
    }

    // 5. Panggil API Mayar dengan batas tunggu (timeout) 10 detik
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let mayarResponse: Response;
    try {
      const endpoint = `${mayarBaseUrl.replace(/\/+$/, "")}/invoices/create`;
      mayarResponse = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mayarApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: customer.nama,
          email: customerEmail,
          mobile: customer.telepon,
          description: `Pembayaran Invoice ${invoice.nomor}`,
          items,
        }),
        signal: controller.signal,
      });
    } catch (fetchErr: unknown) {
      if (fetchErr instanceof Error && fetchErr.name === "AbortError") {
        return NextResponse.json(
          { pesan: "Permintaan ke layanan Mayar melampaui batas waktu 10 detik. Silakan coba lagi." },
          { status: 504 }
        );
      }
      return NextResponse.json(
        { pesan: "Gagal menghubungkan ke server Mayar. Periksa koneksi internet Anda." },
        { status: 502 }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    const mayarJson = (await mayarResponse.json().catch(() => null)) as MayarCreateInvoiceResponse | null;

    if (!mayarResponse.ok || !mayarJson?.data?.link || !mayarJson?.data?.id) {
      const pesanApi = typeof mayarJson?.messages === "string"
        ? mayarJson.messages
        : "Layanan Mayar menolak pembuatan invoice";
      return NextResponse.json(
        { pesan: `Gagal membuat invoice di Mayar: ${pesanApi}` },
        { status: mayarResponse.status >= 400 && mayarResponse.status < 500 ? 400 : 502 }
      );
    }

    const mayarInvoiceId = String(mayarJson.data.id);
    const mayarLink = String(mayarJson.data.link);

    // Simpan ke database via fungsi simpan_link_mayar
    const { error: rpcErr } = await supabase.rpc("simpan_link_mayar", {
      p_invoice: invoice.id,
      p_mayar_invoice_id: mayarInvoiceId,
      p_mayar_link: mayarLink,
      p_mayar_jumlah: sisaTagihan,
    });

    if (rpcErr) {
      return NextResponse.json(
        { pesan: `Gagal memperbarui link pembayaran di database: ${rpcErr.message}` },
        { status: 500 }
      );
    }

    // Kembalikan tautan dan info pembayaran
    return NextResponse.json({
      link: mayarLink,
      mayar_invoice_id: mayarInvoiceId,
      jumlah: sisaTagihan,
    });
  } catch {
    // Tangani error tak terduga tanpa mengekspos kunci atau data sensitif
    return NextResponse.json(
      { pesan: "Terjadi kesalahan pada sistem saat memproses link pembayaran online" },
      { status: 500 }
    );
  }
}
