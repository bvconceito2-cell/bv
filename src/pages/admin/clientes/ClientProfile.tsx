import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  ShoppingBag, 
  TrendingUp, 
  Clock, 
  Calendar,
  CreditCard,
  Heart,
  StickyNote,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { Cliente, Pedido } from '../../../types/database';
import { toast } from 'sonner';

const ClientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<Cliente | null>(null);
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchClientData();
  }, [id]);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      const [clientRes, ordersRes] = await Promise.all([
        supabase.from('clientes').select('*').eq('id', id).single(),
        supabase.from('pedidos').select('*').eq('cliente_id', id).order('created_at', { ascending: false })
      ]);

      if (clientRes.error) throw clientRes.error;
      setClient(clientRes.data as any);
      setOrders((ordersRes.data as any) || []);

      setNotes(clientRes.data.notas_internas || '');
    } catch (error: any) {
      toast.error('Erro ao carregar dados da cliente: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      const { error } = await supabase
        .from('clientes')
        .update({ notas_internas: notes })
        .eq('id', id);

      if (error) throw error;
      toast.success('Notas salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar notas');
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

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-[#2D1B4E]" /></div>;
  if (!client) return <div className="text-center p-20">Cliente não encontrada.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/clientes')} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-[#F5F3F7] flex items-center justify-center text-[#2D1B4E] font-bold text-lg">
              {client.nome[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{client.nome}</h1>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getSegmentColor(client.segmento || 'Novo')}`}>
                  {client.segmento || 'Novo'}
                </span>
                <span className="text-xs text-gray-400">Cliente desde {new Date(client.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          {/* Contact Info */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" /> Contato
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs text-gray-600">
                <Mail className="h-4 w-4 text-gray-400" /> {client.email}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-600">
                <Phone className="h-4 w-4 text-gray-400" /> {client.telefone}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-600">
                <Calendar className="h-4 w-4 text-gray-400" /> {client.data_nascimento ? new Date(client.data_nascimento).toLocaleDateString('pt-BR') : 'Não informado'}
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gray-400" /> Resumo Financeiro
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Total Gasto</span>
                <span className="text-sm font-bold text-gray-800">R$ {client.total_gasto?.toFixed(2) || '0,00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Pedidos</span>
                <span className="text-sm font-bold text-gray-800">{client.total_pedidos || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Ticket Médio</span>
                <span className="text-sm font-bold text-[#8B3A6B]">
                  R$ {client.total_pedidos ? (client.total_gasto / client.total_pedidos).toFixed(2) : '0,00'}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-gray-400" /> Notas Internas
            </h3>
            <textarea 
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs focus:ring-1 focus:ring-[#2D1B4E]"
              placeholder="Adicione observações sobre esta cliente..."
            />
            <button 
              onClick={handleSaveNotes}
              className="w-full py-2 bg-gray-100 text-[#2D1B4E] text-[10px] font-bold uppercase rounded-lg hover:bg-gray-200 transition-all"
            >
              Salvar Notas
            </button>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {/* Order History */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-gray-400" /> Histórico de Pedidos
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Pedido</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Data</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Total</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-gray-400">Nenhum pedido realizado.</td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50/50 transition-all">
                        <td className="px-6 py-4 font-bold text-[#2D1B4E]">#{order.codigo}</td>
                        <td className="px-6 py-4 text-gray-500">{new Date(order.created_at).toLocaleDateString('pt-BR')}</td>
                        <td className="px-6 py-4 font-bold text-gray-800">R$ {order.total.toFixed(2)}</td>
                        <td className="px-6 py-4">
                           <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-600">
                             {order.status}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => navigate(`/admin/pedidos/${order.id}`)}
                            className="p-2 text-gray-400 hover:text-[#2D1B4E] hover:bg-gray-100 rounded-lg"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Addresses */}
             <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" /> Endereços
                </h3>
                <div className="space-y-4">
                  {client.enderecos && client.enderecos.length > 0 ? (
                    client.enderecos.map((addr: any, idx: number) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
                        <p className="font-bold text-gray-800 mb-1">{addr.label || 'Principal'}</p>
                        <p>{addr.rua}, {addr.numero} - {addr.complemento}</p>
                        <p>{addr.bairro} - {addr.cidade}/{addr.estado}</p>
                        <p>CEP: {addr.cep}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400">Nenhum endereço cadastrado.</p>
                  )}
                </div>
             </div>

             {/* Wishlist / Favorites Placeholder */}
             <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <Heart className="h-4 w-4 text-gray-400" /> Wishlist
                </h3>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Heart className="h-8 w-8 text-gray-100 mb-2" />
                  <p className="text-xs text-gray-400">Nenhum produto favorito.</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientProfile;