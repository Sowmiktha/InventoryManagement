
import Link from "next/link";
import pool from "@/lib/db";
import { Suspense } from "react";

type SaleItem = {
  product_name: string;
  quantity: number;
  price_at_sale: string;
  subtotal: string;
};

type Sale = {
  id: number;
  total_amount: string;
  payment_method: string;
  created_at: Date;
};

function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(value);
}

async function ReceiptContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    return <p className="p-10">Invalid receipt number.</p>;
  }

  const saleResult = await pool.query<Sale>(
    "SELECT id, total_amount, payment_method, created_at FROM sales WHERE id = $1",
    [id]
  );

  if (saleResult.rows.length === 0) {
    return <p className="p-10">Receipt not found.</p>;
  }

  const sale = saleResult.rows[0];

  const itemsResult = await pool.query<SaleItem>(
    `SELECT product_name, quantity, price_at_sale, subtotal
     FROM sale_items
     WHERE sale_id = $1
     ORDER BY id`,
    [id]
  );

  return (
    <main className="mx-auto max-w-2xl p-8">
      <div className="rounded-xl border bg-white p-8 text-black">
        <h1 className="text-center text-3xl font-bold">
          StockPilot
        </h1>

        <p className="mt-2 text-center text-gray-500">
          Sales Receipt
        </p>

        <hr className="my-6" />

        <p><strong>Receipt No:</strong> #{sale.id}</p>
        <p>
          <strong>Date:</strong>{" "}
          {new Date(sale.created_at).toLocaleString("en-IN")}
        </p>
        <p>
          <strong>Payment:</strong> {sale.payment_method}
        </p>

       
<table className="mt-6 w-full table-fixed text-sm">
  <colgroup>
    <col className="w-[40%]" />
    <col className="w-[12%]" />
    <col className="w-[24%]" />
    <col className="w-[24%]" />
  </colgroup>

  <thead>
    <tr className="border-b">
      <th className="px-2 py-3 text-left">Product</th>
      <th className="px-2 py-3 text-center">Qty</th>
      <th className="px-2 py-3 text-right">Price</th>
      <th className="px-2 py-3 text-right">Subtotal</th>
    </tr>
  </thead>

  <tbody>
    {itemsResult.rows.map((item, index) => (
      <tr key={index} className="border-b">
        <td className="break-words px-2 py-3">
          {item.product_name}
        </td>

        <td className="px-2 py-3 text-center">
          {item.quantity}
        </td>

        <td className="px-2 py-3 text-right">
          {money(Number(item.price_at_sale))}
        </td>

        <td className="px-2 py-3 text-right">
          {money(Number(item.subtotal))}
        </td>
      </tr>
    ))}
  </tbody>
</table>


        <div className="mt-6 text-right text-2xl font-bold">
          Total: {money(Number(sale.total_amount))}
        </div>

        <p className="mt-8 text-center text-gray-500">
          Thank you for shopping!
        </p>
      </div>

      <div className="mt-6 text-center print:hidden">
        <Link
          href="/sales-history"
          className="rounded-lg bg-indigo-600 px-6 py-3 text-white"
        >
          Back to Sales History
        </Link>
      </div>
    </main>
  );
}


export default function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="p-10 text-center">
          Loading receipt...
        </div>
      }
    >
      <ReceiptContent params={params} />
    </Suspense>
  );
}

