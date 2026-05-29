import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, Filter, Clock, AlertTriangle, Info, Download, Trash2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

const SystemLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [nivelFilter, setNivelFilter] = useState('todos');
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchLogs();
  }, [nivelFilter, page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('logs_sistema')
        .select('*', { count: 'exact' });

      if (nivelFilter !== 'todos') {
        query = query.eq('nivel', nivelFilter);
      }

      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setLogs(data || []);
    } catch (err: any) {
      toast.error('Erro ao carregar logs: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getNivelStyles = (nivel: string) => {
    switch (nivel) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'error': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'warning': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const exportCSV = () => {
    const headers = ['Data', 'Nível', 'Origem', 'Mensagem', 'URL'];
    const rows = logs.map(l => [
      new Date(l.created_at).toLocaleString(),
      l.nivel.toUpperCase(),
      l.origem,
      l.mensagem,
      l.url || ''
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "logs_sistema.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Logs exportados!');
  };

  const filteredLogs = logs.filter(l => 
    l.mensagem.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.origem.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Logs do Sistema</h1>
          <p className="text-sm text-gray-500 font-medium">Monitoramento em tempo real da integridade da plataforma.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg"
          >
            <Download className="h-4 w-4" /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por mensagem ou origem..." 
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/10 transition-all shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            className="px-4 py-2.5 bg-gray-50 text-gray-600 rounded-lg text-sm font-bold uppercase tracking-tight border-none focus:ring-2 focus:ring-brand-primary/10 shadow-inner"
            value={nivelFilter}
            onChange={(e) => { setNivelFilter(e.target.value); setPage(1); }}
          >
            <option value="todos">Todos os Níveis</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data / Hora</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nível</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Origem</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Mensagem</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">URL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-brand-primary mx-auto mb-4" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Consultando registros...</p>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <ShieldAlert className="h-10 w-10 text-gray-100 mx-auto mb-4" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nenhum log encontrado</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-all text-xs">
                    <td className="px-6 py-4 font-medium text-gray-400">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[8px] font-black uppercase border",
                        getNivelStyles(log.nivel)
                      )}>
                        {log.nivel}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-gray-900 uppercase tracking-tighter">
                      {log.origem}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate font-medium text-gray-600" title={log.mensagem}>
                      {log.mensagem}
                    </td>
                    <td className="px-6 py-4 text-[10px] text-gray-400 font-mono truncate max-w-[150px]">
                      {log.url?.split('/').pop() || '/'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Paginação */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <button 
            disabled={page === 1 || loading}
            onClick={() => setPage(p => p - 1)}
            className="p-2 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-brand-primary disabled:opacity-50 transition-all shadow-sm"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Página {page}</span>
          <button 
            disabled={logs.length < itemsPerPage || loading}
            onClick={() => setPage(p => p + 1)}
            className="p-2 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-brand-primary disabled:opacity-50 transition-all shadow-sm"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemLogs;
