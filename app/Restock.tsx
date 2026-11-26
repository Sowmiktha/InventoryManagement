
"use client";

import { useState, useCallback } from "react";
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

const handleScan = useCallback((code: string) => {
  setBarcode(code);
}, []);

const closeScanner = useCallback(() => {
  setShowScanner(false);
}, []);

  async function handleRestock(e: React.FormEvent) {
    e.preventDefault();

    if (loading) return;

    setMessage("");
    setError("");

    const qty = Number(quantity);

    if (!barcode.trim() || !Number.isInteger(qty) || qty <= 0) {
      setError("Enter a valid barcode and quantity.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          barcode: barcode.trim(),
          movementType: "ADD",
          quantity: qty,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Restocking failed");
      }

      setMessage(
        `${data.product}: Stock updated from ${data.previousQuantity} to ${data.newQuantity} units.`
      );

      setBarcode("");
      setQuantity("1");
      await onRestock();

    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border bg-white p-6 text-slate-900 shadow-sm">
      <h2 className="text-xl font-bold">
        Scan to Restock
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Scan or enter a barcode to add newly received stock.
      </p>

      <form
        onSubmit={handleRestock}
        className="mt-5 grid gap-4 md:grid-cols-3 md:items-end"
      >
        <div>
          <label className="mb-2 block text-sm font-medium">
            Product Barcode
          </label>

          <input
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="Scan or enter barcode"
            className="w-full rounded-lg border p-3"
            required
          />
          <button
  type="button"
  onClick={() => setShowScanner(true)}
  className="mt-2 w-full rounded-lg bg-slate-800 p-3 text-white hover:bg-slate-700"
>
  Scan Barcode
</button>
<BarcodeUpload onScan={handleScan} />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Quantity Received
          </label>

          <input
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full rounded-lg border p-3"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-indigo-600 p-3 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Updating..." : "Add Stock"}
        </button>
      </form>

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
