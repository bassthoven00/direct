/**
 * src/app/api/v1/cart/[itemId]/route.ts — PATCH update quantity, DELETE remove item
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validate } from "@/lib/validation";
import { handleApiError } from "@/lib/apiError";
import { updateCartItem, removeCartItem } from "@/services/cartService";

const updateSchema = z.object({ quantity: z.number().int().min(0) });

export async function PATCH(
  req: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const body = await req.json();
    const { quantity } = validate(updateSchema, body);
    const result = await updateCartItem(params.itemId, quantity);
    return NextResponse.json({ data: result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    await removeCartItem(params.itemId);
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
