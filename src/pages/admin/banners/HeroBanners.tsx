import React, { useState, useEffect, useRef } from 'react';
import { ImageIcon, Plus, GripVertical, Edit, Trash2, Loader2, Save, ArrowLeft, Upload } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { BannerHero } from '../../../types/database';
import { toast } from 'sonner';

const HeroBanners = () => {
  const [banners, setBanners] = useState<BannerHero[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBanner, setEditingBanner] = useState<Partial<BannerHero> | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputDesktopRef = useRef<HTMLInputElement>(null);
  const fileInputMobileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('banners_hero')
        .select('*')
        .order('ordem', { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (error: any) {
      console.error('Error fetching banners:', error);
      toast.error('Erro ao carregar banners');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, field: 'imagem_desktop' | 'imagem_mobile') => {
    const file = event.target.files?.[0];
    if (!file || !editingBanner) return;

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

      setEditingBanner((prev: any) => {
        if (!prev) return prev;

        return {
          ...prev,
          [field]: publicUrl,
          imagem_desktop:
            field === 'imagem_desktop'
              ? publicUrl
              : prev.imagem_desktop || publicUrl,
          imagem_mobile:
            field === 'imagem_mobile'
              ? publicUrl
              : prev.imagem_mobile || publicUrl
        };
      });

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
    if (!editingBanner) return;

    const imagemDesktop = editingBanner.imagem_desktop || editingBanner.imagem_mobile || '';
    const imagemMobile = editingBanner.imagem_mobile || editingBanner.imagem_desktop || '';

    if (!imagemDesktop) {
      toast.error('É necessário enviar pelo menos uma imagem para o banner.');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...editingBanner,
        imagem_desktop: imagemDesktop,
        imagem_mobile: imagemMobile,
        ordem: editingBanner.ordem || banners.length + 1,
        ativo: editingBanner.ativo !== false
      };

      let res;

      if (editingBanner.id) {
        res = await supabase
          .from('banners_hero')
          .update(payload as any)
          .eq('id', editingBanner.id);
      } else {
        res = await supabase
          .from('banners_hero')
          .insert([payload] as any);
      }

      if (res.error) throw res.error;

      toast.success('Banner salvo com sucesso!');
      setEditingBanner(null);
      fetchBanners();
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, titulo?: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o banner ${titulo ? `"${titulo}"` : ''}?`)) return;

    try {
      setLoading(true);
      const { error } = await supabase.from('banners_hero').delete().eq('id', id);
      if (error) throw error;
      toast.success('Banner excluído!');
      fetchBanners();
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (editingBanner) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setEditingBanner(null)} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{editingBanner.id ? 'Editar Slide' : 'Novo Slide'}</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
              Dica: se enviar apenas uma imagem, ela será usada automaticamente no Desktop e no Mobile.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase">Imagem Desktop</label>
                  <span className="text-[10px] font-black text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded">1920x700px</span>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-100 rounded text-[10px] text-blue-700 leading-relaxed mb-3">
                  <strong>Comportamento:</strong> object-cover com crop lateral. <br/>
                  <strong>Área Segura:</strong> mantenha textos e rostos nos 1400px centrais.
                </div>
                <div
                  onClick={() => fileInputDesktopRef.current?.click()}
                  className="h-48 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-primary transition-all overflow-hidden relative group"
                >
                  {editingBanner.imagem_desktop ? (
                    <>
                      <img src={editingBanner.imagem_desktop} className="w-full h-full object-cover" />
                      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[72%] border-x border-white/30 border-dashed pointer-events-none">
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[8px] px-1 rounded">ÁREA SEGURA</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-gray-400" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Upload Desktop</span>
                    </>
                  )}
                </div>
                <input type="file" ref={fileInputDesktopRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'imagem_desktop')} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase">Imagem Mobile</label>
                  <span className="text-[10px] font-black text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded">1080x1350px</span>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-100 rounded text-[10px] text-blue-700 leading-relaxed mb-3">
                  <strong>Comportamento:</strong> preenche a tela mobile. <br/>
                  <strong>Dica:</strong> se não enviar, usaremos a imagem Desktop.
                </div>
                <div
                  onClick={() => fileInputMobileRef.current?.click()}
                  className="h-48 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-primary transition-all overflow-hidden"
                >
                  {editingBanner.imagem_mobile ? (
                    <img src={editingBanner.imagem_mobile} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-gray-400" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Upload Mobile</span>
                    </>
                  )}
                </div>
                <input type="file" ref={fileInputMobileRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'imagem_mobile')} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Título</label>
              <input
                type="text"
                value={editingBanner.titulo || ''}
                onChange={e => setEditingBanner({ ...editingBanner, titulo: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Subtítulo</label>
              <input
                type="text"
                value={editingBanner.subtitulo || ''}
                onChange={e => setEditingBanner({ ...editingBanner, subtitulo: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Texto do Botão</label>
              <input
                type="text"
                value={editingBanner.texto_botao || ''}
                onChange={e => setEditingBanner({ ...editingBanner, texto_botao: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Link do Botão</label>
              <input
                type="text"
                value={editingBanner.link_botao || ''}
                onChange={e => setEditingBanner({ ...editingBanner, link_botao: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Cor do Botão</label>
              <input
                type="color"
                value={editingBanner.cor_botao || '#8B3A6B'}
                onChange={e => setEditingBanner({ ...editingBanner, cor_botao: e.target.value })}
                className="h-10 w-full cursor-pointer rounded border border-gray-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Posição do Texto</label>
              <select
                value={editingBanner.posicao_texto || 'esquerda'}
                onChange={e => setEditingBanner({ ...editingBanner, posicao_texto: e.target.value as any })}
                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm"
              >
                <option value="esquerda">Esquerda</option>
                <option value="centro">Centro</option>
                <option value="direita">Direita</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button type="button" onClick={() => setEditingBanner(null)} className="px-6 py-2 border border-gray-200 rounded-lg text-sm font-bold">
              CANCELAR
            </button>
            <button disabled={uploading || loading} type="submit" className="bg-[#2D1B4E] text-white px-8 py-2 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-60">
              {uploading || loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              SALVAR SLIDE
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
          <h1 className="text-2xl font-bold text-gray-800">Banner Hero (Carrossel)</h1>
          <p className="text-sm text-gray-500">Gerencie os slides principais da página inicial.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingBanner({ ativo: true, ordem: banners.length + 1 });
          }}
          className="bg-[#2D1B4E] text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#1a0f2e] transition-all shadow-sm"
        >
          <Plus className="h-4 w-4" /> ADICIONAR SLIDE
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex justify-center p-20">
            <Loader2 className="animate-spin text-[#2D1B4E]" />
          </div>
        ) : banners.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm text-center text-gray-500">
            Nenhum banner cadastrado.
          </div>
        ) : (
          banners.map((banner) => (
            <div key={banner.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-6 group hover:border-[#2D1B4E]/30 transition-all">
              <div className="cursor-grab p-1 text-gray-300">
                <GripVertical className="h-5 w-5" />
              </div>

              <div className="h-24 w-48 rounded-lg bg-gray-50 overflow-hidden shrink-0 border border-gray-100 shadow-inner">
                <img src={banner.imagem_desktop || banner.imagem_mobile} alt="" className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 space-y-1">
                <h3 className="font-bold text-gray-800">{banner.titulo || 'Sem título'}</h3>
                <p className="text-xs text-gray-400 line-clamp-1">{banner.subtitulo}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Ordem: {banner.ordem}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${banner.ativo ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    {banner.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setEditingBanner(banner)} className="p-2 text-gray-400 hover:text-[#2D1B4E] hover:bg-gray-100 rounded-lg transition-all">
                  <Edit className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(banner.id, banner.titulo)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HeroBanners;
