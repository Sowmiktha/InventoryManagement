"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700 print:hidden"
    >
      Print Receipt
    </button>
  );
}