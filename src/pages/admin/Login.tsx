import React, { useState, useEffect } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Check if there is an error in location state (from ProtectedAdminRoute)
    if (location.state && (location.state as any).error) {
      setErrorMsg((location.state as any).error);
    }
  }, [location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        
        // Double check admin profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, role')
          .eq('id', user.id)
          .maybeSingle();


        if (profileError) {
          throw profileError;
        }

        if (!profile) {
          await supabase.auth.signOut();
          setErrorMsg('Usuário autenticado, mas sem perfil admin cadastrado.');
          return;
        }

        if (profile.role !== 'admin') {
          await supabase.auth.signOut();
          setErrorMsg('Acesso negado. Apenas administradores podem acessar esta área.');
          return;
        }

        toast.success('Login realizado com sucesso!');
        navigate('/admin/dashboard');
      }
    } catch (error: any) {
      console.error('Erro de login:', error);
      setErrorMsg(error.message === 'Invalid login credentials' 
        ? 'E-mail ou senha incorretos.' 
        : error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-theme min-h-screen bg-[#034370] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#C9A96E] italic tracking-tighter mb-2">PAINEL ADMIN</h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#C9A96E]" /> Gestão da Loja
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-white/10">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Acesse sua conta</h2>
          
          {errorMsg && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-2 text-xs font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {errorMsg}
            </div>
          )}
          
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  type="email" 
                  placeholder="admin@exemplo.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#04548c]/10 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#04548c]/10 transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded text-[#04548c] focus:ring-[#04548c]" />
                <span className="text-xs text-gray-500 font-medium">Lembrar acesso</span>
              </label>
              <button type="button" className="text-xs font-bold text-[#04548c] hover:underline">Esqueceu a senha?</button>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#04548c] text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#034370] transition-all shadow-lg shadow-[#04548c]/20 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'ENTRAR NO PAINEL'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center mt-8 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
          &copy; {new Date().getFullYear()} LOJA VIRTUAL · TODOS OS DIREITOS RESERVADOS
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
