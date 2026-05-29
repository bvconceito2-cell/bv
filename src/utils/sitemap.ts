import { supabase } from "@/integrations/supabase/client";

export async function generateSitemap() {
  const siteUrl = window.location.origin;
  const now = new Date().toISOString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${siteUrl}/carrinho</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>`;

  // Fetch products
  const { data: products } = await supabase.from('produtos').select('id, slug, updated_at').eq('ativo', true);
  if (products) {
    products.forEach(p => {
      xml += `
  <url>
    <loc>${siteUrl}/produto/${p.slug || p.id}</loc>
    <lastmod>${p.updated_at || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });
  }

  // Fetch categories
  const { data: categories } = await (supabase.from('categorias').select('slug, updated_at') as any).eq('ativo', true);
  if (categories) {
    (categories as any[]).forEach(c => {
      xml += `
  <url>
    <loc>${siteUrl}/category/${c.slug}</loc>
    <lastmod>${c.updated_at || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });
  }

  xml += '\n</urlset>';
  return xml;
}
