import React from 'react';
import { useStore } from '../store/useStore';
import { Layout } from '../components/layout/Layout';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ArrowLeft, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const CartPage = () => {
  const { cart, removeFromCart, updateCartQuantity } = useStore() as any;
  const navigate = useNavigate();

  const subtotal = cart.reduce((acc: number, item: any) => acc + (item.price_current * item.quantity), 0);

  if (cart.length === 0) {
    return (
      <Layout>
        <div className="max-w-[1400px] mx-auto px-6 py-24 text-center bg-brand-background">
          <div className="w-24 h-24 bg-brand-secondary rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-12 h-12 text-brand-muted opacity-30" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-brand-foreground mb-4">Sua sacola está vazia</h1>
          <p className="text-brand-muted mb-8 font-medium">Parece que você ainda não adicionou nenhum produto à sua sacola.</p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 bg-[var(--store-primary)] text-[var(--store-button-text)] px-10 py-4 font-black uppercase tracking-widest hover:opacity-90 transition-colors rounded-brand-button shadow-xl"
          >
            Começar a comprar
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <h1 className="text-3xl font-black uppercase tracking-tight text-brand-foreground mb-12">Sua Sacola</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Listagem de Produtos */}
          <div className="lg:col-span-8">
            <div className="bg-brand-card rounded-brand-card border border-brand-border shadow-sm overflow-hidden">
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-brand-secondary/50 border-b border-brand-border">
                <div className="col-span-6 text-[10px] font-black text-brand-muted uppercase tracking-widest">Produto</div>
                <div className="col-span-2 text-[10px] font-black text-brand-muted uppercase tracking-widest text-center">Quantidade</div>
                <div className="col-span-2 text-[10px] font-black text-brand-muted uppercase tracking-widest text-right">Preço</div>
                <div className="col-span-2 text-[10px] font-black text-brand-muted uppercase tracking-widest text-right">Total</div>
              </div>

              <div className="divide-y divide-brand-border">
                {cart.map((item: any) => (
                  <div key={`${item.id}-${item.color}-${item.size}`} className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    <div className="md:col-span-6 flex gap-4">
                      <div className="w-20 aspect-[3/4] bg-brand-secondary rounded-brand-card overflow-hidden shrink-0 border border-brand-border">
                        <img 
                          src={item.main_image || item.images?.[0]} 
                          alt={item.name} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="flex flex-col justify-center">
                        <h3 className="text-sm font-bold text-brand-foreground uppercase leading-tight mb-1">{item.name}</h3>
                        <p className="text-[10px] text-brand-muted font-black uppercase">
                          {item.color} | {item.size}
                        </p>
                        <button 
                          onClick={() => removeFromCart(item.id, item.color, item.size)}
                          className="mt-3 flex items-center gap-1.5 text-[10px] font-black text-red-400 uppercase hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remover
                        </button>
                      </div>
                    </div>

                    <div className="md:col-span-2 flex justify-center">
                      <div className="flex items-center border border-brand-border rounded-brand-button">
                        <button 
                          onClick={() => updateCartQuantity(item.id, item.color, item.size, Math.max(1, item.quantity - 1))}
                          className="p-2 hover:bg-brand-secondary text-brand-muted"
                        ><Minus className="w-3.5 h-3.5" /></button>
                        <span className="w-10 text-center text-sm font-bold text-brand-foreground">{item.quantity}</span>
                        <button 
                          onClick={() => updateCartQuantity(item.id, item.color, item.size, item.quantity + 1)}
                          className="p-2 hover:bg-brand-secondary text-brand-muted"
                        ><Plus className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>

                    <div className="md:col-span-2 text-right hidden md:block">
                      <p className="text-sm font-medium text-brand-muted line-through">
                        R$ {item.price_original.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm font-bold text-brand-foreground">
                        R$ {item.price_current.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    <div className="md:col-span-2 text-right">
                      <p className="text-base font-black text-[var(--price-color)]">
                        R$ {(item.price_current * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Link to="/" className="inline-flex items-center gap-2 mt-8 text-xs font-black text-brand-muted uppercase hover:text-[var(--store-primary)] transition-colors">
              <ArrowLeft className="w-4 h-4" /> Continuar Comprando
            </Link>
          </div>

          {/* Resumo do Pedido */}
          <div className="lg:col-span-4">
            <div className="bg-brand-card p-8 rounded-brand-card border border-brand-border shadow-sm sticky top-32">
              <h2 className="text-lg font-black uppercase tracking-tight mb-8 text-brand-foreground">Resumo do Pedido</h2>
              
              <div className="space-y-4 pb-8 border-b border-brand-border">
                <div className="flex justify-between text-sm">
                  <span className="text-brand-muted font-medium">Subtotal</span>
                  <span className="text-brand-foreground font-bold">R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-brand-muted font-medium">Entrega</span>
                  <span className="text-brand-accent font-bold uppercase text-[10px]">Calculado no checkout</span>
                </div>
              </div>

              <div className="pt-8 mb-10">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Total Estimado</span>
                  <span className="text-3xl font-black text-[var(--price-color)]">
                    R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <button 
                onClick={() => navigate('/checkout')}
                className="w-full bg-[var(--store-primary)] text-[var(--store-button-text)] py-5 font-black uppercase tracking-[0.2em] rounded-brand-button shadow-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all"
              >
                Finalizar Compra <ArrowRight className="w-5 h-5" />
              </button>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-brand-secondary flex items-center justify-center">
                    <Zap className="h-5 w-5 text-brand-muted" />
                  </div>
                  <span className="text-[9px] font-black text-brand-muted uppercase tracking-tighter">Entrega Expressa</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-brand-secondary flex items-center justify-center">
                    <ArrowRight className="h-5 w-5 text-brand-muted" />
                  </div>
                  <span className="text-[9px] font-black text-brand-muted uppercase tracking-tighter">Troca Sem Custo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CartPage;