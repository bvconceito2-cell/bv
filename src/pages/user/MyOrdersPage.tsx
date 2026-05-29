import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Layout } from '../../components/layout/Layout';
import { supabase } from "@/integrations/supabase/client";
import { User, LogOut, ChevronRight, ShoppingBag, Heart, Package, Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const MyOrdersPage = () => {
  const { user, signOut } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('cliente_email', user?.email)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Se algum item não tiver imagem, tenta buscar dos produtos (retrocompatibilidade)
      const ordersWithImages = await Promise.all((data || []).map(async (order) => {
        const itensComImagens = await Promise.all(((order.itens as any[]) || []).map(async (item: any) => {
          if (!item.imagem && item.id) {
            const { data: produto } = await supabase
              .from('produtos')
              .select('imagem_principal')
              .eq('id', item.id)
              .single();
            
            if (produto?.imagem_principal) {
              return { ...item, imagem: produto.imagem_principal };
            }
          }
          return item;
        }));
        return { ...order, itens: itensComImagens };
      }));

      setOrders(ordersWithImages);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pendente': return <Clock className="h-4 w-4 text-amber-500" />;
      case 'pago': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'cancelado': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Package className="h-4 w-4 text-brand-primary" />;
    }
  };

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Sidebar Navigation */}
          <aside className="w-full md:w-64 space-y-2">
            <Link to="/minha-conta" className="flex items-center justify-between p-4 hover:bg-brand-secondary text-brand-muted rounded-brand-button font-bold text-xs uppercase tracking-widest transition-all">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4" /> Meus Dados
              </div>
              <ChevronRight className="h-4 w-4" />
            </Link>
            
            <Link to="/meus-pedidos" className="flex items-center justify-between p-4 bg-brand-primary/10 text-brand-primary rounded-brand-button font-bold text-xs uppercase tracking-widest transition-all">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-4 w-4" /> Meus Pedidos
              </div>
              <ChevronRight className="h-4 w-4" />
            </Link>

            <Link to="/favoritos" className="flex items-center justify-between p-4 hover:bg-brand-secondary text-brand-muted rounded-brand-button font-bold text-xs uppercase tracking-widest transition-all">
              <div className="flex items-center gap-3">
                <Heart className="h-4 w-4" /> Favoritos
              </div>
              <ChevronRight className="h-4 w-4" />
            </Link>

            <button 
              onClick={() => signOut()}
              className="w-full flex items-center justify-between p-4 hover:bg-red-50 text-red-400 rounded-brand-button font-bold text-xs uppercase tracking-widest transition-all mt-8"
            >
              <div className="flex items-center gap-3">
                <LogOut className="h-4 w-4" /> Sair da Conta
              </div>
            </button>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="bg-brand-card p-8 rounded-brand-card border border-brand-border shadow-sm min-h-[600px]">
              <h1 className="text-2xl font-black uppercase tracking-tight text-brand-foreground mb-8 pb-4 border-b border-brand-border">Meus Pedidos</h1>
              
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Clock className="h-10 w-10 animate-spin text-brand-muted/30" />
                  <p className="text-[10px] font-black uppercase text-brand-muted tracking-widest">Carregando pedidos...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-brand-border rounded-brand-card">
                  <ShoppingBag className="h-12 w-12 text-brand-muted/30 mx-auto mb-4" />
                  <p className="text-sm font-medium text-brand-muted mb-6">Você ainda não realizou nenhum pedido.</p>
                  <Link to="/" className="inline-block px-8 py-3 bg-brand-primary text-brand-primary-foreground font-black uppercase tracking-widest text-xs rounded-brand-button">Começar a comprar</Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-brand-border bg-brand-card rounded-brand-card p-6 hover:shadow-md transition-shadow">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-brand-secondary rounded-full flex items-center justify-center">
                             {getStatusIcon(order.status)}
                           </div>
                           <div>
                             <p className="text-sm font-black text-brand-foreground uppercase tracking-tight">Pedido #{order.codigo}</p>
                             <p className="text-[10px] text-brand-muted font-bold uppercase">{new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] text-brand-muted font-black uppercase tracking-widest mb-1">Status</p>
                           <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                             order.status === 'pago' ? 'bg-[var(--store-highlight)]/10 text-[var(--store-highlight)]' : 
                             order.status === 'cancelado' ? 'bg-[var(--store-primary)]/10 text-[var(--store-primary)]' : 'bg-[var(--store-highlight)]/5 text-[var(--store-highlight)]/70'
                           }`}>
                             {order.status}
                           </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-6">
                        {order.itens.slice(0, 3).map((item: any, idx: number) => (
                          <div key={idx} className="w-12 h-16 bg-brand-secondary rounded border border-brand-border overflow-hidden shrink-0">
                            <img 
                              src={item.imagem || 'https://via.placeholder.com/150?text=Sem+Imagem'} 
                              className="w-full h-full object-cover" 
                              alt={item.nome} 
                            />
                          </div>
                        ))}
                        {order.itens.length > 3 && (
                          <div className="w-12 h-16 bg-brand-secondary rounded flex items-center justify-center text-[10px] font-black text-brand-muted">
                            +{order.itens.length - 3}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-6 border-t border-brand-border">
                        <p className="text-sm font-black text-brand-primary uppercase tracking-tight">Total: R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <Link 
                          to={`/checkout/sucesso?id=${order.id}`}
                          className="text-[10px] font-black text-brand-muted uppercase tracking-widest hover:text-brand-primary transition-colors flex items-center gap-1"
                        >
                          Ver detalhes do pedido <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
};

export default MyOrdersPage;