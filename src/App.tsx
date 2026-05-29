import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

const HomePage = lazy(() => import('./pages/HomePage'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const InstitutionalPage = lazy(() => import('./pages/InstitutionalPage'));

const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const AccountPage = lazy(() => import('./pages/user/AccountPage'));
const MyOrdersPage = lazy(() => import('./pages/user/MyOrdersPage'));
const FavoritesPage = lazy(() => import('./pages/user/FavoritesPage'));

const AdminLogin = lazy(() => import('./pages/admin/Login'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const ProductList = lazy(() => import('./pages/admin/produtos/ProductList'));
const ProductForm = lazy(() => import('./pages/admin/produtos/ProductForm'));
const ImportProducts = lazy(() => import('./pages/admin/produtos/ImportProducts'));

const CategoryList = lazy(() => import('./pages/admin/categorias/CategoryList'));
const OrderList = lazy(() => import('./pages/admin/pedidos/OrderList'));
const OrderDetail = lazy(() => import('./pages/admin/pedidos/OrderDetail'));

const ClientList = lazy(() => import('./pages/admin/clientes/ClientList'));
const ClientProfile = lazy(() => import('./pages/admin/clientes/ClientProfile'));

const CRMDashboard = lazy(() => import('./pages/admin/crm/CRMDashboard'));
const Appearance = lazy(() => import('./pages/admin/aparencia/Appearance'));
const Integrations = lazy(() => import('./pages/admin/integracoes/Integrations'));
const Settings = lazy(() => import('./pages/admin/configuracoes/Settings'));
const CouponList = lazy(() => import('./pages/admin/marketing/CouponList'));
const Marketing = lazy(() => import('./pages/admin/marketing/Marketing'));
const BannerList = lazy(() => import('./pages/admin/banners/BannerList'));
const HeroBanners = lazy(() => import('./pages/admin/banners/HeroBanners'));
const EditorialBanner = lazy(() => import('./pages/admin/banners/EditorialBanner'));
const CategoryBanners = lazy(() => import('./pages/admin/banners/CategoryBanners'));

const HomeSections = lazy(() => import('./pages/admin/secoes/HomeSections'));
const Reports = lazy(() => import('./pages/admin/relatorios/Reports'));
const SystemLogs = lazy(() => import('./pages/admin/SystemLogs'));
const MonitoringPage = lazy(() => import('./pages/admin/MonitoringPage'));
const TemplateDiagnostic = lazy(() => import('./pages/admin/Diagnostic'));
const MelhorEnvioCallback = lazy(() => import('./pages/admin/integracoes/MelhorEnvioCallback'));
const InstitutionalPages = lazy(() => import('./pages/admin/paginas/InstitutionalPages'));

import AdminLayout from './components/admin/layout/AdminLayout';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedAdminRoute } from './components/admin/ProtectedAdminRoute';
import { ProtectedUserRoute } from './components/auth/ProtectedUserRoute';
import { ScrollToTop } from './components/layout/ScrollToTop';
import { Loader2 } from 'lucide-react';

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
  </div>
);

const StoreShell = ({ children }: { children: React.ReactNode }) => (
  <div className="store-theme min-h-screen">
    {children}
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Toaster position="top-right" expand={true} richColors />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<StoreShell><HomePage /></StoreShell>} />
            <Route path="/produto/:id" element={<StoreShell><ProductPage /></StoreShell>} />
            <Route path="/category/:id" element={<StoreShell><CategoryPage /></StoreShell>} />
            <Route path="/carrinho" element={<StoreShell><CartPage /></StoreShell>} />
            <Route path="/pagina/:slug" element={<StoreShell><InstitutionalPage /></StoreShell>} />

            <Route path="/login" element={<StoreShell><LoginPage /></StoreShell>} />
            <Route path="/cadastro" element={<StoreShell><RegisterPage /></StoreShell>} />

            <Route path="/minha-conta" element={<StoreShell><ProtectedUserRoute><AccountPage /></ProtectedUserRoute></StoreShell>} />
            <Route path="/meus-pedidos" element={<StoreShell><ProtectedUserRoute><MyOrdersPage /></ProtectedUserRoute></StoreShell>} />
            <Route path="/favoritos" element={<StoreShell><FavoritesPage /></StoreShell>} />

            <Route path="/checkout" element={<StoreShell><CheckoutPage /></StoreShell>} />
            <Route path="/checkout/sucesso" element={<StoreShell><CheckoutPage /></StoreShell>} />
            <Route path="/checkout/pendente" element={<StoreShell><CheckoutPage /></StoreShell>} />
            <Route path="/checkout/erro" element={<StoreShell><CheckoutPage /></StoreShell>} />

            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<Navigate to="/admin/login" replace />} />

            <Route path="/admin/dashboard" element={<ProtectedAdminRoute><AdminLayout><AdminDashboard /></AdminLayout></ProtectedAdminRoute>} />
            <Route path="/admin/produtos" element={<ProtectedAdminRoute><AdminLayout><ProductList /></AdminLayout></ProtectedAdminRoute>} />
            <Route path="/admin/produtos/novo" element={<ProtectedAdminRoute><AdminLayout><ProductForm /></AdminLayout></ProtectedAdminRoute>} />
            <Route path="/admin/produtos/:id" element={<ProtectedAdminRoute><AdminLayout><ProductForm /></AdminLayout></ProtectedAdminRoute>} />
            <Route path="/admin/importar-produtos" element={<ProtectedAdminRoute><AdminLayout><ImportProducts /></AdminLayout></ProtectedAdminRoute>} />

            <Route path="/admin/categorias" element={<ProtectedAdminRoute><AdminLayout><CategoryList /></AdminLayout></ProtectedAdminRoute>} />
            <Route path="/admin/pedidos" element={<ProtectedAdminRoute><AdminLayout><OrderList /></AdminLayout></ProtectedAdminRoute>} />
            <Route path="/admin/pedidos/:id" element={<ProtectedAdminRoute><AdminLayout><OrderDetail /></AdminLayout></ProtectedAdminRoute>} />

            <Route path="/admin/clientes" element={<ProtectedAdminRoute><AdminLayout><ClientList /></AdminLayout></ProtectedAdminRoute>} />
            <Route path="/admin/clientes/:id" element={<ProtectedAdminRoute><AdminLayout><ClientProfile /></AdminLayout></ProtectedAdminRoute>} />

            <Route path="/admin/crm" element={<ProtectedAdminRoute><AdminLayout><CRMDashboard /></AdminLayout></ProtectedAdminRoute>} />
            <Route path="/admin/banners" element={<ProtectedAdminRoute><AdminLayout><BannerList /></AdminLayout></ProtectedAdminRoute>} />
            <Route path="/admin/banners/hero" element={<ProtectedAdminRoute><AdminLayout><HeroBanners /></AdminLayout></ProtectedAdminRoute>} />
            <Route path="/admin/banners/editorial" element={<ProtectedAdminRoute><AdminLayout><EditorialBanner /></AdminLayout></ProtectedAdminRoute>} />
            <Route path="/admin/banners/categorias" element={<ProtectedAdminRoute><AdminLayout><CategoryBanners /></AdminLayout></ProtectedAdminRoute>} />

            <Route path="/admin/secoes" element={<ProtectedAdminRoute><AdminLayout><HomeSections /></AdminLayout></ProtectedAdminRoute>} />
            <Route path="/admin/paginas" element={<ProtectedAdminRoute><AdminLayout><InstitutionalPages /></AdminLayout></ProtectedAdminRoute>} />
            <Route path="/admin/aparencia" element={<ProtectedAdminRoute><AdminLayout><Appearance /></AdminLayout></ProtectedAdminRoute>} />
            <Route path="/admin/marketing" element={<ProtectedAdminRoute><AdminLayout><Marketing /></AdminLayout></ProtectedAdminRoute>} />
            <Route path="/admin/cupons" element={<ProtectedAdminRoute><AdminLayout><CouponList /></AdminLayout></ProtectedAdminRoute>} />
            <Route path="/admin/integracoes" element={<ProtectedAdminRoute><AdminLayout><Integrations /></AdminLayout></ProtectedAdminRoute>} />
            <Route path="/admin/integracoes/melhor-envio/callback" element={<MelhorEnvioCallback />} />
            <Route path="/admin/configuracoes" element={<ProtectedAdminRoute><AdminLayout><Settings /></AdminLayout></ProtectedAdminRoute>} />

            <Route path="/admin/relatorios" element={<ProtectedAdminRoute><AdminLayout><Reports /></AdminLayout></ProtectedAdminRoute>} />
            <Route path="/admin/diagnostico-template" element={<ProtectedAdminRoute><AdminLayout><TemplateDiagnostic /></AdminLayout></ProtectedAdminRoute>} />
            <Route path="/admin/logs" element={<ProtectedAdminRoute><AdminLayout><SystemLogs /></AdminLayout></ProtectedAdminRoute>} />
            <Route path="/admin/monitoramento" element={<ProtectedAdminRoute><AdminLayout><MonitoringPage /></AdminLayout></ProtectedAdminRoute>} />

            <Route path="*" element={<StoreShell><HomePage /></StoreShell>} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
