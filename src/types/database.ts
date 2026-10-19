export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          aksi: string
          alasan: string | null
          data_id: string | null
          id: number
          pelaku_id: string | null
          pelaku_peran: string | null
          sebelum: Json | null
          sesudah: Json | null
          tabel: string
          waktu: string
        }
        Insert: {
          aksi: string
          alasan?: string | null
          data_id?: string | null
          id?: never
          pelaku_id?: string | null
          pelaku_peran?: string | null
          sebelum?: Json | null
          sesudah?: Json | null
          tabel: string
          waktu?: string
        }
        Update: {
          aksi?: string
          alasan?: string | null
          data_id?: string | null
          id?: never
          pelaku_id?: string | null
          pelaku_peran?: string | null
          sebelum?: Json | null
          sesudah?: Json | null
          tabel?: string
          waktu?: string
        }
        Relationships: []
      }
      billing_item_costs: {
        Row: {
          billing_item_id: string
          harga_modal: number
        }
        Insert: {
          billing_item_id: string
          harga_modal?: number
        }
        Update: {
          billing_item_id?: string
          harga_modal?: number
        }
        Relationships: [
          {
            foreignKeyName: "billing_item_costs_billing_item_id_fkey"
            columns: ["billing_item_id"]
            isOneToOne: true
            referencedRelation: "billing_items"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_items: {
        Row: {
          alasan_penyesuaian: string | null
          created_at: string
          disesuaikan_at: string | null
          disesuaikan_oleh: string | null
          ditambah_oleh: string | null
          harga_dipakai: number
          harga_master: number
          id: string
          item_id: string
          jenis: string
          jumlah: number
          nama_item: string
          work_order_id: string
        }
        Insert: {
          alasan_penyesuaian?: string | null
          created_at?: string
          disesuaikan_at?: string | null
          disesuaikan_oleh?: string | null
          ditambah_oleh?: string | null
          harga_dipakai: number
          harga_master: number
          id?: string
          item_id: string
          jenis: string
          jumlah: number
          nama_item: string
          work_order_id: string
        }
        Update: {
          alasan_penyesuaian?: string | null
          created_at?: string
          disesuaikan_at?: string | null
          disesuaikan_oleh?: string | null
          ditambah_oleh?: string | null
          harga_dipakai?: number
          harga_master?: number
          id?: string
          item_id?: string
          jenis?: string
          jumlah?: number
          nama_item?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_items_disesuaikan_oleh_fkey"
            columns: ["disesuaikan_oleh"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_items_ditambah_oleh_fkey"
            columns: ["ditambah_oleh"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_items_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          alamat: string | null
          created_at: string
          email: string | null
          id: string
          nama: string
          telepon: string
          tipe: string
        }
        Insert: {
          alamat?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nama: string
          telepon: string
          tipe?: string
        }
        Update: {
          alamat?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nama?: string
          telepon?: string
          tipe?: string
        }
        Relationships: []
      }
      inventory_costs: {
        Row: {
          harga_modal: number
          item_id: string
          updated_at: string
        }
        Insert: {
          harga_modal: number
          item_id: string
          updated_at?: string
        }
        Update: {
          harga_modal?: number
          item_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_costs_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          aktif: boolean
          created_at: string
          harga_jual: number
          id: string
          jenis: string
          kode: string
          nama: string
          stok: number
          stok_minimum: number
          updated_at: string
        }
        Insert: {
          aktif?: boolean
          created_at?: string
          harga_jual: number
          id?: string
          jenis: string
          kode: string
          nama: string
          stok?: number
          stok_minimum?: number
          updated_at?: string
        }
        Update: {
          aktif?: boolean
          created_at?: string
          harga_jual?: number
          id?: string
          jenis?: string
          kode?: string
          nama?: string
          stok?: number
          stok_minimum?: number
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          dibayar_online_at: string | null
          diskon: number
          diterbitkan_at: string
          diterbitkan_oleh: string | null
          id: string
          mayar_invoice_id: string | null
          mayar_jumlah: number | null
          mayar_link: string | null
          nomor: string
          status_bayar: string
          subtotal: number
          terbayar: number
          total: number
          work_order_id: string
        }
        Insert: {
          dibayar_online_at?: string | null
          diskon?: number
          diterbitkan_at?: string
          diterbitkan_oleh?: string | null
          id?: string
          mayar_invoice_id?: string | null
          mayar_jumlah?: number | null
          mayar_link?: string | null
          nomor: string
          status_bayar?: string
          subtotal: number
          terbayar?: number
          total: number
          work_order_id: string
        }
        Update: {
          dibayar_online_at?: string | null
          diskon?: number
          diterbitkan_at?: string
          diterbitkan_oleh?: string | null
          id?: string
          mayar_invoice_id?: string | null
          mayar_jumlah?: number | null
          mayar_link?: string | null
          nomor?: string
          status_bayar?: string
          subtotal?: number
          terbayar?: number
          total?: number
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_diterbitkan_oleh_fkey"
            columns: ["diterbitkan_oleh"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: true
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      mayar_webhook_log: {
        Row: {
          created_at: string
          event: string | null
          id: number
          mayar_id: string | null
          payload: Json
          pesan_error: string | null
          status: string
        }
        Insert: {
          created_at?: string
          event?: string | null
          id?: never
          mayar_id?: string | null
          payload: Json
          pesan_error?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          event?: string | null
          id?: never
          mayar_id?: string | null
          payload?: Json
          pesan_error?: string | null
          status?: string
        }
        Relationships: []
      }
      mekanik: {
        Row: {
          aktif: boolean
          created_at: string
          id: string
          kepala_mekanik_id: string
          nama: string
        }
        Insert: {
          aktif?: boolean
          created_at?: string
          id?: string
          kepala_mekanik_id: string
          nama: string
        }
        Update: {
          aktif?: boolean
          created_at?: string
          id?: string
          kepala_mekanik_id?: string
          nama?: string
        }
        Relationships: [
          {
            foreignKeyName: "mekanik_kepala_mekanik_id_fkey"
            columns: ["kepala_mekanik_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      number_counters: {
        Row: {
          jenis: string
          periode: string
          terakhir: number
        }
        Insert: {
          jenis: string
          periode: string
          terakhir?: number
        }
        Update: {
          jenis?: string
          periode?: string
          terakhir?: number
        }
        Relationships: []
      }
      payments: {
        Row: {
          created_at: string
          dicatat_oleh: string | null
          id: string
          invoice_id: string
          jumlah: number
          metode: string
        }
        Insert: {
          created_at?: string
          dicatat_oleh?: string | null
          id?: string
          invoice_id: string
          jumlah: number
          metode: string
        }
        Update: {
          created_at?: string
          dicatat_oleh?: string | null
          id?: string
          invoice_id?: string
          jumlah?: number
          metode?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_dicatat_oleh_fkey"
            columns: ["dicatat_oleh"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          aktif: boolean
          created_at: string
          email: string
          id: string
          nama: string
          role: string
        }
        Insert: {
          aktif?: boolean
          created_at?: string
          email: string
          id: string
          nama: string
          role?: string
        }
        Update: {
          aktif?: boolean
          created_at?: string
          email?: string
          id?: string
          nama?: string
          role?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string
          dicatat_oleh: string | null
          id: number
          item_id: string
          jenis: string
          jumlah: number
          keterangan: string | null
          stok_sesudah: number
          work_order_id: string | null
        }
        Insert: {
          created_at?: string
          dicatat_oleh?: string | null
          id?: never
          item_id: string
          jenis: string
          jumlah: number
          keterangan?: string | null
          stok_sesudah: number
          work_order_id?: string | null
        }
        Update: {
          created_at?: string
          dicatat_oleh?: string | null
          id?: never
          item_id?: string
          jenis?: string
          jumlah?: number
          keterangan?: string | null
          stok_sesudah?: number
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_dicatat_oleh_fkey"
            columns: ["dicatat_oleh"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          merek_model: string
          plat: string
          tahun: number | null
          transmisi: string | null
          warna: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          merek_model: string
          plat: string
          tahun?: number | null
          transmisi?: string | null
          warna?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          merek_model?: string
          plat?: string
          tahun?: number | null
          transmisi?: string | null
          warna?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      wo_status_history: {
        Row: {
          catatan: string | null
          created_at: string
          dari_status: string | null
          id: number
          ke_status: string
          oleh: string | null
          work_order_id: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          dari_status?: string | null
          id?: never
          ke_status: string
          oleh?: string | null
          work_order_id: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          dari_status?: string | null
          id?: never
          ke_status?: string
          oleh?: string | null
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wo_status_history_oleh_fkey"
            columns: ["oleh"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wo_status_history_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_mekanik: {
        Row: {
          mekanik_id: string
          work_order_id: string
        }
        Insert: {
          mekanik_id: string
          work_order_id: string
        }
        Update: {
          mekanik_id?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_mekanik_mekanik_id_fkey"
            columns: ["mekanik_id"]
            isOneToOne: false
            referencedRelation: "mekanik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_mekanik_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_photos: {
        Row: {
          created_at: string
          diunggah_oleh: string | null
          id: string
          jenis: string
          path: string
          work_order_id: string
        }
        Insert: {
          created_at?: string
          diunggah_oleh?: string | null
          id?: string
          jenis: string
          path: string
          work_order_id: string
        }
        Update: {
          created_at?: string
          diunggah_oleh?: string | null
          id?: string
          jenis?: string
          path?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_photos_diunggah_oleh_fkey"
            columns: ["diunggah_oleh"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_photos_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          alasan_diskon: string | null
          catatan_status: string | null
          created_at: string
          customer_id: string
          diagnosis: string | null
          diambil_at: string | null
          dibuat_oleh: string | null
          diskon: number
          estimasi_selesai: string | null
          id: string
          keluhan: string
          kepala_mekanik_id: string
          nomor: string
          odometer: number
          selesai_at: string | null
          status: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          alasan_diskon?: string | null
          catatan_status?: string | null
          created_at?: string
          customer_id: string
          diagnosis?: string | null
          diambil_at?: string | null
          dibuat_oleh?: string | null
          diskon?: number
          estimasi_selesai?: string | null
          id?: string
          keluhan: string
          kepala_mekanik_id: string
          nomor: string
          odometer: number
          selesai_at?: string | null
          status?: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          alasan_diskon?: string | null
          catatan_status?: string | null
          created_at?: string
          customer_id?: string
          diagnosis?: string | null
          diambil_at?: string | null
          dibuat_oleh?: string | null
          diskon?: number
          estimasi_selesai?: string | null
          id?: string
          keluhan?: string
          kepala_mekanik_id?: string
          nomor?: string
          odometer?: number
          selesai_at?: string | null
          status?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_dibuat_oleh_fkey"
            columns: ["dibuat_oleh"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_kepala_mekanik_id_fkey"
            columns: ["kepala_mekanik_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_settings: {
        Row: {
          alamat: string
          galeri_paths: string[]
          id: number
          jam_buka: string | null
          logo_path: string | null
          nama: string
          telepon: string
          updated_at: string
        }
        Insert: {
          alamat?: string
          galeri_paths?: string[]
          id?: number
          jam_buka?: string | null
          logo_path?: string | null
          nama?: string
          telepon?: string
          updated_at?: string
        }
        Update: {
          alamat?: string
          galeri_paths?: string[]
          id?: number
          jam_buka?: string | null
          logo_path?: string | null
          nama?: string
          telepon?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      atur_diskon: {
        Args: { p_alasan: string; p_diskon: number; p_wo: string }
        Returns: undefined
      }
      buat_work_order: {
        Args: {
          p_keluhan: string
          p_kepala_mekanik_id: string
          p_odometer: number
          p_vehicle_id: string
        }
        Returns: string
      }
      catat_pembayaran: {
        Args: { p_invoice: string; p_jumlah: number; p_metode: string }
        Returns: string
      }
      catat_stok_masuk: {
        Args: { p_item: string; p_jumlah: number; p_keterangan?: string }
        Returns: undefined
      }
      dashboard_beban_mekanik: {
        Args: { p_dari: string; p_sampai: string; p_tim?: string }
        Returns: {
          mekanik: string
          tim: string
          wo_aktif: number
          wo_selesai: number
        }[]
      }
      dashboard_laba_harian: {
        Args: { p_dari: string; p_sampai: string }
        Returns: {
          laba: number
          modal: number
          pendapatan: number
          tanggal: string
        }[]
      }
      dashboard_pendapatan_harian: {
        Args: { p_dari: string; p_sampai: string }
        Returns: {
          pendapatan_jasa: number
          pendapatan_part: number
          tanggal: string
        }[]
      }
      dashboard_ringkasan: {
        Args: { p_dari: string; p_sampai: string }
        Returns: Json
      }
      dashboard_top_item: {
        Args: { p_dari: string; p_jenis?: string; p_sampai: string }
        Returns: {
          jumlah: number
          nama: string
          pendapatan: number
        }[]
      }
      dashboard_wo_per_status: {
        Args: { p_tim?: string }
        Returns: {
          jumlah: number
          status: string
        }[]
      }
      dashboard_wo_selesai_harian: {
        Args: { p_dari: string; p_sampai: string }
        Returns: {
          jumlah: number
          tanggal: string
        }[]
      }
      hapus_item_tagihan: {
        Args: { p_billing_item: string }
        Returns: undefined
      }
      laporan_laba: {
        Args: { p_dari: string; p_sampai: string }
        Returns: {
          laba: number
          margin_persen: number
          modal: number
          nomor_invoice: string
          nomor_wo: string
          pendapatan: number
          plat: string
          tanggal: string
          work_order_id: string
        }[]
      }
      sesuaikan_harga_item: {
        Args: { p_alasan: string; p_billing_item: string; p_harga: number }
        Returns: boolean
      }
      sesuaikan_stok: {
        Args: { p_alasan: string; p_item: string; p_stok_fisik: number }
        Returns: undefined
      }
      simpan_link_mayar: {
        Args: {
          p_invoice: string
          p_mayar_invoice_id: string
          p_mayar_jumlah: number
          p_mayar_link: string
        }
        Returns: undefined
      }
      tambah_item_tagihan: {
        Args: { p_item: string; p_jumlah: number; p_wo: string }
        Returns: string
      }
      tandai_lunas_mayar: {
        Args: { p_invoice?: string; p_mayar_invoice_id: string }
        Returns: string
      }
      terbitkan_invoice: { Args: { p_wo: string }; Returns: string }
      tugaskan_mekanik: {
        Args: { p_estimasi: string; p_mekanik: string[]; p_wo: string }
        Returns: undefined
      }
      ubah_status_wo: {
        Args: { p_catatan?: string; p_status: string; p_wo: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
