import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { deleteContractor, updateContractor } from "@/lib/queries/contractors";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const contractor = await updateContractor(Number(id), {
    name: body.name,
    address: body.address ?? null,
    phone: body.phone ?? null,
    email: body.email ?? null,
    specialties: body.specialties ?? [],
  });
  if (!contractor) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ contractor });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  await deleteContractor(Number(id));
  return NextResponse.json({ ok: true });
}
