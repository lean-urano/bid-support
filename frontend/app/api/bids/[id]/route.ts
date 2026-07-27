import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { deleteBid, updateBid } from "@/lib/queries/bids";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const bid = await updateBid(Number(id), {
    title: body.title,
    organization: body.organization,
    location: body.location ?? null,
    deadline: body.deadline ?? null,
    budgetMax: body.budgetMax ?? null,
    category: body.category ?? null,
    requirements: body.requirements ?? null,
  });
  if (!bid) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ bid });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  await deleteBid(Number(id));
  return NextResponse.json({ ok: true });
}
