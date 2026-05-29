import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Target, ShoppingBag, Loader2, Search, Filter, Mail, Phone, ChevronRight, Eye } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const CRMDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<any>({
    totalClientes: 0,
    clientesVIP: 0,
    ticketMedio: 0,
    clientesNovos: 0,
    totalVendas: 0,
    segmentos: []
  });

  useEffect(() => {
    fetchCRMData();
  }, []);

  const fetchCRMData = async () => {
    try {
      setLoading(true);
      const { data: dbClientes, error } = await supabase.from('clientes').select('*');
      if (error) throw error;

      setClientes(dbClientes || []);

      const total = dbClientes.length;
      const vip = dbClientes.filter(c => c.segmento?.toLowerCase() === 'vip').length;
      const novos = dbClientes.filter(c => {
        const data = new Date(c.created_at);
        const trintaDiasAtras = new Date();
        trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
        return data > trintaDiasAtras;
      }).length;

      const totalGasto = dbClientes.reduce((acc, c) => acc + Number(c.total_gasto || 0), 0);

      setStats({
        totalClientes: total,
        clientesVIP: vip,
        clientesNovos: novos,
        totalVendas: totalGasto,
        ticketMedio: total > 0 ? totalGasto / total : 0,
        segmentos: [
          { name: 'VIP', count: vip, color: 'bg-purple-600' },
          { name: 'Recentes', count: dbClientes.filter(c => c.segmento?.toLowerCase() === 'recente').length, color: 'bg-blue-600' },
          { name: 'Em Risco', count: dbClientes.filter(c => c.segmento?.toLowerCase() === 'em risco').length, color: 'bg-amber-500' },
          { name: 'Inativos', count: dbClientes.filter(c => c.segmento?.toLowerCase() === 'inativo').length, color: 'bg-red-500' },
          { name: 'Novos', count: dbClientes.filter(c => !c.segmento || c.segmento?.toLowerCase() === 'novo').length, color: 'bg-gray-400' },
        ]
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClientes = clientes.filter(c => 
    c.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5); // Mostra apenas 5 no dashboard


  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-[#04548c]" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Inteligência CRM</h1>
          <p className="text-sm text-gray-500 font-medium">Gestão estratégica da base de clientes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Clientes', value: stats.totalClientes, icon: Users, color: 'text-blue-600', sub: 'Na base total' },
          { label: 'Clientes VIP', value: stats.clientesVIP, icon: Target, color: 'text-purple-600', sub: 'Alto valor' },
          { label: 'Novos (30d)', value: stats.clientesNovos, icon: ShoppingBag, color: 'text-orange-500', sub: 'Crescimento' },
          { label: 'Ticket Médio', value: `R$ ${stats.ticketMedio.toFixed(2)}`, icon: TrendingUp, color: 'text-green-600', sub: 'Por cliente' },
        ].map((item, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={idx} 
            className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-gray-50 rounded-lg">
                <item.icon className={`h-4 w-4 ${item.color}`} />
              </div>
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
            <h3 className="text-xl font-black text-gray-800">{item.value}</h3>
            <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">{item.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Distribuição por Segmento */}
        <div className="lg:col-span-1 bg-white p-8 rounded-xl border border-gray-100 shadow-sm space-y-8">
          <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest border-b border-gray-50 pb-4">Segmentação da Base</h3>
          <div className="space-y-6">
            {stats.segmentos.map((s: any) => (
              <div key={s.name} className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-tight">
                  <span className="text-gray-600">{s.name}</span>
                  <span className="text-gray-400">{s.count} clientes</span>
                </div>
                <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.totalClientes > 0 ? (s.count / stats.totalClientes) * 100 : 0}%` }}
                    className={`h-full ${s.color} rounded-full`} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Últimos Leads / Clientes */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest">Leads & Clientes Recentes</h3>
            <button onClick={() => navigate('/admin/clientes')} className="text-[10px] font-black text-brand-primary uppercase hover:underline">Ver Todos</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase">Cliente</th>
                  <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase text-center">Pedidos</th>
                  <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase text-right">Total Gasto</th>
                  <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredClientes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400 text-[10px] font-bold uppercase">Nenhuma cliente encontrada.</td>
                  </tr>
                ) : (
                  filteredClientes.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-all cursor-pointer group" onClick={() => navigate(`/admin/clientes/${c.id}`)}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-brand-secondary/20 flex items-center justify-center text-brand-primary font-black text-[10px] uppercase">
                            {c.nome[0]}
                          </div>
                          <div>
                            <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{c.nome}</p>
                            <p className="text-[9px] text-gray-400 font-bold">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[10px] font-black text-gray-400 text-center">{c.total_pedidos || 0}</td>
                      <td className="px-6 py-4 text-xs font-black text-brand-primary text-right">R$ {(c.total_gasto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 text-center">
                        <button className="p-2 text-gray-300 group-hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-all">
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

  );
};

export default CRMDashboard;