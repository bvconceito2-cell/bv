import React, { useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, Zap, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

export const CartDrawer = () => {
  const navigate = useNavigate();
  const { cart, cartDrawerOpen, setCartDrawerOpen, removeFromCart, updateCartQuantity } = useStore() as any;

  const subtotal = cart.reduce((acc: number, item: any) => acc + (item.price_current * item.quantity), 0);

  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('loja-abandoned-cart', JSON.stringify({
        items: cart,
        timestamp: new Date().toISOString()
      }));
    } else {
      localStorage.removeItem('loja-abandoned-cart');
    }
  }, [cart]);

  return (
    <AnimatePresence>
      {cartDrawerOpen && (
        <div className="fixed inset-0 z-[100] overflow-hidden">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setCartDrawerOpen(false)}
          />
          
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-screen max-w-md flex flex-col bg-brand-background shadow-2xl relative"
            >
              <div className="flex items-center justify-between p-6 border-b border-brand-border bg-brand-card sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-secondary rounded-lg">
                    <ShoppingBag className="w-5 h-5 text-[var(--store-primary)]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black uppercase tracking-tight text-brand-foreground">Sua Sacola</h2>
                    <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">
                      {cart.reduce((acc: number, item: any) => acc + item.quantity, 0)} {cart.length === 1 && cart[0].quantity === 1 ? 'item' : 'itens'} selecionados
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setCartDrawerOpen(false)}
                  className="p-2 hover:bg-brand-secondary rounded-full transition-colors text-brand-muted hover:text-brand-foreground"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center pb-20">
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-24 h-24 bg-brand-secondary rounded-full flex items-center justify-center mb-6"
                    >
                      <ShoppingBag className="w-10 h-10 text-brand-muted opacity-30" />
                    </motion.div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-brand-foreground mb-2">Sacola Vazia</h3>
                    <p className="text-xs text-brand-muted font-medium mb-8 max-w-[200px] mx-auto">Sua sacola ainda não possui produtos. Explore nossa coleção!</p>
                    <button 
                      onClick={() => setCartDrawerOpen(false)}
                      className="bg-[var(--store-primary)] text-[var(--store-button-text)] px-8 py-4 text-[11px] font-black uppercase tracking-widest rounded-brand-button shadow-xl hover:opacity-90 transition-all"
                    >
                      Explorar Coleção
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {cart.map((item: any, idx: number) => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={`${item.id}-${item.color}-${item.size}`} 
                        className="flex gap-4 group"
                      >
                        <div className="w-24 aspect-[3/4] bg-brand-secondary rounded-brand-card overflow-hidden shrink-0 border border-brand-border shadow-sm">
                          <img 
                            src={item.main_image || item.images?.[0]} 
                            alt={item.name} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                            loading="lazy"
                          />
                        </div>
                        <div className="flex-1 flex flex-col pt-1">
                          <div className="flex justify-between gap-2 mb-1">
                            <h3 className="text-xs font-black text-brand-foreground line-clamp-2 uppercase leading-tight tracking-tight">{item.name}</h3>
                            <button 
                              onClick={() => removeFromCart(item.id, item.color, item.size)}
                              className="text-brand-muted hover:text-red-600 transition-colors p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-brand-secondary text-brand-muted rounded-sm">Cor: {item.color}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-brand-secondary text-brand-muted rounded-sm">Tam: {item.size}</span>
                          </div>
                          <div className="mt-auto flex items-center justify-between">
                            <div className="flex items-center bg-brand-secondary border border-brand-border rounded-brand-button shrink-0">
                              <button 
                                onClick={() => updateCartQuantity(item.id, item.color, item.size, Math.max(1, item.quantity - 1))}
                                className="p-1.5 hover:bg-[var(--store-primary)]/10 text-brand-muted hover:text-[var(--store-primary)] transition-colors"
                              ><Minus className="w-3.5 h-3.5" /></button>
                              <span className="w-10 text-center text-xs font-black text-brand-foreground">{item.quantity}</span>
                              <button 
                                onClick={() => updateCartQuantity(item.id, item.color, item.size, item.quantity + 1)}
                                className="p-1.5 hover:bg-[var(--store-primary)]/10 text-brand-muted hover:text-[var(--store-primary)] transition-colors"
                              ><Plus className="w-3.5 h-3.5" /></button>
                            </div>
                            <span className="text-sm font-black text-[var(--price-color)]">
                              R$ {(item.price_current * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-brand-border bg-brand-card space-y-6 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-black text-brand-muted uppercase tracking-[0.2em]">Subtotal</span>
                      <span className="text-base font-black text-brand-foreground">
                        R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[var(--store-highlight)]">
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em]">Pagando no PIX</span>
                      </div>
                      <span className="text-base font-black">
                        R$ {(subtotal * 0.9).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 py-3 px-4 bg-brand-secondary rounded-brand-button">
                    <ShieldCheck className="w-4 h-4 text-brand-muted" />
                    <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">Compra 100% Segura e Garantida</p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => {
                        setCartDrawerOpen(false);
                        navigate('/checkout');
                      }}
                      className="w-full bg-[var(--store-primary)] text-[var(--store-button-text)] py-5 text-xs font-black uppercase tracking-[0.2em] rounded-brand-button shadow-xl shadow-[var(--store-primary)]/10 flex items-center justify-center gap-3 hover:opacity-90 transition-all"
                    >
                      Finalizar Compra <ArrowRight className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        setCartDrawerOpen(false);
                        navigate('/carrinho');
                      }}
                      className="w-full text-center text-[10px] font-black uppercase tracking-[0.3em] text-brand-muted hover:text-[var(--store-primary)] transition-colors py-2"
                    >
                      Editar Sacola
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
