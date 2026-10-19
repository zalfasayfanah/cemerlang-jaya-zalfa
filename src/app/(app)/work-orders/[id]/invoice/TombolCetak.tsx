"use client";

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TombolCetak({
  workOrderId,
  children,
}: {
  workOrderId: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 print:hidden border-b pb-4 mb-6">
      <Link href={`/work-orders/${workOrderId}/tagihan`}>
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="size-4" />
          Kembali ke Tagihan
        </Button>
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        <Button onClick={() => window.print()} className="gap-2 bg-primary text-primary-foreground">
          <Printer className="size-4" />
          Cetak Invoice / Simpan PDF
        </Button>
      </div>
    </div>
  );
}
