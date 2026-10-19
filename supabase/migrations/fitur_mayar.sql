-- ====================================================================
-- App 4 Cemerlang Jaya Motor
-- Fitur: Integrasi Pembayaran Online Mayar (Sandbox Mode)
-- ====================================================================

-- 1. Tambah kolom pendukung Mayar di tabel invoices
alter table public.invoices
  add column if not exists mayar_invoice_id text,
  add column if not exists mayar_link text,
  add column if not exists mayar_jumlah bigint,
  add column if not exists dibayar_online_at timestamptz;

create index if not exists idx_invoices_mayar_invoice_id 
  on public.invoices (mayar_invoice_id);

-- 2. Tambah metode 'mayar' pada constraint tabel payments
alter table public.payments 
  drop constraint if exists payments_metode_check;

alter table public.payments 
  add constraint payments_metode_check 
  check (metode in ('tunai', 'transfer', 'qris', 'mayar'));

-- 3. Tabel log webhook Mayar (RLS aktif, hanya Owner yang membaca)
create table if not exists public.mayar_webhook_log (
  id bigint generated always as identity primary key,
  event text,
  mayar_id text,
  payload jsonb not null,
  status text not null default 'diterima',
  pesan_error text,
  created_at timestamptz not null default now()
);

alter table public.mayar_webhook_log enable row level security;

drop policy if exists "webhook_log_owner_baca" on public.mayar_webhook_log;
create policy "webhook_log_owner_baca" on public.mayar_webhook_log
  for select to authenticated
  using ((select private.peran_saya()) = 'owner');

revoke all on public.mayar_webhook_log from public, anon;
grant select on public.mayar_webhook_log to authenticated;
grant all on public.mayar_webhook_log to service_role;

-- 4. Fungsi simpan_link_mayar (Admin dan Owner)
create or replace function public.simpan_link_mayar(
  p_invoice uuid,
  p_mayar_invoice_id text,
  p_mayar_link text,
  p_mayar_jumlah bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_peran text;
  v_inv record;
begin
  -- Periksa peran pemanggil
  v_peran := private.peran_saya();
  if v_peran not in ('admin', 'owner') then
    raise exception 'Hanya Admin atau Owner yang boleh menyimpan link pembayaran Mayar';
  end if;

  -- Validasi input
  if p_invoice is null then
    raise exception 'ID Invoice wajib diisi';
  end if;
  if coalesce(trim(p_mayar_invoice_id), '') = '' then
    raise exception 'Mayar Invoice ID wajib diisi';
  end if;
  if coalesce(trim(p_mayar_link), '') = '' then
    raise exception 'Link pembayaran Mayar wajib diisi';
  end if;
  if p_mayar_jumlah is null or p_mayar_jumlah <= 0 then
    raise exception 'Jumlah pembayaran Mayar harus lebih besar dari 0';
  end if;

  -- Kunci baris invoice dengan FOR UPDATE
  select id, status_bayar
  into v_inv
  from public.invoices
  where id = p_invoice
  for update;

  if not found then
    raise exception 'Invoice tidak ditemukan';
  end if;

  if v_inv.status_bayar = 'lunas' then
    raise exception 'Invoice sudah lunas';
  end if;

  -- Perbarui data Mayar pada invoice
  update public.invoices
  set
    mayar_invoice_id = trim(p_mayar_invoice_id),
    mayar_link = trim(p_mayar_link),
    mayar_jumlah = p_mayar_jumlah
  where id = p_invoice;
end;
$$;

revoke all on function public.simpan_link_mayar(uuid, text, text, bigint) from public, anon;
grant execute on function public.simpan_link_mayar(uuid, text, text, bigint) to authenticated;

-- 5. Fungsi tandai_lunas_mayar (Hanya Secret Key / Service Role)
create or replace function public.tandai_lunas_mayar(
  p_mayar_invoice_id text,
  p_invoice uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inv record;
  v_bayar bigint;
  v_terbayar_baru bigint;
  v_status_baru text;
  v_payment_id uuid;
begin
  -- 1. Validasi pemanggil hanya service_role (Secret Key)
  if coalesce(auth.jwt()->>'role', auth.role(), current_user) <> 'service_role' then
    raise exception 'Akses ditolak: fungsi ini hanya dapat dijalankan dengan secret key (service role)';
  end if;

  -- 2. Validasi input
  if coalesce(trim(p_mayar_invoice_id), '') = '' and p_invoice is null then
    raise exception 'Mayar Invoice ID atau ID Invoice harus diberikan';
  end if;

  -- 3. Kunci baris invoice dengan FOR UPDATE
  select id, total, terbayar, status_bayar, mayar_jumlah
  into v_inv
  from public.invoices
  where (p_mayar_invoice_id is not null and mayar_invoice_id = trim(p_mayar_invoice_id))
     or (p_invoice is not null and id = p_invoice)
  for update;

  if not found then
    raise exception 'Invoice tidak ditemukan';
  end if;

  -- 4. Idempoten: catat pembayaran hanya bila belum lunas
  if v_inv.status_bayar = 'lunas' then
    return null;
  end if;

  -- 5. Tentukan nominal pembayaran sebesar mayar_jumlah
  v_bayar := coalesce(v_inv.mayar_jumlah, v_inv.total - v_inv.terbayar);
  if v_bayar <= 0 then
    v_bayar := v_inv.total - v_inv.terbayar;
  end if;

  -- 6. Hitung akumulasi pembayaran dan status baru
  v_terbayar_baru := v_inv.terbayar + v_bayar;
  if v_terbayar_baru >= v_inv.total then
    v_status_baru := 'lunas';
  else
    v_status_baru := 'sebagian';
  end if;

  -- 7. Update status invoice
  update public.invoices
  set
    terbayar = v_terbayar_baru,
    status_bayar = v_status_baru,
    dibayar_online_at = now()
  where id = v_inv.id;

  -- 8. Catat pembayaran di payments
  insert into public.payments (
    invoice_id,
    metode,
    jumlah,
    dicatat_oleh
  ) values (
    v_inv.id,
    'mayar',
    v_bayar,
    null
  )
  returning id into v_payment_id;

  return v_payment_id;
end;
$$;

revoke all on function public.tandai_lunas_mayar(text, uuid) from public, anon, authenticated;
grant execute on function public.tandai_lunas_mayar(text, uuid) to service_role;
