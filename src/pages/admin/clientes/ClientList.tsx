import React, { useState, useEffect } from 'react';
import { Search, Filter, User, Mail, Phone, ShoppingCart, TrendingUp, MoreHorizontal, UserCheck, UserX, Clock, Loader2, Eye, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";

import { Cliente } from '../../../types/database';

const ClientList = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Cliente[]>([]);
  const [stats, setStats] = useState({
    totalClientes: 0,
    compraramHoje: 0,
    ticketMedio: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      
      // Busca clientes
      const { data: clientsData, error: clientsError } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;
      setClients((clientsData as any) || []);

      // Busca estatísticas reais dos pedidos
      const today = new Date().toISOString().split('T')[0];
      const { data: ordersData, error: ordersError } = await supabase
        .from('pedidos')
        .select('total, created_at, status');

      if (ordersError) throw ordersError;

      const allOrders = ordersData || [];
      
      // Filtra pedidos válidos para ticket médio (exclui cancelados e pendentes)
      const validOrders = allOrders.filter(p => {
        const status = p.status?.toLowerCase();
        return status !== 'cancelado' && status !== 'pendente' && status !== 'erro';
      });

      const totalVendido = validOrders.reduce((acc, p) => acc + Number(p.total || 0), 0);
      const qtdPedidos = validOrders.length;
      
      // Filtra pedidos que compraram hoje (pagos ou aprovados)
      const compraramHojeCount = allOrders.filter(p => {
        const isToday = p.created_at?.startsWith(today);
        const status = p.status?.toLowerCase();
        const isValidStatus = ['pago', 'aprovado', 'entregue', 'enviado'].includes(status || '');
        return isToday && isValidStatus;
      }).length;

      setStats({
        totalClientes: clientsData?.length || 0,
        compraramHoje: compraramHojeCount,
        ticketMedio: qtdPedidos > 0 ? totalVendido / qtdPedidos : 0
      });

    } catch (error) {
      console.error('Error fetching clients and stats:', error);
      toast.error('Erro ao carregar dados reais');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', clientId);

      if (error) throw error;

      toast.success('Cliente excluído com sucesso!');
      fetchClients();
    } catch (error: any) {
      toast.error('Erro ao excluir cliente: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getSegmentColor = (segment: string) => {
    switch (segment?.toLowerCase()) {
      case 'vip': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'recente': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'em risco': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'inativo': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
          <p className="text-sm text-gray-500">Gerencie o relacionamento com as clientes da Loja.</p>
        </div>
      </div>

      {/* CRM Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Clientes', value: stats.totalClientes, icon: User, color: 'text-blue-600' },
          { label: 'Compraram hoje', value: stats.compraramHoje, icon: ShoppingCart, color: 'text-green-600' },
          { label: 'Ticket Médio', value: `R$ ${stats.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: 'text-[#8B3A6B]' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
              <h3 className="text-2xl font-bold text-gray-800">{item.value}</h3>
            </div>
            <div className={`p-3 rounded-xl bg-gray-50`}>
              <item.icon className={`h-6 w-6 ${item.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome, e-mail ou CPF..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-[#2D1B4E]/10"
          />
        </div>
        <div className="flex gap-2">
          <select className="px-4 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium border-none focus:ring-2 focus:ring-[#2D1B4E]/10">
            <option>Todos os Segmentos</option>
            <option>VIP</option>
            <option>Recentes</option>
            <option>Em Risco</option>
            <option>Inativos</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100">
            <Filter className="h-4 w-4" /> Filtros
          </button>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cliente</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contato</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pedidos</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Gasto</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Última Compra</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Segmento</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-brand-primary mx-auto mb-4" />
                    <p className="text-sm text-gray-400 font-medium uppercase tracking-widest">Carregando Clientes...</p>
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-gray-400">
                    Nenhuma cliente cadastrada no momento.
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr 
                    key={client.id} 
                    className="hover:bg-gray-50/50 transition-all cursor-pointer group"
                    onClick={() => navigate(`/admin/clientes/${client.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-brand-secondary/20 flex items-center justify-center text-brand-primary font-black text-sm uppercase">
                          {client.nome ? client.nome[0] : 'U'}
                        </div>
                        <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{client.nome}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-600 font-medium">{client.email}</p>
                      <p className="text-[10px] text-gray-400">{client.telefone || 'Sem telefone'}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-gray-400 text-center">{client.total_pedidos || 0}</td>
                    <td className="px-6 py-4 text-sm font-black text-brand-primary">R$ {(client.total_gasto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-500 font-medium">
                        {client.ultimo_pedido ? new Date(client.ultimo_pedido).toLocaleDateString('pt-BR') : '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase border ${getSegmentColor(client.segmento || 'Novo')}`}>
                        {client.segmento || 'Novo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate(`/admin/clientes/${client.id}`); }}
                          className="p-2 text-gray-300 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-all"
                          title="Ver Perfil"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteClient(client.id); }}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Excluir Cliente"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientList;
