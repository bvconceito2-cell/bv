import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Plus, Trash2, Image as ImageIcon, Check, Loader2, X, Video, Play, GripVertical, Star } from 'lucide-react';
import { productsService } from '../../../services/productsService';
import { categoriesService } from '../../../services/categoriesService';
import * as storageService from '../../../services/storageService';
import { generateSlug } from '../../../utils/helpers';
import { toast } from 'sonner';

interface MediaItem {
  url: string;
  path: string;
  tipo: 'imagem' | 'video';
  principal: boolean;
  ordem: number;
}

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('basicas');
  const [categories, setCategories] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<any>({
    nome: '',
    marca: 'LOJA',
    categoria_id: '',
    descricao: '',
    preco_original: 0,
    preco_atual: 0,
    parcelas: 5,
    estoque: 0,
    ativo: true,
    destaque: false,
    novidade: false,
    imagens: [],
    midias: [],
    imagem_principal: '',
    cores: [], 
    tamanhos: [],
    detalhes: {},
    estoque_por_variacao: {},
    meta_title: '',
    meta_description: '',
    slug: '',
    peso: 0.3,
    altura: 4,
    largura: 12,
    comprimento: 17
  });

  useEffect(() => {
    fetchCategories();
    if (isEditing) fetchProduct();
  }, [id]);

  const fetchCategories = async () => {
    try {
      const data = await categoriesService.list();
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const data = await productsService.getById(id!);
      if (data) {
        setFormData({
          ...data,
          categoria_id: data.categoria_id?.toString() || '',
          cores: data.cores || [],
          tamanhos: data.tamanhos || [],
          imagens: data.imagens || [],
          midias: data.midias || [],
          imagem_principal: data.imagem_principal || '',
          detalhes: data.detalhes || {},
          estoque_por_variacao: data.estoque_por_variacao || {},
          peso: (data as any).peso || 0.3,
          altura: (data as any).altura || 4,
          largura: (data as any).largura || 12,
          comprimento: (data as any).comprimento || 17
        });
      }
    } catch (error) {
      toast.error('Erro ao carregar produto');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'imagem' | 'video') => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newMedia: any[] = [...(formData.midias || [])];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      

      // Validações
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (type === 'imagem' && !isImage) {
        toast.error(`${file.name} não é uma imagem válida.`);
        continue;
      }
      if (type === 'video' && !isVideo) {
        toast.error(`${file.name} não é um vídeo válido.`);
        continue;
      }

      const maxSize = type === 'imagem' ? 5 * 1024 * 1024 : 20 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`${file.name} excede o limite de ${type === 'imagem' ? '5MB' : '20MB'}.`);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);

      const isPrincipal = newMedia.length === 0 && type === 'imagem';

      newMedia.push({
        url: previewUrl,
        file: file, // Store file for later upload
        tipo: type,
        principal: isPrincipal,
        ordem: newMedia.length + 1
      });

      if (isPrincipal) {
        setFormData((prev: any) => ({ ...prev, imagem_principal: previewUrl }));
      }
    }

    setFormData((prev: any) => ({ ...prev, midias: newMedia }));
    if (event.target) event.target.value = '';
  };

  const removeMedia = async (index: number) => {
    const mediaToRemove = formData.midias[index];
    const newMedia = formData.midias.filter((_: any, i: number) => i !== index);
    
    try {
      // Se tiver path, significa que já está no storage e deve ser removido
      if (mediaToRemove.path) {
        await storageService.deleteFile('produtos', mediaToRemove.path);
      }

      // Se tiver um previewUrl (blob), revogar para liberar memória
      if (mediaToRemove.url && mediaToRemove.url.startsWith('blob:')) {
        URL.revokeObjectURL(mediaToRemove.url);
      }

      let newMainImage = formData.imagem_principal;
      if (mediaToRemove.principal) {
        const nextImage = newMedia.find((m: any) => m.tipo === 'imagem');
        if (nextImage) {
          nextImage.principal = true;
          newMainImage = nextImage.url;
        } else {
          newMainImage = '';
        }
      }

      setFormData({ 
        ...formData, 
        midias: newMedia,
        imagem_principal: newMainImage
      });
      toast.success('Mídia removida');
    } catch (error) {
      toast.error('Erro ao remover mídia');
    }
  };

  const setAsPrincipal = (index: number) => {
    const newMedia = formData.midias.map((m: any, i: number) => ({
      ...m,
      principal: i === index
    }));
    setFormData({ 
      ...formData, 
      midias: newMedia,
      imagem_principal: newMedia[index].url 
    });
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!formData.nome) return toast.error('Nome do produto é obrigatório');
    if (!formData.midias || formData.midias.length === 0) return toast.error('Adicione pelo menos uma imagem');

    try {
      setLoading(true);
      
      const uploadedMidias = [...formData.midias];
      
      // Realizar uploads pendentes
      for (let i = 0; i < uploadedMidias.length; i++) {
        const media = uploadedMidias[i];
        if (media.file) {
          const fileExt = media.file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const storagePath = `produtos/${id || 'new'}/${fileName}`;
          
          await storageService.uploadToStorage('produtos', storagePath, media.file);
          const finalPublicUrl = storageService.getPublicUrl('produtos', storagePath);
          

          uploadedMidias[i] = {
            ...media,
            url: finalPublicUrl,
            path: storagePath,
            file: undefined // Remover o arquivo após upload
          };
        }
      }

      const imageUrls = uploadedMidias
        .filter((m: any) => m.tipo === 'imagem')
        .map((m: any) => m.url);
      
      const mainImageUrl = uploadedMidias.find((m: any) => m.principal)?.url || imageUrls[0] || '';

      // Payload final conforme solicitado
      const payload = {
        nome: formData.nome,
        slug: formData.slug || generateSlug(formData.nome),
        marca: formData.marca || 'LOJA',
        categoria_id: formData.categoria_id ? parseInt(formData.categoria_id) : null,
        descricao: formData.descricao,
        preco_original: Number(formData.preco_original) || 0,
        preco_atual: Number(formData.preco_atual) || 0,
        parcelas: parseInt(formData.parcelas) || 1,
        cores: formData.cores,
        tamanhos: formData.tamanhos,
        imagens: imageUrls,
        imagem_principal: mainImageUrl,
        midias: uploadedMidias.map(({ file, ...rest }) => rest), // Remover File da midias
        estoque: parseInt(formData.estoque) || 0,
        destaque: formData.destaque,
        novidade: formData.novidade,
        ativo: formData.ativo,
        detalhes: formData.detalhes,
        peso: Number(formData.peso) || 0.3,
        altura: Number(formData.altura) || 4,
        largura: Number(formData.largura) || 12,
        comprimento: Number(formData.comprimento) || 17,
        updated_at: new Date().toISOString()
      };


      let produtoSalvo;
      try {
        if (isEditing) {
          produtoSalvo = await productsService.update(id!, payload);
        } else {
          produtoSalvo = await productsService.create(payload);
        }
      } catch (err) {
        console.error('ERRO NO SUPABASE:', err);
        throw err;
      }

      toast.success(isEditing ? 'Produto atualizado!' : 'Produto criado!');
      navigate('/admin/produtos');
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };


  const addColor = () => {
    setFormData({
      ...formData,
      cores: [...formData.cores, { nome: '', hex: '#000000', imagem: '' }]
    });
  };

  const removeColor = (idx: number) => {
    setFormData({
      ...formData,
      cores: formData.cores.filter((_: any, i: number) => i !== idx)
    });
  };

  const toggleTamanho = (t: string) => {
    const current = formData.tamanhos || [];
    if (current.includes(t)) {
      setFormData({ ...formData, tamanhos: current.filter((item: string) => item !== t) });
    } else {
      setFormData({ ...formData, tamanhos: [...current, t] });
    }
  };

  const tabs = [
    { id: 'basicas', label: 'Informações Básicas' },
    { id: 'estoque', label: 'Preços e Estoque' },
    { id: 'variacoes', label: 'Variações' },
    { id: 'midia', label: 'Mídia e Imagens' },
    { id: 'frete', label: 'Dimensões e Frete' },
    { id: 'detalhes', label: 'Detalhes Técnicos' },
    { id: 'seo', label: 'SEO' }
  ];

  if (loading && isEditing) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-[#2D1B4E]" /></div>;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => navigate('/admin/produtos')} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{isEditing ? 'Editar Produto' : 'Novo Produto'}</h1>
            <p className="text-sm text-gray-500">Gerencie todos os detalhes da peça.</p>
          </div>
        </div>
        <button 
          type="submit"
          disabled={loading}
          className="bg-[#2D1B4E] text-white px-8 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#1a0f2e] transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          SALVAR PRODUTO
        </button>
      </div>

      <div className="flex gap-2 border-b border-gray-100 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-4 text-xs font-bold uppercase tracking-widest whitespace-nowrap border-b-2 transition-all ${
              activeTab === tab.id ? 'border-[#2D1B4E] text-[#2D1B4E]' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm min-h-[400px]">
        {activeTab === 'basicas' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nome do Produto</label>
              <input 
                type="text" 
                value={formData.nome} 
                onChange={e => {
                  const newName = e.target.value;
                  const newSlug = generateSlug(newName);
                  setFormData({
                    ...formData, 
                    nome: newName, 
                    slug: formData.slug === generateSlug(formData.nome) || !formData.slug ? newSlug : formData.slug,
                    meta_title: formData.meta_title === `${formData.nome} | LOJA` || !formData.meta_title ? `${newName} | LOJA` : formData.meta_title
                  });
                }} 
                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 text-sm" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Marca</label>
              <input 
                type="text" 
                value={formData.marca} 
                onChange={e => setFormData({...formData, marca: e.target.value})} 
                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 text-sm" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Categoria</label>
              <select 
                value={formData.categoria_id} 
                onChange={e => setFormData({...formData, categoria_id: e.target.value})} 
                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 text-sm"
              >
                <option value="">Selecione...</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Descrição</label>
              <textarea 
                rows={6} 
                value={formData.descricao} 
                onChange={e => {
                  const newDesc = e.target.value;
                  setFormData({
                    ...formData, 
                    descricao: newDesc,
                    meta_description: formData.meta_description === formData.descricao.slice(0, 160) || !formData.meta_description ? newDesc.slice(0, 160) : formData.meta_description
                  });
                }} 
                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 text-sm" 
              />
            </div>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.ativo} 
                  onChange={e => setFormData({...formData, ativo: e.target.checked})} 
                  className="w-4 h-4 rounded text-[#2D1B4E]" 
                />
                <span className="text-xs font-bold text-gray-700 uppercase">Ativo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.destaque} 
                  onChange={e => setFormData({...formData, destaque: e.target.checked})} 
                  className="w-4 h-4 rounded text-[#2D1B4E]" 
                />
                <span className="text-xs font-bold text-gray-700 uppercase">Destaque na Home</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.novidade} 
                  onChange={e => setFormData({...formData, novidade: e.target.checked})} 
                  className="w-4 h-4 rounded text-[#2D1B4E]" 
                />
                <span className="text-xs font-bold text-gray-700 uppercase">Novidade</span>
              </label>
            </div>
          </div>
        )}

        {activeTab === 'frete' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Peso (kg)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.peso} 
                  onChange={e => setFormData({...formData, peso: e.target.value})} 
                  className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 text-sm" 
                  placeholder="Ex: 0.3"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Altura (cm)</label>
                <input 
                  type="number" 
                  value={formData.altura} 
                  onChange={e => setFormData({...formData, altura: e.target.value})} 
                  className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 text-sm" 
                  placeholder="Ex: 4"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Largura (cm)</label>
                <input 
                  type="number" 
                  value={formData.largura} 
                  onChange={e => setFormData({...formData, largura: e.target.value})} 
                  className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 text-sm" 
                  placeholder="Ex: 12"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Comprimento (cm)</label>
                <input 
                  type="number" 
                  value={formData.comprimento} 
                  onChange={e => setFormData({...formData, comprimento: e.target.value})} 
                  className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 text-sm" 
                  placeholder="Ex: 17"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 italic">Estes valores são utilizados para o cálculo de frete no checkout.</p>
          </div>
        )}

        {activeTab === 'estoque' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Preço Original (De:)</label>
              <input 
                type="text" 
                placeholder="0.00"
                value={formData.preco_original} 
                onChange={e => setFormData({...formData, preco_original: e.target.value.replace(',', '.')})} 
                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 text-sm" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Preço Atual (Por:)</label>
              <input 
                type="text" 
                placeholder="0.00"
                value={formData.preco_atual} 
                onChange={e => setFormData({...formData, preco_atual: e.target.value.replace(',', '.')})} 
                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 text-sm" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Parcelas Max (Sem juros)</label>
              <select 
                value={formData.parcelas} 
                onChange={e => setFormData({...formData, parcelas: parseInt(e.target.value)})} 
                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 text-sm"
              >
                {[1,2,3,4,5,6,10,12].map(v => <option key={v} value={v}>{v}x</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Estoque Total</label>
              <input 
                type="number" 
                value={formData.estoque} 
                onChange={e => setFormData({...formData, estoque: e.target.value})} 
                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 text-sm" 
              />
            </div>

          </div>
        )}

        {activeTab === 'variacoes' && (
          <div className="space-y-8">
             <section>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cores Disponíveis</h3>
                  <button type="button" onClick={addColor} className="text-[10px] font-bold text-[#2D1B4E] uppercase flex items-center gap-1"><Plus className="h-3 w-3" /> Adicionar Cor</button>
                </div>
                <div className="space-y-3">
                  {formData.cores.map((color: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                       <input type="color" value={color.hex} onChange={e => {
                         const newCores = [...formData.cores];
                         newCores[idx].hex = e.target.value;
                         setFormData({...formData, cores: newCores});
                       }} className="w-10 h-10 cursor-pointer rounded border border-gray-200" />
                       <input type="text" placeholder="Nome da Cor" value={color.nome} onChange={e => {
                         const newCores = [...formData.cores];
                         newCores[idx].nome = e.target.value;
                         setFormData({...formData, cores: newCores});
                       }} className="flex-1 bg-white border border-gray-200 rounded px-3 py-2 text-sm" />
                       <button type="button" onClick={() => removeColor(idx)} className="p-2 text-red-400 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
             </section>

             <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Tamanhos Disponíveis</h3>
                <div className="flex flex-wrap gap-2">
                   {['PP', 'P', 'M', 'G', 'GG', 'XG', '34', '36', '38', '40', '42', '44', '46', '48'].map(t => (
                     <button 
                       key={t}
                       type="button"
                       onClick={() => toggleTamanho(t)}
                       className={`px-4 py-2 rounded border text-xs font-bold transition-all ${
                         formData.tamanhos?.includes(t) ? 'bg-[#2D1B4E] text-white border-[#2D1B4E]' : 'bg-white text-gray-400 border-gray-200 hover:border-[#2D1B4E]'
                       }`}
                     >
                       {t}
                     </button>
                   ))}
                </div>
             </section>
          </div>
        )}

        {activeTab === 'midia' && (
          <div className="space-y-6">
             <div className="flex gap-4 mb-8">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex-1 border-2 border-dashed border-gray-200 p-6 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-[#2D1B4E] hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="h-6 w-6 animate-spin text-[#2D1B4E]" /> : <ImageIcon className="h-6 w-6 text-gray-400" />}
                  <span className="text-xs font-bold uppercase tracking-widest">Carregar Imagens</span>
                  <span className="text-[10px] text-gray-400">JPG, PNG, WEBP até 5MB</span>
                </button>
                
                <button 
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploading}
                  className="flex-1 border-2 border-dashed border-gray-200 p-6 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-[#2D1B4E] hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="h-6 w-6 animate-spin text-[#2D1B4E]" /> : <Video className="h-6 w-6 text-gray-400" />}
                  <span className="text-xs font-bold uppercase tracking-widest">Vídeo Curto</span>
                  <span className="text-[10px] text-gray-400">MP4, WEBM até 20MB</span>
                </button>

                <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'imagem')} accept="image/*,video/mp4,video/webm,video/quicktime" multiple className="hidden" />
                <input type="file" ref={videoInputRef} onChange={(e) => handleFileUpload(e, 'video')} accept="video/mp4,video/webm,video/quicktime" className="hidden" />
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {formData.midias?.map((media: any, idx: number) => (
                  <div key={idx} className={`aspect-[3/4] relative group rounded-lg overflow-hidden border-2 transition-all ${media.principal ? 'border-[#C9A96E]' : 'border-gray-100 shadow-sm'}`}>
                    {media.tipo === 'imagem' ? (
                      <img src={media.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-900 flex items-center justify-center relative">
                        <video src={media.url} className="w-full h-full object-cover opacity-60" />
                        <Play className="h-8 w-8 text-white absolute" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                       {!media.principal && media.tipo === 'imagem' && (
                         <button 
                           type="button"
                           onClick={() => setAsPrincipal(idx)}
                           className="w-full py-1.5 bg-white text-gray-900 text-[10px] font-bold rounded uppercase flex items-center justify-center gap-1"
                         >
                           <Check className="h-3 w-3" /> Principal
                         </button>
                       )}
                       <button 
                          type="button"
                          onClick={() => removeMedia(idx)}
                         className="w-full py-1.5 bg-red-500 text-white text-[10px] font-bold rounded uppercase flex items-center justify-center gap-1"
                       >
                         <Trash2 className="h-3 w-3" /> Excluir
                       </button>
                     </div>

                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {media.principal && <span className="bg-[#C9A96E] text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm">PRINCIPAL</span>}
                      <span className="bg-white/90 backdrop-blur-sm text-gray-900 text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1 uppercase">
                        {media.tipo === 'imagem' ? <ImageIcon className="h-2 w-2" /> : <Video className="h-2 w-2" />}
                        {media.tipo}
                      </span>
                    </div>
                  </div>
                ))}
             </div>
             <p className="text-[10px] text-gray-400 font-medium">* Arraste as imagens para reordenar (em breve). A mídia principal será usada como capa.</p>
          </div>
        )}

        {activeTab === 'detalhes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {['Modelagem', 'Composição', 'Feito em', 'Cuidados', 'Tecido', 'Decote', 'Comprimento', 'Tabela de Medidas'].map(field => (
               <div key={field}>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{field}</label>
                  <input 
                    type="text" 
                    value={formData.detalhes?.[field] || ''} 
                    onChange={e => setFormData({...formData, detalhes: { ...formData.detalhes, [field]: e.target.value }})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 text-sm" 
                  />
               </div>
             ))}
          </div>
        )}

        {activeTab === 'seo' && (
          <div className="space-y-6">
             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Slug da URL (Opcional)</label>
                <input type="text" placeholder="ex: vestido-midi-seda-rose" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 text-sm" />
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Meta Title</label>
                <input type="text" value={formData.meta_title} onChange={e => setFormData({...formData, meta_title: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 text-sm" />
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Meta Description</label>
                <textarea rows={3} value={formData.meta_description} onChange={e => setFormData({...formData, meta_description: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 text-sm" />
             </div>
          </div>
        )}
      </div>
    </form>
  );
};

export default ProductForm;