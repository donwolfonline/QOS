import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata, ResolvingMetadata } from 'next';
import { MODULES, CATEGORY_COLORS } from '@/lib/registry-data';
import ModuleDetailClient from './ModuleDetailClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const mod = MODULES.find(m => m.slug === decodedSlug);

  if (!mod) {
    return { title: 'Module Not Found - Q-OS Registry' };
  }

  // Construct OG Image URL
  const ogParams = new URLSearchParams({
    title: mod.name,
    category: mod.category,
    author: mod.author,
    cpu: mod.cpu,
    ram: mod.ram,
  });

  const ogUrl = `/og?${ogParams.toString()}`;

  return {
    title: `${mod.name} by ${mod.author} | Q-OS Module Registry`,
    description: mod.description,
    openGraph: {
      title: `${mod.name} | Q-OS Module Registry`,
      description: mod.description,
      images: [
        {
          url: ogUrl,
          width: 1200,
          height: 630,
          alt: `${mod.name} Module Card`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${mod.name} | Q-OS Module Registry`,
      description: mod.description,
      images: [ogUrl],
    },
  };
}

export default async function ModulePage({ params }: Props) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const mod = MODULES.find(m => m.slug === decodedSlug);

  if (!mod) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-32 pb-32 px-6 flex flex-col items-center">
      <div className="w-full max-w-3xl mb-6">
        <Link href="/registry" className="inline-flex items-center gap-2 text-gray-500 hover:text-[#00d4ff] font-mono-code text-sm transition-colors">
          <span>←</span> Back to Registry
        </Link>
      </div>
      
      {/* Client component for the interactive tabs and copy button */}
      <ModuleDetailClient mod={mod} />
    </div>
  );
}
