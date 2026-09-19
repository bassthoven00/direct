/**
 * src/app/api/v1/user/profile/route.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validate } from "@/lib/validation";
import { handleApiError } from "@/lib/apiError";
import { getSessionFromCookies } from "@/lib/auth";
import { getUserProfile, updateUserProfile } from "@/services/userService";

const updateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await getUserProfile(session.userId);
    return NextResponse.json({ data: profile });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = validate(updateSchema, body);

    const profile = await updateUserProfile(session.userId, data);
    return NextResponse.json({ data: profile });
  } catch (error) {
    return handleApiError(error);
  }
}
