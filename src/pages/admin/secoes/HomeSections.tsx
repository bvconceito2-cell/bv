import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, GripVertical, Settings, Loader2, X, Save } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { SecaoHome } from '../../../types/database';
import { toast } from 'sonner';

const defaultConfigs: Record<string, any> = {
  top_bar: {
    texto: '✨ FRETE GRÁTIS acima de R$199 · Parcele em até 5x sem juros',
    cor_fundo: '#D4AF37',
    cor_texto: '#000000'
  },
  hero_banner: {
    autoplay: true,
    intervalo: 5000,
    overlay: true,
    altura_desktop: 560,
    altura_mobile: 230
  },
  icones_categorias: {
    titulo: '',
    mostrar_titulo: false,
    tamanho_desktop: 112,
    tamanho_mobile: 64
  },
  beneficios: {
    texto: 'BV CONCEITO',
    simbolo: '✦',
    cor_fundo: '#000000',
    cor_texto: '#F2AE49',
    cor_simbolo: '#D4B483',
    velocidade: 30
  },
  produtos_destaque: {
    titulo: 'Destaques para você',
    link: '/category/destaques',
    quantidade: 8
  },
  editorial: {
    titulo_secao: 'DESTAQUES'
  },
  novidades: {
    titulo: 'Novidades da semana',
    link: '/category/novidades',
    quantidade: 8
  },
  cadastro: {
    titulo: 'Cadastre-se e ganhe 10% OFF',
    subtitulo: 'Fique por dentro das novidades e ofertas exclusivas.',
    placeholder: 'Seu melhor e-mail',
    texto_botao: 'CADASTRAR'
  },
  newsletter: {
    titulo: 'Cadastre-se e ganhe 10% OFF',
    subtitulo: 'Fique por dentro das novidades e ofertas exclusivas.',
    placeholder: 'Seu melhor e-mail',
    texto_botao: 'CADASTRAR'
  }
};

const HomeSections = () => {
  const [sections, setSections] = useState<SecaoHome[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedSection, setSelectedSection] = useState<SecaoHome | null>(null);
  const [formConfig, setFormConfig] = useState<any>({});

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('secoes_home')
        .select('*')
        .order('ordem', { ascending: true });

      if (error) throw error;

      setSections(data || []);
    } catch (error: any) {
      console.error('Error fetching sections:', error);
      toast.error('Erro ao carregar seções');
    } finally {
      setLoading(false);
    }
  };

  const toggleVisivel = async (id: number, current: boolean) => {
    try {
      const { error } = await supabase
        .from('secoes_home')
        .update({ visivel: !current })
        .eq('id', id);

      if (error) throw error;

      toast.success('Visibilidade alterada!');
      fetchSections();
    } catch (error: any) {
      console.error('Erro ao atualizar visibilidade:', error);
      toast.error('Erro ao atualizar visibilidade');
    }
  };

  const getDefaultConfig = (section: SecaoHome) => {
    return defaultConfigs[section.chave] || {};
  };

  const openConfig = (section: SecaoHome) => {
    const currentConfig = section.config || {};
    const defaultConfig = getDefaultConfig(section);

    setFormConfig({
      ...defaultConfig,
      ...currentConfig
    });

    setSelectedSection(section);
  };

  const closeModal = () => {
    setSelectedSection(null);
    setFormConfig({});
  };

  const updateField = (key: string, value: any) => {
    setFormConfig((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  const saveConfig = async () => {
    if (!selectedSection) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('secoes_home')
        .update({
          config: formConfig,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedSection.id);

      if (error) throw error;

      toast.success('Configuração salva com sucesso!');
      closeModal();
      fetchSections();
    } catch (error: any) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const renderField = (label: string, key: string, type: 'text' | 'number' | 'color' | 'boolean' = 'text') => {
    return (
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
          {label}
        </label>

        {type === 'boolean' ? (
          <button
            type="button"
            onClick={() => updateField(key, !formConfig[key])}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase ${
              formConfig[key] ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {formConfig[key] ? 'Ativado' : 'Desativado'}
          </button>
        ) : (
          <input
            type={type}
            value={formConfig[key] ?? ''}
            onChange={(e) => updateField(key, type === 'number' ? Number(e.target.value) : e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#04548c]"
          />
        )}
      </div>
    );
  };

  const renderConfigFields = () => {
    if (!selectedSection) return null;

    switch (selectedSection.chave) {
      case 'top_bar':
        return (
          <>
            {renderField('Texto da barra', 'texto')}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField('Cor de fundo', 'cor_fundo', 'color')}
              {renderField('Cor do texto', 'cor_texto', 'color')}
            </div>
          </>
        );

      case 'hero_banner':
        return (
          <>
            {renderField('Autoplay', 'autoplay', 'boolean')}
            {renderField('Intervalo do slide em milissegundos', 'intervalo', 'number')}
            {renderField('Overlay escuro sobre imagem', 'overlay', 'boolean')}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField('Altura desktop', 'altura_desktop', 'number')}
              {renderField('Altura mobile', 'altura_mobile', 'number')}
            </div>
          </>
        );

      case 'icones_categorias':
        return (
          <>
            {renderField('Mostrar título', 'mostrar_titulo', 'boolean')}
            {renderField('Título', 'titulo')}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField('Tamanho desktop', 'tamanho_desktop', 'number')}
              {renderField('Tamanho mobile', 'tamanho_mobile', 'number')}
            </div>
          </>
        );

      case 'beneficios':
        return (
          <>
            {renderField('Texto do letreiro', 'texto')}
            {renderField('Símbolo separador', 'simbolo')}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderField('Cor de fundo', 'cor_fundo', 'color')}
              {renderField('Cor do texto', 'cor_texto', 'color')}
              {renderField('Cor do símbolo', 'cor_simbolo', 'color')}
            </div>
            {renderField('Velocidade da animação', 'velocidade', 'number')}
          </>
        );

      case 'produtos_destaque':
      case 'novidades':
        return (
          <>
            {renderField('Título da seção', 'titulo')}
            {renderField('Link do Ver Tudo', 'link')}
            {renderField('Quantidade de produtos', 'quantidade', 'number')}
          </>
        );

      case 'editorial':
        return (
          <>
            {renderField('Título da seção', 'titulo_secao')}
            <p className="text-xs text-gray-500">
              Imagem, produtos e botão do editorial continuam sendo editados na tela própria de Banner Editorial.
            </p>
          </>
        );

      case 'cadastro':
      case 'newsletter':
        return (
          <>
            {renderField('Título', 'titulo')}
            {renderField('Subtítulo', 'subtitulo')}
            {renderField('Placeholder do campo de e-mail', 'placeholder')}
            {renderField('Texto do botão', 'texto_botao')}
          </>
        );

      default:
        return (
          <div className="text-sm text-gray-500">
            Esta seção ainda não possui campos específicos, mas você pode controlar se ela fica visível ou oculta.
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Seções da Home</h1>
        <p className="text-sm text-gray-500">Controle quais seções aparecem na página inicial e sua ordem.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex justify-center p-20">
            <Loader2 className="animate-spin text-[#04548c]" />
          </div>
        ) : sections.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm text-center text-gray-500">
            Nenhuma seção cadastrada.
          </div>
        ) : (
          sections.map((section) => (
            <div
              key={section.id}
              className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 group hover:border-[#04548c]/30 transition-all"
            >
              <div className="cursor-grab p-1 text-gray-300">
                <GripVertical className="h-5 w-5" />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-400 font-mono">#{section.ordem}</span>
                  <h3 className="font-bold text-gray-800">{section.nome}</h3>
                </div>
                <p className="text-[11px] text-gray-400 font-mono">{section.chave}</p>
              </div>

              <div className="flex items-center gap-6 pr-4">
                <button
                  onClick={() => toggleVisivel(section.id, section.visivel)}
                  className={`p-2 rounded-lg transition-all flex items-center gap-2 text-[10px] font-bold uppercase ${
                    section.visivel ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {section.visivel ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  {section.visivel ? 'Visível' : 'Oculto'}
                </button>

                <div className="border-l border-gray-100 pl-6">
                  <button
                    onClick={() => openConfig(section)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg text-[10px] font-bold uppercase hover:bg-gray-100 transition-all"
                  >
                    <Settings className="h-3.5 w-3.5" /> Configurar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Configurar {selectedSection.nome}</h2>
                <p className="text-xs text-gray-500">Chave: {selectedSection.chave}</p>
              </div>

              <button onClick={closeModal} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {renderConfigFields()}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all"
              >
                Cancelar
              </button>

              <button
                onClick={saveConfig}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#04548c] text-white text-sm font-bold hover:bg-[#03416d] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeSections;
