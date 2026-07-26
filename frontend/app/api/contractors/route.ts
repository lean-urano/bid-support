import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createContractor, listContractors } from "@/lib/queries/contractors";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const contractors = await listContractors();
  return NextResponse.json({ contractors });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const contractor = await createContractor({
    name: body.name,
    address: body.address ?? null,
    phone: body.phone ?? null,
    email: body.email ?? null,
    specialties: body.specialties ?? [],
  });
  return NextResponse.json({ contractor }, { status: 201 });
}
