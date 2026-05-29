import React from 'react';
import { useStore } from '../../store/useStore';
import { Layout } from '../../components/layout/Layout';
import { User, LogOut, ChevronRight, ShoppingBag, Heart, Trash2, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const FavoritesPage = () => {
  const navigate = useNavigate();
  const { products, favorites, toggleFavorite }: any = useStore();
  
  const favoriteProducts = products.filter((p: any) => favorites.includes(p.id));

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
            
            <Link to="/meus-pedidos" className="flex items-center justify-between p-4 hover:bg-brand-secondary text-brand-muted rounded-brand-button font-bold text-xs uppercase tracking-widest transition-all">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-4 w-4" /> Meus Pedidos
              </div>
              <ChevronRight className="h-4 w-4" />
            </Link>

            <div className="flex items-center justify-between p-4 bg-brand-primary/10 text-brand-primary rounded-brand-button font-bold text-xs uppercase tracking-widest transition-all">
              <div className="flex items-center gap-3">
                <Heart className="h-4 w-4" /> Favoritos
              </div>
              <ChevronRight className="h-4 w-4" />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="bg-brand-card p-8 rounded-brand-card border border-brand-border shadow-sm min-h-[600px]">
              <h1 className="text-2xl font-black uppercase tracking-tight text-brand-foreground mb-8 pb-4 border-b border-brand-border">Meus Favoritos</h1>
              
              {favoriteProducts.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-brand-border rounded-brand-card">
                  <Heart className="h-12 w-12 text-brand-muted/30 mx-auto mb-4" />
                  <p className="text-sm font-medium text-brand-muted mb-6">Você ainda não favoritou nenhum produto.</p>
                  <Link to="/" className="inline-block px-8 py-3 bg-brand-primary text-brand-primary-foreground font-black uppercase tracking-widest text-xs rounded-brand-button">Explorar produtos</Link>
                </div>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favoriteProducts.map((product: any) => (
                    <div key={product.id} className="group border border-brand-border rounded-brand-card overflow-hidden hover:shadow-lg transition-all bg-brand-card">
                      <div className="aspect-[3/4] relative overflow-hidden bg-brand-secondary">
                        <img 
                          src={product.main_image} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <button 
                          onClick={() => toggleFavorite(product.id)}
                          className="absolute top-4 right-4 h-10 w-10 bg-brand-background rounded-full flex items-center justify-center text-red-500 shadow-lg hover:scale-110 transition-transform"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="p-6">
                        <h3 className="text-sm font-bold text-brand-foreground uppercase tracking-tight line-clamp-1 mb-2">{product.name}</h3>
                        <p className="text-lg font-black text-brand-primary mb-6">R$ {product.price_current.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        
                        <div className="flex gap-2">
                           <button 
                             onClick={() => navigate(`/produto/${product.id}`)}
                             className="flex-1 bg-brand-foreground text-brand-background py-3 text-[10px] font-black uppercase tracking-widest rounded-brand-button hover:opacity-90 transition-all flex items-center justify-center gap-2"
                           >
                             VER PRODUTO <ArrowRight className="h-3 w-3" />
                           </button>
                        </div>
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

export default FavoritesPage;