import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import {
  ChevronLeft,
  ChevronRight,
  Zap,
  RefreshCcw,
  CreditCard,
  ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductCard } from '../product/ProductComponents';

export const HeroBanner = () => {
  const { banners }: any = useStore();
  const [currentSlide, setCurrentSlide] = useState(0);

  const fallbackBanner = {
    id: 'fallback-banner',
    imagem_desktop:
      'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1600',
    imagem_mobile:
      'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=900',
    titulo: 'Nova Coleção',
    subtitulo: 'Template premium totalmente responsivo',
    texto_botao: 'EXPLORAR AGORA',
    link_botao: '/produtos',
    posicao_texto: 'left',
    ativo: true,
  };

  const activeBanners =
    Array.isArray(banners)
      ? banners.filter((b: any) => b?.ativo !== false)
      : [];

  const safeBanners =
    activeBanners.length > 0
      ? activeBanners
      : [fallbackBanner];

  useEffect(() => {
    if (safeBanners.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % safeBanners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [safeBanners.length]);

  return (
    <section className="w-full bg-brand-background py-2 md:py-6">
      <div className="max-w-[1600px] mx-auto px-2 md:px-6">

        <div className="relative w-full h-[230px] sm:h-[320px] md:h-[400px] lg:h-[500px] xl:h-[560px] overflow-hidden group rounded-lg md:rounded-2xl bg-brand-secondary shadow-lg md:shadow-xl">

          {safeBanners.map((banner: any, index: number) => (

            <div
              key={banner.id || index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentSlide
                  ? 'opacity-100'
                  : 'opacity-0 pointer-events-none'
              }`}
            >

              <picture className="w-full h-full">

                {/* MOBILE */}
                {banner.imagem_mobile && (
                  <source
                    media="(max-width: 639px)"
                    srcSet={banner.imagem_mobile}
                  />
                )}

                {/* TABLET */}
                {banner.imagem_tablet && (
                  <source
                    media="(min-width: 640px) and (max-width: 1023px)"
                    srcSet={banner.imagem_tablet}
                  />
                )}

                {/* DESKTOP */}
                <img
                  src={
                    banner.imagem_desktop ||
                    fallbackBanner.imagem_desktop
                  }
                  alt={banner.titulo || banner.title || 'Banner'}
                  className="w-full h-full object-cover object-center"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  onError={(e: any) => {
                    e.target.src = fallbackBanner.imagem_desktop;
                  }}
                />

              </picture>

              <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />

              <div className="absolute inset-0 flex items-center">
                <div className="w-full px-4 sm:px-6 md:px-16 lg:px-24">

                  <div
                    className={`max-w-xl animate-in fade-in slide-in-from-left-8 duration-1000 ${
                      banner.posicao_texto === 'centro'
                        ? 'mx-auto text-center items-center flex flex-col'
                        : banner.posicao_texto === 'direita'
                        ? 'ml-auto text-right items-end flex flex-col'
                        : ''
                    }`}
                  >

                    {(banner.titulo || banner.title) && (
                      <h1
                        className="text-xl sm:text-3xl md:text-5xl lg:text-6xl leading-tight drop-shadow-lg mb-1.5 md:mb-4 text-white font-bold"
                        style={{
                          fontFamily: 'var(--store-font-heading)',
                          fontWeight: 'var(--store-font-weight-title)',
                          letterSpacing: 'var(--store-header-spacing)',
                          textTransform:
                            'var(--store-header-transform)' as any
                        }}
                      >
                        {banner.titulo || banner.title}
                      </h1>
                    )}

                    {(banner.subtitulo || banner.subtitle) && (
                      <p className="text-white text-[11px] sm:text-sm md:text-lg mb-3 md:mb-6 font-medium max-w-lg drop-shadow-md line-clamp-2">
                        {banner.subtitulo || banner.subtitle}
                      </p>
                    )}

                    {(banner.texto_botao ||
                      banner.textoBotao ||
                      banner.button_text) && (
                      <Link
                        to={
                          banner.link_botao ||
                          banner.linkBotao ||
                          banner.button_link ||
                          '/'
                        }
                        className="inline-block bg-brand-primary hover:opacity-95 text-brand-primary-foreground px-5 sm:px-8 md:px-12 py-2 md:py-3.5 transition-all duration-300 rounded-lg md:rounded-brand-button shadow-xl text-[10px] sm:text-xs md:text-sm font-bold"
                        style={{
                          backgroundColor: banner.cor_botao,
                          letterSpacing: 'var(--store-header-spacing)',
                          fontFamily: 'var(--store-font-heading)',
                          fontWeight:
                            'var(--store-font-weight-title)',
                          textTransform:
                            'var(--store-header-transform)' as any
                        }}
                      >
                        {banner.texto_botao ||
                          banner.textoBotao ||
                          banner.button_text ||
                          'EXPLORAR'}
                      </Link>
                    )}

                  </div>
                </div>
              </div>
            </div>
          ))}

          {safeBanners.length > 1 && (
            <div className="absolute bottom-3 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">

              {safeBanners.map((_: any, index: number) => (

                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1 transition-all rounded-full ${
                    index === currentSlide
                      ? 'w-8 md:w-12 bg-white'
                      : 'w-4 md:w-6 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Ir para slide ${index + 1}`}
                />

              ))}

            </div>
          )}

          {safeBanners.length > 1 && (
            <>
              <button
                onClick={() =>
                  setCurrentSlide(
                    (prev) =>
                      (prev - 1 + safeBanners.length) %
                      safeBanners.length
                  )
                }
                className="hidden md:flex absolute left-3 md:left-5 top-1/2 -translate-y-1/2 h-10 w-10 md:h-12 md:w-12 bg-white text-black hover:bg-white/90 rounded-full items-center justify-center transition-all opacity-0 md:group-hover:opacity-100 shadow-lg z-10"
                aria-label="Slide anterior"
              >
                <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
              </button>

              <button
                onClick={() =>
                  setCurrentSlide(
                    (prev) => (prev + 1) % safeBanners.length
                  )
                }
                className="hidden md:flex absolute right-3 md:right-5 top-1/2 -translate-y-1/2 h-10 w-10 md:h-12 md:w-12 bg-white text-black hover:bg-white/90 rounded-full items-center justify-center transition-all opacity-0 md:group-hover:opacity-100 shadow-lg z-10"
                aria-label="Próximo slide"
              >
                <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
              </button>
            </>
          )}

        </div>
      </div>
    </section>
  );
};

export const CategoryCircleIcons = () => {
  const { categories }: any = useStore();

  const safeCategories = Array.isArray(categories)
    ? categories
    : [];

  return (
    <section className="w-full bg-brand-background py-2 md:py-10">

      <div className="max-w-[1600px] mx-auto px-3 md:px-6">

        <div className="flex justify-center md:flex-wrap gap-3 md:gap-6 overflow-x-auto md:overflow-visible no-scrollbar pb-3 md:pb-0 px-1">

          {safeCategories.map((item: any, i: number) => (

            <Link
              to={`/category/${item.slug}`}
              key={i}
              className="group shrink-0"
            >

              <div className="w-[92px] md:w-auto bg-white rounded-[18px] md:rounded-[26px] p-2 md:p-5 border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">

                <div className="flex flex-col items-center">

                  <div className="relative w-16 h-16 md:w-28 md:h-28 rounded-full overflow-hidden bg-[#f5f5f5] shadow-md ring-3 md:ring-4 ring-white">

                    <img
                      src={
                        item.imagem_url ||
                        item.imagem ||
                        item.image ||
                        'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=200&h=200&fit=crop'
                      }
                      alt={item.nome || item.name}
                      className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                      onError={(e: any) => {
                        e.target.src =
                          'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=200&h=200&fit=crop';
                      }}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />

                  </div>

                  <span
                    className="mt-2 md:mt-4 text-[11px] md:text-[14px] text-center leading-tight text-brand-foreground group-hover:text-black transition-colors duration-300"
                    style={{
                      fontFamily: 'var(--store-font-body)',
                      fontWeight: 600
                    }}
                  >
                    {item.nome || item.name}
                  </span>

                </div>
              </div>

            </Link>

          ))}

        </div>
      </div>
    </section>
  );
};

export const Benefits = () => {
  const items = [
    {
      title: 'Frete Grátis',
      desc: 'Acima de R$ 199',
      icon: Zap
    },
    {
      title: 'Troca Grátis',
      desc: 'Primeira troca por nossa conta',
      icon: RefreshCcw
    },
    {
      title: '5x Sem Juros',
      desc: 'No cartão de crédito',
      icon: CreditCard
    },
    {
      title: 'Compra Segura',
      desc: 'SSL & Pagamento Protegido',
      icon: ShieldCheck
    },
  ];

  return (
    <section className="border-t border-b border-brand-border py-6 md:py-8 bg-brand-card mb-4">

      <div className="max-w-[1400px] mx-auto px-3 md:px-6 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-0 md:divide-x divide-brand-border">

        {items.map((b, i) => (

          <div
            key={i}
            className="flex flex-col sm:flex-row items-center gap-3 px-2 md:px-10 justify-center md:justify-start"
          >

            <div className="w-12 h-12 flex items-center justify-center bg-brand-secondary rounded-full shrink-0 shadow-sm">

              <b.icon
                className="w-6 h-6 text-[var(--price-color)]"
                strokeWidth={2}
              />

            </div>

            <div className="text-center sm:text-left">

              <p
                className="text-xs sm:text-sm leading-tight mb-0.5"
                style={{
                  fontFamily: 'var(--store-font-heading)',
                  fontWeight:
                    'var(--store-font-weight-title)',
                  color: 'var(--store-foreground)'
                }}
              >
                {b.title}
              </p>

              <p
                className="text-[10px] sm:text-[11px] font-medium"
                style={{
                  fontFamily: 'var(--store-font-body)',
                  fontWeight:
                    'var(--store-font-weight-text)',
                  color: 'var(--store-muted)'
                }}
              >
                {b.desc}
              </p>

            </div>
          </div>

        ))}

      </div>
    </section>
  );
};

export const EditorialSection = () => {
  const { products, editorial }: any = useStore();

  const safeProducts = Array.isArray(products)
    ? products
    : [];

  const validProducts = safeProducts.filter(
    (p: any) =>
      p?.status === 'active' &&
      (
        (p?.images && p.images.length > 0) ||
        p?.main_image
      )
  );

  const productIds = editorial?.produtos_ids || [];

  const produtosColecao = validProducts
    .filter((p: any) => productIds.includes(p.id))
    .slice(0, 4);

  const displayProducts =
    produtosColecao.length > 0
      ? produtosColecao
      : validProducts.slice(0, 4);

  if (!editorial || editorial.ativo === false)
    return null;

  return (
    <div className="max-w-[1400px] mx-auto px-3 md:px-6 py-8 md:py-12">

      <div className="flex items-center justify-between mb-6 md:mb-8">

        <h2
          className="flex items-center gap-2 md:gap-3 text-lg md:text-xl font-bold uppercase tracking-wide"
          style={{
            fontFamily: 'var(--store-font-heading)',
            fontWeight: 'var(--store-font-weight-title)',
            color: 'var(--store-foreground)'
          }}
        >
          <span className="w-1 md:w-1.5 h-5 md:h-7 bg-[var(--price-color)] rounded-full inline-block" />
          DESTAQUES
        </h2>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-0 rounded-lg md:rounded-brand-card overflow-hidden shadow-lg md:shadow-xl border border-brand-border">

        <div className="relative min-h-[280px] sm:min-h-[350px] md:min-h-[500px] group overflow-hidden">

          <img
            src={
              editorial.imagem_url ||
              'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1000'
            }
            alt={editorial.titulo}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          <div className="absolute bottom-6 sm:bottom-8 left-6 sm:left-8 md:bottom-10 md:left-10 right-6 sm:right-8 md:right-10">

            <p className="text-brand-secondary text-[10px] sm:text-xs tracking-[0.2em] uppercase font-bold mb-2 md:mb-3 drop-shadow-sm">
              {editorial.subtitulo}
            </p>

            <h3
              className="text-white text-2xl sm:text-3xl md:text-5xl mb-2 md:mb-4 leading-tight"
              style={{
                fontFamily: 'var(--store-font-heading)',
                fontWeight:
                  'var(--store-font-weight-title)'
              }}
            >
              {editorial.titulo}
            </h3>

            <p className="text-white/80 text-xs sm:text-sm md:text-base mb-4 md:mb-8 max-w-xs font-medium leading-relaxed line-clamp-2 md:line-clamp-3">
              {editorial.descricao ||
                'Peças que contam histórias. Descubra a elegância atemporal da nova coleção.'}
            </p>

            <Link
              to={editorial.link_botao || '/'}
              className="border-2 border-[var(--store-button-text)] text-[var(--store-button-text)] text-[10px] sm:text-xs md:text-sm font-bold px-5 sm:px-6 md:px-8 py-2 md:py-3.5 hover:bg-[var(--store-button-text)] hover:text-black transition-all duration-300 rounded-lg md:rounded-brand-button inline-block"
              style={{
                letterSpacing:
                  'var(--store-header-spacing)',
                textTransform:
                  'var(--store-header-transform)' as any
              }}
            >
              {editorial.texto_botao || 'EXPLORAR'}
            </Link>

          </div>
        </div>

        <div className="grid grid-cols-2 gap-px bg-brand-border">

          {displayProducts.map((p: any) => (

            <div
              key={p.id}
              className="bg-brand-card p-1.5 sm:p-2 md:p-4"
            >
              <ProductCard product={p} />
            </div>

          ))}

        </div>
      </div>
    </div>
  );
};
