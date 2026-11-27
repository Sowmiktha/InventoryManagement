
"use client";

import { useState, useCallback, useRef } from "react";
import BarcodeScanner from "./BarcodeScanner";
import BarcodeUpload from "./BarcodeUpload";

export default function Restock({
  onRestock,
}: {
  onRestock: () => void | Promise<void>;
}) {
  const [barcode, setBarcode] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const [autoRestock, setAutoRestock] = useState(true);

  const processingRef = useRef(false);

  // Automatically update stock in PostgreSQL.
  const updateStock = useCallback(
    async (code: string, qty: number) => {
      if (processingRef.current) return;

      setMessage("");
      setError("");

      if (
        !code.trim() ||
        !Number.isSafeInteger(qty) ||
        qty <= 0
      ) {
        setError("Enter a valid barcode and quantity.");
        return;
      }

      processingRef.current = true;
      setLoading(true);

      try {
        const response = await fetch("/api/inventory", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            barcode: code.trim(),
            movementType: "ADD",
            quantity: qty,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Restocking failed"
          );
        }

        setMessage(
          `${data.product}: Successfully added ${qty} unit(s). Stock updated from ${data.previousQuantity} to ${data.newQuantity} units.`
        );

        setBarcode("");

        try {
          await onRestock();
        } catch {
          setError(
            "Stock was added, but the dashboard could not refresh. Refresh the page to see the updated stock."
          );
        }

      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong"
        );
      } finally {
        processingRef.current = false;
        setLoading(false);
      }
    },
    [onRestock]
  );

  // Called by both camera scanner and image upload.
  const handleScan = useCallback(
    (code: string) => {
      if (processingRef.current) return;

      setBarcode(code);

      if (autoRestock) {
        void updateStock(code, Number(quantity));
      }
    },
    [autoRestock, quantity, updateStock]
  );

  const closeScanner = useCallback(() => {
    setShowScanner(false);
  }, []);

  // Manual restocking remains available as a backup.
  async function handleRestock(e: React.FormEvent) {
    e.preventDefault();

    await updateStock(barcode, Number(quantity));
  }

  return (
    <section className="mt-8 rounded-2xl border bg-white p-6 text-slate-900 shadow-sm">

      <h2 className="text-xl font-bold">
        Scan to Restock
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Automatically identify and restock products using
        barcode scanning or image uploading.
      </p>

      {/* Automatic restocking mode */}

      <div className="mt-5 flex items-center justify-between rounded-xl border bg-slate-50 p-4">

        <div>
          <p className="font-semibold">
            Automatic Restocking
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {autoRestock
              ? "Stock updates immediately after barcode detection."
              : "Confirm stock additions manually."}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-label="Automatic Restocking"
          aria-checked={autoRestock}
          disabled={loading}
          onClick={() => setAutoRestock(!autoRestock)}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
            autoRestock
              ? "bg-green-600"
              : "bg-slate-400"
          }`}
        >
          <span
            className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition-transform ${
              autoRestock
                ? "translate-x-5"
                : "translate-x-0"
            }`}
          />
        </button>

      </div>

      <form
        onSubmit={handleRestock}
        className="mt-5 grid gap-4 md:grid-cols-2"
      >

        {/* Quantity selection */}

        <div>
          <label className="mb-2 block text-sm font-medium">
            Quantity Received Per Scan
          </label>

          <input
            type="number"
            min="1"
            step="1"
            value={quantity}
            disabled={loading}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full rounded-lg border p-3"
            required
          />

          <p className="mt-2 text-xs text-slate-500">
            Set the quantity before scanning.
            The default is 1 unit per scan.
          </p>
        </div>

        {/* Barcode input */}

        <div>
          <label className="mb-2 block text-sm font-medium">
            Product Barcode
          </label>

          <input
            type="text"
            value={barcode}
            disabled={loading}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="Scan or enter barcode"
            className="w-full rounded-lg border p-3"
            required
          />
        </div>

        {/* Camera and image upload */}

        <fieldset
          disabled={loading}
          className="grid gap-3 md:col-span-2 md:grid-cols-2 disabled:opacity-50"
        >

          <button
            type="button"
            onClick={() => setShowScanner(true)}
            className="mt-2 w-full rounded-lg bg-slate-800 p-3 text-white hover:bg-slate-700"
          >
            Scan Barcode
          </button>

          <BarcodeUpload onScan={handleScan} />

        </fieldset>

        {/* Manual backup */}

        <button
          type="submit"
          disabled={loading || !barcode.trim()}
          className="rounded-lg bg-indigo-600 p-3 text-white hover:bg-indigo-700 disabled:opacity-50 md:col-span-2"
        >
          {loading
            ? "Updating Inventory..."
            : "Add Stock Manually"}
        </button>

      </form>

      {loading && (
        <p className="mt-4 rounded-lg bg-blue-100 p-3 text-blue-700">
          Identifying product and updating inventory...
        </p>
      )}

      {message && (
        <p className="mt-4 rounded-lg bg-green-100 p-3 text-green-700">
          {message}
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-lg bg-red-100 p-3 text-red-700">
          {error}
        </p>
      )}

      {showScanner && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={closeScanner}
        />
      )}

    </section>
  );
}
