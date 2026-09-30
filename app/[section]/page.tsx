import { notFound } from "next/navigation";
import { Workspace } from "@/components/workspace";
import { sections, type Section } from "@/lib/navigation";

export function generateStaticParams() {
  return Object.keys(sections)
    .filter((section) => section !== "overview")
    .map((section) => ({ section }));
}

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
  return <Workspace section={section as Section} />;
}
