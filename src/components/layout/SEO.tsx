import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useStore } from '../../store/useStore';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  canonical?: string;
  article?: boolean;
  product?: any;
  organization?: boolean;
  breadcrumb?: { name: string; item: string }[];
}

export const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  image, 
  canonical, 
  article,
  product,
  organization,
  breadcrumb
}) => {
  const { config }: any = useStore();
  const siteName = config?.nome_loja || 'Minha Loja';
  const defaultDescription = config?.tagline || 'Sua loja online completa e segura.';
  const siteUrl = window.location.origin;
  const defaultImage = `${siteUrl}/og-image.jpg`;

  const seoTitle = title ? `${title} | ${siteName}` : siteName;
  const seoDescription = description || defaultDescription;
  const seoImage = image || defaultImage;
  const seoCanonical = canonical || window.location.href;

  const jsonLd: any[] = [];

  if (organization) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': siteName,
      'url': siteUrl,
      'logo': `${siteUrl}/logo.png`,
      'sameAs': [
        config?.instagram,
        config?.facebook
      ].filter(Boolean)
    });
  }

  if (product) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'Product',
      'name': product.name,
      'image': product.images || [product.main_image],
      'description': product.description,
      'sku': product.id,
      'brand': {
        '@type': 'Brand',
        'name': product.brand || siteName
      },
      'offers': {
        '@type': 'Offer',
        'url': window.location.href,
        'priceCurrency': 'BRL',
        'price': product.price_current,
        'availability': (product.estoque || 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        'seller': {
          '@type': 'Organization',
          'name': siteName
        }
      }
    });
  }

  if (breadcrumb) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': breadcrumb.map((item, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'name': item.name,
        'item': item.item.startsWith('http') ? item.item : `${siteUrl}${item.item}`
      }))
    });
  }

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <link rel="canonical" href={seoCanonical} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={article ? 'article' : 'website'} />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={seoImage} />
      <meta property="og:url" content={seoCanonical} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={seoImage} />

      {/* Security & Indexing */}
      {(seoCanonical.includes('/admin') || seoCanonical.includes('/checkout') || seoCanonical.includes('/minha-conta') || seoCanonical.includes('/meus-pedidos') || seoCanonical.includes('/login') || seoCanonical.includes('/cadastro')) ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      {/* JSON-LD */}
      {jsonLd.map((ld, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(ld)}
        </script>
      ))}
    </Helmet>
  );
};
