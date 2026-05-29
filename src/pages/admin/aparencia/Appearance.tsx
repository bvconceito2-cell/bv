import React, { useState, useEffect } from 'react';
import { Palette, Type, Image as ImageIcon, Check, RefreshCw, Loader2, Upload, Trash2, Globe } from 'lucide-react';
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
    brand: '#F2AE49',
    background: '#ffffff',
    text: '#111111',
    highlight: '#D4B483'
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
      let { data, error } = await supabase.from('aparencia').select('*').eq('id', 1).maybeSingle();

      if (!data && !error) {
        const { data: firstRow } = await supabase.from('aparencia').select('*').limit(1).maybeSingle();
        data = firstRow;
      }

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

  const getContrastColor = (hex: string) => {
    if (!hex || hex === 'transparent') return '#ffffff';
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length !== 6) return '#ffffff';

    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);

    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return '#ffffff';

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#111111' : '#ffffff';
  };

  const adjustColor = (hex: string, amount: number) => {
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length !== 6) return hex;

    const clamp = (val: number) => Math.min(Math.max(val, 0), 255);

    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);

    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return hex;

    const rVal = clamp(r + amount);
    const gVal = clamp(g + amount);
    const bVal = clamp(b + amount);

    return `#${rVal.toString(16).padStart(2, '0')}${gVal.toString(16).padStart(2, '0')}${bVal.toString(16).padStart(2, '0')}`;
  };

  const handleCoresPrimariasChange = (key: string, value: string) => {
    setCoresPrimarias(prev => ({ ...prev, [key]: value }));

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
        --header-background: ${background};
        --header-foreground: ${text};
        --footer-background: #050816;
        --footer-foreground: #ffffff;
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

  const handleFontChange = (type: 'heading' | 'body', value: string) => {
    setFonts(prev => ({ ...prev, [type]: value }));

    const styleTagId = 'store-dynamic-fonts';
    let styleTag = document.getElementById(styleTagId);

    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleTagId;
      document.head.appendChild(styleTag);
    }

    styleTag.innerHTML = `
      .store-theme {
        --store-font-${type === 'heading' ? 'heading' : 'body'}: "${value}";
        ${type === 'heading' ? `--store-font-primary: "${value}"; --store-header-font: "${value}";` : ''}
      }
    `;

    handleFontLoad(type, value);
  };

  const handleLayoutChange = (key: string, value: any) => {
    setLayout(prev => ({ ...prev, [key]: value }));

    const styleTagId = 'store-dynamic-layout';
    let styleTag = document.getElementById(styleTagId);

    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleTagId;
      document.head.appendChild(styleTag);
    }

    const updated = { ...layout, [key]: value };

    styleTag.innerHTML = `
      .store-theme {
        --store-header-font: "${updated.header_font}";
        --store-header-weight: ${updated.header_weight};
        --store-font-weight-menu: ${updated.header_weight};
        --store-header-spacing: ${updated.header_spacing}em;
        --store-header-transform: ${updated.header_transform};
        --store-header-size: ${updated.header_size}px;
        --store-radius-card: ${updated.card_radius}px;
        --store-radius-button: ${updated.button_radius}px;
      }
    `;

    if (key === 'header_font') {
      handleFontLoad('header', value);
    }
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

      let { error } = await supabase.from('aparencia').upsert({ id: 1, ...payload } as any);

      if (error) {
        const { error: fallbackError } = await supabase.from('aparencia').upsert(payload as any);
        if (fallbackError) throw fallbackError;
      }

      if (error) throw error;

      await fetchFromSupabase(true);

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
      <div className="flex items-center justify-center h-64 bg-[#F8F9FA]">
        <Loader2 className="h-8 w-8 animate-spin text-[#04548c]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-[#F8F9FA] text-[#111827]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] font-outfit">Aparência</h1>
          <p className="text-sm text-[#6b7280] font-outfit">Personalize a identidade visual da sua loja.</p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#04548c] text-white px-8 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#03426d] transition-all shadow-sm disabled:opacity-50"
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
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-lg transition-all font-outfit ${
                activeTab === tab.id
                  ? 'bg-[#04548c] text-white shadow-md'
                  : 'text-[#6b7280] hover:bg-[#eef2f7] hover:text-[#04548c]'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </aside>

        <main className="flex-1 space-y-6">
          {activeTab === 'colors' && (
            <div className="bg-white p-8 rounded-xl border border-[#e5e7eb] shadow-sm space-y-12 font-outfit animate-in fade-in slide-in-from-bottom-2 duration-300">
              <section>
                <div className="flex items-center gap-2 mb-6 border-b border-[#e5e7eb] pb-4">
                  <Globe className="h-5 w-5 text-[#04548c]" />
                  <h3 className="text-base font-black text-[#111827] uppercase tracking-tight">Cores Primárias da Loja</h3>
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
                        <label className="block text-xs font-black text-[#111827] uppercase mb-1">{color.label}</label>
                        <p className="text-[10px] text-[#6b7280] mb-3 italic">{color.desc}</p>
                      </div>

                      <div className="flex gap-4 items-center">
                        <input
                          type="color"
                          value={coresPrimarias[color.key as keyof typeof coresPrimarias]}
                          onChange={(e) => handleCoresPrimariasChange(color.key, e.target.value)}
                          className="h-12 w-16 cursor-pointer rounded-lg border border-[#e5e7eb] bg-white p-1"
                        />

                        <input
                          type="text"
                          value={coresPrimarias[color.key as keyof typeof coresPrimarias]}
                          onChange={(e) => handleCoresPrimariasChange(color.key, e.target.value)}
                          className="flex-1 bg-[#f8f9fa] border border-[#e5e7eb] rounded-lg px-4 py-3 text-xs font-mono uppercase focus:ring-1 focus:ring-[#04548c]/20 outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'typography' && (
            <div className="bg-white p-8 rounded-xl border border-[#e5e7eb] shadow-sm space-y-8 font-outfit animate-in fade-in slide-in-from-bottom-2 duration-300">
              <section>
                <h3 className="text-sm font-bold text-[#111827] uppercase tracking-widest border-b border-[#e5e7eb] pb-4 mb-6">Tipografia da Loja</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-xs font-bold text-[#6b7280] uppercase mb-3">Fonte da Loja (Global)</label>
                    <select
                      value={fonts.heading}
                      onChange={(e) => handleFontChange('heading', e.target.value)}
                      className="w-full bg-[#f8f9fa] border border-[#e5e7eb] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#04548c]/10 outline-none"
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

                <div className="mt-8 p-6 bg-[#f8f9fa] rounded-xl border border-dashed border-[#e5e7eb]">
                  <h4 className="text-lg font-bold mb-2 text-[#111827]" style={{ fontFamily: fonts.heading, fontWeight: layout.header_weight }}>
                    Preview do Título
                  </h4>
                  <p className="text-sm text-[#6b7280] leading-relaxed" style={{ fontFamily: fonts.body }}>
                    Este é um exemplo de como os textos da sua loja serão exibidos. A fonte selecionada é aplicada somente na loja.
                  </p>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'logo' && (
            <div className="bg-white p-8 rounded-xl border border-[#e5e7eb] shadow-sm space-y-8 font-outfit animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="space-y-4">
                  <h3 className="text-sm font-bold text-[#111827] uppercase tracking-widest border-b border-[#e5e7eb] pb-4">Logo Principal</h3>

                  <div className="relative aspect-video bg-[#f8f9fa] rounded-xl border-2 border-dashed border-[#e5e7eb] flex flex-col items-center justify-center p-6 overflow-hidden group">
                    {logoUrl ? (
                      <>
                        <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                          <label className="cursor-pointer bg-white text-[#111827] p-2 rounded-full hover:bg-[#f3f4f6] transition-colors">
                            <Upload className="h-5 w-5" />
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                          </label>

                          <button
                            onClick={() => setLogoUrl(null)}
                            className="bg-white text-red-500 p-2 rounded-full hover:bg-[#f3f4f6] transition-colors"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <label className="flex flex-col items-center gap-3 cursor-pointer hover:text-[#04548c] transition-colors">
                        <Upload className="h-8 w-8 text-[#9ca3af]" />
                        <span className="text-xs font-bold uppercase text-[#111827]">Upload Logo</span>
                        <span className="text-[10px] text-[#9ca3af]">PNG, JPG ou SVG (Máx. 5MB)</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                      </label>
                    )}
                  </div>

                  <p className="text-[10px] text-[#9ca3af]">Recomendado: Fundo transparente, largura mínima de 400px.</p>
                </section>

                <section className="space-y-6">
                  <h3 className="text-sm font-bold text-[#111827] uppercase tracking-widest border-b border-[#e5e7eb] pb-4">Tamanho da Logo</h3>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#6b7280] uppercase">Desktop ({logoWidth.desktop}px)</label>
                        <span className="text-[10px] text-[#9ca3af] font-mono">80px - 320px</span>
                      </div>

                      <input
                        type="range"
                        min="80"
                        max="320"
                        step="5"
                        value={logoWidth.desktop}
                        onChange={(e) => setLogoWidth(prev => ({ ...prev, desktop: parseInt(e.target.value) }))}
                        className="w-full h-2 bg-[#e5e7eb] rounded-lg appearance-none cursor-pointer accent-[#04548c]"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#6b7280] uppercase">Mobile ({logoWidth.mobile}px)</label>
                        <span className="text-[10px] text-[#9ca3af] font-mono">50px - 220px</span>
                      </div>

                      <input
                        type="range"
                        min="50"
                        max="220"
                        step="5"
                        value={logoWidth.mobile}
                        onChange={(e) => setLogoWidth(prev => ({ ...prev, mobile: parseInt(e.target.value) }))}
                        className="w-full h-2 bg-[#e5e7eb] rounded-lg appearance-none cursor-pointer accent-[#04548c]"
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-bold text-[#111827] uppercase tracking-widest border-b border-[#e5e7eb] pb-4">Favicon (Ícone do Navegador)</h3>

                  <div className="relative aspect-square w-32 mx-auto bg-[#f8f9fa] rounded-xl border-2 border-dashed border-[#e5e7eb] flex flex-col items-center justify-center p-4 overflow-hidden group">
                    {faviconUrl ? (
                      <>
                        <img src={faviconUrl} alt="Favicon" className="h-12 w-12 object-contain" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <label className="cursor-pointer bg-white text-[#111827] p-1.5 rounded-full hover:bg-[#f3f4f6] transition-colors">
                            <Upload className="h-4 w-4" />
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'favicon')} />
                          </label>

                          <button
                            onClick={() => setFaviconUrl(null)}
                            className="bg-white text-red-500 p-1.5 rounded-full hover:bg-[#f3f4f6] transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <label className="flex flex-col items-center gap-2 cursor-pointer hover:text-[#04548c] transition-colors text-center">
                        <Upload className="h-6 w-6 text-[#9ca3af]" />
                        <span className="text-[10px] font-bold uppercase text-[#111827]">Upload</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'favicon')} />
                      </label>
                    )}
                  </div>

                  <p className="text-[10px] text-[#9ca3af] text-center">Recomendado: PNG 32x32px ou ICO.</p>
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
