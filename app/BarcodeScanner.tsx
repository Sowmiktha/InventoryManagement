
"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

export default function BarcodeScanner({
  onScan,
  onClose,
}: {
  onScan: (barcode: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    const video = videoRef.current;

    let active = true;
    let scanned = false;
    let stream: MediaStream | undefined;
    let controls: { stop: () => void } | undefined;

    function stopCamera() {
      controls?.stop();

      stream?.getTracks().forEach((track) => {
        track.stop();
      });

      if (video) {
        video.pause();
        video.srcObject = null;
      }
    }

    async function startCamera() {
      try {
        if (!video || !active) return;

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
           width: { ideal: 1920 },
height: { ideal: 1080 },
          },
          audio: false,
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        controls = await reader.decodeFromStream(
          stream,
          video,
          (result, err, scannerControls) => {
            if (result && active && !scanned) {
              scanned = true;
              scannerControls.stop();
              onScan(result.getText());
              onClose();
            }
          }
        );

        if (!active) {
          stopCamera();
          return;
        }

        setLoading(false);
      } catch (err) {
        stopCamera();

        if (active) {
          setLoading(false);
          setError(
            err instanceof Error
              ? err.message
              : "Unable to start camera."
          );
        }
      }
    }

    const timer = window.setTimeout(startCamera, 300);

    return () => {
      active = false;
      window.clearTimeout(timer);
      stopCamera();
    };
  }, [onScan, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 text-slate-900">

        <h2 className="text-xl font-bold">
          Scan Barcode
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Position the product barcode in front of your camera.
        </p>

        {loading && (
          <p className="mt-3 text-indigo-600">
            Starting camera...
          </p>
        )}

        <video
          ref={videoRef}
          muted
          playsInline
          className="mt-4 aspect-video w-full rounded-xl bg-black object-contain"
        />

        {error && (
          <p className="mt-3 text-red-600">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-lg bg-red-600 p-3 text-white"
        >
          Close Scanner
        </button>

      </div>
    </div>
  );
}

