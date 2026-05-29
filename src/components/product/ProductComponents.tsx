import React from 'react';
import { Heart, Zap, ShoppingBag } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export const ProductCard = ({ product }: any) => {
  const { toggleFavorite, favorites, addToCart, setCartDrawerOpen }: any = useStore();
  const isFavorite = favorites.includes(product.id);

  const pixPrice = product.price_current * 0.95;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="group bg-brand-card relative flex flex-col h-full transition-all duration-300 rounded-[20px] overflow-hidden border border-brand-border hover:shadow-2xl cursor-pointer"
    >
      <div className="relative w-full overflow-hidden bg-brand-secondary aspect-[3/4] rounded-t-[20px]">
        {product.discount > 0 && (
          <div className="absolute top-3 left-3 z-10 bg-[var(--store-highlight)] text-[var(--store-button-text)] rounded-full w-10 h-10 flex items-center justify-center text-[11px] shadow-lg border border-brand-background leading-none"
            style={{ fontFamily: 'var(--store-font-heading)', fontWeight: 'var(--store-font-weight-title)' }}>
            -{product.discount}%
          </div>
        )}
        
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 translate-x-2 lg:group-hover:translate-x-0">
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(product.id);
            }}
            className={cn(
              "h-10 w-10 bg-brand-background/95 backdrop-blur-md rounded-full flex items-center justify-center transition-all shadow-md hover:scale-110",
              isFavorite ? 'text-red-500' : 'text-brand-muted hover:text-red-500'
            )}
          >
            <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
          </button>
          
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addToCart(product, product.colors?.[0]?.nome, product.sizes?.[0]);
              setCartDrawerOpen(true);
            }}
            className="h-10 w-10 bg-brand-background/95 backdrop-blur-md text-brand-muted hover:text-brand-primary rounded-full flex items-center justify-center transition-all shadow-md hover:scale-110"
          >
            <ShoppingBag className="h-5 w-5" />
          </button>
        </div>

        <Link to={`/produto/${product.slug || product.id}`} className="absolute inset-0 block h-full overflow-hidden">
          <img 
            src={product.main_image || product.images?.[0] || ''} 
            alt={product.name}
            className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Link>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <Link to={`/produto/${product.slug || product.id}`} className="flex flex-col flex-1 gap-1">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold"
            style={{ color: 'var(--store-primary)', fontFamily: 'var(--store-font-heading)' }}>
            {product.brand || 'MARCA'}
          </span>

          <h3 className="text-sm line-clamp-2 leading-snug min-h-[2.5rem] transition-colors"
            style={{ color: 'var(--store-text)', fontFamily: 'var(--store-font-heading)', fontWeight: 'var(--store-font-weight-title)' }}>
            {product.name}
          </h3>
          
          <div className="mt-auto pt-3 flex flex-col gap-0.5">
            {product.price_original > product.price_current && (
              <span className="text-[12px] line-through opacity-50 font-medium"
                style={{ color: 'var(--store-text)' }}>
                R$ {product.price_original?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            )}
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-xl font-black"
                style={{ color: 'var(--store-primary)', fontFamily: 'var(--store-font-heading)' }}>
                R$ {product.price_current?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              {product.discount > 0 && (
                <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter flex items-center gap-1"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--store-highlight), transparent 90%)', color: 'var(--store-highlight)' }}>
                  Economia R$ {(product.price_original - product.price_current).toFixed(0)}
                </span>
              )}
            </div>
            
            <p className="text-[11px] font-medium opacity-60" style={{ color: 'var(--store-text)' }}>
              ou {product.installments || 1}x de R$ {(product.price_current / (product.installments || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-brand-border/50">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 shrink-0" style={{ color: 'var(--store-highlight)' }} />
              <span className="text-[11px] font-bold uppercase tracking-tight"
                style={{ color: 'var(--store-highlight)', fontFamily: 'var(--store-font-heading)' }}>
                R$ {pixPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} no PIX
              </span>
            </div>
          </div>
        </Link>
      </div>
    </motion.div>
  );
};

export const ProductGrid = ({ title, products, linkVerTudo }: any) => {
  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-12 bg-brand-background overflow-hidden">
      <div className="flex items-center justify-between mb-10">
        <h2 className="flex items-center gap-4 text-2xl uppercase tracking-tight"
          style={{ color: 'var(--store-text)', fontFamily: 'var(--store-font-heading)', fontWeight: 'var(--store-font-weight-title)' }}>
          <span className="w-1.5 h-8 rounded-full inline-block" style={{ backgroundColor: 'var(--store-primary)' }} />
          {title}
        </h2>
        {linkVerTudo && (
          <Link to={linkVerTudo} className="text-xs hover:opacity-80 font-bold transition-all flex items-center gap-2 group"
            style={{ color: 'var(--store-primary)', fontFamily: 'var(--store-font-heading)', fontWeight: 'var(--store-font-weight-title)' }}>
            Ver Tudo <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 lg:gap-10">
        {products.map((product: any) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};