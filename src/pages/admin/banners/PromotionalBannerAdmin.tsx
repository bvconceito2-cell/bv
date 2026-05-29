import React, { useState, useEffect, useRef } from 'react';
import { Save, Loader2, ImageIcon, Trash2, Upload, GripVertical, Check, Plus, ArrowLeft } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { BannerPromocional } from '../../../types/database';
import { toast } from 'sonner';

const PromotionalBannerAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [banners, setBanners] = useState<BannerPromocional[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [uploading, setUploading] = useState<'desktop' | 'mobile' | null>(null);
  
  const [formData, setFormData] = useState<Partial<BannerPromocional>>({
    titulo: '',
    subtitulo: '',
    imagem_desktop: '',
    imagem_mobile: '',
    texto_botao: '',
    link_botao: '',
    alinhamento: 'centro',
    overlay: false,
    cor_texto: '#ffffff',
    cor_botao: '#000000',
    ativo: true,
    ordem: 0
  });

  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('banners_promocionais')
        .select('*')
        .order('ordem', { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (error: any) {
      console.error('Error fetching promotional banners:', error);
      toast.error('Erro ao carregar banners promocionais');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'desktop' | 'mobile') => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(type);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const storagePath = `banners_promocionais/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('banners')
        .getPublicUrl(storagePath);

      if (type === 'desktop') {
        setFormData(prev => ({ ...prev, imagem_desktop: publicUrl }));
      } else {
        setFormData(prev => ({ ...prev, imagem_mobile: publicUrl }));
      }
      
      toast.success(`Imagem ${type} carregada!`);
    } catch (error: any) {
      toast.error('Erro no upload: ' + error.message);
    } finally {
      setUploading(null);
      if (event.target) event.target.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imagem_desktop || !formData.imagem_mobile) {
      toast.error('Imagens desktop e mobile são obrigatórias');
      return;
    }

    try {
      setIsSaving(true);
      
      if (editingId) {
        const { error } = await supabase
          .from('banners_promocionais')
          .update({
            titulo: formData.titulo,
            subtitulo: formData.subtitulo,
            imagem_desktop: formData.imagem_desktop,
            imagem_mobile: formData.imagem_mobile,
            texto_botao: formData.texto_botao,
            link_botao: formData.link_botao,
            alinhamento: formData.alinhamento,
            overlay: formData.overlay,
            cor_texto: formData.cor_texto,
            cor_botao: formData.cor_botao,
            ativo: formData.ativo,
            ordem: formData.ordem
          })
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Banner atualizado!');
      } else {
        const { error } = await supabase
          .from('banners_promocionais')
          .insert([{
            titulo: formData.titulo,
            subtitulo: formData.subtitulo,
            imagem_desktop: formData.imagem_desktop,
            imagem_mobile: formData.imagem_mobile,
            texto_botao: formData.texto_botao,
            link_botao: formData.link_botao,
            alinhamento: formData.alinhamento,
            overlay: formData.overlay,
            cor_texto: formData.cor_texto,
            cor_botao: formData.cor_botao,
            ativo: formData.ativo,
            ordem: formData.ordem
          }]);
        if (error) throw error;
        toast.success('Banner criado!');
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({
        titulo: '',
        subtitulo: '',
        imagem_desktop: '',
        imagem_mobile: '',
        texto_botao: '',
        link_botao: '',
        alinhamento: 'centro',
        overlay: false,
        cor_texto: '#ffffff',
        cor_botao: '#000000',
        ativo: true,
        ordem: 0
      });
      fetchBanners();
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (banner: BannerPromocional) => {
    setFormData(banner);
    setEditingId(banner.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    
    try {
      const { error } = await supabase.from('banners_promocionais').delete().eq('id', id);
      if (error) throw error;
      toast.success('Banner excluído!');
      fetchBanners();
    } catch (error: any) {
      toast.error('Erro ao excluir');
    }
  };

  const toggleStatus = async (banner: BannerPromocional) => {
    try {
      const { error } = await supabase
        .from('banners_promocionais')
        .update({ ativo: !banner.ativo })
        .eq('id', banner.id);
      if (error) throw error;
      fetchBanners();
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  if (loading && banners.length === 0) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin text-[#04548c]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Banner Promocional Full</h1>
          <p className="text-sm text-gray-500">Banners horizontais de alta conversão para a home.</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => {
              setEditingId(null);
              setFormData({
                titulo: '',
                subtitulo: '',
                imagem_desktop: '',
                imagem_mobile: '',
                texto_botao: '',
                link_botao: '',
                alinhamento: 'centro',
                overlay: false,
                cor_texto: '#ffffff',
                cor_botao: '#000000',
                ativo: true,
                ordem: banners.length
              });
              setShowForm(true);
            }}
            className="bg-[#04548c] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#1a0f2e] transition-all"
          >
            <Plus className="h-4 w-4" /> ADICIONAR NOVO
          </button>
        )}
      </div>

      {showForm ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <button 
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-xs font-bold uppercase"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
              {editingId ? 'Editar Banner' : 'Novo Banner'}
            </h3>
          </div>

          <form onSubmit={handleSave} className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Imagens</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-gray-500 uppercase">Desktop</label>
                      <span className="text-[9px] font-black text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded">1920x420px</span>
                    </div>
                    <div 
                      onClick={() => desktopInputRef.current?.click()}
                      className="h-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-primary transition-all overflow-hidden relative group"
                    >
                      {uploading === 'desktop' ? (
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                      ) : formData.imagem_desktop ? (
                        <>
                          <img src={formData.imagem_desktop} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Upload className="text-white h-5 w-5" />
                          </div>
                        </>
                      ) : (
                        <>
                          <Upload className="h-6 w-6 text-gray-400" />
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Upload Desktop</span>
                        </>
                      )}
                    </div>
                    <input type="file" ref={desktopInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'desktop')} />
                    <p className="text-[9px] text-gray-400 font-medium leading-tight">Proporção wide. Ideal para faixas de promoção.</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-gray-500 uppercase">Mobile</label>
                      <span className="text-[9px] font-black text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded">800x450px (16:9)</span>
                    </div>
                    <div 
                      onClick={() => mobileInputRef.current?.click()}
                      className="h-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-primary transition-all overflow-hidden relative group"
                    >
                      {uploading === 'mobile' ? (
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                      ) : formData.imagem_mobile ? (
                        <>
                          <img src={formData.imagem_mobile} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Upload className="text-white h-5 w-5" />
                          </div>
                        </>
                      ) : (
                        <>
                          <Upload className="h-6 w-6 text-gray-400" />
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Upload Mobile</span>
                        </>
                      )}
                    </div>
                    <input type="file" ref={mobileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'mobile')} />
                    <p className="text-[9px] text-gray-400 font-medium leading-tight">Proporção retangular horizontal para mobile.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Título</label>
                  <input 
                    type="text" 
                    value={formData.titulo || ''}
                    onChange={e => setFormData({...formData, titulo: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-[#04548c] outline-none"
                    placeholder="Ex: Coleção Inverno"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Subtítulo</label>
                  <input 
                    type="text" 
                    value={formData.subtitulo || ''}
                    onChange={e => setFormData({...formData, subtitulo: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-[#04548c] outline-none"
                    placeholder="Ex: Até 50% OFF"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Texto do Botão</label>
                  <input 
                    type="text" 
                    value={formData.texto_botao || ''}
                    onChange={e => setFormData({...formData, texto_botao: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-[#04548c] outline-none"
                    placeholder="Ex: Ver agora"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Link do Botão</label>
                  <input 
                    type="text" 
                    value={formData.link_botao || ''}
                    onChange={e => setFormData({...formData, link_botao: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-[#04548c] outline-none"
                    placeholder="Ex: /categoria/inverno"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Aparência & Alinhamento</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Alinhamento</label>
                    <select 
                      value={formData.alinhamento}
                      onChange={e => setFormData({...formData, alinhamento: e.target.value as any})}
                      className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-[#04548c] outline-none"
                    >
                      <option value="esquerda">Esquerda</option>
                      <option value="centro">Centro</option>
                      <option value="direita">Direita</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Ordem</label>
                    <input 
                      type="number" 
                      value={formData.ordem}
                      onChange={e => setFormData({...formData, ordem: parseInt(e.target.value)})}
                      className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-[#04548c] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Cor do Texto</label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={formData.cor_texto}
                        onChange={e => setFormData({...formData, cor_texto: e.target.value})}
                        className="h-10 w-10 rounded cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={formData.cor_texto}
                        onChange={e => setFormData({...formData, cor_texto: e.target.value})}
                        className="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-[#04548c] outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Cor do Botão</label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={formData.cor_botao}
                        onChange={e => setFormData({...formData, cor_botao: e.target.value})}
                        className="h-10 w-10 rounded cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={formData.cor_botao}
                        onChange={e => setFormData({...formData, cor_botao: e.target.value})}
                        className="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-[#04548c] outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-10 h-6 rounded-full relative transition-colors ${formData.overlay ? 'bg-[#04548c]' : 'bg-gray-200'}`}>
                      <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${formData.overlay ? 'translate-x-4' : ''}`} />
                    </div>
                    <input type="checkbox" className="hidden" checked={formData.overlay} onChange={e => setFormData({...formData, overlay: e.target.checked})} />
                    <span className="text-xs font-bold text-gray-700 uppercase">Overlay Escuro</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-10 h-6 rounded-full relative transition-colors ${formData.ativo ? 'bg-green-500' : 'bg-gray-200'}`}>
                      <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${formData.ativo ? 'translate-x-4' : ''}`} />
                    </div>
                    <input type="checkbox" className="hidden" checked={formData.ativo} onChange={e => setFormData({...formData, ativo: e.target.checked})} />
                    <span className="text-xs font-bold text-gray-700 uppercase">Status Ativo</span>
                  </label>
                </div>
              </div>

              <div className="pt-6">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="w-full bg-[#04548c] text-white py-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#1a0f2e] transition-all disabled:opacity-50 shadow-lg"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {editingId ? 'ATUALIZAR BANNER' : 'CRIAR BANNER'}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {banners.length === 0 ? (
            <div className="bg-white p-20 rounded-xl border border-dashed border-gray-200 text-center space-y-4">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <ImageIcon className="h-8 w-8 text-gray-300" />
              </div>
              <div>
                <h3 className="text-gray-800 font-bold">Nenhum banner promocional</h3>
                <p className="text-sm text-gray-500">Adicione banners horizontais para destacar coleções ou promoções.</p>
              </div>
            </div>
          ) : (
            banners.map((banner) => (
              <div key={banner.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-6 group hover:border-[#04548c]/30 transition-all">
                <div className="h-20 w-40 rounded-lg bg-gray-50 overflow-hidden shrink-0 border border-gray-100 shadow-inner">
                  <img src={banner.imagem_desktop} alt="" className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-800 truncate">{banner.titulo || 'Sem título'}</h3>
                    {!banner.ativo && <span className="bg-gray-100 text-gray-400 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Inativo</span>}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{banner.subtitulo || 'Sem subtítulo'}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Ordem: {banner.ordem}</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Alinhamento: {banner.alinhamento}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleStatus(banner)}
                    className={`p-2 rounded-lg transition-all ${banner.ativo ? 'text-green-500 bg-green-50' : 'text-gray-400 bg-gray-50'}`}
                    title="Toggle Status"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleEdit(banner)}
                    className="p-2 text-gray-400 hover:text-[#04548c] hover:bg-gray-50 rounded-lg transition-all"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(banner.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// Internal Edit icon for the list since I didn't import it globally
const Edit = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
);

export default PromotionalBannerAdmin;
