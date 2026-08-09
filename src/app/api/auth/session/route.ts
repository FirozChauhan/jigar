import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { SessionPayload } from "@/lib/types";

export async function GET() {
  const jar = await cookies();
  const authenticated = jar.has("jigar_auth");
  const payload: SessionPayload = { authenticated };
  return NextResponse.json(payload);
}