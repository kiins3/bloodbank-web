"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { bloodGroup, fmtDate, productType } from "@/lib/format";
import type { PrintedLabel } from "@/lib/types";

/** Shows the generated bag label and prints just the label. */
export function LabelDialog({ label, onClose }: { label: PrintedLabel | null; onClose: () => void }) {
  function print() {
    const node = document.getElementById("bag-label");
    if (!node) return;
    const w = window.open("", "_blank", "width=480,height=360");
    if (!w) return;
    w.document.write(
      `<html><head><title>${(label?.bagCode ?? "").replace(/[<>&"]/g, "")}</title><style>body{font-family:system-ui,sans-serif;margin:16px}img{width:100%}</style></head><body>${node.innerHTML}</body></html>`,
    );
    w.document.close();
    w.focus();
    w.print();
  }
  return (
    <Dialog open={!!label} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nhãn túi máu</DialogTitle>
          <DialogDescription>Đã tạo nhãn. Dán lên túi rồi chuyển sang kho.</DialogDescription>
        </DialogHeader>
        {label && (
          <div id="bag-label" className="rounded-lg border-2 border-dashed p-4">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontSize: 12, color: "#666", margin: 0 }}>{productType[label.productType]}</p>
                <p style={{ fontSize: 16, fontWeight: 600, margin: "2px 0 0", fontFamily: "monospace" }}>{label.bagCode}</p>
              </div>
              <p style={{ fontSize: 32, fontWeight: 700, color: "#e11d48", margin: 0, lineHeight: 1 }}>{bloodGroup(label.bloodType, label.rhFactor)}</p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`data:image/png;base64,${label.barCodeBag}`} alt={`Mã vạch ${label.bagCode}`} style={{ width: "100%", height: 72, objectFit: "contain", margin: "12px 0", background: "#fff" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span>Thể tích: <b>{label.volume} ml</b></span>
              <span>HSD: <b>{fmtDate(label.expiryDate)}</b></span>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Đóng</Button>
          <Button onClick={print}><Printer /> In nhãn</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
