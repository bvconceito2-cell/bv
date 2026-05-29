import React, { useState, useEffect } from 'react';
import { Tag, Plus, GripVertical, Edit, Trash2, Loader2, Save, ImageIcon, Upload } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { Categoria } from '../../../types/database';
import { toast } from 'sonner';

const CategoryBanners = () => {
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<Categoria>>({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: Categoria) => {
    setEditingId(category.id);
    setFormData(category);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const storagePath = `categorias/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-media')
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-media')
        .getPublicUrl(storagePath);

      setFormData({ ...formData, imagem_url: publicUrl });
      toast.success('Imagem carregada!');
    } catch (error: any) {
      toast.error('Erro no upload: ' + error.message);
    } finally {
      setUploading(false);
      if (event.target) event.target.value = '';
    }
  };

  const handleSave = async () => {
    try {
      if (!editingId) return;

      const { error } = await supabase
        .from('categorias')
        .update(formData)
        .eq('id', editingId);

      if (error) throw error;
      toast.success('Categoria atualizada!');
      setEditingId(null);
      fetchCategories();
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Ícones de Categorias</h1>
        <p className="text-sm text-gray-500">Gerencie os ícones circulares que aparecem no carrossel da Home.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex justify-center p-20"><Loader2 className="animate-spin text-[#2D1B4E]" /></div>
        ) : (
          categories.map(cat => (
            <div key={cat.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
              {editingId === cat.id ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                   <div>
                     <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nome de Exibição</label>
                     <input 
                       type="text" 
                       value={formData.nome || ''} 
                       onChange={e => setFormData({...formData, nome: e.target.value})}
                       className="w-full bg-gray-50 border border-gray-100 rounded px-3 py-2 text-sm"
                     />
                   </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase">Imagem Circular</label>
                        <span className="text-[8px] font-black text-brand-primary bg-brand-primary/10 px-1 rounded">500x500px (1:1)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="h-12 w-12 bg-gray-50 border-2 border-dashed border-gray-200 rounded-full flex items-center justify-center cursor-pointer overflow-hidden shrink-0 hover:border-brand-primary transition-colors"
                        >
                          {formData.imagem_url ? (
                            <img src={formData.imagem_url} className="w-full h-full object-cover" />
                          ) : (
                            <Upload className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                        <span className="text-[9px] text-gray-400 font-medium leading-tight">Use fotos quadradas com fundo limpo.</span>
                      </div>
                    </div>
                   <div className="flex gap-2">
                     <button onClick={handleSave} className="flex-1 bg-[#2D1B4E] text-white py-2 rounded text-xs font-bold uppercase">Salvar</button>
                     <button onClick={() => setEditingId(null)} className="px-4 py-2 border border-gray-200 rounded text-xs font-bold uppercase">Cancelar</button>
                   </div>
                </div>
              ) : (
                <div className="flex items-center gap-6">
                   <div className="h-16 w-16 rounded-full bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                     {cat.imagem_url ? <img src={cat.imagem_url} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="h-6 w-6 text-gray-200" />}
                   </div>
                   <div className="flex-1">
                     <h3 className="font-bold text-gray-800">{cat.nome}</h3>
                     <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Ordem: {cat.ordem} | {cat.ativo ? 'Ativo' : 'Inativo'}</p>
                   </div>
                   <button onClick={() => handleEdit(cat)} className="p-2 text-gray-400 hover:text-[#2D1B4E] hover:bg-gray-100 rounded-lg transition-all"><Edit className="h-4 w-4" /></button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CategoryBanners;