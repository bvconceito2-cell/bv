import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Layout } from '../components/layout/Layout';
import { SEO } from '../components/layout/SEO';
import { Heart, Share2, ChevronRight, Star, ShieldCheck, RefreshCcw, CreditCard, Ruler, Play, Check, ShoppingBag, Zap, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

const FloatingWhatsApp = () => {
  const { config }: any = useStore();
  const message = "Olá! Gostaria de tirar uma dúvida sobre um produto.";
  const whatsappNumber = config?.whatsapp?.replace(/\D/g, '') || '';
  const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

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

const ProductPage = () => {
  const { id } = useParams();
  const { products, addToCart, toggleFavorite, favorites, fetchFromSupabase, setCartDrawerOpen }: any = useStore();
  const product = products.find((p: any) => String(p.id) === id || p.slug === id || p.id === Number(id));

  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [mainMedia, setMainMedia] = useState<any>(null);
  const [showStickyAdd, setShowStickyAdd] = useState(false);

  useEffect(() => {
    if (products.length === 0) {
      fetchFromSupabase();
    }
  }, [products.length, fetchFromSupabase]);

  useEffect(() => {
    if (product) {
      setSelectedColor(product.colors?.length > 0 ? product.colors[0].nome : '');
      
      const media = product.media && product.media.length > 0 
        ? product.media 
        : (product.images || []).map((url: string, i: number) => ({ url, tipo: 'imagem', principal: i === 0 }));
      
      const principal = media.find((m: any) => m.principal) || media[0];
      setMainMedia(principal);
    }
  }, [product]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setShowStickyAdd(scrollY > 600);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);



  if (!product) return <div className="min-h-screen flex items-center justify-center bg-brand-background text-brand-foreground">Produto não encontrado</div>;

  const isFavorite = favorites.includes(product.id);

  const handleAddToCart = () => {
    if (product.sizes?.length > 0 && !selectedSize) {
      toast.error('Por favor, selecione um tamanho');
      return;
    }
    if (product.colors?.length > 0 && !selectedColor) {
      toast.error('Por favor, selecione uma cor');
      return;
    }
    addToCart(product, selectedColor, selectedSize);
    
    toast.custom((t) => (
      <div className={`max-w-md w-full bg-brand-card shadow-2xl rounded-brand-card pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-brand-border overflow-hidden`}>
        <div className="flex-1 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <div className="h-10 w-10 rounded-full bg-brand-primary/10 flex items-center justify-center">
                <Check className="h-6 w-6 text-brand-primary" />
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-bold text-brand-foreground">
                Produto adicionado à sacola
              </p>
              <p className="mt-1 text-xs text-brand-muted font-medium">
                Você pode continuar comprando ou finalizar o pedido.
              </p>
              <div className="mt-4 flex gap-4">
                <button
                  onClick={() => {
                    setCartDrawerOpen(true);
                    toast.dismiss(t);
                  }}
                  className="bg-[var(--store-primary)] text-[var(--store-button-text)] px-4 py-2 rounded-brand-button text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-colors"
                >
                  Ver sacola
                </button>
                <button
                  onClick={() => toast.dismiss(t)}
                  className="text-[10px] font-black text-brand-muted uppercase tracking-widest hover:text-brand-foreground transition-colors"
                >
                  Continuar comprando
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    ), { duration: 3000, position: 'top-right' });
  };


  return (
    <Layout>
      <SEO 
        title={product.name}
        description={product.description}
        image={product.main_image || product.images?.[0]}
        product={product}
        breadcrumb={[
          { name: 'Início', item: '/' },
          { name: 'Moda Feminina', item: '/category/feminino' },
          { name: product.category, item: `/category/${product.category.toLowerCase()}` },
          { name: product.name, item: `/produto/${product.id}` }
        ]}
      />
      <div className="bg-brand-card border-b border-brand-border">
        <div className="max-w-[1400px] mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-[10px] md:text-xs text-brand-muted font-medium overflow-x-auto no-scrollbar whitespace-nowrap">
            <Link to="/" className="hover:text-[var(--store-primary)] transition-colors">Início</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/category/feminino" className="hover:text-[var(--store-primary)] transition-colors">Moda Feminina</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to={`/category/${product.category.toLowerCase()}`} className="hover:text-[var(--store-primary)] transition-colors">{product.category}</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-brand-foreground truncate">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-0 lg:px-8 py-0 lg:py-12 bg-brand-background">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-16">
          
          {/* Gallery Section */}
          <div className="lg:col-span-7 flex flex-col md:flex-row-reverse gap-4">
            <div className="flex-1 aspect-[4/5] relative bg-brand-secondary overflow-hidden group">
              {mainMedia?.tipo === 'video' ? (
                <video 
                  src={mainMedia.url} 
                  autoPlay 
                  muted 
                  loop 
                  controls 
                  className="w-full h-full object-cover"
                />
              ) : (
                <img src={mainMedia?.url} alt={product.name} className="w-full h-full object-cover" fetchPriority="high" />
              )}
              {product.discount > 0 && (
                <div className="absolute top-6 left-6 bg-[var(--store-highlight)] text-[var(--store-button-text)] text-xs font-black h-12 w-12 flex items-center justify-center rounded-full shadow-xl z-10 border-2 border-brand-background">
                  -{product.discount}%
                </div>
              )}
            </div>

            {/* Thumbnails */}
            <div className="flex md:flex-col gap-3 px-4 md:px-0 overflow-x-auto no-scrollbar md:w-24 py-4 md:py-0">
              {(product.media && product.media.length > 0 ? product.media : (product.images || []).map((url: string) => ({ url, tipo: 'imagem' }))).map((media: any, i: number) => (
                <button 
                  key={i} 
                  onClick={() => setMainMedia(media)}
                  className={`aspect-[3/4] w-20 md:w-full border-2 rounded-lg overflow-hidden flex-shrink-0 transition-all relative ${mainMedia?.url === media.url ? 'border-brand-primary scale-95 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                >
                  {media.tipo === 'video' ? (
                    <div className="w-full h-full bg-brand-foreground/90 flex items-center justify-center">
                      <video src={media.url} className="w-full h-full object-cover opacity-60" />
                      <Play className="h-4 w-4 text-brand-background absolute" />
                    </div>
                  ) : (
                    <img src={media.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Product Info Section */}
          <div className="lg:col-span-5 flex flex-col px-6 lg:px-0 py-8 lg:py-0">
            <div className="space-y-6">
              <div className="space-y-2">
                <Link to="#" className="text-[10px] uppercase opacity-60 mb-2 block"
                  style={{ color: 'var(--store-primary)', fontFamily: 'var(--store-font-heading)', fontWeight: 'var(--store-font-weight-title)', letterSpacing: 'var(--store-header-spacing)' }}>
                  {product.brand}
                </Link>
                <h1 className="text-2xl lg:text-3xl leading-tight"
                  style={{ color: 'var(--store-foreground)', fontFamily: 'var(--store-font-heading)', fontWeight: 'var(--store-font-weight-title)', textTransform: 'var(--store-header-transform)' as any, letterSpacing: 'var(--store-header-spacing)' }}>
                  {product.name}
                </h1>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < Math.floor(product.rating) ? 'text-brand-primary fill-brand-primary' : 'text-brand-muted/20'}`} />
                    ))}
                  </div>
                  <span className="text-[10px] text-brand-muted font-black uppercase tracking-widest">({product.reviews_count} avaliações)</span>
                </div>
              </div>

              {/* Price Card */}
              <div className="bg-brand-card p-6 rounded-brand-card border border-brand-border shadow-sm space-y-4 relative overflow-hidden">
                <div className="flex flex-col gap-1">
                  {product.price_original > product.price_current && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-brand-muted line-through font-bold">
                        R$ {product.price_original.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="bg-brand-secondary text-brand-foreground text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                        ECONOMIZE R$ {(product.price_original - product.price_current).toFixed(0)} 🔥
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl lg:text-5xl tracking-tighter"
                      style={{ color: 'var(--store-primary)', fontFamily: 'var(--store-font-heading)', fontWeight: 'var(--store-font-weight-price)' }}>
                      R$ {product.price_current.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-1 pt-2 border-t border-brand-border mt-2">
                    <p className="text-xs font-black uppercase flex items-center gap-2" style={{ color: 'var(--store-primary)', fontFamily: 'var(--store-font-heading)', letterSpacing: 'var(--store-header-spacing)' }}>
                      <CreditCard className="h-3 w-3" />
                      Até {product.installments}x de R$ {(product.price_current / product.installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} sem juros
                    </p>
                    <p className="text-[10px] font-black uppercase flex items-center gap-2" style={{ color: 'var(--store-highlight)', fontFamily: 'var(--store-font-heading)', letterSpacing: 'var(--store-header-spacing)' }}>
                      <Zap className="h-3 w-3" />
                      R$ {(product.price_current * 0.95).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} no PIX (5% OFF)
                    </p>
                  </div>
                </div>
              </div>

              {/* Selection Options */}
              <div className="space-y-8">
                {/* Colors */}
                {product.colors?.length > 0 && (
                  <div className="space-y-4">
                    <p className="text-[11px] font-black uppercase tracking-widest text-brand-foreground">Cor: <span className="text-brand-muted">{selectedColor}</span></p>
                    <div className="flex flex-wrap gap-3">
                      {product.colors.map((color: any, i: number) => (
                        <button 
                          key={i}
                          onClick={() => {
                            setSelectedColor(color.nome);
                            if (color.imagem) setMainMedia({ url: color.imagem, tipo: 'imagem' });
                          }}
                          className={cn(
                            "group relative h-12 w-12 rounded-full border-2 transition-all p-0.5",
                            selectedColor === color.nome ? 'border-[var(--store-primary)] scale-110 shadow-lg shadow-[var(--store-primary)]/10' : 'border-brand-border hover:border-[var(--store-primary)]/50'
                          )}
                        >
                          <div style={{ backgroundColor: color.hex }} className="w-full h-full rounded-full border border-black/5" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sizes */}
                {product.sizes?.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-[11px] font-black uppercase tracking-widest text-brand-foreground">Tamanho: <span className="text-brand-muted">{selectedSize}</span></p>
                      {product.technical?.['Tabela de Medidas'] && (
                        <button className="flex items-center gap-1.5 text-[9px] font-black text-[var(--store-primary)] uppercase tracking-widest border-b border-[var(--store-primary)]/20 pb-0.5 hover:border-[var(--store-primary)] transition-colors">
                          <Ruler className="h-3 w-3" /> Tabela de medidas
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-4 md:flex md:flex-wrap gap-2">
                      {product.sizes.map((size: string) => (
                        <button 
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={cn(
                            "h-12 min-w-[48px] px-3 flex items-center justify-center text-xs font-black border-2 transition-all rounded-brand-button",
                            selectedSize === size 
                              ? 'border-brand-foreground bg-brand-foreground text-brand-background shadow-lg' 
                              : 'border-brand-border text-brand-muted hover:border-brand-foreground hover:text-brand-foreground'
                          )}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-4 py-4">
                <button 
                  onClick={handleAddToCart}
                  className="w-full text-sm font-black transition-all rounded-brand-button shadow-2xl flex items-center justify-center gap-3 h-16 bg-[var(--store-primary)] text-[var(--store-button-text)]"
                  style={{ fontFamily: 'var(--store-font-heading)', textTransform: 'var(--store-header-transform)' as any, letterSpacing: 'var(--store-header-spacing)' }}
                >
                  <ShoppingBag className="h-5 w-5" />
                  Adicionar na Sacola
                </button>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => toggleFavorite(product.id)}
                    className={cn(
                      "h-14 border border-brand-border flex items-center justify-center gap-2 rounded-brand-button font-black text-[10px] uppercase tracking-widest transition-all",
                      isFavorite ? 'bg-[var(--store-highlight)]/10 text-[var(--store-highlight)] border-[var(--store-highlight)]/20' : 'bg-brand-background text-brand-muted hover:border-[var(--store-primary)]/50'
                    )}
                  >
                    <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} /> {isFavorite ? 'Favorito' : 'Favoritar'}
                  </button>
                  <button className="h-14 border border-brand-border bg-brand-background text-brand-muted flex items-center justify-center gap-2 rounded-brand-button font-black text-[10px] uppercase tracking-widest hover:border-[var(--store-primary)]/50">
                    <Share2 className="h-4 w-4" /> Compartilhar
                  </button>
                </div>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-3 gap-2 py-6 border-y border-brand-border">
                {[
                  { icon: CreditCard, text: "Até 5x s/ juros" },
                  { icon: ShieldCheck, text: "Site Seguro" },
                  { icon: RefreshCcw, text: "Troca Fácil" }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center text-center gap-2">
                    <item.icon className="h-5 w-5 text-[var(--store-primary)] opacity-60" />
                    <span className="text-[9px] font-black text-brand-muted uppercase tracking-tighter leading-tight px-1">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Description & Details */}
              <div className="space-y-8 pt-4">
                <div className="space-y-3">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-foreground border-l-2 border-[var(--store-primary)] pl-3">Descrição do Produto</h3>
                  <p className="text-sm text-brand-muted leading-relaxed font-medium">
                    {product.description}
                  </p>
                </div>
                
                {Object.keys(product.technical || {}).length > 0 && (
                  <div className="space-y-4 bg-brand-secondary/30 p-6 rounded-2xl border border-brand-border">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-foreground">Especificações Técnicas</h3>
                    <div className="grid grid-cols-1 gap-3">
                       {Object.entries(product.technical || {}).map(([label, val]: any) => (
                        <div key={label} className="flex justify-between items-center text-xs pb-2 border-b border-brand-border/50 last:border-0 last:pb-0">
                          <span className="text-brand-muted font-bold uppercase tracking-widest text-[9px]">{label}</span>
                          <span className="text-brand-foreground font-black">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      <div className="max-w-[1400px] mx-auto px-4 py-16 border-t border-brand-border bg-brand-background">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-xl font-black uppercase tracking-tight text-brand-foreground">VOCÊ TAMBÉM PODE GOSTAR</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {products
            .filter((p: any) => p.category === product.category && p.id !== product.id)
            .slice(0, 4)
            .map((related: any) => (
              <Link 
                key={related.id} 
                to={`/produto/${related.slug || related.id}`}
                className="group flex flex-col gap-3"
              >
                <div className="aspect-[3/4] bg-brand-secondary rounded-sm overflow-hidden relative">
                  <img 
                    src={related.main_image || related.images?.[0]} 
                    alt={related.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-brand-foreground uppercase truncate">{related.name}</h3>
                  <p className="text-sm font-black text-brand-primary mt-1">
                    R$ {related.price_current?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </Link>
            ))}
        </div>
      </div>

      {/* Sticky Add to Cart Mobile */}
      <AnimatePresence>
        {showStickyAdd && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-brand-background border-t border-brand-border p-4 pb-8 md:hidden shadow-[0_-10px_30px_rgba(0,0,0,0.05)]"
          >
            <div className="flex gap-4 items-center">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-brand-muted uppercase truncate">{product.name}</p>
                <p className="text-sm font-black text-brand-foreground">R$ {product.price_current?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <button 
                onClick={handleAddToCart}
                className="bg-[var(--store-primary)] text-[var(--store-button-text)] px-6 h-12 text-[11px] font-black uppercase tracking-widest rounded-sm flex items-center gap-2 whitespace-nowrap shadow-lg"
              >
                <ShoppingBag className="w-4 h-4" /> ADICIONAR
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <FloatingWhatsApp />
    </Layout>
  );
};

export default ProductPage;