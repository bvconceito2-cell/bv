import React, { useState, useEffect } from 'react';
import { Palette, Layout, Type, Image as ImageIcon, Check, RefreshCw, Loader2, Upload, Trash2, Globe } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { uploadToStorage, getPublicUrl } from '../../../services/storageService';
import { useStore } from '../../../store/useStore';

const Appearance = () => {
  const { fetchFromSupabase }: any = useStore();

  const [activeTab, setActiveTab] = useState('colors');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [coresPrimarias, setCoresPrimarias] = useState({
    brand: '#04548c',
    background: '#ffffff',
    text: '#111111',
    highlight: '#22c55e'
  });

  // Internal state for backward compatibility if needed, but not persisted to DB
  const [colors] = useState({
    brand: '#04548c',
    background: '#ffffff',
    text: '#111111',
    highlight: '#22c55e'
  });

  const [fonts, setFonts] = useState({
    heading: 'Outfit',
    body: 'Outfit'
  });

  const [layout, setLayout] = useState({
    card_radius: 12,
    button_radius: 8,
    header_font: 'Outfit',
    header_weight: '900',
    header_spacing: '0.2',
    header_transform: 'uppercase',
    header_size: '14',
    container_mode: 'centralizado',
    max_width: 1400,
    card_shadow: 'sm',
    section_spacing: 64,
    grid_spacing: 24,
    header_height: 80
  });

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [logoWidth, setLogoWidth] = useState({
    desktop: 180,
    mobile: 120
  });

  useEffect(() => {
    fetchAppearance();
  }, []);

  const fetchAppearance = async () => {
    try {
      // 1. Tentar buscar registro com ID 1
      let { data, error } = await supabase.from('aparencia').select('*').eq('id', 1).maybeSingle();
      
      // 2. Se não encontrar, tentar buscar a primeira linha disponível
      if (!data && !error) {
        const { data: firstRow } = await supabase.from('aparencia').select('*').limit(1).maybeSingle();
        data = firstRow;
      }

      // 3. Se ainda não existir nada, o handleSave criará o primeiro registro
      if (data) {
        if ((data as any).cores_primarias) setCoresPrimarias(prev => ({ ...prev, ...((data as any).cores_primarias as any) }));
        if (data.fontes) setFonts(prev => ({ ...prev, ...(data.fontes as any) }));
        if ((data as any).layout) setLayout(prev => ({ ...prev, ...((data as any).layout as any) }));
        setLogoUrl(data.logo_url);
        setFaviconUrl(data.favicon_url);
        
        const configLogo = (data as any).config_logo;
        if (configLogo) {
          setLogoWidth(prev => ({ ...prev, ...configLogo }));
        }
      }
    } catch (error) {
      console.error('Error fetching appearance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCoresPrimariasChange = (key: string, value: string) => {
    setCoresPrimarias(prev => ({ ...prev, [key]: value }));
    
    // Live update preview
    const getContrastColor = (hex: string) => {
      if (!hex || hex === 'transparent') return '#ffffff';
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.5 ? '#111111' : '#ffffff';
    };

    const adjustColor = (hex: string, amount: number) => {
      const clamp = (val: number) => Math.min(Math.max(val, 0), 255);
      const r_val = clamp(parseInt(hex.slice(1, 3), 16) + amount);
      const g_val = clamp(parseInt(hex.slice(3, 5), 16) + amount);
      const b_val = clamp(parseInt(hex.slice(5, 7), 16) + amount);
      return `#${r_val.toString(16).padStart(2, '0')}${g_val.toString(16).padStart(2, '0')}${b_val.toString(16).padStart(2, '0')}`;
    };

    const updated = { ...coresPrimarias, [key]: value };
    const primary = updated.brand;
    const background = updated.background;
    const text = updated.text;
    const highlight = updated.highlight;

    const dynamicStyles = `
      .store-theme {
        --store-primary: ${primary};
        --store-primary-hover: ${adjustColor(primary, -30)};
        --store-background: ${background};
        --store-text: ${text};
        --store-text-muted: ${adjustColor(text, 50)};
        --store-highlight: ${highlight};
        --store-highlight-foreground: ${getContrastColor(highlight)};
        --store-card: ${background === '#ffffff' ? '#ffffff' : adjustColor(background, 10)};
        --store-border: ${adjustColor(background, -20)};
        --store-button: ${primary};
        --store-button-text: ${getContrastColor(primary)};
        
        --price-color: ${primary};
        --discount-color: ${highlight};
        --header-background: ${primary};
        --header-foreground: ${getContrastColor(primary)};
        --footer-background: ${background};
        --footer-foreground: ${text};
        --input-background: ${background};
        --input-border: ${adjustColor(background, -20)};
      }
    `;

    let styleTag = document.getElementById('store-dynamic-colors');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'store-dynamic-colors';
      document.head.appendChild(styleTag);
    }
    styleTag.innerHTML = dynamicStyles;
  };

  const handleColorChange = (key: string, value: string) => {
    // Deprecated for cores_primarias
    console.log("handleColorChange called but deprecated for cores_primarias", key, value);
  };

  const handleFontChange = (type: 'heading' | 'body', value: string) => {
    setFonts(prev => ({ ...prev, [type]: value }));
    
    // Live update Store Design Tokens for preview
    const tokenName = `--store-font-${type === 'heading' ? 'heading' : 'body'}`;
    document.documentElement.style.setProperty(tokenName, value);

    if (type === 'heading') {
       document.documentElement.style.setProperty('--store-font-primary', value);
       document.documentElement.style.setProperty('--store-header-font', value);
    }
    
    handleFontLoad(type, value);
  };

  const handleLayoutChange = (key: string, value: any) => {
    setLayout(prev => ({ ...prev, [key]: value }));

    // Live update tokens
    if (key === 'header_font') {
       document.documentElement.style.setProperty('--store-header-font', value);
       handleFontLoad('header', value);
    }
    if (key === 'header_weight') {
       document.documentElement.style.setProperty('--store-header-weight', value);
       document.documentElement.style.setProperty('--store-font-weight-menu', value);
    }
    if (key === 'header_spacing') document.documentElement.style.setProperty('--store-header-spacing', `${value}em`);
    if (key === 'header_transform') document.documentElement.style.setProperty('--store-header-transform', value);
    if (key === 'header_size') document.documentElement.style.setProperty('--store-header-size', `${value}px`);
    if (key === 'card_radius') document.documentElement.style.setProperty('--store-radius-card', `${value}px`);
    if (key === 'button_radius') document.documentElement.style.setProperty('--store-radius-button', `${value}px`);
  };

  const handleFontLoad = (type: 'heading' | 'body' | 'header', value: string) => {
    const linkId = `dynamic-google-fonts-preview-${type}`;
    let link = document.getElementById(linkId) as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = `https://fonts.googleapis.com/css2?family=${value.replace(/\s+/g, '+')}:wght@100;200;300;400;500;600;700;800;900&display=swap`;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileName = `${type}-${Date.now()}.${file.name.split('.').pop()}`;
      await uploadToStorage('site-assets', fileName, file);
      const publicUrl = getPublicUrl('site-assets', fileName);
      
      if (type === 'logo') setLogoUrl(publicUrl);
      else setFaviconUrl(publicUrl);
      
      toast.success(`${type === 'logo' ? 'Logo' : 'Favicon'} carregado com sucesso!`);
    } catch (error: any) {
      toast.error('Erro no upload: ' + error.message);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const payload = { 
        cores_primarias: coresPrimarias,
        fontes: fonts,
        logo_url: logoUrl,
        favicon_url: faviconUrl,
        config_logo: logoWidth,
        layout: layout,
        updated_at: new Date().toISOString()
      };

      // Try to update ID 1 specifically to keep it consistent. 
      // If it fails because of ID type (UUID vs Int), it will try without specific ID to use standard first row.
      let { error } = await supabase.from('aparencia').upsert({ id: 1, ...payload } as any);
      
      if (error) {
        // Fallback: upsert without ID if ID 1 failed (e.g. if table uses UUID)
        const { error: fallbackError } = await supabase.from('aparencia').upsert(payload as any);
        if (fallbackError) throw fallbackError;
      }
      
      if (error) throw error;
      
      // Refresh global store
      await fetchFromSupabase(true);

      
      // Update favicon in real-time

      if (faviconUrl) {
        const favicon = document.querySelector('link[rel="icon"]');
        if (favicon) favicon.setAttribute('href', faviconUrl);
      }

      toast.success('Aparência salva com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-foreground font-outfit">Aparência</h1>
          <p className="text-sm text-brand-muted font-outfit">Personalize a identidade visual da sua loja.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-brand-primary text-brand-primary-foreground px-8 py-2.5 rounded-brand-button text-sm font-bold flex items-center gap-2 hover:bg-brand-primary-hover transition-all shadow-sm disabled:opacity-50"
        >
          {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {isSaving ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0 space-y-1">
          {[
            { id: 'colors', label: 'Cores da Loja', icon: Palette },
            { id: 'typography', label: 'Tipografia', icon: Type },
            { id: 'logo', label: 'Logo & Marca', icon: ImageIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-brand-button transition-all font-outfit ${
                activeTab === tab.id 
                  ? 'bg-brand-primary text-white shadow-md' 
                  : 'text-brand-muted hover:bg-brand-secondary'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </aside>

        <main className="flex-1 space-y-6">
          {activeTab === 'colors' && (
            <div className="bg-brand-card p-8 rounded-brand-card border border-brand-border shadow-sm space-y-12 font-outfit animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* NOVO SISTEMA DE 4 CORES PRIMÁRIAS */}
              <section>
                <div className="flex items-center gap-2 mb-6 border-b border-brand-border pb-4">
                  <Globe className="h-5 w-5 text-brand-primary" />
                  <h3 className="text-base font-black text-brand-foreground uppercase tracking-tight">Cores Primárias da Loja</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    { label: 'Cor Principal da Marca', key: 'brand', desc: 'Usada em botões, links e destaques principais' },
                    { label: 'Cor de Fundo', key: 'background', desc: 'Cor de fundo principal da storefront' },
                    { label: 'Cor dos Textos', key: 'text', desc: 'Cor padrão para textos e parágrafos' },
                    { label: 'Cor de Promoções', key: 'highlight', desc: 'Usada para preços promocionais e descontos' },
                  ].map((color) => (
                    <div key={color.key} className="space-y-3">
                      <div>
                        <label className="block text-xs font-black text-brand-foreground uppercase mb-1">{color.label}</label>
                        <p className="text-[10px] text-brand-muted mb-3 italic">{color.desc}</p>
                      </div>
                      <div className="flex gap-4 items-center">
                        <input 
                          type="color" 
                          value={coresPrimarias[color.key as keyof typeof coresPrimarias]} 
                          onChange={(e) => handleCoresPrimariasChange(color.key, e.target.value)}
                          className="h-12 w-16 cursor-pointer rounded-lg border border-brand-border bg-white p-1"
                        />
                        <input 
                          type="text" 
                          value={coresPrimarias[color.key as keyof typeof coresPrimarias]}
                          onChange={(e) => handleCoresPrimariasChange(color.key, e.target.value)}
                          className="flex-1 bg-brand-secondary border-none rounded-lg px-4 py-3 text-xs font-mono uppercase focus:ring-1 focus:ring-brand-primary/20 outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

            </div>
          )}

          {activeTab === 'typography' && (
            <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm space-y-8 font-outfit animate-in fade-in slide-in-from-bottom-2 duration-300">
              <section>
                <h3 className="text-sm font-bold text-brand-foreground uppercase tracking-widest border-b border-brand-border pb-4 mb-6">Tipografia da Loja</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Fonte da Loja (Global)</label>
                    <select 
                      value={fonts.heading}
                      onChange={(e) => handleFontChange('heading', e.target.value)}
                      className="w-full bg-brand-secondary border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-primary/10 outline-none"
                    >
                      <option value="Outfit">Outfit (Padrão)</option>
                      <option value="Inter">Inter</option>
                      <option value="Playfair Display">Playfair Display (Serif)</option>
                      <option value="Montserrat">Montserrat</option>
                      <option value="Poppins">Poppins</option>
                      <option value="Roboto">Roboto</option>
                    </select>
                  </div>
                </div>
                <div className="mt-8 p-6 bg-brand-secondary rounded-xl border border-dashed border-brand-border">
                  <h4 className="text-lg font-bold mb-2" style={{ fontFamily: 'var(--store-font-primary)', fontWeight: 'var(--store-font-weight-title)' }}>Preview do Título</h4>
                  <p className="text-sm text-brand-muted leading-relaxed" style={{ fontFamily: 'var(--store-font-primary)', fontWeight: 'var(--store-font-weight-text)' }}>
                    Este é um exemplo de como os textos da sua loja serão exibidos. A fonte selecionada é aplicada globalmente.
                  </p>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'layout' && (
            <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm space-y-8 font-outfit animate-in fade-in slide-in-from-bottom-2 duration-300">
              <section>
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest border-b border-gray-100 pb-4 mb-6">Configurações de Layout</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-brand-foreground uppercase mb-3">Modo do Container</label>
                      <select 
                        value={layout.container_mode}
                        onChange={(e) => handleLayoutChange('container_mode', e.target.value)}
                        className="w-full bg-brand-secondary border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-primary/10 outline-none"
                      >
                        <option value="centralizado">Centralizado (Padrão)</option>
                        <option value="tela_cheia">Tela Cheia</option>
                      </select>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-xs font-black text-brand-foreground uppercase">Largura Máxima ({layout.max_width}px)</label>
                      </div>
                      <input 
                        type="range" min="1000" max="1920" step="20"
                        value={layout.max_width}
                        onChange={(e) => handleLayoutChange('max_width', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                      />
                    </div>
                    <div>
                       <div className="flex items-center justify-between mb-3">
                         <label className="block text-xs font-black text-brand-foreground uppercase">Altura do Header ({layout.header_height}px)</label>
                       </div>
                       <input 
                         type="range" min="60" max="120" step="2"
                         value={layout.header_height}
                         onChange={(e) => handleLayoutChange('header_height', parseInt(e.target.value))}
                         className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                       />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-xs font-black text-brand-foreground uppercase">Arredondamento Global ({layout.card_radius}px)</label>
                      </div>
                      <input 
                        type="range" min="0" max="32" step="2"
                        value={layout.card_radius}
                        onChange={(e) => handleLayoutChange('card_radius', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-brand-foreground uppercase mb-3">Sombra dos Elementos</label>
                      <select 
                        value={layout.card_shadow}
                        onChange={(e) => handleLayoutChange('card_shadow', e.target.value)}
                        className="w-full bg-brand-secondary border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-primary/10 outline-none"
                      >
                        <option value="none">Nenhuma</option>
                        <option value="sm">Suave</option>
                        <option value="md">Média</option>
                        <option value="lg">Intensa</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-brand-foreground uppercase mb-3">Fonte do Menu / Header</label>
                      <select 
                        value={layout.header_font}
                        onChange={(e) => handleLayoutChange('header_font', e.target.value)}
                        className="w-full bg-brand-secondary border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-primary/10 outline-none"
                      >
                        <option value="Outfit">Outfit (Padrão)</option>
                        <option value="Inter">Inter</option>
                        <option value="Playfair Display">Playfair Display (Serif)</option>
                        <option value="Montserrat">Montserrat</option>
                        <option value="Poppins">Poppins</option>
                        <option value="Roboto">Roboto</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-100">
                  <div className="space-y-4">
                    <label className="block text-xs font-black text-brand-foreground uppercase">Espaçamento entre Seções ({layout.section_spacing}px)</label>
                    <input 
                      type="range" min="24" max="120" step="4"
                      value={layout.section_spacing}
                      onChange={(e) => handleLayoutChange('section_spacing', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-xs font-black text-brand-foreground uppercase">Espaçamento do Grid ({layout.grid_spacing}px)</label>
                    <input 
                      type="range" min="8" max="48" step="4"
                      value={layout.grid_spacing}
                      onChange={(e) => handleLayoutChange('grid_spacing', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                    />
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'logo' && (
            <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm space-y-8 font-outfit animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest border-b border-gray-100 pb-4">Logo Principal</h3>
                  <div className="relative aspect-video bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-6 overflow-hidden group">
                    {logoUrl ? (
                      <>
                        <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                          <label className="cursor-pointer bg-white text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors">
                            <Upload className="h-5 w-5" />
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                          </label>
                          <button 
                            onClick={() => setLogoUrl(null)}
                            className="bg-white text-red-500 p-2 rounded-full hover:bg-gray-100 transition-colors"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <label className="flex flex-col items-center gap-3 cursor-pointer hover:text-brand-primary transition-colors">
                        <Upload className="h-8 w-8 text-gray-400" />
                        <span className="text-xs font-bold uppercase">Upload Logo</span>
                        <span className="text-[10px] text-gray-400">PNG, JPG ou SVG (Máx. 5MB)</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                      </label>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400">Recomendado: Fundo transparente, largura mínima de 400px.</p>
                </section>

                <section className="space-y-6">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest border-b border-gray-100 pb-4">Tamanho da Logo</h3>
                  
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-500 uppercase">Desktop ({logoWidth.desktop}px)</label>
                        <span className="text-[10px] text-gray-400 font-mono">80px - 320px</span>
                      </div>
                      <input 
                        type="range" 
                        min="80" 
                        max="320" 
                        step="5"
                        value={logoWidth.desktop}
                        onChange={(e) => setLogoWidth(prev => ({ ...prev, desktop: parseInt(e.target.value) }))}
                        className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-500 uppercase">Mobile ({logoWidth.mobile}px)</label>
                        <span className="text-[10px] text-gray-400 font-mono">50px - 220px</span>
                      </div>
                      <input 
                        type="range" 
                        min="50" 
                        max="220" 
                        step="5"
                        value={logoWidth.mobile}
                        onChange={(e) => setLogoWidth(prev => ({ ...prev, mobile: parseInt(e.target.value) }))}
                        className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest border-b border-gray-100 pb-4">Favicon (Ícone do Navegador)</h3>
                  <div className="relative aspect-square w-32 mx-auto bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-4 overflow-hidden group">
                    {faviconUrl ? (
                      <>
                        <img src={faviconUrl} alt="Favicon" className="h-12 w-12 object-contain" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <label className="cursor-pointer bg-white text-gray-900 p-1.5 rounded-full hover:bg-gray-100 transition-colors">
                            <Upload className="h-4 w-4" />
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'favicon')} />
                          </label>
                          <button 
                            onClick={() => setFaviconUrl(null)}
                            className="bg-white text-red-500 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <label className="flex flex-col items-center gap-2 cursor-pointer hover:text-brand-primary transition-colors text-center">
                        <Upload className="h-6 w-6 text-gray-400" />
                        <span className="text-[10px] font-bold uppercase">Upload</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'favicon')} />
                      </label>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 text-center">Recomendado: PNG 32x32px ou ICO.</p>
                </section>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default Appearance;
