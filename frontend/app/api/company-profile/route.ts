import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCompanyProfileFull, replaceAchievements, replaceLicenses, saveCompanyProfile } from "@/lib/queries/company-profile";
import type { AchievementInput, LicenseInput, ProfileInput } from "@/lib/queries/company-profile";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const data = await getCompanyProfileFull();
  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const profile = body.profile as ProfileInput | undefined;
  if (!profile || !profile.name?.trim()) {
    return NextResponse.json({ error: "会社名を入力してください。" }, { status: 400 });
  }
  const licenses = Array.isArray(body.licenses) ? (body.licenses as LicenseInput[]) : [];
  const achievements = Array.isArray(body.achievements) ? (body.achievements as AchievementInput[]) : [];
  if (licenses.some((license) => !license.licenseType?.trim())) {
    return NextResponse.json({ error: "資格・許可の名称を入力してください。" }, { status: 400 });
  }
  if (achievements.some((achievement) => !achievement.title?.trim())) {
    return NextResponse.json({ error: "実績の工事名を入力してください。" }, { status: 400 });
  }

  await saveCompanyProfile(profile);
  const data = await getCompanyProfileFull();
  await Promise.all([replaceLicenses(data.profile.id, licenses), replaceAchievements(data.profile.id, achievements)]);

  return NextResponse.json(await getCompanyProfileFull());
}
