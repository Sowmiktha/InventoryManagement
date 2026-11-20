
"use client";

import { useEffect, useState } from "react";

type SaleItem = {
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
};

type Sale = {
  id: number;
  total_amount: string;
  payment_method: string;
  created_at: string;
  items: SaleItem[];
};

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSales() {
      try {
        const response = await fetch("/api/sales-history");
        if (!response.ok) {
          throw new Error("Could not load sales");
        }

        const data = await response.json();
        setSales(data);
      } catch {
        setError("Failed to load sales history.");
      } finally {
        setLoading(false);
      }
    }

    loadSales();
  }, []);

  const money = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">
            Sales History
          </h1>
          <p className="mt-2 text-gray-500">
            View all completed StockPilot transactions.
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          {loading && <p>Loading sales...</p>}

          {error && (
            <p className="text-red-600">{error}</p>
          )}

          {!loading && !error && sales.length === 0 && (
            <p>No sales recorded yet.</p>
          )}

          {!loading && !error && sales.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-4">Sale ID</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Products</th>
                    <th className="p-4">Payment</th>
                    <th className="p-4">Total</th>

<th className="p-4">Receipt</th>

                  </tr>
                </thead>

                <tbody>
                  {sales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="border-b align-top"
                    >
                      <td className="p-4">#{sale.id}</td>

                      <td className="p-4">
                        {new Date(
                          sale.created_at
                        ).toLocaleString("en-IN")}
                      </td>

                      <td className="p-4">
                        {sale.items.map((item, index) => (
                          <div key={index} className="mb-2">
                            <p className="font-medium">
                              {item.productName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {item.quantity} × {money(item.price)}
                            </p>
                          </div>
                        ))}
                      </td>

                      <td className="p-4">
                        {sale.payment_method}
                      </td>

                      <td className="p-4 font-bold">
                        {money(Number(sale.total_amount))}
                      </td>

<td className="p-4">
  <button
    type="button"
   onClick={() => window.open(`/receipt/${sale.id}`, "_blank")}
    className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
  >
    Print Receipt
  </button>
</td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
