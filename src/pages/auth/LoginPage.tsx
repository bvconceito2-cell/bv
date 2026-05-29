import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { Mail, Lock, Loader2, ArrowRight, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const from = location.state?.from?.pathname || "/minha-conta";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      toast.success('Bem-vindo(a) de volta!');
      navigate(from, { replace: true });
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Informe seu e-mail para recuperar a senha');
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      toast.success('E-mail de recuperação enviado!');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto px-4 py-16 lg:py-24 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-brand-card p-8 lg:p-12 rounded-brand-card border border-brand-border shadow-2xl"
        >
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black uppercase tracking-tight text-brand-foreground mb-2">Login</h1>
            <p className="text-sm text-brand-muted font-medium">Acesse sua conta para gerenciar seus pedidos</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase text-brand-muted tracking-widest ml-1">E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted group-focus-within:text-brand-primary transition-colors" />
                <input 
                  required 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-brand-secondary border border-brand-border rounded-brand-button pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all shadow-inner text-brand-foreground placeholder:text-brand-muted"
                  placeholder="exemplo@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="block text-[10px] font-black uppercase text-brand-muted tracking-widest">Senha</label>
                <button 
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[9px] font-black text-brand-primary uppercase hover:underline tracking-tighter"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted group-focus-within:text-brand-primary transition-colors" />
                <input 
                  required 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-brand-secondary border border-brand-border rounded-brand-button pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all shadow-inner text-brand-foreground placeholder:text-brand-muted"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full bg-brand-primary text-brand-primary-foreground py-5 font-black uppercase tracking-[0.2em] rounded-brand-button shadow-xl shadow-brand-primary/10 flex items-center justify-center gap-3 hover:bg-brand-primary-hover active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>ENTRAR <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <div className="mt-12 pt-10 border-t border-brand-border text-center">
            <p className="text-sm text-brand-muted font-medium mb-4">Ainda não tem uma conta?</p>
            <Link 
              to="/cadastro" 
              className="inline-flex items-center gap-2 text-sm font-black text-brand-primary uppercase tracking-widest hover:gap-3 transition-all group"
            >
              Criar Conta Grátis <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default LoginPage;