import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, ShoppingBag, CreditCard, Truck, Calendar, Clock, ShieldAlert, Download, CheckSquare, Square, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const OrderList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Todos os Status');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  const [stats, setStats] = useState({
    hoje: 0,
    pendentes: 0,
    faturar: 0,
    enviar: 0
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const toggleSelectOrder = (id: string) => {
    setSelectedOrders(prev => 
      prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (filteredOrders.length > 0 && selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(o => o.id));
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedOrders.length === 0) return;
    try {
      setIsBulkLoading(true);
      const { error } = await supabase
        .from('pedidos')
        .update({ status: newStatus })
        .in('id', selectedOrders as any);

      if (error) throw error;
      toast.success(`${selectedOrders.length} pedidos atualizados para ${newStatus}`);
      setSelectedOrders([]);
      fetchOrders();
    } catch (err: any) {
      toast.error('Erro na atualização em massa: ' + err.message);
    } finally {
      setIsBulkLoading(false);
    }
  };

  const exportOrdersCSV = () => {
    const headers = ['Código', 'Cliente', 'Email', 'Data', 'Total', 'Status'];
    const rows = filteredOrders.map(o => [
      o.codigo,
      o.cliente_nome,
      o.cliente_email,
      new Date(o.created_at).toLocaleDateString(),
      o.total.toFixed(2),
      o.status
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.body.appendChild(document.createElement("a"));
    link.href = URL.createObjectURL(blob);
    link.download = `pedidos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    document.body.removeChild(link);
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
      
      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = data?.filter(o => o.created_at.startsWith(today)) || [];
      const pendingOrders = data?.filter(o => o.status === 'Pendente') || [];
      const toInvoice = data?.filter(o => o.status_pagamento === 'pendente') || [];
      const toShip = data?.filter(o => o.status === 'Pagamento Aprovado' || o.status === 'Em separação') || [];

      setStats({
        hoje: todayOrders.length,
        pendentes: pendingOrders.length,
        faturar: toInvoice.reduce((acc, o) => acc + o.total, 0),
        enviar: toShip.length
      });

    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast.error('Erro ao carregar pedidos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId: string, statusPagamento: string) => {
    const isPaid = statusPagamento?.toLowerCase() === 'aprovado' || statusPagamento?.toLowerCase() === 'pago';
    
    const confirmMessage = isPaid 
      ? 'Este pedido já foi pago. Tem certeza que deseja excluir?' 
      : 'Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.';

    if (!window.confirm(confirmMessage)) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('pedidos')
        .delete()
        .eq('id', parseInt(orderId));

      if (error) throw error;

      toast.success('Pedido excluído com sucesso!');
      fetchOrders();
    } catch (error: any) {
      toast.error('Erro ao excluir pedido: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pendente': return 'bg-amber-50 text-amber-600';
      case 'pago': return 'bg-green-50 text-green-600';
      case 'em separação': return 'bg-blue-50 text-blue-600';
      case 'enviado': return 'bg-purple-50 text-purple-600';
      case 'entregue': return 'bg-emerald-50 text-emerald-600';
      case 'cancelado': return 'bg-red-50 text-red-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'Todos os Status' || order.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch = searchTerm === '' || 
      order.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      order.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.cliente_email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pedidos</h1>
          <p className="text-sm text-gray-500">Acompanhe e gerencie as vendas da sua loja.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/admin/debug-pagamentos')}
            className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-xs font-black uppercase hover:bg-amber-100 transition-all shadow-sm"
          >
            <ShieldAlert className="h-4 w-4" /> Debug Pagamentos
          </button>
          <button 
            onClick={fetchOrders}
            className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-400 hover:text-brand-primary"
            title="Recarregar"
          >
            <Clock className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>


      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Hoje', value: stats.hoje, icon: Calendar, color: 'text-blue-600' },
          { label: 'Pendentes', value: stats.pendentes, icon: ShoppingBag, color: 'text-amber-600' },
          { label: 'A faturar', value: `R$ ${stats.faturar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: CreditCard, color: 'text-green-600' },
          { label: 'Para enviar', value: stats.enviar, icon: Truck, color: 'text-purple-600' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`p-2 rounded-lg bg-gray-50`}>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</p>
              <p className="text-lg font-bold text-gray-800">{item.value}</p>
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
            placeholder="Buscar por código ou nome do cliente..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            className="px-4 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium border-none focus:ring-2 focus:ring-brand-primary/10"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>Todos os Status</option>
            <option value="pendente">Pendente</option>
            <option value="pago">Pago</option>
            <option value="em separação">Em separação</option>
            <option value="enviado">Enviado</option>
            <option value="entregue">Entregue</option>
            <option value="cancelado">Cancelado</option>
          </select>
          <button 
            onClick={exportOrdersCSV}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold uppercase tracking-tight hover:bg-black transition-all shadow-sm"
          >
            <Download className="h-4 w-4" /> Exportar
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedOrders.length > 0 && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="bg-brand-primary p-4 rounded-xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 sticky top-4 z-30"
          >
            <div className="flex items-center gap-4 text-white">
              <span className="text-xs font-black uppercase tracking-widest">{selectedOrders.length} Selecionados</span>
              <button onClick={() => setSelectedOrders([])} className="text-[10px] uppercase font-bold text-brand-secondary underline">Cancelar</button>
            </div>
            <div className="flex gap-2">
              <select 
                disabled={isBulkLoading}
                className="bg-white/10 border border-white/20 text-white text-xs font-bold px-4 py-2 rounded-lg outline-none focus:bg-white/20"
                onChange={(e) => handleBulkStatusUpdate(e.target.value)}
                value=""
              >
                <option value="" className="text-gray-900">Alterar Status para...</option>
                <option value="pago" className="text-gray-900">Pago</option>
                <option value="em separação" className="text-gray-900">Em separação</option>
                <option value="enviado" className="text-gray-900">Enviado</option>
                <option value="cancelado" className="text-gray-900 text-red-500">Cancelado</option>
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 w-10">
                  <button onClick={toggleSelectAll} className="text-gray-300 hover:text-brand-primary">
                    {selectedOrders.length === filteredOrders.length && filteredOrders.length > 0 ? <CheckSquare className="h-4 w-4 text-brand-primary" /> : <Square className="h-4 w-4" />}
                  </button>
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pedido</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cliente</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Data</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pagamento</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Ações</th>

              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Clock className="h-8 w-8 text-gray-200 animate-spin" />
                      <p className="text-sm text-gray-400 font-medium">Carregando pedidos...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <ShoppingBag className="h-8 w-8 text-gray-200" />
                      <p className="text-sm text-gray-400 font-medium">Nenhum pedido encontrado.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr 
                    key={order.id} 
                    className="hover:bg-gray-50/50 transition-all cursor-pointer group"
                    onClick={() => navigate(`/admin/pedidos/${order.id}`)}
                  >
                    <td className="px-6 py-4" onClick={(e) => { e.stopPropagation(); toggleSelectOrder(order.id); }}>
                      <button className="text-gray-300 hover:text-brand-primary">
                        {selectedOrders.includes(order.id) ? <CheckSquare className="h-4 w-4 text-brand-primary" /> : <Square className="h-4 w-4" />}
                      </button>
                    </td>

                    <td className="px-6 py-4 text-sm font-bold text-brand-primary">#{order.codigo}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-800">{order.cliente_nome}</p>
                      <p className="text-[10px] text-gray-400">{order.cliente_email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-500 font-medium">{new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
                      <p className="text-[10px] text-gray-400">{new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-800">R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4">
                       <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                         order.status_pagamento === 'aprovado' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                       }`}>
                         {order.forma_pagamento}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate(`/admin/pedidos/${order.id}`); }}
                          className="p-2 text-gray-300 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-all"
                          title="Ver Detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteOrder(order.id, order.status_pagamento); }}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Excluir Pedido"
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

export default OrderList;
