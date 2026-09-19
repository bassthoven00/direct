/**
 * src/app/api/v1/cart/route.ts — GET cart, POST add item
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validate } from "@/lib/validation";
import { handleApiError } from "@/lib/apiError";
import { getOrCreateCart, addCartItem } from "@/services/cartService";

const addItemSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("product"),
    variantId: z.string().cuid(),
    quantity: z.number().int().min(1),
  }),
  z.object({
    type: z.literal("experience"),
    packageId: z.string().cuid(),
    submittedData: z.record(z.unknown()).optional(),
  }),
]);

function getSessionId(req: NextRequest): string {
  return req.cookies.get("cart_session")?.value ?? `anon-${Date.now()}`;
}

export async function GET(req: NextRequest) {
  try {
    const sessionId = getSessionId(req);
    const cart = await getOrCreateCart(sessionId);
    return NextResponse.json({ data: cart });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionId = getSessionId(req);
    const body = await req.json();
    const item = validate(addItemSchema, body);
    
    const cartItem = await addCartItem(sessionId, item);
    return NextResponse.json({ data: cartItem }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
