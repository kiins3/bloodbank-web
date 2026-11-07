"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// BarcodeDetector ships in Chromium browsers but not in TypeScript's DOM lib yet.
type Detector = { detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]> };
type DetectorCtor = new (opts: { formats: string[] }) => Detector;
const getDetector = () => (globalThis as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;

/**
 * Camera scanner for QR tickets and bag barcodes, using the browser's BarcodeDetector.
 * Hidden where unsupported; USB scanners still work through the text input next to it.
 */
export function QrScanner({ onResult, label = "Quét bằng camera" }: { onResult: (code: string) => void; label?: string }) {
  const [open, setOpen] = useState(false);
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const video = useRef<HTMLVideoElement>(null);

  // Feature-detect after mount so server and client render the same markup.
  useEffect(() => {
    const id = requestAnimationFrame(() => setSupported(!!getDetector() && !!navigator.mediaDevices?.getUserMedia));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    const Ctor = getDetector();
    if (!Ctor) return;
    const detector = new Ctor({ formats: ["qr_code", "code_128", "ean_13"] });
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;

    const tick = async () => {
      if (stopped || !video.current) return;
      try {
        const found = await detector.detect(video.current);
        if (found[0]?.rawValue) {
          onResult(found[0].rawValue.trim());
          setOpen(false);
          return;
        }
      } catch {
        /* frame not ready yet */
      }
      timer = setTimeout(tick, 250);
    };

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        stream = s;
        if (video.current) {
          video.current.srcObject = s;
          void video.current.play();
        }
        tick();
      })
      .catch(() => setError("Không mở được camera. Hãy cho phép quyền camera hoặc nhập mã bằng tay."));

    return () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [open, onResult]);

  if (!supported) return null;
  return (
    <>
      <Button type="button" variant="outline" onClick={() => { setError(null); setOpen(true); }}>
        <Camera /> {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Quét mã</DialogTitle>
            <DialogDescription>Đưa mã QR hoặc mã vạch vào giữa khung hình.</DialogDescription>
          </DialogHeader>
          {error ? (
            <p className="rounded-lg bg-destructive/5 p-4 text-sm text-destructive">{error}</p>
          ) : (
            <div className="relative overflow-hidden rounded-lg bg-black">
              <video ref={video} className="aspect-square w-full object-cover" muted playsInline />
              <div className="pointer-events-none absolute inset-10 rounded-xl border-2 border-white/80" />
            </div>
          )}
          <Button variant="outline" onClick={() => setOpen(false)}><X /> Đóng</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
