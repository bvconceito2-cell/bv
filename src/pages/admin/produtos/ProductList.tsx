
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Upload, Image as ImageIcon, Download, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from 'react-router-dom';
import { productsService } from '../../../services/productsService';
import { categoriesService } from '../../../services/categoriesService';
import { toast } from 'sonner';
import { DataTable, StatusBadge } from '../../../components/admin/ui/DataTable';
import { LoadingState } from '../../../components/admin/ui/States';
import { formatCurrency } from '../../../utils/helpers';

const ProductList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [categoriesMap, setCategoriesMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {

      const [productsData, categoriesData] = await Promise.all([
        productsService.list(),
        categoriesService.list()
      ]);
      
      setProducts(productsData || []);
      
      const map: Record<number, string> = {};
      categoriesData?.forEach((c: any) => map[c.id] = c.nome);
      setCategoriesMap(map);

      setDebugInfo({
        url: 'Verifique o Console',
        count: productsData?.length || 0,
        firstProduct: productsData?.[0] || 'Nenhum',
        error: null
      });
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
      setDebugInfo({
        url: 'Verifique o Console',
        count: 0,
        firstProduct: 'Nenhum',
        error: error.message || error
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (row: any) => {
    if (!window.confirm(`Tem certeza que deseja excluir o produto "${row.nome}"? Esta ação não pode ser desfeita.`)) return;

    try {
      setLoading(true);
      await productsService.delete(row.id);
      toast.success('Produto excluído com sucesso');
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir produto');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (product: any) => {
    try {
      await productsService.update(product.id, { ativo: !product.ativo });
      toast.success(`Produto ${!product.ativo ? 'ativado' : 'desativado'} com sucesso`);
      fetchData();
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  const handleBulkStatus = async (active: boolean) => {
    if (selectedProducts.length === 0) return;
    try {
      setIsBulkActionLoading(true);
      const { error } = await supabase
        .from('produtos')
        .update({ ativo: active })
        .in('id', selectedProducts as any);

      
      if (error) throw error;
      toast.success(`${selectedProducts.length} produtos ${active ? 'ativados' : 'desativados'}`);
      setSelectedProducts([]);
      fetchData();
    } catch (err: any) {
      toast.error('Erro na ação em massa: ' + err.message);
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    if (!confirm(`Deseja realmente excluir ${selectedProducts.length} produtos? Esta ação é irreversível.`)) return;
    
    try {
      setIsBulkActionLoading(true);
      const { error } = await supabase
        .from('produtos')
        .delete()
        .in('id', selectedProducts as any);
      
      if (error) throw error;
      toast.success(`${selectedProducts.length} produtos excluídos`);
      setSelectedProducts([]);
      fetchData();
    } catch (err: any) {
      toast.error('Erro ao excluir produtos: ' + err.message);
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const exportProductsCSV = () => {
    const headers = ['Nome', 'Marca', 'Preço', 'Estoque', 'Status'];
    const rows = filteredProducts.map(p => [
      p.nome,
      p.marca,
      p.preco_atual,
      p.estoque,
      p.ativo ? 'Ativo' : 'Inativo'
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.body.appendChild(document.createElement("a"));
    link.href = URL.createObjectURL(blob);
    link.download = `produtos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    {
      key: 'nome',
      label: 'Produto',
      render: (value: string, row: any) => (
        <div className="flex items-center gap-3">
          <div className="h-12 w-9 rounded-md bg-gray-100 shrink-0 overflow-hidden border border-gray-200">
            {row.imagem_principal ? (
              <img src={row.imagem_principal} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <ImageIcon className="h-4 w-4" />
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800 line-clamp-1">{value}</p>
            <p className="text-[10px] text-brand-primary font-bold uppercase">{row.marca}</p>
          </div>
        </div>
      )
    },
    {
      key: 'categoria_id',
      label: 'Categoria',
      render: (value: number) => (
        <span className="text-xs text-gray-600 font-medium">
          {categoriesMap[value] || 'Sem categoria'}
        </span>
      )
    },
    {
      key: 'preco_atual',
      label: 'Preço',
      render: (value: number, row: any) => (
        <div>
          <p className="text-sm font-bold text-gray-800">{formatCurrency(value)}</p>
          {row.preco_original > value && (
            <p className="text-[10px] text-gray-400 line-through">{formatCurrency(row.preco_original)}</p>
          )}
        </div>
      )
    },
    {
      key: 'estoque',
      label: 'Estoque',
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${value > 5 ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className="text-sm text-gray-600 font-medium">{value} un.</span>
        </div>
      )
    },
    {
      key: 'ativo',
      label: 'Status',
      render: (value: boolean, row: any) => (
        <button 
          onClick={() => toggleStatus(row)}
          className="hover:opacity-80 transition-opacity"
        >
          <StatusBadge 
            status={value ? 'Ativo' : 'Inativo'} 
            variant={value ? 'success' : 'default'} 
          />
        </button>
      )
    }
  ];

  const filteredProducts = products.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.marca?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">


      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Produtos</h1>
          <p className="text-sm text-gray-500">Gerencie o catálogo de produtos da sua loja.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/admin/importar-produtos')}
            className="bg-white border border-gray-200 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm"
          >
            <Upload className="h-4 w-4" /> IMPORTAR ZIP
          </button>
          <button 
            onClick={() => navigate('/admin/produtos/novo')}
            className="bg-brand-primary text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-brand-primary/90 transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" /> NOVO PRODUTO
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou marca..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={exportProductsCSV}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold uppercase tracking-tight hover:bg-black transition-all shadow-sm"
          >
            <Download className="h-4 w-4" /> Exportar
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedProducts.length > 0 && (
        <div className="bg-brand-primary p-4 rounded-xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 sticky top-4 z-30">
          <div className="flex items-center gap-4 text-white">
            <span className="text-xs font-black uppercase tracking-widest">{selectedProducts.length} Selecionados</span>
            <button onClick={() => setSelectedProducts([])} className="text-[10px] uppercase font-bold text-brand-secondary underline">Cancelar</button>
          </div>
          <div className="flex gap-2">
            <button 
              disabled={isBulkActionLoading}
              onClick={() => handleBulkStatus(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-all"
            >
              <CheckCircle2 className="h-4 w-4" /> Ativar
            </button>
            <button 
              disabled={isBulkActionLoading}
              onClick={() => handleBulkStatus(false)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-all"
            >
              <XCircle className="h-4 w-4" /> Desativar
            </button>
            <button 
              disabled={isBulkActionLoading}
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/40 text-white text-xs font-bold rounded-lg transition-all"
            >
              <Trash2 className="h-4 w-4" /> Excluir
            </button>
          </div>
        </div>
      )}


      {loading ? (
        <LoadingState />
      ) : (
        <DataTable 
          columns={columns} 
          data={filteredProducts} 
          onEdit={(row) => navigate(`/admin/produtos/${row.id}`)}
          onDelete={handleDelete}
          selectedIds={selectedProducts}
          onSelectRow={(id) => setSelectedProducts(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
          onSelectAll={() => setSelectedProducts(selectedProducts.length === filteredProducts.length ? [] : filteredProducts.map(p => p.id))}
        />

      )}
    </div>
  );
};

export default ProductList;