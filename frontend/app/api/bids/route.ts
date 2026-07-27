import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createBid, listBids } from "@/lib/queries/bids";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const bids = await listBids();
  return NextResponse.json({ bids });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const bid = await createBid({
    title: body.title,
    organization: body.organization,
    location: body.location ?? null,
    deadline: body.deadline ?? null,
    budgetMax: body.budgetMax ?? null,
    category: body.category ?? null,
    requirements: body.requirements ?? null,
  });
  return NextResponse.json({ bid }, { status: 201 });
}
