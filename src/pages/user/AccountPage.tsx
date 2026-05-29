import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Layout } from '../../components/layout/Layout';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { User, Mail, Phone, MapPin, Loader2, Save, LogOut, ChevronRight, ShoppingBag, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const AccountPage = () => {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: ''
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      if (data) {
        setProfile(data);
        setFormData({
          nome: (data as any).nome || '',
          email: data.email || '',
          telefone: (data as any).telefone || '',
          cpf: (data as any).cpf || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nome: formData.nome,
          telefone: formData.telefone,
          cpf: formData.cpf
        } as any)

        .eq('id', user?.id);
      
      if (error) throw error;
      toast.success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Sidebar Navigation */}
          <aside className="w-full md:w-64 space-y-2">
            <div className="p-6 bg-brand-secondary rounded-brand-card mb-8">
              <div className="w-16 h-16 bg-brand-primary text-brand-primary-foreground rounded-full flex items-center justify-center text-2xl font-black mb-4 mx-auto">
                {formData.nome?.charAt(0).toUpperCase()}
              </div>
              <div className="text-center">
                <h2 className="text-sm font-black uppercase tracking-tight text-brand-foreground truncate">{formData.nome || 'Cliente'}</h2>
                <p className="text-[10px] text-brand-muted font-medium truncate">{formData.email}</p>
              </div>
            </div>

            <Link to="/minha-conta" className="flex items-center justify-between p-4 bg-brand-primary/10 text-brand-primary rounded-brand-button font-bold text-xs uppercase tracking-widest transition-all">
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

            <Link to="/favoritos" className="flex items-center justify-between p-4 hover:bg-brand-secondary text-brand-muted rounded-brand-button font-bold text-xs uppercase tracking-widest transition-all">
              <div className="flex items-center gap-3">
                <Heart className="h-4 w-4" /> Favoritos
              </div>
              <ChevronRight className="h-4 w-4" />
            </Link>

            <button 
              onClick={() => signOut()}
              className="w-full flex items-center justify-between p-4 hover:bg-[var(--store-highlight)]/10 text-[var(--store-highlight)] rounded-brand-button font-bold text-xs uppercase tracking-widest transition-all mt-8"
            >
              <div className="flex items-center gap-3">
                <LogOut className="h-4 w-4" /> Sair da Conta
              </div>
            </button>
          </aside>

          {/* Main Content */}
          <main className="flex-1 max-w-2xl">
            <div className="bg-brand-card p-8 rounded-brand-card border border-brand-border shadow-sm">
              <h1 className="text-2xl font-black uppercase tracking-tight text-brand-foreground mb-8 pb-4 border-b border-brand-border">Meus Dados</h1>
              
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black uppercase text-brand-muted mb-2 tracking-widest">Nome Completo</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted" />
                      <input 
                        required 
                        type="text" 
                        value={formData.nome}
                        onChange={(e) => setFormData({...formData, nome: e.target.value})}
                        className="w-full bg-brand-secondary border border-brand-border rounded-brand-button pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all text-brand-foreground placeholder:text-brand-muted"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-brand-muted mb-2 tracking-widest">E-mail</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted/30" />
                      <input 
                        disabled 
                        type="email" 
                        value={formData.email}
                        className="w-full bg-brand-secondary border border-brand-border rounded-brand-button pl-12 pr-4 py-3.5 text-sm text-brand-muted cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-brand-muted mb-2 tracking-widest">Telefone</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted" />
                      <input 
                        type="tel" 
                        value={formData.telefone}
                        onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                        className="w-full bg-brand-secondary border border-brand-border rounded-brand-button pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all text-brand-foreground placeholder:text-brand-muted"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-brand-muted mb-2 tracking-widest">CPF</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted" />
                      <input 
                        type="text" 
                        value={formData.cpf}
                        onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                        className="w-full bg-brand-secondary border border-brand-border rounded-brand-button pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all text-brand-foreground placeholder:text-brand-muted"
                        placeholder="000.000.000-00"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-brand-border">
                  <button 
                    disabled={loading}
                    className="w-full md:w-auto px-10 bg-brand-primary text-brand-primary-foreground py-4 font-black uppercase tracking-[0.2em] rounded-brand-button shadow-xl flex items-center justify-center gap-2 hover:bg-brand-primary-hover transition-all disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="h-4 w-4" /> SALVAR ALTERAÇÕES</>}
                  </button>
                </div>
              </form>
            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
};

export default AccountPage;