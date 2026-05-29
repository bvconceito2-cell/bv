import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { supabase } from "@/integrations/supabase/client";
import { useStore } from '../../store/useStore';
import { toast } from 'sonner';
import { Mail, Lock, User, Loader2, ArrowRight, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { config }: any = useStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não conferem');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.nome
          }
        }
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Create profile in profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: formData.email,
            role: 'customer'
          } as any);

        
        if (profileError) console.error('Error creating profile:', profileError);
      }

      toast.success('Conta criada com sucesso! Verifique seu e-mail.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
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
            <h1 className="text-3xl font-black uppercase tracking-tight text-brand-foreground mb-2">Cadastro</h1>
            <p className="text-sm text-brand-muted font-medium">Junte-se à {config?.nome_loja || 'nossa loja'} e aproveite benefícios exclusivos</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase text-brand-muted tracking-widest ml-1">Nome Completo</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted group-focus-within:text-brand-primary transition-colors" />
                <input 
                  required 
                  type="text" 
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  className="w-full bg-brand-secondary border border-brand-border rounded-brand-button pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all shadow-inner text-brand-foreground placeholder:text-brand-muted"
                  placeholder="Seu nome"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase text-brand-muted tracking-widest ml-1">E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted group-focus-within:text-brand-primary transition-colors" />
                <input 
                  required 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-brand-secondary border border-brand-border rounded-brand-button pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all shadow-inner text-brand-foreground placeholder:text-brand-muted"
                  placeholder="exemplo@email.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase text-brand-muted tracking-widest ml-1">Senha</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted group-focus-within:text-brand-primary transition-colors" />
                <input 
                  required 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-brand-secondary border border-brand-border rounded-brand-button pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all shadow-inner text-brand-foreground placeholder:text-brand-muted"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase text-brand-muted tracking-widest ml-1">Confirmar Senha</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted group-focus-within:text-brand-primary transition-colors" />
                <input 
                  required 
                  type="password" 
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className="w-full bg-brand-secondary border border-brand-border rounded-brand-button pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all shadow-inner text-brand-foreground placeholder:text-brand-muted"
                  placeholder="Repita sua senha"
                />
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full bg-brand-primary text-brand-primary-foreground py-5 mt-4 font-black uppercase tracking-[0.2em] rounded-brand-button shadow-xl shadow-brand-primary/10 flex items-center justify-center gap-3 hover:bg-brand-primary-hover active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>CADASTRAR <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <div className="mt-12 pt-10 border-t border-brand-border text-center">
            <p className="text-sm text-brand-muted font-medium mb-4">Já tem uma conta?</p>
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 text-sm font-black text-brand-primary uppercase tracking-widest hover:gap-3 transition-all group"
            >
              <ChevronRight className="h-4 w-4 rotate-180" /> Fazer Login
            </Link>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default RegisterPage;