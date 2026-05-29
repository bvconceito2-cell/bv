import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Package, 
  User, 
  MapPin, 
  CreditCard, 
  Truck, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  MoreHorizontal,
  ExternalLink,
  Printer,
  RefreshCw,
  MessageCircle,
  Copy,
  Save,
  FileText,
  ChevronDown
} from 'lucide-react';

import { supabase } from "@/integrations/supabase/client";
import { useStore } from '../../../store/useStore';
import { toast } from 'sonner';

const OrderDetail = () => {
  const { config }: any = useStore();
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [trackingCode, setTrackingCode] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [savingTracking, setSavingTracking] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', id as any)
        .single();

      if (error) throw error;
      
      // Se algum item não tiver imagem, tenta buscar dos produtos
      const itensComImagens = await Promise.all(((data.itens as any[]) || []).map(async (item: any) => {
        if (!item.imagem && item.id) {
          const { data: produto } = await supabase
            .from('produtos')
            .select('imagem_principal')
            .eq('id', item.id)
            .single();
          
          if (produto?.imagem_principal) {
            return { ...item, imagem: produto.imagem_principal };
          }
        }
        return item;
      }));

      setOrder({ ...data, itens: itensComImagens });
      setTrackingCode(data.codigo_rastreio || '');
      setInternalNotes(data.observacoes_internas || '');
    } catch (error: any) {
      toast.error('Erro ao carregar pedido: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    try {
      const novoHistorico = [
        ...(order.historico_status || []),
        {
          status: newStatus,
          data: new Date().toISOString(),
          mensagem: `Status alterado para ${newStatus}`
        }
      ];

      const { error } = await supabase
        .from('pedidos')
        .update({ 
          status: newStatus,
          historico_status: novoHistorico
        })
        .eq('id', id as any);

      if (error) throw error;
      toast.success('Status atualizado!');
      fetchOrder();
    } catch (error: any) {
      toast.error('Erro ao atualizar status');
    }
  };

  const saveTrackingCode = async () => {
    try {
      setSavingTracking(true);
      const { error } = await supabase
        .from('pedidos')
        .update({ codigo_rastreio: trackingCode })
        .eq('id', id as any);

      if (error) throw error;
      toast.success('Código de rastreio salvo!');
      fetchOrder();
    } catch (error: any) {
      toast.error('Erro ao salvar código de rastreio');
    } finally {
      setSavingTracking(false);
    }
  };

  const saveInternalNotes = async () => {
    try {
      setSavingNotes(true);
      const { error } = await supabase
        .from('pedidos')
        .update({ observacoes_internas: internalNotes })
        .eq('id', id as any);

      if (error) throw error;
      toast.success('Observações salvas!');
      fetchOrder();
    } catch (error: any) {
      toast.error('Erro ao salvar observações');
    } finally {
      setSavingNotes(false);
    }
  };

  const getWhatsAppLink = (message: string) => {
    if (!order.cliente_telefone) return '';
    const phone = order.cliente_telefone.replace(/\D/g, '');
    return `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
  };

  const copyWhatsApp = () => {
    const link = getWhatsAppLink(`Olá ${order.cliente_nome}, tudo bem? Sou da ${config?.nome_loja || 'loja'} e estou entrando em contato sobre seu pedido #${order.codigo}.`);
    if (!link) {
      toast.error('Telefone não disponível');
      return;
    }
    window.open(link, '_blank');
    toast.success('WhatsApp aberto!');
  };

  const updatePaymentStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ status_pagamento: newStatus })
        .eq('id', id as any);

      if (error) throw error;
      toast.success('Status de pagamento atualizado!');
      fetchOrder();
    } catch (error: any) {
      toast.error('Erro ao atualizar pagamento');
    }
  };

  const syncPayment = async () => {
    try {
      toast.loading('Sincronizando com Mercado Pago...', { id: 'sync' });
      const { data, error } = await supabase.functions.invoke(`webhook-mercadopago?type=payment&id=${order.mp_payment_id || order.mp_preference_id}`);


      if (error) throw error;
      toast.success('Status sincronizado!', { id: 'sync' });
      fetchOrder();
    } catch (error: any) {
      toast.error('Erro na sincronização: ' + error.message, { id: 'sync' });
    }
  };



  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pendente': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'pago': return 'bg-green-50 text-green-600 border-green-100';
      case 'em separação': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'enviado': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'entregue': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'cancelado': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <Clock className="h-10 w-10 animate-spin text-gray-200" />
      <p className="text-sm text-gray-400 font-medium tracking-widest uppercase">Carregando detalhes do pedido...</p>
    </div>
  );
  
  if (!order) return <div className="text-center p-20">Pedido não encontrado.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/pedidos')} className="p-2 hover:bg-gray-100 rounded-full transition-all">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Pedido #{order.codigo}</h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 font-medium">Realizado em {new Date(order.created_at).toLocaleString('pt-BR')}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {order.forma_pagamento === 'Mercado Pago' && (
            <button 
              onClick={() => syncPayment()}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary/5 text-brand-primary border border-brand-primary/10 rounded-lg text-xs font-black uppercase hover:bg-brand-primary/10 transition-all shadow-sm"
              title="Sincronizar com Mercado Pago"
            >
              <RefreshCw className="h-4 w-4" /> Sincronizar MP
            </button>
          )}
          <select 

            className="flex-1 md:flex-none bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-xs font-black uppercase text-gray-700 focus:ring-2 focus:ring-brand-primary/10 transition-all outline-none"
            value={order.status}
            onChange={(e) => updateStatus(e.target.value)}
          >
            <option value="pendente">Pendente</option>
            <option value="pago">Pago</option>
            <option value="em separação">Em separação</option>
            <option value="enviado">Enviado</option>
            <option value="entregue">Entregue</option>
            <option value="cancelado">Cancelado</option>
          </select>
          <button onClick={() => window.print()} className="bg-brand-primary text-white p-2.5 rounded-lg hover:bg-brand-primary-hover transition-all shadow-md">
            <Printer className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Produtos do Pedido</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {(order.itens || []).map((item: any, idx: number) => (
                <div key={idx} className="p-6 flex items-center gap-4">
                  <div className="h-20 w-16 rounded-sm bg-gray-50 overflow-hidden border border-gray-100 shrink-0">
                    <img 
                      src={item.imagem || 'https://via.placeholder.com/150?text=Sem+Imagem'} 
                      alt={item.nome} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-tight leading-tight">{item.nome}</h4>
                    <p className="text-[10px] text-gray-400 font-black uppercase mt-1">
                       {item.cor && `Cor: ${item.cor}`} {item.tamanho && ` | Tam: ${item.tamanho}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-gray-900">R$ {item.preco.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-400 font-black uppercase">Qtd: {item.quantidade}</p>
                    <p className="text-xs font-black text-brand-primary mt-1">Sub: R$ {(item.preco * item.quantidade).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-3">
              <div className="flex justify-between text-xs font-medium text-gray-500 uppercase tracking-wider">
                <span>Subtotal</span>
                <span className="font-bold text-gray-900">R$ {order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-medium text-gray-500 uppercase tracking-wider">
                <span>Frete ({order.metodo_envio?.nome || 'Padrão'})</span>
                <span className="font-bold text-gray-900">R$ {order.frete.toFixed(2)}</span>
              </div>
              {order.desconto > 0 && (
                <div className="flex justify-between text-xs font-black text-green-600 uppercase tracking-wider">
                  <span>Desconto ({order.cupom_codigo || 'Promocional'})</span>
                  <span>- R$ {order.desconto.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-end pt-4 border-t border-gray-200">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total do Pedido</span>
                <span className="text-3xl font-black text-brand-primary">R$ {order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 pb-4 border-b border-gray-50">Logística e Notas</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Código de Rastreio</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    placeholder="Ex: BR123456789BR"
                    className="flex-1 bg-gray-50 border-none rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-primary/10 transition-all outline-none"
                  />
                  <button 
                    onClick={saveTrackingCode}
                    disabled={savingTracking}
                    className="p-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition-all disabled:opacity-50"
                  >
                    {savingTracking ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Observações Internas</label>
                <textarea 
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Notas visíveis apenas para a equipe..."
                  rows={3}
                  className="w-full bg-gray-50 border-none rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-primary/10 transition-all outline-none resize-none"
                />
                <button 
                  onClick={saveInternalNotes}
                  disabled={savingNotes}
                  className="mt-2 w-full flex items-center justify-center gap-2 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-black uppercase hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  {savingNotes ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar Observações
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 pb-4 border-b border-gray-50">Histórico do Pedido</h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-brand-primary ring-4 ring-brand-primary/10"></div>
                  {(order.historico_status || []).length > 0 && <div className="w-0.5 flex-1 bg-gray-100 my-1"></div>}
                </div>
                <div>
                  <p className="text-xs font-black text-gray-800 uppercase tracking-tight">Pedido Criado</p>
                  <p className="text-[10px] text-gray-400 font-medium">{new Date(order.created_at).toLocaleString('pt-BR')}</p>
                </div>
              </div>
              
              {(order.historico_status || []).map((step: any, idx: number) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-brand-primary ring-4 ring-brand-primary/10"></div>
                    {idx < (order.historico_status || []).length - 1 && <div className="w-0.5 flex-1 bg-gray-100 my-1"></div>}
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-800 uppercase tracking-tight">{step.status}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{new Date(step.data).toLocaleString('pt-BR')}</p>
                    {step.mensagem && <p className="text-[10px] text-gray-500 mt-1 italic">{step.mensagem}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-50">
               <User className="h-4 w-4 text-gray-400" />
               <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Dados do Cliente</h3>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{order.cliente_nome}</p>
                <p className="text-xs text-gray-500 font-medium">{order.cliente_email}</p>
                <p className="text-xs text-gray-500 font-medium">{order.cliente_telefone}</p>
              </div>
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={copyWhatsApp}
                    className="flex items-center justify-center gap-2 py-2.5 bg-[#25D366] text-white border-none rounded text-[10px] font-black uppercase hover:bg-[#20ba5a] transition-all shadow-sm"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                  </button>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(order.cliente_email);
                      toast.success('Email copiado!');
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 bg-gray-50 text-gray-600 border border-gray-100 rounded text-[10px] font-black uppercase hover:bg-gray-100 transition-all"
                  >
                    <Copy className="h-3.5 w-3.5" /> Email
                  </button>
                </div>
                
                <div className="relative group/wa">
                  <button 
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 text-gray-500 border border-gray-100 rounded text-[9px] font-bold uppercase hover:bg-gray-100 transition-all"
                  >
                    <span>Mensagens Rápidas WA</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-xl z-20 hidden group-hover/wa:block overflow-hidden">
                    {[
                      { label: 'Pedido Recebido', msg: `Olá ${order.cliente_nome}! Recebemos seu pedido #${order.codigo} na ${config?.nome_loja || 'loja'}. Já estamos preparando tudo com muito carinho!` },
                      { label: 'Pagamento Pendente', msg: `Olá ${order.cliente_nome}, tudo bem? Notei que o pagamento do seu pedido #${order.codigo} ainda não foi confirmado. Posso te ajudar com alguma dúvida?` },
                      { label: 'Pedido Enviado', msg: `Boas notícias, ${order.cliente_nome}! Seu pedido #${order.codigo} já foi enviado. O código de rastreio é: ${order.codigo_rastreio || 'será atualizado em breve'}.` },
                      { label: 'Agradecimento', msg: `Olá ${order.cliente_nome}! Passando para agradecer a confiança na ${config?.nome_loja || 'loja'}. Quando suas peças chegarem, marca a gente no Insta? 🥰` }
                    ].map((btn, i) => (
                      <button 
                        key={i}
                        onClick={() => {
                          const link = getWhatsAppLink(btn.msg);
                          window.open(link, '_blank');
                        }}
                        className="w-full text-left px-4 py-2.5 text-[9px] font-bold uppercase text-gray-600 hover:bg-brand-primary/5 hover:text-brand-primary transition-colors border-b border-gray-50 last:border-none"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {order.cliente_id && (
                <button onClick={() => navigate(`/admin/clientes/${order.cliente_id}`)} className="w-full text-center py-2 border border-gray-100 rounded text-[10px] font-black uppercase text-gray-400 hover:bg-gray-50 transition-all">
                  Ver Perfil Completo
                </button>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
             <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-50">
               <MapPin className="h-4 w-4 text-gray-400" />
               <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Endereço de Entrega</h3>
            </div>
            <div className="text-xs text-gray-600 font-medium leading-relaxed space-y-1">
              <p className="font-black text-gray-900 uppercase tracking-tighter">{order.endereco_entrega?.rua}, {order.endereco_entrega?.numero}</p>
              <p className="uppercase">{order.endereco_entrega?.bairro}</p>
              <p className="uppercase">{order.endereco_entrega?.cidade} - {order.endereco_entrega?.estado}</p>
              <p className="text-brand-primary">CEP: {order.endereco_entrega?.cep}</p>
              {order.endereco_entrega?.complemento && (
                <p className="text-[10px] italic text-gray-400">Complemento: {order.endereco_entrega?.complemento}</p>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-50">
               <CreditCard className="h-4 w-4 text-gray-400" />
               <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Pagamento</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Método</span>
                <span className="text-xs font-black text-gray-900 uppercase">{order.forma_pagamento}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</span>
                <select 
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border-none outline-none cursor-pointer ${
                    order.status_pagamento === 'aprovado' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                  }`}
                  value={order.status_pagamento || 'pendente'}
                  onChange={(e) => updatePaymentStatus(e.target.value)}
                >
                  <option value="pendente">Pendente</option>
                  <option value="aprovado">Aprovado</option>
                  <option value="cancelado">Cancelado</option>
                  <option value="estornado">Estornado</option>
                </select>
              </div>
              {order.mp_payment_id && (
                <div className="pt-4 border-t border-gray-50">
                   <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-1">Mercado Pago ID</p>
                   <p className="text-[10px] font-mono font-bold text-gray-900 bg-gray-50 p-2 rounded truncate">{order.mp_payment_id}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
