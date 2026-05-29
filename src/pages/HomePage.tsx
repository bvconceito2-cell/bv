import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import {
  HeroBanner,
  CategoryCircleIcons,
  Benefits,
  EditorialSection
} from '../components/home/HomeComponents';
import { PromotionalBanner } from '../components/home/PromotionalBanner';
import {
  ArrowUp,
  MessageCircle,
  Loader2
} from 'lucide-react';
import { ProductGrid } from '../components/product/ProductComponents';
import { Layout } from '../components/layout/Layout';
import { SEO } from '../components/layout/SEO';
import { motion } from 'framer-motion';

const FloatingWhatsApp = () => {
  const { config }: any = useStore();

  const whatsappNumber =
    config?.whatsapp?.replace(/\D/g, '') || '';

  const message = `Olá! Gostaria de tirar uma dúvida sobre a ${
    config?.nome_loja || 'loja'
  }.`;

  if (!whatsappNumber) return null;

  const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    message
  )}`;

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-24 right-8 z-40 bg-[#25D366] text-white p-4 rounded-full shadow-2xl flex items-center justify-center hover:opacity-90 transition-opacity"
      title="Fale conosco no WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </motion.a>
  );
};

const HomePage = () => {
  const {
    products,
    fetchFromSupabase,
    homeSections,
    promotionalBanners,
    config,
    loading,
    banners,
    categories
  }: any = useStore();

  useEffect(() => {
    fetchFromSupabase();
  }, [fetchFromSupabase]);

  const safeProducts = Array.isArray(products)
    ? products
    : [];

  const safeSections = Array.isArray(homeSections)
    ? homeSections
    : [];

  const safeBanners = Array.isArray(banners)
    ? banners
    : [];

  const safeCategories = Array.isArray(categories)
    ? categories
    : [];

  if (loading && safeProducts.length === 0) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--store-primary)]" />
        </div>
      </Layout>
    );
  }

  const validProducts = safeProducts.filter(
    (p: any) => p?.status !== 'inactive'
  );

  const featuredProducts = validProducts
    .filter((p: any) => p?.featured)
    .slice(0, 8);

  const fallbackFeatured =
    featuredProducts.length > 0
      ? featuredProducts
      : validProducts.slice(0, 8);

  const newProducts = validProducts
    .filter((p: any) => p?.novidade)
    .slice(0, 8);

  const fallbackNew =
    newProducts.length > 0
      ? newProducts
      : validProducts.slice(0, 8);

  const getSection = (key: string) => {
    if (safeSections.length === 0) {
      return {
        visivel: true,
        ativo: true,
        config: {}
      };
    }

    const section = safeSections.find(
      (s: any) =>
        s?.chave === key ||
        s?.tipo === key ||
        s?.nome === key
    );

    return (
      section || {
        visivel: true,
        ativo: true,
        config: {}
      }
    );
  };

  const isSectionVisible = (key: string) => {
    const section = getSection(key);

    if (!section) return true;

    if (section.visivel === false) return false;

    if (section.ativo === false) return false;

    return true;
  };

  return (
    <Layout>
      <SEO organization />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {(safeBanners.length > 0 ||
          isSectionVisible('hero_banner')) && (
          <HeroBanner />
        )}

        {(safeCategories.length > 0 ||
          isSectionVisible(
            'icones_categorias'
          )) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <CategoryCircleIcons />
          </motion.div>
        )}

        {isSectionVisible('beneficios') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Benefits />
          </motion.div>
        )}

        {fallbackFeatured.length > 0 && (
          <div className="py-2">
            <ProductGrid
              title="Destaques para você"
              products={fallbackFeatured}
              linkVerTudo="/category/destaques"
            />
          </div>
        )}

        {Array.isArray(promotionalBanners) &&
          promotionalBanners.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{
                opacity: 1,
                scale: 1
              }}
              viewport={{ once: true }}
            >
              <PromotionalBanner
                banner={promotionalBanners[0]}
              />
            </motion.div>
          )}

        {isSectionVisible('editorial') && (
          <EditorialSection />
        )}

        {fallbackNew.length > 0 && (
          <div className="py-2">
            <ProductGrid
              title="Novidades da semana"
              products={fallbackNew}
              linkVerTudo="/category/novidades"
            />
          </div>
        )}

        {isSectionVisible('cadastro') && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="bg-[var(--header-background)] py-16 mt-12 text-[var(--header-foreground)]"
          >
            <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12 text-inherit">
              <div className="text-center md:text-left">
                <h3
                  className="text-3xl mb-3"
                  style={{
                    fontFamily:
                      'var(--store-font-heading)',
                    fontWeight:
                      'var(--store-font-weight-title)',
                    textTransform:
                      'var(--store-header-transform)' as any,
                    letterSpacing:
                      'var(--store-header-spacing)'
                  }}
                >
                  {getSection('cadastro')?.config
                    ?.titulo ||
                    'Cadastre-se e ganhe 10% OFF'}
                </h3>

                <p
                  className="text-base opacity-80"
                  style={{
                    fontFamily:
                      'var(--store-font-body)',
                    fontWeight:
                      'var(--store-font-weight-text)'
                  }}
                >
                  {getSection('cadastro')?.config
                    ?.subtitulo ||
                    `Fique por dentro das novidades e ofertas exclusivas ${
                      config?.nome_loja || ''
                    }.`}
                </p>
              </div>

              <div className="flex w-full max-w-lg items-center bg-[var(--input-background)] border border-[var(--input-border)] rounded-full overflow-hidden shadow-2xl">
                <input
                  type="email"
                  placeholder="Seu melhor e-mail"
                  className="flex-1 h-14 px-8 text-brand-foreground text-sm focus:outline-none border-none bg-transparent placeholder:text-brand-muted"
                />

                <button
                  className="bg-[var(--store-primary)] hover:opacity-90 h-14 px-10 text-[var(--store-button-text)] transition-all border-none"
                  style={{
                    fontFamily:
                      'var(--store-font-heading)',
                    fontWeight:
                      'var(--store-font-weight-title)',
                    textTransform:
                      'var(--store-header-transform)' as any,
                    letterSpacing:
                      'var(--store-header-spacing)'
                  }}
                >
                  CADASTRAR
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      <motion.button
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() =>
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          })
        }
        className="fixed bottom-8 right-8 h-14 w-14 bg-brand-card border border-brand-border shadow-2xl rounded-full flex items-center justify-center text-brand-muted hover:text-brand-primary transition-all z-40 group"
      >
        <ArrowUp className="h-6 w-6 group-hover:-translate-y-1 transition-transform" />
      </motion.button>

      <FloatingWhatsApp />
    </Layout>
  );
};

export default HomePage;
