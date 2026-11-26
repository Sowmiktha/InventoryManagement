
"use client";

import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

export default function BarcodeUpload({
  onScan,
}: {
  onScan: (barcode: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);

  async function handleUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setMessage("");
    setProgress(0);

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      event.target.value = "";
      return;
    }

    setLoading(true);

    const imageUrl = URL.createObjectURL(file);

    try {
      const image = new Image();
      image.src = imageUrl;

      await image.decode();

      const reader = new BrowserMultiFormatReader();

      // Limit image size for faster processing.
      const scale = Math.min(
        1,
        1600 / Math.max(
          image.naturalWidth,
          image.naturalHeight
        )
      );

      const width = Math.round(
        image.naturalWidth * scale
      );

      const height = Math.round(
        image.naturalHeight * scale
      );

      // Try common angles first.
      const angles = [0, 90, 45, 135];

      // Then try every remaining 5-degree angle.
      for (let angle = 0; angle < 180; angle += 5) {
        if (!angles.includes(angle)) {
          angles.push(angle);
        }
      }

      const filters = [
        "none",
        "grayscale(100%) contrast(160%)",
        "grayscale(100%) brightness(120%) contrast(220%)",
      ];

      let barcode = "";
      let attempts = 0;

      const totalAttempts =
        angles.length * filters.length;

      const canvas = document.createElement("canvas");

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Image processing unavailable");
      }

      for (const filter of filters) {
        for (const angle of angles) {

          const radians = angle * Math.PI / 180;

          // Calculate dimensions so the rotated
          // image is not cut off.
          canvas.width = Math.ceil(
            Math.abs(width * Math.cos(radians)) +
            Math.abs(height * Math.sin(radians))
          );

          canvas.height = Math.ceil(
            Math.abs(width * Math.sin(radians)) +
            Math.abs(height * Math.cos(radians))
          );

          // Add a white background.
          ctx.fillStyle = "#ffffff";

          ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
          );

          ctx.save();

          ctx.translate(
            canvas.width / 2,
            canvas.height / 2
          );

          ctx.rotate(radians);

          ctx.filter = filter;

          ctx.drawImage(
            image,
            -width / 2,
            -height / 2,
            width,
            height
          );

          ctx.restore();

          attempts++;

          setProgress(
            Math.round(
              attempts / totalAttempts * 100
            )
          );

          try {
            const result =
              await reader.decodeFromCanvas(canvas);

            barcode = result.getText();

            if (barcode) break;

          } catch {
            // Continue trying other angles.
          }

          // Allow the browser to update the interface.
          await new Promise<void>((resolve) =>
            setTimeout(resolve, 0)
          );
        }

        if (barcode) break;
      }

      if (!barcode) {
        throw new Error("Barcode not detected");
      }

      onScan(barcode);

      setProgress(100);

      setMessage(`Barcode detected: ${barcode}`);

    } catch {
      setError(
        "Unable to read the barcode. Please try a clearer photograph or enter the barcode manually."
      );

    } finally {
      URL.revokeObjectURL(imageUrl);

      setLoading(false);

      if (fileRef.current) {
        fileRef.current.value = "";
      }
    }
  }

  return (
    <div className="mt-2">

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />

      <button
        type="button"
        disabled={loading}
        onClick={() => fileRef.current?.click()}
        className="w-full rounded-lg bg-slate-800 p-3 text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {loading
          ? `Detecting Barcode... ${progress}%`
          : "Upload Barcode"}
      </button>

      {loading && (
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {message && (
        <p className="mt-2 text-sm text-green-600">
          {message}
        </p>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}

    </div>
  );
}

