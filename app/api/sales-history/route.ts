
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        s.id,
        s.total_amount,
        s.payment_method,
        s.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'productName', si.product_name,
              'quantity', si.quantity,
              'price', si.price_at_sale,
              'subtotal', si.subtotal
            )
          ) FILTER (WHERE si.id IS NOT NULL),
          '[]'::json
        ) AS items
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      GROUP BY s.id, s.total_amount,
               s.payment_method, s.created_at
      ORDER BY s.created_at DESC, s.id DESC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Sales history error:", error);
    return NextResponse.json(
      { error: "Could not fetch sales history" },
      { status: 500 }
    );
  }
}
