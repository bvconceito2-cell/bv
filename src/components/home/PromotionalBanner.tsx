import React from 'react';
import { Link } from 'react-router-dom';

interface PromotionalBannerProps {
  banner: {
    imagem_desktop: string;
    imagem_mobile: string;
    titulo?: string;
    subtitulo?: string;
    texto_botao?: string;
    link_botao?: string;
    alinhamento?: 'esquerda' | 'centro' | 'direita';
    overlay?: boolean;
    cor_texto?: string;
    cor_botao?: string;
  };
}

export const PromotionalBanner = ({ banner }: PromotionalBannerProps) => {
  if (!banner) return null;

  const alignmentClasses = {
    esquerda: 'items-start text-left',
    centro: 'items-center text-center',
    direita: 'items-end text-right',
  };

  const currentAlignment = banner.alinhamento || 'centro';

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-12">
      <div className="relative w-full h-[220px] tablet:h-[320px] md:h-[420px] rounded-brand-card overflow-hidden group shadow-lg">
        {/* Imagem Desktop */}
        <img 
          src={banner.imagem_desktop} 
          alt={banner.titulo || 'Promoção'} 
          className="hidden md:block absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        {/* Imagem Mobile */}
        <img 
          src={banner.imagem_mobile || banner.imagem_desktop} 
          alt={banner.titulo || 'Promoção'} 
          className="block md:hidden absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />

        {/* Overlay opcional */}
        {banner.overlay && (
          <div className="absolute inset-0 bg-black/30" />
        )}

        {/* Conteúdo */}
        <div className={`absolute inset-0 flex flex-col justify-center p-8 md:p-20 z-10 ${alignmentClasses[currentAlignment]}`}>
          <div className="max-w-xl animate-in fade-in duration-700">
            {banner.subtitulo && (
              <p 
                className="text-xs md:text-sm mb-3 opacity-90"
                style={{ color: banner.cor_texto || 'var(--store-button-text)', fontFamily: 'var(--store-font-heading)', fontWeight: 'var(--store-font-weight-title)', letterSpacing: 'var(--store-header-spacing)', textTransform: 'var(--store-header-transform)' as any }}
              >
                {banner.subtitulo}
              </p>
            )}
            {banner.titulo && (
              <h2 
                className="text-3xl md:text-5xl mb-8 leading-tight"
                style={{ 
                  color: banner.cor_texto || 'var(--store-button-text)',
                  fontFamily: 'var(--store-font-heading)',
                  fontWeight: 'var(--store-font-weight-title)',
                  letterSpacing: 'var(--store-header-spacing)',
                  textTransform: 'var(--store-header-transform)' as any
                }}
              >
                {banner.titulo}
              </h2>
            )}
            {banner.texto_botao && (
              <Link
                to={banner.link_botao || '#'}
                className="inline-block px-10 py-4 text-xs transition-all duration-300 hover:scale-105 shadow-xl rounded-brand-button"
                style={{ 
                  backgroundColor: banner.cor_botao || 'var(--store-primary)',
                  color: banner.cor_texto || 'var(--store-button-text)',
                  fontFamily: 'var(--store-font-heading)',
                  fontWeight: 'var(--store-font-weight-title)',
                  letterSpacing: 'var(--store-header-spacing)',
                  textTransform: 'var(--store-header-transform)' as any
                }}
              >
                {banner.texto_botao}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
