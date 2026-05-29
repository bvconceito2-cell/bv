
import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Layout';
import { supabase } from "@/integrations/supabase/client";
import { 
  Activity, AlertTriangle, CheckCircle, Clock, 
  Search, Filter, RefreshCcw, Database, Shield, Truck, XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';


const MonitoringPage = () => {
  const [checkoutLogs, setCheckoutLogs] = useState<any[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    checkoutErrors: 0,
    webhookErrors: 0,
    avgCheckoutTime: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data: cLogs } = await (supabase as any)
        .from('checkout_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      const { data: wLogs } = await (supabase as any)
        .from('mercadopago_webhooks_logs')
        .select('*')
        .order('processed_at', { ascending: false })
        .limit(20);

      const { count: ordersCount } = await (supabase as any).from('pedidos').select('*', { count: 'exact', head: true });
      const { count: cErrors } = await (supabase as any).from('checkout_logs').select('*', { count: 'exact', head: true }).not('erro', 'is', null);
      const { count: wErrors } = await (supabase as any).from('mercadopago_webhooks_logs').select('*', { count: 'exact', head: true }).eq('success', false);


      setCheckoutLogs(cLogs || []);
      setWebhookLogs(wLogs || []);
      setStats({
        totalOrders: ordersCount || 0,
        checkoutErrors: cErrors || 0,
        webhookErrors: wErrors || 0,
        avgCheckoutTime: 0 // Mock por enquanto
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-12 px-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">Monitoramento de Produção</h1>
            <p className="text-gray-500">Observabilidade em tempo real do fluxo de checkout e integrações.</p>
          </div>
          <button 
            onClick={fetchLogs}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-sm transition-colors font-bold uppercase text-xs tracking-widest"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatCard 
            title="Total de Pedidos" 
            value={stats.totalOrders} 
            icon={<Database className="w-6 h-6" />} 
            color="blue"
          />
          <StatCard 
            title="Erros de Checkout" 
            value={stats.checkoutErrors} 
            icon={<AlertTriangle className="w-6 h-6" />} 
            color="red"
          />
          <StatCard 
            title="Erros de Webhook" 
            value={stats.webhookErrors} 
            icon={<Shield className="w-6 h-6" />} 
            color="orange"
          />
          <StatCard 
            title="Falhas de Frete (24h)" 
            value={checkoutLogs.filter(l => l.etapa === 'calcular-frete' && l.erro).length} 
            icon={<Truck className="w-6 h-6" />} 
            color="amber"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Checkout Logs */}
          <section>
            <h2 className="text-xl font-bold mb-6 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-primary" />
              Logs de Checkout
            </h2>
            <div className="bg-white border-2 border-gray-100 rounded-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b-2 border-gray-100">
                  <tr>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Data</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Etapa</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Status</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {checkoutLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-gray-500 font-mono text-[11px]">
                        {format(new Date(log.created_at), 'HH:mm:ss')}
                      </td>
                      <td className="px-4 py-3 font-bold">{log.etapa}</td>
                      <td className="px-4 py-3">
                        {log.erro ? (
                          <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">Erro {log.status_http}</span>
                        ) : (
                          <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">Sucesso</span>
                        )}
                      </td>
                      <td className="px-4 py-3 truncate max-w-[150px] text-gray-400">
                        {log.erro || 'OK'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Webhook Logs */}
          <section>
            <h2 className="text-xl font-bold mb-6 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              Logs de Webhooks MP
            </h2>
            <div className="bg-white border-2 border-gray-100 rounded-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b-2 border-gray-100">
                  <tr>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Data</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Pedido</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Status MP</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Sucesso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {webhookLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-gray-500 font-mono text-[11px]">
                        {format(new Date(log.processed_at), 'HH:mm:ss')}
                      </td>
                      <td className="px-4 py-3 font-bold">{log.order_id || '-'}</td>
                      <td className="px-4 py-3 uppercase text-[10px]">{log.status || 'N/A'}</td>
                      <td className="px-4 py-3">
                        {log.success ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
};

const StatCard = ({ title, value, icon, color }: any) => {
  const colorClasses: any = {
    blue: "bg-blue-50 text-blue-600",
    red: "bg-red-50 text-red-600",
    orange: "bg-orange-50 text-orange-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="bg-white p-6 border-2 border-gray-100 rounded-sm shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-sm ${colorClasses[color] || colorClasses.blue}`}>
          {icon}
        </div>
        <span className="text-2xl font-black">{value}</span>
      </div>
      <h3 className="text-gray-500 uppercase text-[10px] font-bold tracking-widest">{title}</h3>
    </div>
  );
};

export default MonitoringPage;
