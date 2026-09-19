/**
 * src/app/api/v1/user/orders/route.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/apiError";
import { getSessionFromCookies } from "@/lib/auth";
import { getUserOrders } from "@/services/userService";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orders = await getUserOrders(session.userId);
    return NextResponse.json({ data: orders });
  } catch (error) {
    return handleApiError(error);
  }
}
