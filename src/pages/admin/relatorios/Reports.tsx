import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart as PieChartIcon, 
  Download, 
  ArrowUpRight, 
  ShoppingBag, 
  Users, 
  Calendar, 
  Layers, 
  Loader2, 
  Filter, 
  ChevronDown,
  RefreshCw,
  FileDown,
  Ticket,
  Target
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

const COLORS = ['#04548c', '#1a0f2e', '#E8816A', '#34D399', '#FBBF24', '#F87171'];

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('30d'); // hoje, 7d, 30d, mes, tudo, custom
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [reportData, setReportData] = useState<any>({
    receitaTotal: 0,
    totalPedidos: 0,
    ticketMedio: 0,
    novasClientes: 0,
    totalDescontos: 0,
    vendasPorDia: [],
    statusDistribution: [],
    topProdutos: [],
    topClientes: [],
    cuponsPopulares: [],
    debug: {
      totalPedidosRaw: 0,
      totalProdutosRaw: 0,
      totalClientesRaw: 0,
      totalCuponsRaw: 0,
      periodo: { start: '', end: '' },
      receitaCalculada: 0,
      ticketMedioCalculado: 0,
      primeiroPedido: null,
      ultimoPedido: null,
      query: ''
    }
  });

  useEffect(() => {
    fetchReportData();
  }, [filter, dateRange]);

  const getDateRange = () => {
    if (filter === 'custom' && dateRange.start) {
      return { start: new Date(dateRange.start).toISOString(), end: dateRange.end ? new Date(dateRange.end).toISOString() : new Date().toISOString() };
    }

    const now = new Date();
    const start = new Date();
    
    switch (filter) {
      case 'hoje':
        start.setHours(0, 0, 0, 0);
        break;
      case '7d':
        start.setDate(now.getDate() - 7);
        break;
      case '30d':
        start.setDate(now.getDate() - 30);
        break;
      case 'mes':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
      default:
        return { start: null, end: null };
    }
    return { start: start.toISOString(), end: null };
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const { start, end } = getDateRange();
      
      let query = supabase.from('pedidos').select('*');
      let queryDescription = "SELECT * FROM pedidos";
      
      if (start) {
        query = query.gte('created_at', start);
        queryDescription += ` WHERE created_at >= '${start}'`;
      }
      if (end) {
        query = query.lte('created_at', end);
        queryDescription += start ? ` AND created_at <= '${end}'` : ` WHERE created_at <= '${end}'`;
      }
      
      const [pedidosRes, clientesRes, cuponsRes, produtosRes] = await Promise.all([
        query.order('created_at', { ascending: true }),
        supabase.from('clientes').select('nome, email, created_at'),
        supabase.from('cupons').select('*'),
        supabase.from('produtos').select('id')
      ]);

      const pedidos = pedidosRes.data || [];
      const validPedidos = pedidos.filter(p => p.status?.toLowerCase() !== 'cancelado');
      
      const receitaTotal = validPedidos.reduce((acc, p) => acc + Number(p.total || 0), 0);
      const totalPedidos = pedidos.length;
      const totalDescontos = validPedidos.reduce((acc, p) => acc + Number(p.desconto || 0), 0);
      
      // Vendas por Dia
      const salesMap = pedidos.reduce((acc: any, p) => {
        const date = new Date(p.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        if (!acc[date]) acc[date] = { name: date, total: 0, count: 0 };
        if (p.status?.toLowerCase() !== 'cancelado') acc[date].total += Number(p.total || 0);
        acc[date].count += 1;
        return acc;
      }, {});
      const vendasPorDia = Object.values(salesMap);

      // Status Distribution
      const statusMap = pedidos.reduce((acc: any, p) => {
        const status = p.status || 'Pendente';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      const statusDistribution = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

      // Top Clientes
      const clientMap = validPedidos.reduce((acc: any, p) => {
        if (!acc[p.cliente_email]) {
          acc[p.cliente_email] = { nome: p.cliente_nome, email: p.cliente_email, total: 0, pedidos: 0 };
        }
        acc[p.cliente_email].total += Number(p.total || 0);
        acc[p.cliente_email].pedidos += 1;
        return acc;
      }, {});
      const topClientes = Object.values(clientMap)
        .sort((a: any, b: any) => b.total - a.total)
        .slice(0, 5);

      // Top Produtos (extraídos dos JSONs de itens dos pedidos)
      const productMap = validPedidos.reduce((acc: any, p) => {
        ((p.itens as any) || []).forEach((item: any) => {
          if (!acc[item.nome]) acc[item.nome] = { name: item.nome, total: 0, qty: 0 };
          acc[item.nome].qty += item.quantidade || 1;
          acc[item.nome].total += (item.preco || 0) * (item.quantidade || 1);
        });
        return acc;
      }, {});
      const topProdutos = Object.values(productMap)
        .sort((a: any, b: any) => b.qty - a.qty)
        .slice(0, 5);

      const ticketMedio = validPedidos.length > 0 ? receitaTotal / validPedidos.length : 0;

      setReportData({
        receitaTotal,
        totalPedidos,
        ticketMedio,
        novasClientes: clientesRes.data?.length || 0,
        totalDescontos,
        vendasPorDia,
        statusDistribution,
        topProdutos,
        topClientes,
        cuponsPopulares: Object.entries(pedidos.reduce((acc: any, p) => {
          if (p.cupom_codigo) {
            if (!acc[p.cupom_codigo]) acc[p.cupom_codigo] = { codigo: p.cupom_codigo, total: 0, desconto: 0 };
            acc[p.cupom_codigo].total += 1;
            acc[p.cupom_codigo].desconto += Number(p.desconto || 0);
          }
          return acc;
        }, {}))
        .map(([_, data]: any) => data)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5),
        debug: {
          totalPedidosRaw: pedidos.length,
          totalProdutosRaw: produtosRes.data?.length || 0,
          totalClientesRaw: clientesRes.data?.length || 0,
          totalCuponsRaw: cuponsRes.data?.length || 0,
          periodo: { start: start || 'Início', end: end || 'Hoje' },
          receitaCalculada: receitaTotal,
          ticketMedioCalculado: ticketMedio,
          primeiroPedido: pedidos[0] ? { id: pedidos[0].id, data: pedidos[0].created_at } : null,
          ultimoPedido: pedidos[pedidos.length - 1] ? { id: pedidos[pedidos.length - 1].id, data: pedidos[pedidos.length - 1].created_at } : null,
          query: queryDescription
        }
      });

    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    try {
      const headers = ['Data', 'Vendas (R$)', 'Qtd Pedidos'];
      const rows = reportData.vendasPorDia.map((d: any) => [d.name, d.total.toFixed(2), d.count]);
      
      const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `relatorio_vendas_${filter}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Relatório exportado!');
    } catch (err) {
      toast.error('Erro ao exportar CSV');
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <Loader2 className="animate-spin text-[#04548c] h-10 w-10" />
      <p className="text-gray-400 font-medium uppercase text-xs tracking-widest">Processando relatórios...</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Relatórios & Inteligência</h1>
          <p className="text-sm text-gray-500 font-medium">Análise detalhada de performance comercial.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-gray-100 rounded-lg p-1 shadow-sm">
            {[
              { id: 'hoje', label: 'Hoje' },
              { id: '7d', label: '7 Dias' },
              { id: '30d', label: '30 Dias' },
              { id: 'mes', label: 'Mês' },
              { id: 'tudo', label: 'Tudo' },
              { id: 'custom', label: 'Personalizado' }
            ].map(btn => (
              <button 
                key={btn.id}
                onClick={() => setFilter(btn.id)}
                className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${
                  filter === btn.id ? 'bg-[#04548c] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
          
          {filter === 'custom' && (
            <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-lg p-1 shadow-sm">
              <input 
                type="date" 
                className="text-[10px] font-bold text-gray-600 outline-none border-none p-1"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
              <span className="text-gray-300">|</span>
              <input 
                type="date" 
                className="text-[10px] font-bold text-gray-600 outline-none border-none p-1"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
          )}
          <button 
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-50 text-green-600 border border-green-100 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-green-100 transition-all shadow-sm"
          >
            <FileDown className="h-4 w-4" /> Exportar
          </button>
        </div>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Receita Líquida', value: `R$ ${reportData.receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: 'text-green-600' },
          { label: 'Ticket Médio', value: `R$ ${reportData.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: Target, color: 'text-[#04548c]' },
          { label: 'Total de Pedidos', value: reportData.totalPedidos, icon: ShoppingBag, color: 'text-blue-600' },
          { label: 'Descontos Dados', value: `R$ ${reportData.totalDescontos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: Ticket, color: 'text-red-500' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-gray-50 rounded-lg">
                <item.icon className={`h-4 w-4 ${item.color}`} />
              </div>
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
            <h3 className="text-xl font-black text-gray-800">{item.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest mb-8">Vendas por Dia</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.vendasPorDia}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#9CA3AF'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#9CA3AF'}} />
                <Tooltip cursor={{fill: '#F9FAFB'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}} />
                <Bar dataKey="total" fill="#04548c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest mb-8">Pedidos por Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reportData.statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {reportData.statusDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/30">
            <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest">Produtos Mais Vendidos</h3>
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Produto</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Vendas</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Receita</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reportData.topProdutos.map((p: any, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-all">
                  <td className="px-6 py-4 text-xs font-bold text-gray-800 uppercase truncate max-w-[200px]">{p.name}</td>
                  <td className="px-6 py-4 text-xs font-black text-gray-400 text-center">{p.qty}</td>
                  <td className="px-6 py-4 text-xs font-black text-[#04548c] text-right">R$ {p.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top Clients Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/30">
            <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest">Melhores Clientes</h3>
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cliente</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Pedidos</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Total Gasto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reportData.topClientes.map((c: any, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-all">
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-gray-800 uppercase tracking-tight">{c.nome}</p>
                    <p className="text-[9px] text-gray-400 font-medium">{c.email}</p>
                  </td>
                  <td className="px-6 py-4 text-xs font-black text-gray-400 text-center">{c.pedidos}</td>
                  <td className="px-6 py-4 text-xs font-black text-[#04548c] text-right">R$ {c.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Coupon Performance Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
          <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest">Performance de Cupons</h3>
          <Ticket className="h-4 w-4 text-blue-600" />
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cupom</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Utilizações</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Economia Gerada</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reportData.cuponsPopulares?.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest">Nenhum cupom utilizado no período.</td>
              </tr>
            ) : (
              reportData.cuponsPopulares?.map((cupom: any, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-all">
                  <td className="px-6 py-4 text-xs font-bold text-gray-800 uppercase tracking-widest">{cupom.codigo}</td>
                  <td className="px-6 py-4 text-xs font-black text-gray-400 text-center">{cupom.total}</td>
                  <td className="px-6 py-4 text-xs font-black text-green-600 text-right">R$ {cupom.desconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Debug Section */}
      <div className="bg-red-50 border-2 border-dashed border-red-200 rounded-xl p-8 mt-12">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
          <h3 className="font-black text-red-600 uppercase text-xs tracking-widest">Debug dos Dados (Temporário)</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Entidades Consultadas</p>
              <ul className="space-y-2">
                <li className="flex justify-between text-xs font-bold text-red-800 uppercase"><span>Pedidos:</span> {reportData.debug.totalPedidosRaw}</li>
                <li className="flex justify-between text-xs font-bold text-red-800 uppercase"><span>Produtos:</span> {reportData.debug.totalProdutosRaw}</li>
                <li className="flex justify-between text-xs font-bold text-red-800 uppercase"><span>Clientes:</span> {reportData.debug.totalClientesRaw}</li>
                <li className="flex justify-between text-xs font-bold text-red-800 uppercase"><span>Cupons:</span> {reportData.debug.totalCuponsRaw}</li>
              </ul>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Cálculos Financeiros</p>
              <ul className="space-y-2">
                <li className="flex justify-between text-xs font-bold text-red-800 uppercase"><span>Receita:</span> R$ {reportData.debug.receitaCalculada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</li>
                <li className="flex justify-between text-xs font-bold text-red-800 uppercase"><span>Ticket Médio:</span> R$ {reportData.debug.ticketMedioCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</li>
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Período</p>
              <p className="text-[10px] font-black text-red-900 uppercase">{reportData.debug.periodo.start} até {reportData.debug.periodo.end}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Amostra de Pedidos</p>
              {reportData.debug.primeiroPedido && (
                <div className="mb-2">
                  <p className="text-[9px] font-bold text-red-700 uppercase">Primeiro: {String(reportData.debug.primeiroPedido.id).slice(0, 8)}...</p>
                  <p className="text-[8px] text-red-500">{new Date(reportData.debug.primeiroPedido.data).toLocaleString()}</p>
                </div>
              )}
              {reportData.debug.ultimoPedido && (
                <div>
                  <p className="text-[9px] font-bold text-red-700 uppercase">Último: {String(reportData.debug.ultimoPedido.id).slice(0, 8)}...</p>
                  <p className="text-[8px] text-red-500">{new Date(reportData.debug.ultimoPedido.data).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-red-100">
          <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2">Query Supabase</p>
          <code className="block bg-red-100/50 p-4 rounded text-[10px] font-mono text-red-900 break-all">
            {reportData.debug.query}
          </code>
        </div>
      </div>
    </div>
  );
};

export default Reports;