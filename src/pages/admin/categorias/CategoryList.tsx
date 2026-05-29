import React, { useState, useEffect } from 'react';
import { Plus, Tag, Edit, Trash2, GripVertical, Eye, EyeOff, Loader2, Save, X, Image as ImageIcon, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';
import { Categoria } from '../../../types/database';
import { toast } from 'sonner';

const CategoryList = () => {
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Categoria> | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('ordem', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editingCategory) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const storagePath = `categorias/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('categorias')
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('categorias')
        .getPublicUrl(storagePath);

      setEditingCategory({ ...editingCategory, imagem_url: publicUrl });
      toast.success('Imagem carregada!');
    } catch (error: any) {
      toast.error('Erro no upload: ' + error.message);
    } finally {
      setUploading(false);
      if (event.target) event.target.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.nome) return;
    
    try {
      setLoading(true);
      const slug = editingCategory.slug || editingCategory.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/ /g, '-').replace(/[^\w-]+/g, '');
      const ordem = editingCategory.ordem || categories.length + 1;
      
      const payload: any = {
        nome: editingCategory.nome,
        slug: slug,
        ordem: ordem,
        ativo: editingCategory.ativo ?? true,
        imagem_url: editingCategory.imagem_url || null
      };
      

      let res;
      if (editingCategory.id) {
        res = await supabase.from('categorias').update(payload).eq('id', editingCategory.id);
      } else {
        res = await supabase.from('categorias').insert([payload]);
      }

      if (res.error) throw res.error;
      toast.success('Categoria salva!');
      setEditingCategory(null);
      fetchCategories();
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, nome: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir a categoria "${nome}"?`)) return;
    
    try {
      setLoading(true);
      const { error } = await supabase.from('categorias').delete().eq('id', id);
      if (error) throw error;
      toast.success('Categoria excluída!');
      fetchCategories();
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const moveCategory = async (id: number, direction: 'up' | 'down') => {
    const index = categories.findIndex(c => c.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === categories.length - 1) return;

    const newCategories = [...categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];

    // Update locally for immediate feedback
    setCategories(newCategories);

    try {
      // Update all orders in Supabase to be safe
      const updates = newCategories.map((cat, idx) => ({
        id: cat.id,
        nome: cat.nome,
        slug: cat.slug,
        ordem: idx + 1
      }));

      for (const update of updates) {
        await supabase.from('categorias').update({ ordem: update.ordem }).eq('id', update.id);
      }
      toast.success('Ordem atualizada');
    } catch (error: any) {
      toast.error('Erro ao reordenar');
      fetchCategories();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Categorias</h1>
          <p className="text-sm text-gray-500">Organize seus produtos.</p>
        </div>
        {!editingCategory && (
          <button 
            type="button"
            onClick={() => setEditingCategory({ ativo: true })}
            className="bg-[#04548c] text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#034370] transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" /> NOVA CATEGORIA
          </button>
        )}
      </div>

      {editingCategory && (
        <div className="bg-white p-6 rounded-xl border-2 border-[#04548c]/10 shadow-lg space-y-4">
           <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-gray-800">{editingCategory.id ? 'Editar Categoria' : 'Nova Categoria'}</h3>
             <button type="button" onClick={() => setEditingCategory(null)}><X className="h-5 w-5 text-gray-400" /></button>
           </div>
           <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nome</label>
                <input 
                  type="text" 
                  value={editingCategory.nome || ''} 
                  onChange={e => setEditingCategory({...editingCategory, nome: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Slug (Opcional)</label>
                <input 
                  type="text" 
                  value={editingCategory.slug || ''} 
                  onChange={e => setEditingCategory({...editingCategory, slug: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded px-3 py-2 text-sm"
                  placeholder="ex: vestidos"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Imagem da Categoria</label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-lg bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                    {editingCategory.imagem_url ? (
                      <img src={editingCategory.imagem_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden" 
                      id="cat-image-upload"
                    />
                    <label 
                      htmlFor="cat-image-upload"
                      className="inline-block px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold uppercase rounded cursor-pointer transition-all"
                    >
                      {uploading ? 'Carregando...' : editingCategory.imagem_url ? 'Alterar Imagem' : 'Selecionar Imagem'}
                    </label>
                    <p className="text-[10px] text-gray-400 mt-1">Recomendado: 200x200px (JPG, PNG)</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editingCategory.ativo} onChange={e => setEditingCategory({...editingCategory, ativo: e.target.checked})} />
                    <span className="text-xs font-bold text-gray-700 uppercase">Ativa</span>
                 </label>
                 <div className="flex-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Ordem</label>
                    <input 
                      type="number" 
                      value={editingCategory.ordem || 0} 
                      onChange={e => setEditingCategory({...editingCategory, ordem: parseInt(e.target.value)})}
                      className="w-full bg-gray-50 border border-gray-100 rounded px-3 py-1 text-sm"
                    />
                 </div>
              </div>
              <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                 <button type="button" onClick={() => setEditingCategory(null)} className="px-4 py-2 border border-gray-200 rounded text-xs font-bold uppercase">Cancelar</button>
                 <button type="submit" className="bg-[#04548c] text-white px-6 py-2 rounded text-xs font-bold uppercase">Salvar Categoria</button>
              </div>
           </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex justify-center p-20"><Loader2 className="animate-spin text-[#04548c]" /></div>
        ) : categories.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm text-center text-gray-500">
            Nenhuma categoria cadastrada.
          </div>
        ) : (
          categories.map((category, index) => (
            <div key={category.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 group hover:border-[#04548c]/30 transition-all">
              <div className="flex flex-col gap-1 text-gray-300">
                <button 
                  type="button"
                  onClick={() => moveCategory(category.id, 'up')}
                  disabled={index === 0}
                  className="hover:text-[#04548c] disabled:opacity-30"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button 
                  type="button"
                  onClick={() => moveCategory(category.id, 'down')}
                  disabled={index === categories.length - 1}
                  className="hover:text-[#04548c] disabled:opacity-30"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
              
              <div className="h-12 w-12 rounded-lg bg-gray-50 overflow-hidden shrink-0 border border-gray-100">
                {category.imagem_url ? (
                  <img src={category.imagem_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Tag className="h-6 w-6" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h3 className="font-bold text-gray-800">{category.nome}</h3>
                <p className="text-xs text-gray-400">/{category.slug}</p>
              </div>

              <div className="flex items-center gap-6 pr-4">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    category.ativo ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {category.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 border-l border-gray-100 pl-6">
                  <button type="button" onClick={() => setEditingCategory(category)} className="p-2 text-gray-400 hover:text-[#04548c] hover:bg-gray-100 rounded-lg transition-all" title="Editar">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleDelete(category.id, category.nome)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CategoryList;