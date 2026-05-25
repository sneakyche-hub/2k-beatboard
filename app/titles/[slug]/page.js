import { notFound } from "next/navigation";
import TitleWorkspace from "@/components/TitleWorkspace";
import { titles, TITLE_SLUGS, getTitle } from "@/lib/data";

export function generateStaticParams() {
  return TITLE_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }) {
  const t = getTitle(params.slug);
  return {
    title: t ? `${t.title_name} · 2K BeatBoard` : "Title · 2K BeatBoard",
  };
}

export default function Page({ params }) {
  const title = getTitle(params.slug);
  if (!title) notFound();
  return <TitleWorkspace title={title} />;
}
