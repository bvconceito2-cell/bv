import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Globe, Eye, FileText, ChevronRight, Loader2, Save, X } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { useStore } from '../../../store/useStore';

const InstitutionalPages = () => {
  const { fetchFromSupabase }: any = useStore();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pages, setPages] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<any>(null);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('paginas_institucionais' as any)
        .select('*')
        .order('ordem', { ascending: true });

      if (error) throw error;
      setPages(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar páginas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const { id, ...pageData } = currentPage;
      
      let error;
      if (id) {
        const { error: updateError } = await supabase
          .from('paginas_institucionais' as any)
          .update(pageData)
          .eq('id', id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('paginas_institucionais' as any)
          .insert([pageData]);
        error = insertError;
      }

      if (error) throw error;

      toast.success(`Página ${id ? 'atualizada' : 'criada'} com sucesso!`);
      setIsModalOpen(false);
      fetchPages();
      fetchFromSupabase(true);
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: any) => {
    if (!confirm('Tem certeza que deseja excluir esta página?')) return;

    try {
      const { error } = await supabase
        .from('paginas_institucionais' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Página excluída com sucesso!');
      fetchPages();
      fetchFromSupabase(true);
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + error.message);
    }
  };

  const openModal = (page: any = null) => {
    setCurrentPage(page || {
      titulo: '',
      slug: '',
      conteudo: '',
      ordem: 0,
      ativo: true,
      meta_title: '',
      meta_description: ''
    });
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 admin-theme">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Páginas Institucionais</h1>
          <p className="text-sm text-gray-500">Gerencie conteúdos como "Quem Somos", "Políticas" e outros.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-brand-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-sm"
        >
          <Plus className="h-4 w-4" /> NOVA PÁGINA
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Título / Link</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Ordem</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pages.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">Nenhuma página cadastrada.</td>
                </tr>
              ) : (
                pages.map((page) => (
                  <tr key={page.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-brand-primary/5 flex items-center justify-center text-brand-primary">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800 uppercase tracking-tight">{page.titulo}</p>
                          <p className="text-[10px] text-gray-400 font-mono">/pagina/{page.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-gray-500">#{page.ordem}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${page.ativo ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {page.ativo ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openModal(page)}
                          className="p-2 text-gray-400 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(page.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Excluir"
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800 uppercase tracking-tight">{currentPage?.id ? 'Editar Página' : 'Nova Página Institucional'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Título da Página</label>
                  <input 
                    type="text" 
                    required
                    value={currentPage.titulo}
                    onChange={(e) => setCurrentPage({...currentPage, titulo: e.target.value})}
                    placeholder="Ex: Política de Privacidade"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/10 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Slug (URL)</label>
                  <input 
                    type="text" 
                    required
                    value={currentPage.slug}
                    onChange={(e) => setCurrentPage({...currentPage, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                    placeholder="ex: politica-privacidade"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-mono focus:ring-2 focus:ring-brand-primary/10 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Conteúdo da Página (Texto Rico)</label>
                <textarea 
                  required
                  rows={10}
                  value={currentPage.conteudo}
                  onChange={(e) => setCurrentPage({...currentPage, conteudo: e.target.value})}
                  placeholder="Escreva aqui o conteúdo da página..."
                  className="w-full px-4 py-4 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/10 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Ordem de Exibição</label>
                  <input 
                    type="number" 
                    value={currentPage.ordem}
                    onChange={(e) => setCurrentPage({...currentPage, ordem: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/10 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Status</label>
                  <select 
                    value={currentPage.ativo ? 'true' : 'false'}
                    onChange={(e) => setCurrentPage({...currentPage, ativo: e.target.value === 'true'})}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/10 outline-none"
                  >
                    <option value="true">Publicada (Ativa)</option>
                    <option value="false">Rascunho (Inativa)</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                 <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                   <Globe className="h-4 w-4" /> Configurações de SEO
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Meta Title</label>
                     <input 
                       type="text" 
                       value={currentPage.meta_title}
                       onChange={(e) => setCurrentPage({...currentPage, meta_title: e.target.value})}
                       className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/10 outline-none"
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Meta Description</label>
                     <input 
                       type="text" 
                       value={currentPage.meta_description}
                       onChange={(e) => setCurrentPage({...currentPage, meta_description: e.target.value})}
                       className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/10 outline-none"
                     />
                   </div>
                 </div>
              </div>
            </form>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-4">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-800 transition-all uppercase tracking-widest"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-brand-primary text-white px-8 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-brand-primary/10 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSaving ? 'SALVANDO...' : 'SALVAR PÁGINA'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstitutionalPages;