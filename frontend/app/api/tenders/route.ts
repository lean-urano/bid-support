import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createTender, listTenders } from "@/lib/queries/tenders";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const tenders = await listTenders();
  return NextResponse.json({ tenders });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const tender = await createTender({
    title: body.title,
    organization: body.organization,
    location: body.location ?? null,
    deadline: body.deadline ?? null,
    budgetMax: body.budgetMax ?? null,
    category: body.category ?? null,
    requirements: body.requirements ?? null,
  });
  return NextResponse.json({ tender }, { status: 201 });
}
