import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { toast } from 'sonner';
import { 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  Package, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  ExternalLink,
  Loader2,
  RefreshCcw,
  AlertTriangle,
  Ticket
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { supabase } from "@/integrations/supabase/client";
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, change, trend, icon: Icon, colorClass = "text-[#04548c]" }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-[#F5F3F7] rounded-lg">
        <Icon className={`h-5 w-5 ${colorClass}`} />
      </div>
      {change && (
        <div className={`flex items-center gap-1 text-xs font-bold ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
          {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {change}
        </div>
      )}
    </div>
    <p className="text-gray-400 text-sm font-medium">{title}</p>
    <h3 className="text-2xl font-bold text-gray-800 mt-1">{value}</h3>
  </div>
);

const Dashboard = () => {
  const { reprocessHomeSections }: any = useStore();
  const [reprocessing, setReprocessing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    receitaTotal: 0,
    pedidosHoje: 0,
    pedidosPendentes: 0,
    clientesTotal: 0,
    produtosAtivos: 0,
    estoqueBaixo: 0,
    usoCupons: 0
  });
  
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [topCoupons, setTopCoupons] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      const [pedidosRes, clientesRes, produtosRes, cuponsRes] = await Promise.all([
        supabase.from('pedidos').select('*'),
        supabase.from('clientes').select('id', { count: 'exact' }),
        supabase.from('produtos').select('*'),
        supabase.from('cupons').select('*')
      ]);

      const allPedidos = pedidosRes.data || [];
      const allProdutos = produtosRes.data || [];
      const allCupons = cuponsRes.data || [];
      
      const pedidosHoje = allPedidos.filter(p => p.created_at?.startsWith(today));
      const pedidosPendentes = allPedidos.filter(p => p.status?.toLowerCase() === 'pendente');
      const receitaTotal = allPedidos
        .filter(p => p.status?.toLowerCase() !== 'cancelado')
        .reduce((acc, p) => acc + Number(p.total || 0), 0);
      
      const estoqueBaixoCount = allProdutos.filter(p => (p.estoque || 0) < 5).length;
      const produtosAtivosCount = allProdutos.filter(p => p.ativo).length;

      setStats({
        receitaTotal,
        pedidosHoje: pedidosHoje.length,
        pedidosPendentes: pedidosPendentes.length,
        clientesTotal: clientesRes.count || 0,
        produtosAtivos: produtosAtivosCount,
        estoqueBaixo: estoqueBaixoCount,
        usoCupons: allPedidos.filter(p => p.cupom_codigo).length
      });

      // Ultimos 7 dias para o gráfico
      const last7Days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      const dailyData = last7Days.map(date => {
        const dayTotal = allPedidos
          .filter(p => p.created_at?.startsWith(date) && p.status?.toLowerCase() !== 'cancelado')
          .reduce((acc, p) => acc + Number(p.total || 0), 0);
        
        return {
          name: date.split('-').reverse().slice(0, 2).join('/'),
          vendas: dayTotal
        };
      });
      setChartData(dailyData);

      // Pedidos recentes
      const sortedOrders = [...allPedidos]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
      setRecentOrders(sortedOrders);

      // Ranking produtos (total_vendas do banco)
      const sortedProducts = [...allProdutos]
        .sort((a, b) => (b.total_vendas || 0) - (a.total_vendas || 0))
        .slice(0, 3);
      setTopProducts(sortedProducts);

      // Ranking cupons
      const couponUsageMap: Record<string, number> = {};
      allPedidos.forEach(p => {
        if (p.cupom_codigo) {
          couponUsageMap[p.cupom_codigo] = (couponUsageMap[p.cupom_codigo] || 0) + 1;
        }
      });

      const sortedCoupons = Object.entries(couponUsageMap)
        .map(([codigo, usos]) => ({ codigo, usos }))
        .sort((a, b) => b.usos - a.usos)
        .slice(0, 3);
      setTopCoupons(sortedCoupons);

    } catch (error) {
      console.error('Error fetching dashboard:', error);
      toast.error('Erro ao sincronizar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleFixSections = async () => {
    setReprocessing(true);
    const success = await reprocessHomeSections();
    if (success) {
      toast.success('Seções da home restauradas com sucesso!');
    } else {
      toast.error('Erro ao restaurar seções.');
    }
    setReprocessing(false);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <Loader2 className="animate-spin text-[#04548c] h-10 w-10" />
      <p className="text-gray-400 font-medium uppercase text-xs tracking-widest">Carregando painel real...</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Dashboard Administrativo</h1>
          <p className="text-sm text-gray-500 font-medium">Dados reais consolidados do Supabase.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchDashboardData}
            className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-400 hover:text-[#04548c]"
            title="Recarregar dados"
          >
            <RefreshCcw className="h-5 w-5" />
          </button>
          <Link to="/admin/relatorios" className="bg-[#04548c] text-white px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-md">
            Ver Relatórios
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Receita Total" 
          value={`R$ ${stats.receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          icon={TrendingUp} 
          colorClass="text-green-600"
        />
        <StatCard 
          title="Pedidos Hoje" 
          value={stats.pedidosHoje} 
          icon={ShoppingCart} 
        />
        <StatCard 
          title="Clientes" 
          value={stats.clientesTotal} 
          icon={Users} 
        />
        <StatCard 
          title="Produtos Ativos" 
          value={stats.produtosAtivos} 
          icon={Package} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-gray-800 uppercase text-sm tracking-tight">Desempenho (Últimos 7 dias)</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#04548c] rounded-full"></span>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Vendas (R$)</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#04548c" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#04548c" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 10, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 10, fontWeight: 700}} tickFormatter={(value) => `R$${value}`} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold'}}
                />
                <Area type="monotone" dataKey="vendas" stroke="#04548c" strokeWidth={3} fillOpacity={1} fill="url(#colorVendas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts & Top Products */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-black text-gray-800 uppercase text-sm tracking-tight mb-6">Alertas & Performance</h3>
            <div className="space-y-6">
              {stats.pedidosPendentes > 0 && (
                <div className="flex gap-4">
                  <div className="p-2 bg-amber-50 rounded-lg shrink-0 h-fit">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{stats.pedidosPendentes} Pedidos Pendentes</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 font-medium uppercase">Aguardando aprovação</p>
                    <Link to="/admin/pedidos" className="text-[10px] font-black text-[#04548c] mt-2 flex items-center gap-1 uppercase hover:underline">Ver Todos <ExternalLink className="h-2.5 w-2.5" /></Link>
                  </div>
                </div>
              )}
              {stats.estoqueBaixo > 0 && (
                <div className="flex gap-4">
                  <div className="p-2 bg-red-50 rounded-lg shrink-0 h-fit">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{stats.estoqueBaixo} Alerta de Estoque</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 font-medium uppercase">Produtos com menos de 5 unid.</p>
                    <Link to="/admin/produtos" className="text-[10px] font-black text-[#04548c] mt-2 flex items-center gap-1 uppercase hover:underline">Repor Estoque <ExternalLink className="h-2.5 w-2.5" /></Link>
                  </div>
                </div>
              )}
              {topCoupons.length > 0 && (
                <div className="flex gap-4">
                  <div className="p-2 bg-blue-50 rounded-lg shrink-0 h-fit">
                    <Ticket className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">Cupom Pop: {topCoupons[0].codigo}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 font-medium uppercase">{topCoupons[0].usos} usos totais</p>
                    <Link to="/admin/relatorios" className="text-[10px] font-black text-[#04548c] mt-2 flex items-center gap-1 uppercase hover:underline">Relatório Completo <ExternalLink className="h-2.5 w-2.5" /></Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-black text-gray-800 uppercase text-sm tracking-tight mb-6">Ranking de Vendas</h3>
            <div className="space-y-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">Top Produtos</p>
              {topProducts.map((p, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-10 h-12 bg-gray-50 rounded overflow-hidden shrink-0 border border-gray-100">
                    <img src={p.imagem_principal || p.imagens?.[0]} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate uppercase">{p.nome}</p>
                    <p className="text-[10px] text-gray-400 font-black">{p.total_vendas || 0} VENDAS</p>
                  </div>
                </div>
              ))}
              
              {topCoupons.length > 0 && (
                <>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2 mt-6">Top Cupons</p>
                  {topCoupons.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <p className="text-xs font-bold text-gray-800 uppercase tracking-tight">{c.codigo}</p>
                      <span className="text-[10px] font-black text-[#04548c] bg-blue-50 px-2 py-0.5 rounded">{c.usos} USOS</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-black text-gray-800 uppercase text-sm tracking-tight">Últimos Pedidos</h3>
          <Link to="/admin/pedidos" className="text-[10px] font-black text-[#04548c] uppercase tracking-widest hover:underline">Ver Histórico Completo</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Código</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cliente</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Valor</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">Nenhum pedido recente.</td>
                </tr>
              ) : (
                recentOrders.map((order, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-all">
                    <td className="px-6 py-4 text-xs font-black text-[#04548c]">#{order.codigo}</td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-gray-800 uppercase tracking-tight">{order.cliente_nome}</p>
                      <p className="text-[9px] text-gray-400 font-medium">{order.cliente_email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                        order.status?.toLowerCase() === 'pago' ? 'bg-green-50 text-green-600' : 
                        order.status?.toLowerCase() === 'pendente' ? 'bg-amber-50 text-amber-600' : 
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-black text-gray-800 text-right">R$ {Number(order.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-[10px] font-bold text-gray-400">{new Date(order.created_at).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Tools */}
      <div className="flex justify-center pt-8 border-t border-gray-100">
        <button 
          onClick={handleFixSections}
          disabled={reprocessing}
          className="flex items-center gap-2 px-8 py-3 bg-gray-50 text-gray-400 text-[10px] font-black uppercase rounded-lg border border-gray-200 hover:bg-gray-100 transition-all disabled:opacity-50"
        >
          {reprocessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCcw className="h-3 w-3" />}
          Sincronizar Estrutura da Home
        </button>
      </div>
    </div>
  );
};

export default Dashboard;