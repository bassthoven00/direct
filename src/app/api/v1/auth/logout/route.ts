/**
 * src/app/api/v1/auth/logout/route.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/apiError";
import { logoutUser } from "@/services/authService";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;
    
    await logoutUser(refreshToken);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
