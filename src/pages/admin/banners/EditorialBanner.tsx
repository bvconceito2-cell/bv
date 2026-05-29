import React, { useState, useEffect } from 'react';
import { Save, Loader2, ImageIcon, Plus, Trash2, Upload } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { BannerEditorial, Produto } from '../../../types/database';
import { toast } from 'sonner';

const EditorialBanner = () => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [banner, setBanner] = useState<Partial<BannerEditorial>>({
    titulo: '',
    subtitulo: '',
    imagem_url: '',
    texto_botao: '',
    link_botao: '',
    produtos_ids: [],
    ativo: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bannerRes, productsRes] = await Promise.all([
        supabase.from('banner_editorial').select('*').limit(1).maybeSingle(),
        supabase.from('produtos').select('id, nome').eq('ativo', true)
      ]);

      if (bannerRes.data) setBanner(bannerRes.data);
      setProducts(productsRes.data || []);
    } catch (error) {
      console.error('Error fetching editorial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const storagePath = `banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('banners')
        .getPublicUrl(storagePath);

      setBanner({ ...banner, imagem_url: publicUrl });
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
    try {
      setIsSaving(true);

      const { data: existing } = await supabase.from('banner_editorial').select('id').limit(1).maybeSingle();
      
      let res;
      if (existing) {
        res = await supabase.from('banner_editorial').update(banner as any).eq('id', existing.id);
      } else {
        res = await supabase.from('banner_editorial').insert([banner] as any);
      }

      if (res.error) throw res.error;

      toast.success('Banner editorial salvo!');
      fetchData();
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleProduct = (productId: number) => {
    const currentIds = banner.produtos_ids || [];
    if (currentIds.includes(productId)) {
      setBanner({ ...banner, produtos_ids: currentIds.filter(id => id !== productId) });
    } else {
      if (currentIds.length >= 4) {
        toast.warning('O grid aceita no máximo 4 produtos.');
        return;
      }
      setBanner({ ...banner, produtos_ids: [...currentIds, productId] });
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-[#2D1B4E]" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Banner Editorial</h1>
        <p className="text-sm text-gray-500">Configure a seção de grid editorial (ex: Coleção Jeans).</p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-widest border-b pb-4 mb-4">Informações do Banner</h3>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-gray-500 uppercase">Imagem de Fundo (Editorial)</label>
                <span className="text-[10px] font-black text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded">1000x1500px (2:3)</span>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-100 rounded text-[10px] text-blue-700 leading-relaxed mb-3">
                <strong>Comportamento:</strong> Vertical. Ocupa o lado esquerdo do grid editorial. <br/>
                <strong>Nota:</strong> O sistema aplicará um gradiente escuro na base para leitura do texto.
              </div>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="h-60 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-primary transition-all overflow-hidden"
              >
                {banner.imagem_url ? (
                  <img src={banner.imagem_url} className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Upload Editorial</span>
                  </>
                )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Título</label>
                <input 
                  type="text" 
                  value={banner.titulo || ''}
                  onChange={e => setBanner({...banner, titulo: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Subtítulo</label>
                <input 
                  type="text" 
                  value={banner.subtitulo || ''}
                  onChange={e => setBanner({...banner, subtitulo: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Texto do Botão</label>
                <input 
                  type="text" 
                  value={banner.texto_botao || ''}
                  onChange={e => setBanner({...banner, texto_botao: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Link do Botão</label>
                <input 
                  type="text" 
                  value={banner.link_botao || ''}
                  onChange={e => setBanner({...banner, link_botao: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-2">
              <input type="checkbox" checked={banner.ativo} onChange={e => setBanner({...banner, ativo: e.target.checked})} />
              <span className="text-xs font-bold text-gray-700 uppercase">Banner Ativo</span>
            </label>
          </div>

          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full bg-[#2D1B4E] text-white py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#1a0f2e] transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            SALVAR ALTERAÇÕES
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-widest border-b pb-4 mb-4">Produtos Vinculados (Max 4)</h3>
            
            <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {products.map(p => (
                <label key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-all">
                  <span className="text-sm text-gray-700">{p.nome}</span>
                  <input 
                    type="checkbox" 
                    checked={banner.produtos_ids?.includes(p.id)}
                    onChange={() => toggleProduct(p.id)}
                    className="rounded text-[#2D1B4E] focus:ring-[#2D1B4E]"
                  />
                </label>
              ))}
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
               <p className="text-[10px] text-blue-700 font-bold uppercase mb-1">Selecionados ({banner.produtos_ids?.length || 0}/4)</p>
               <div className="flex flex-wrap gap-2">
                 {banner.produtos_ids?.map(id => (
                   <span key={id} className="px-2 py-1 bg-white border border-blue-200 rounded text-[10px] font-bold text-blue-700">
                     ID: {id}
                   </span>
                 ))}
               </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditorialBanner;