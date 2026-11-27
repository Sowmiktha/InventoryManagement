
import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET: Retrieve all products
export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        category,
        price,
        quantity,
        minimum_stock AS "minimumStock",
        barcode,
        created_at AS "createdAt"
      
FROM products
WHERE is_active = TRUE
ORDER BY id DESC

    `);

    const products = result.rows.map((product) => ({
      ...product,
      price: Number(product.price),
    }));

    return NextResponse.json(products);
  } catch (error) {
    console.error("Fetch products error:", error);

    return NextResponse.json(
      { error: "Could not fetch products" },
      { status: 500 }
    );
  }
}

// POST: Add a new product
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const category =
      typeof body.category === "string"
        ? body.category.trim()
        : "Other";

    const barcode =
      typeof body.barcode === "string"
        ? body.barcode.trim()
        : "";

    const price = Number(body.price);
    const quantity = Number(body.quantity);
    const minimumStock = Number(body.minimumStock);

    if (
      !name ||
      name.length > 150 ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isInteger(quantity) ||
      quantity < 0 ||
      !Number.isInteger(minimumStock) ||
      minimumStock < 0 ||
      category.length > 100 ||
      barcode.length > 100
    ) {
      return NextResponse.json(
        { error: "Please enter valid product details" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO products
        (name, category, price, quantity, minimum_stock, barcode)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING
         id,
         name,
         category,
         price,
         quantity,
         minimum_stock AS "minimumStock",
         barcode,
         created_at AS "createdAt"`,
      [
        name,
        category || "Other",
        price,
        quantity,
        minimumStock,
        barcode || null,
      ]
    );

    const product = {
      ...result.rows[0],
      price: Number(result.rows[0].price),
    };

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Create product error:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return NextResponse.json(
        { error: "This barcode is already assigned to another product" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Could not create product" },
      { status: 500 }
    );
  }
} 


export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!Number.isInteger(id) || id <= 0) {
      return Response.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE products
       SET is_active = FALSE
       WHERE id = $1 AND is_active = TRUE
       RETURNING id, name`,
      [id]
    );

    if (result.rowCount === 0) {
      return Response.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return Response.json({
      message: "Product removed successfully",
      product: result.rows[0],
    });
  } catch (error) {
    console.error("Delete product error:", error);

    return Response.json(
      { error: "Failed to remove product" },
      { status: 500 }
    );
  }
}



export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const id = body.id;

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const category =
      typeof body.category === "string"
        ? body.category.trim()
        : "Other";

    const price = Number(body.price);
    const minimumStock = Number(body.minimumStock);

    // Validate the updated product details
    if (
      !Number.isSafeInteger(id) ||
      id <= 0 ||
      !name ||
      name.length > 150 ||
      category.length > 100 ||
      body.price == null ||
      body.price === "" ||
      !Number.isFinite(price) ||
      price < 0 ||
      body.minimumStock == null ||
      body.minimumStock === "" ||
      !Number.isInteger(minimumStock) ||
      minimumStock < 0 ||
      minimumStock > 2147483647
    ) {
      return NextResponse.json(
        { error: "Please enter valid product details" },
        { status: 400 }
      );
    }

    // Update the existing product
    const result = await pool.query(
      `UPDATE products
       SET
         name = $1,
         category = $2,
         price = $3,
         minimum_stock = $4
       WHERE id = $5 AND is_active = TRUE
       RETURNING
         id,
         name,
         category,
         price,
         quantity,
         minimum_stock AS "minimumStock",
         barcode,
         created_at AS "createdAt"`,
      [
        name,
        category || "Other",
        price,
        minimumStock,
        id,
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const product = {
      ...result.rows[0],
      price: Number(result.rows[0].price),
    };

    return NextResponse.json({
      message: "Product updated successfully",
      product,
    });

  } catch (error) {
    console.error("Update product error:", error);

    return NextResponse.json(
      { error: "Could not update product" },
      { status: 500 }
    );
  }
}
