/**
 * src/app/api/v1/user/addresses/route.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validate } from "@/lib/validation";
import { handleApiError } from "@/lib/apiError";
import { getSessionFromCookies } from "@/lib/auth";
import { getUserAddresses, createUserAddress } from "@/services/userService";

const addressSchema = z.object({
  label: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  company: z.string().optional(),
  street1: z.string().min(1),
  street2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1),
  phone: z.string().optional(),
  isDefault: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const addresses = await getUserAddresses(session.userId);
    return NextResponse.json({ data: addresses });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = validate(addressSchema, body);

    const address = await createUserAddress(session.userId, data);
    return NextResponse.json({ data: address }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
