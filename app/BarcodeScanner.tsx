
"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { DecodeHintType, BarcodeFormat } from "@zxing/library";

export default function BarcodeScanner({
  onScan,
  onClose,
}: {
  onScan: (barcode: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onScanRef = useRef(onScan);
  const onCloseRef = useRef(onClose);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [detected, setDetected] = useState("");

  useEffect(() => {
    onScanRef.current = onScan;
    onCloseRef.current = onClose;
  }, [onScan, onClose]);

  useEffect(() => {
    const hints = new Map();

    hints.set(DecodeHintType.TRY_HARDER, true);

    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.CODE_93,
      BarcodeFormat.ITF,
      BarcodeFormat.CODABAR,
    ]);

    const reader = new BrowserMultiFormatReader(hints);
    const video = videoRef.current;
    const canvas = document.createElement("canvas");

    let active = true;
    let scanned = false;
    let stream: MediaStream | undefined;
    let scanTimer: number | undefined;
    let closeTimer: number | undefined;

    const angles = [
      0, 90, 45, 135,
      15, 30, 60, 75,
      105, 120, 150, 165,
    ];

    let angleIndex = 0;

    function stopCamera() {
      window.clearTimeout(scanTimer);

      stream?.getTracks().forEach((track) => {
        track.stop();
      });

      if (video) {
        video.pause();
        video.srcObject = null;
      }
    }

    function acceptBarcode(code: string) {
      if (!active || scanned) return;

      scanned = true;
      setDetected(code);
      stopCamera();

      closeTimer = window.setTimeout(() => {
        if (!active) return;

        onScanRef.current(code);
        onCloseRef.current();
      }, 400);
    }

    function scanFrame() {
      if (!active || scanned || !video) return;

      if (video.readyState >= 2 && video.videoWidth > 0) {
        const angle = angles[angleIndex];
        angleIndex = (angleIndex + 1) % angles.length;

        const radians = angle * Math.PI / 180;
        const width = video.videoWidth;
        const height = video.videoHeight;

        const sin = Math.abs(Math.sin(radians));
        const cos = Math.abs(Math.cos(radians));

        canvas.width = Math.ceil(
          width * cos + height * sin
        );

        canvas.height = Math.ceil(
          width * sin + height * cos
        );

        const ctx = canvas.getContext("2d");

        if (ctx) {
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.translate(
            canvas.width / 2,
            canvas.height / 2
          );

          ctx.rotate(radians);

          ctx.drawImage(
            video,
            -width / 2,
            -height / 2,
            width,
            height
          );

          try {
            const result = reader.decodeFromCanvas(canvas);

            if (result) {
              acceptBarcode(result.getText());
              return;
            }
          } catch {
            // Continue searching for a readable barcode.
          }
        }
      }

      scanTimer = window.setTimeout(scanFrame, 120);
    }

    async function startCamera() {
      try {
        if (!video || !active) return;

        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error(
            "Camera unavailable. Open the app using localhost or HTTPS."
          );
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        video.srcObject = stream;
        await video.play();

        if (!active) {
          stopCamera();
          return;
        }

        setLoading(false);
        scanFrame();

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
      window.clearTimeout(closeTimer);
      stopCamera();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">

      <div className="w-full max-w-xl rounded-2xl bg-white p-6 text-slate-900 shadow-xl">

        <h2 className="text-xl font-bold">
          Smart Barcode Scanner
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Hold the barcode in front of the camera.
          Multiple angles are checked automatically.
        </p>

        {loading && (
          <p className="mt-3 text-indigo-600">
            Starting camera...
          </p>
        )}

        <div className="relative mt-4 overflow-hidden rounded-xl bg-black">

          <video
            ref={videoRef}
            muted
            autoPlay
            playsInline
            className="aspect-video w-full object-contain"
          />

          {!loading && !error && !detected && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-2/3 w-4/5 rounded-xl border-2 border-green-400">
                <div className="relative top-1/2 h-0.5 w-full bg-red-500" />
              </div>
            </div>
          )}

        </div>

        {!loading && !error && !detected && (
          <p className="mt-3 text-center text-indigo-600">
            Searching for barcode...
          </p>
        )}

        {detected && (
          <p className="mt-3 rounded-lg bg-green-100 p-3 text-green-700">
            Barcode detected: {detected}
          </p>
        )}

        {error && (
          <p className="mt-3 rounded-lg bg-red-100 p-3 text-red-700">
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
