import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

const BASE_URL = 'https://tradehub-next-nine.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [{ data: listings }, { data: profiles }] = await Promise.all([
    supabase.from('listings').select('id, created_at').eq('status', 'active').order('created_at', { ascending: false }).limit(500),
    supabase.from('profiles').select('id').limit(200),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/browse`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/search`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/community`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/premium`, changeFrequency: 'monthly', priority: 0.5 },
  ];

  const listingRoutes: MetadataRoute.Sitemap = (listings ?? []).map((l) => ({
    url: `${BASE_URL}/listing/${l.id}`,
    lastModified: new Date(l.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  const profileRoutes: MetadataRoute.Sitemap = (profiles ?? []).map((p) => ({
    url: `${BASE_URL}/profile/${p.id}`,
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...listingRoutes, ...profileRoutes];
}
