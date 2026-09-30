import { notFound } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { TourAiPage } from "@/components/tour-ai-page";
import { sections, type Section } from "@/lib/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  return { title: sections[section as Section]?.label ?? "Sayfa bulunamadı" };
}

export default async function SectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!Object.hasOwn(sections, section) || section === "overview") notFound();
  if (section === "tour-ai") return <TourAiPage />;
  return <Workspace section={section as Section} />;
}
