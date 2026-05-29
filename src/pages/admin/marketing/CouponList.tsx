import React, { useState, useEffect } from 'react';
import { Ticket, Plus, Search, Filter, Calendar, Percent, DollarSign, Edit, Trash2, Loader2, Save, ArrowLeft } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { Cupom } from '../../../types/database';
import { toast } from 'sonner';

const CouponList = () => {
  const [coupons, setCoupons] = useState<Cupom[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCoupon, setEditingCoupon] = useState<Partial<Cupom> | null>(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar cupons');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon) return;
    try {
      setLoading(true);
      
      const cleanedCoupon = {
        ...editingCoupon,
        valor_minimo_pedido: editingCoupon.valor_minimo_pedido || 0,
        limite_usos: editingCoupon.limite_usos || 0,
        limite_por_cliente: editingCoupon.limite_por_cliente || 0,
        categorias_ids: editingCoupon.categorias_ids || [],
        produtos_ids: editingCoupon.produtos_ids || [],
        usos_atuais: editingCoupon.usos_atuais || 0,
        validade: editingCoupon.validade || null
      };
      
      let res;
      if (editingCoupon.id) {
        res = await supabase.from('cupons').update(cleanedCoupon as any).eq('id', editingCoupon.id);
      } else {
        res = await supabase.from('cupons').insert([cleanedCoupon] as any);
      }

      if (res.error) throw res.error;
      toast.success('Cupom salvo!');
      setEditingCoupon(null);
      fetchCoupons();
    } catch (error: any) {
      toast.error('Erro ao salvar cupom: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, codigo: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o cupom "${codigo}"?`)) return;
    
    try {
      setLoading(true);
      const { error } = await supabase.from('cupons').delete().eq('id', id);
      if (error) throw error;
      toast.success('Cupom excluído!');
      fetchCoupons();
    } catch (error) {
      toast.error('Erro ao excluir');
    } finally {
      setLoading(false);
    }
  };

  if (editingCoupon) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setEditingCoupon(null)} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">{editingCoupon.id ? 'Editar Cupom' : 'Novo Cupom'}</h1>
        </div>

        <form onSubmit={handleSave} className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Código do Cupom</label>
                <input 
                  type="text" 
                  value={editingCoupon.codigo || ''}
                  onChange={e => setEditingCoupon({...editingCoupon, codigo: e.target.value.toUpperCase()})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm font-mono"
                  placeholder="EX: BEMVINDA10"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tipo</label>
                <select 
                  value={editingCoupon.tipo || 'percentual'}
                  onChange={e => setEditingCoupon({...editingCoupon, tipo: e.target.value as any})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm"
                >
                  <option value="percentual">Percentual (%)</option>
                  <option value="valor_fixo">Valor Fixo (R$)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Valor do Desconto</label>
                <input 
                  type="number" 
                  value={editingCoupon.valor || 0}
                  onChange={e => setEditingCoupon({...editingCoupon, valor: parseFloat(e.target.value)})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Valor Mínimo do Pedido</label>
                <input 
                  type="number" 
                  value={editingCoupon.valor_minimo_pedido || 0}
                  onChange={e => setEditingCoupon({...editingCoupon, valor_minimo_pedido: parseFloat(e.target.value)})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Limite de Usos Total</label>
                <input 
                  type="number" 
                  value={editingCoupon.limite_usos || 0}
                  onChange={e => setEditingCoupon({...editingCoupon, limite_usos: parseInt(e.target.value)})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm"
                  placeholder="0 para ilimitado"
                />
              </div>
               <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Limite de Uso por Cliente</label>
                <input 
                  type="number" 
                  value={editingCoupon.limite_por_cliente || 0}
                  onChange={e => setEditingCoupon({...editingCoupon, limite_por_cliente: parseInt(e.target.value)})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm"
                  placeholder="0 para ilimitado"
                />
              </div>
               <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Data de Validade</label>
                <input 
                  type="date" 
                  value={editingCoupon.validade ? new Date(editingCoupon.validade).toISOString().split('T')[0] : ''}
                  onChange={e => setEditingCoupon({...editingCoupon, validade: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm"
                />
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">IDs de Categorias (separados por vírgula)</label>
                <input 
                  type="text" 
                  value={editingCoupon.categorias_ids?.join(',') || ''}
                  onChange={e => setEditingCoupon({...editingCoupon, categorias_ids: e.target.value.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm"
                  placeholder="Ex: 1, 2, 3"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">IDs de Produtos (separados por vírgula)</label>
                <input 
                  type="text" 
                  value={editingCoupon.produtos_ids?.join(',') || ''}
                  onChange={e => setEditingCoupon({...editingCoupon, produtos_ids: e.target.value.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm"
                  placeholder="Ex: 101, 102"
                />
              </div>
           </div>

           <label className="flex items-center gap-2 cursor-pointer">
             <input type="checkbox" checked={editingCoupon.ativo} onChange={e => setEditingCoupon({...editingCoupon, ativo: e.target.checked})} />
             <span className="text-sm font-bold text-gray-700 uppercase">Cupom Ativo</span>
           </label>
           <div className="flex justify-end gap-4">
             <button type="button" onClick={() => setEditingCoupon(null)} className="px-6 py-2 border border-gray-200 rounded-lg text-sm font-bold">CANCELAR</button>
             <button type="submit" className="bg-[#04548c] text-white px-8 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
               <Save className="h-4 w-4" /> SALVAR CUPOM
             </button>
           </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cupons de Desconto</h1>
          <p className="text-sm text-gray-500">Crie e gerencie ofertas especiais para suas clientes.</p>
        </div>
        <button 
          onClick={() => setEditingCoupon({ tipo: 'percentual', ativo: true })}
          className="bg-[#04548c] text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#1a0f2e] transition-all shadow-sm"
        >
          <Plus className="h-4 w-4" /> NOVO CUPOM
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Código</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Desconto</th>
                <th className="px-6 py-4">Mínimo</th>
                <th className="px-6 py-4">Uso/Limite</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-20"><Loader2 className="animate-spin inline mr-2" /> Carregando...</td></tr>
              ) : coupons.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-20 text-gray-400">Nenhum cupom cadastrado.</td></tr>
              ) : (
                coupons.map(coupon => (
                  <tr key={coupon.id} className="hover:bg-gray-50/50 transition-all">
                    <td className="px-6 py-4 font-mono font-bold text-[#04548c]">{coupon.codigo}</td>
                    <td className="px-6 py-4 capitalize">{coupon.tipo.replace('_', ' ')}</td>
                    <td className="px-6 py-4 font-bold">{coupon.tipo === 'percentual' ? `${coupon.valor}%` : `R$ ${coupon.valor.toFixed(2)}`}</td>
                    <td className="px-6 py-4">R$ {Number(coupon.valor_minimo_pedido || 0).toFixed(2)}</td>
                    <td className="px-6 py-4">{coupon.usos_atuais || 0}/{coupon.limite_usos || '∞'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${coupon.ativo ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {coupon.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => setEditingCoupon(coupon)} className="p-2 text-gray-400 hover:text-[#04548c] hover:bg-gray-100 rounded-lg transition-all"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(coupon.id, coupon.codigo)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="h-4 w-4" /></button>
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

export default CouponList;