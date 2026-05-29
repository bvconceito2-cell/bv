import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Search, ShoppingBag, User, Heart, Menu, X, ChevronRight, Phone } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CartDrawer } from './CartDrawer';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

const Instagram = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const Facebook = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const TopBar = () => {
  const { homeSections }: any = useStore();
  const section = homeSections?.find((s: any) => s.chave === 'top_bar');
  
  if (section && !section.visivel) return null;

  return (
    <div 
      className="h-9 flex items-center justify-center text-[11px] md:text-[13px] font-semibold tracking-wide px-4 text-center"
      style={{ 
        backgroundColor: section?.config?.cor_fundo || 'var(--store-primary)',
        color: section?.config?.cor_texto || 'var(--store-button-text)'
      }}
    >
      {section?.config?.texto || '✨ FRETE GRÁTIS acima de R$199 · Parcele em até 5x sem juros'}
    </div>
  );
};

const Header = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { config, cart, setCartDrawerOpen, appearance }: any = useStore();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setTimeout(() => {
        navigate(`/category/search?q=${encodeURIComponent(searchTerm)}`);
        setSearchTerm('');
      }, 100);
    }
  };

  const cartCount = cart.reduce((acc: any, item: any) => acc + item.quantity, 0);

  const getFirstName = (fullName: string | undefined | null) => {
    if (!fullName) return 'CONTA';
    return fullName.split(' ')[0].toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm border-b border-gray-200 min-h-[60px]">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-3 lg:py-5 flex items-center justify-between gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden text-black p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        <Link 
          to="/" 
          className="text-black flex flex-col items-start group transition-all duration-300 shrink-0"
          style={{ 
            fontFamily: 'var(--store-font-primary)',
            fontWeight: 'var(--store-font-weight-menu)',
            letterSpacing: 'var(--store-header-spacing)',
            textTransform: 'var(--store-header-transform)' as any
          }}
        >
          {appearance?.logo_url ? (
            <img 
              src={appearance.logo_url} 
              alt={config?.nome_loja || "Logo"} 
              style={{
                width: appearance?.config_logo?.desktop ? `${appearance.config_logo.desktop}px` : 'auto',
                maxWidth: '100%',
                height: 'auto',
                objectFit: 'contain'
              }}
              className="w-auto h-auto max-h-[120px] transition-all duration-300 hidden lg:block"
            />
          ) : (
            <div className="flex flex-col items-center lg:items-start hidden lg:flex">
              <span className="text-lg md:text-xl lg:text-2xl leading-tight" style={{ fontFamily: 'inherit', fontWeight: 'var(--store-font-weight-title)', letterSpacing: 'var(--store-header-spacing)', textTransform: 'var(--store-header-transform)' as any }}>
                {config?.nome_loja?.toUpperCase() || "LOJA"}
              </span>
              <span className="text-[7px] lg:text-[9px] opacity-70 -mt-0.5" style={{ fontFamily: 'inherit', fontWeight: 'var(--store-font-weight-title)', letterSpacing: 'var(--store-header-spacing)', textTransform: 'var(--store-header-transform)' as any }}>
                {config?.tagline?.toUpperCase() || "SUA LOJA"}
              </span>
            </div>
          )}

          {appearance?.logo_url ? (
            <img 
              src={appearance.logo_url} 
              alt={config?.nome_loja || "Logo"} 
              style={{
                width: appearance?.config_logo?.mobile ? `${appearance.config_logo.mobile}px` : 'auto',
                maxWidth: '100%',
                height: 'auto',
                objectFit: 'contain'
              }}
              className="w-auto h-auto max-h-[80px] transition-all duration-300 lg:hidden"
            />
          ) : (
            <div className="flex flex-col items-center lg:items-start lg:hidden">
              <span className="text-lg leading-tight" style={{ fontFamily: 'inherit', fontWeight: 'var(--store-font-weight-title)', letterSpacing: 'var(--store-header-spacing)', textTransform: 'var(--store-header-transform)' as any }}>
                {config?.nome_loja?.toUpperCase() || "LOJA"}
              </span>
              <span className="text-[7px] opacity-70 -mt-0.5" style={{ fontFamily: 'inherit', fontWeight: 'var(--store-font-weight-title)', letterSpacing: 'var(--store-header-spacing)', textTransform: 'var(--store-header-transform)' as any }}>
                {config?.tagline?.toUpperCase() || "SUA LOJA"}
              </span>
            </div>
          )}
        </Link>

        <div className="flex-1 max-w-[500px] hidden lg:block mx-8">
          <form onSubmit={handleSearch} className="search-wrapper">
            <input 
              type="text" 
              placeholder="O que você está procurando?"
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="search-button" aria-label="Buscar">
              <Search />
            </button>
          </form>
        </div>

        <div className="flex items-center gap-2 md:gap-4 lg:gap-8 text-black shrink-0">
          <Link to={user ? "/minha-conta" : "/login"} className="flex flex-col items-center gap-1 group transition-all duration-200">
            <User className="h-5 w-5 lg:h-6 lg:w-6 group-hover:scale-110 transition-transform" />
            <span className="text-[8px] lg:text-[10px] text-black opacity-90 hidden sm:block"
              style={{ 
                fontFamily: 'inherit',
                fontWeight: 'var(--store-font-weight-menu)',
                letterSpacing: 'var(--store-header-spacing)',
                textTransform: 'var(--store-header-transform)' as any
              }}
            >
              {user ? getFirstName(user.user_metadata?.full_name) : 'LOGIN'}
            </span>
          </Link>

          <Link to="/favoritos" className="flex flex-col items-center gap-1 group transition-all duration-200 hidden sm:flex">
            <Heart className="h-5 w-5 lg:h-6 lg:w-6 group-hover:scale-110 transition-transform" />
            <span className="text-[8px] lg:text-[10px] text-black opacity-90"
              style={{ 
                fontFamily: 'inherit',
                fontWeight: 'var(--store-font-weight-menu)',
                letterSpacing: 'var(--store-header-spacing)',
                textTransform: 'var(--store-header-transform)' as any
              }}
            >FAVORITOS</span>
          </Link>

          <button 
            onClick={() => setCartDrawerOpen(true)}
            className="flex flex-col items-center gap-1 group transition-all duration-200"
          >
            <div className="relative">
              <ShoppingBag className="h-5 w-5 lg:h-6 lg:w-6 group-hover:scale-110 transition-transform" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2.5 bg-brand-primary text-brand-primary-foreground text-[9px] lg:text-[10px] font-black h-4 w-4 lg:h-5 lg:w-5 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-[8px] lg:text-[10px] text-black opacity-90 hidden sm:block"
              style={{ 
                fontFamily: 'inherit',
                fontWeight: 'var(--store-font-weight-menu)',
                letterSpacing: 'var(--store-header-spacing)',
                textTransform: 'var(--store-header-transform)' as any
              }}
            >SACOLA</span>
          </button>
        </div>
      </div>

      <div className="px-4 pb-4 lg:hidden bg-white">
        <form onSubmit={handleSearch} className="search-wrapper">
          <input 
            type="text" 
            placeholder="Busque na loja..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="search-button" aria-label="Buscar">
            <Search />
          </button>
        </form>
      </div>
    </header>
  );
};

const MobileMenu = ({ isOpen, onClose, categories }: any) => {
  const { config } = useStore();
  const { user } = useAuth();
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-brand-background z-[70] shadow-2xl flex flex-col"
          >
            <div className="p-6 bg-[var(--header-background)] text-[var(--header-foreground)] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">Bem-vindo(a)</p>
                <p className="font-black text-lg tracking-tight truncate">
                  {user ? user.user_metadata?.full_name : 'Fazer Login'}
                </p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-6">
              <div className="px-6 mb-8">
                <h3 className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-4">Categorias</h3>
                <nav className="flex flex-col gap-1">
                  {categories.map((cat: any) => (
                    <Link
                      key={cat.id}
                      to={`/category/${cat.slug}`}
                      onClick={onClose}
                      className="flex items-center justify-between py-4 border-b border-brand-border text-sm font-bold text-brand-foreground hover:text-brand-primary group"
                    >
                      {cat.nome}
                      <ChevronRight className="h-4 w-4 text-brand-muted group-hover:text-brand-primary transition-colors" />
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="px-6 space-y-4">
                <h3 className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-4">Minha Conta</h3>
                <Link to="/minha-conta" onClick={onClose} className="flex items-center gap-3 text-sm font-bold text-brand-foreground hover:text-brand-primary">
                  <User className="h-5 w-5" /> Perfil e Pedidos
                </Link>
                <Link to="/favoritos" onClick={onClose} className="flex items-center gap-3 text-sm font-bold text-brand-foreground hover:text-brand-primary">
                  <Heart className="h-5 w-5" /> Meus Favoritos
                </Link>
              </div>
            </div>

            <div className="p-6 bg-brand-primary/5 border-t border-brand-border mt-auto">
              <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-4">Precisando de ajuda?</p>
              <a 
                href={`https://wa.me/${((config as any)?.whatsapp || (config as any)?.contato?.whatsapp || '').replace(/\D/g, '')}`} 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white py-4 rounded-lg font-black text-xs uppercase tracking-widest shadow-lg shadow-green-100 hover:opacity-90 transition-opacity"
              >
                <Phone className="h-4 w-4" /> Suporte WhatsApp
              </a>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const NavigationMenu = () => {
  const { categories }: any = useStore();
  const location = useLocation();
  const activeCategories = categories?.filter((cat: any) => cat.ativo) || [];

  return (
    <nav className="bg-brand-background border-b border-brand-border hidden lg:block overflow-x-auto no-scrollbar">
      <div className="max-w-[1400px] mx-auto px-8 flex items-center justify-center gap-2">
        {activeCategories.map((cat: any) => (
          <Link 
            key={cat.id} 
            to={`/category/${cat.slug}`}
            className={cn(
              "px-6 py-5 transition-all duration-200 border-b-2",
              location.pathname === `/category/${cat.slug}` 
                ? "text-brand-primary border-brand-primary bg-brand-primary/5" 
                : "text-brand-muted border-transparent hover:text-brand-primary hover:bg-brand-primary/5"
            )}
            style={{ 
              fontFamily: 'inherit',
              fontWeight: 'var(--store-font-weight-menu)',
              letterSpacing: 'var(--store-header-spacing)',
              textTransform: 'var(--store-header-transform)' as any,
              fontSize: 'var(--store-header-size)'
            }}
          >
            {cat.nome}
          </Link>
        ))}
      </div>
    </nav>
  );
};

const Footer = () => {
  const { config, categories, pages }: any = useStore();
  const activeCategories = categories?.filter((cat: any) => cat.ativo).slice(0, 8) || [];
  const institutionalPages = pages || [];

  return (
    <footer className="pt-16 pb-8 border-t border-brand-border bg-[var(--footer-background)] text-[var(--footer-foreground)]">
      <div className="max-w-[1400px] mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
        <div>
          <h4 className="font-bold text-sm mb-4 uppercase tracking-tight text-inherit">INSTITUCIONAL</h4>
          <ul className="text-sm text-brand-muted space-y-2">
            {institutionalPages.map((page: any) => (
              <li key={page.id} className="hover:text-brand-primary cursor-pointer transition-colors duration-200">
                <Link to={`/pagina/${page.slug}`}>{page.titulo}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-sm mb-4 uppercase tracking-tight text-inherit">ATENDIMENTO</h4>
          <ul className="text-sm text-brand-muted space-y-2">
            <li className="hover:text-brand-primary cursor-pointer transition-colors duration-200">
              <Link to="/minha-conta">Central de Ajuda</Link>
            </li>
            <li className="hover:text-brand-primary cursor-pointer transition-colors duration-200">
              <Link to="/meus-pedidos">Acompanhar Pedido</Link>
            </li>
            <li className="hover:text-brand-primary cursor-pointer transition-colors duration-200">
              <Link to="/pagina/contato">Fale Conosco</Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-sm mb-4 uppercase tracking-tight text-inherit">CATEGORIAS</h4>
          <ul className="text-sm text-brand-muted space-y-2">
            {activeCategories.map((cat: any) => (
              <li key={cat.id} className="hover:text-brand-primary cursor-pointer transition-colors duration-200">
                <Link to={`/category/${cat.slug}`}>{cat.nome}</Link>
              </li>
            ))}
            {categories?.length > 8 && (
              <li className="hover:text-brand-primary cursor-pointer transition-colors duration-200 font-bold">
                <Link to="/">Ver todas →</Link>
              </li>
            )}
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-sm mb-4 uppercase tracking-tight text-inherit">REDES SOCIAIS</h4>
          <div className="flex gap-4">
            {config?.instagram && (
              <a href={config.instagram} target="_blank" rel="noopener noreferrer" className="h-10 w-10 bg-brand-secondary rounded-full flex items-center justify-center hover:bg-brand-primary hover:text-brand-primary-foreground transition-all duration-200 text-inherit">
                <Instagram className="h-5 w-5" />
              </a>
            )}
            {config?.facebook && (
              <a href={config.facebook} target="_blank" rel="noopener noreferrer" className="h-10 w-10 bg-brand-secondary rounded-full flex items-center justify-center hover:bg-brand-primary hover:text-brand-primary-foreground transition-all duration-200 text-inherit">
                <Facebook className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="max-w-[1400px] mx-auto px-4 border-t border-brand-border pt-8 text-center">
        <p className="text-xs text-brand-muted font-medium tracking-tight">© {new Date().getFullYear()} {config?.nome_loja || 'Loja Virtual'}. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
};

export const Layout = ({ children }: any) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { categories }: any = useStore();
  const activeCategories = categories?.filter((cat: any) => cat.ativo) || [];

  return (
    <div className="store-theme min-h-screen flex flex-col selection:bg-brand-primary/20 selection:text-brand-foreground overflow-x-hidden">
      <TopBar />
      <Header onMenuClick={() => setMobileMenuOpen(true)} />
      <NavigationMenu />
      <MobileMenu 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
        categories={activeCategories}
      />
      <CartDrawer />
      <main className="flex-1 w-full max-w-full overflow-hidden">
        {children}
      </main>

      <Footer />
    </div>
  );
};
