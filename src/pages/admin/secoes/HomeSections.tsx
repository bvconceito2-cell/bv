import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, GripVertical, Settings, Loader2, X, Save } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { SecaoHome } from '../../../types/database';
import { toast } from 'sonner';

type TopBarConfig = {
  texto: string;
  cor_fundo: string;
  cor_texto: string;
};

const HomeSections = () => {
  const [sections, setSections] = useState<SecaoHome[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedSection, setSelectedSection] = useState<SecaoHome | null>(null);
  const [topBarConfig, setTopBarConfig] = useState<TopBarConfig>({
    texto: '✨ FRETE GRÁTIS acima de R$199 · Parcele em até 5x sem juros',
    cor_fundo: '#D4AF37',
    cor_texto: '#000000'
  });

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

  const openConfig = (section: SecaoHome) => {
    if (section.chave !== 'top_bar') {
      toast.info('Configuração dessa seção ainda não foi implementada.');
      return;
    }

    const config = (section as any).config || {};

    setTopBarConfig({
      texto: config.texto || '✨ FRETE GRÁTIS acima de R$199 · Parcele em até 5x sem juros',
      cor_fundo: config.cor_fundo || '#D4AF37',
      cor_texto: config.cor_texto || '#000000'
    });

    setSelectedSection(section);
  };

  const closeModal = () => {
    setSelectedSection(null);
  };

  const saveTopBarConfig = async () => {
    if (!selectedSection) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('secoes_home')
        .update({
          config: topBarConfig,
          visivel: selectedSection.visivel
        })
        .eq('id', selectedSection.id);

      if (error) throw error;

      toast.success('Barra superior salva com sucesso!');
      closeModal();
      fetchSections();
    } catch (error: any) {
      console.error('Erro ao salvar barra superior:', error);
      toast.error('Erro ao salvar barra superior');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Seções da Home</h1>
          <p className="text-sm text-gray-500">Controle quais seções aparecem na página inicial e sua ordem.</p>
        </div>
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
              </div>

              <div className="flex items-center gap-6 pr-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleVisivel(section.id, section.visivel)}
                    className={`p-2 rounded-lg transition-all flex items-center gap-2 text-[10px] font-bold uppercase ${
                      section.visivel ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {section.visivel ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    {section.visivel ? 'Visível' : 'Oculto'}
                  </button>
                </div>

                <div className="flex items-center gap-2 border-l border-gray-100 pl-6">
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

      {selectedSection && selectedSection.chave === 'top_bar' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Configurar Barra Superior</h2>
                <p className="text-xs text-gray-500">Edite a frase, cor de fundo e cor do texto da faixa do topo.</p>
              </div>

              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                  Texto da barra
                </label>
                <input
                  type="text"
                  value={topBarConfig.texto}
                  onChange={(e) => setTopBarConfig({ ...topBarConfig, texto: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#04548c]"
                  placeholder="Ex: ✨ FRETE GRÁTIS acima de R$199"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                    Cor de fundo
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={topBarConfig.cor_fundo}
                      onChange={(e) => setTopBarConfig({ ...topBarConfig, cor_fundo: e.target.value })}
                      className="h-11 w-14 rounded-lg border border-gray-200"
                    />
                    <input
                      type="text"
                      value={topBarConfig.cor_fundo}
                      onChange={(e) => setTopBarConfig({ ...topBarConfig, cor_fundo: e.target.value })}
                      className="flex-1 rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#04548c]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                    Cor do texto
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={topBarConfig.cor_texto}
                      onChange={(e) => setTopBarConfig({ ...topBarConfig, cor_texto: e.target.value })}
                      className="h-11 w-14 rounded-lg border border-gray-200"
                    />
                    <input
                      type="text"
                      value={topBarConfig.cor_texto}
                      onChange={(e) => setTopBarConfig({ ...topBarConfig, cor_texto: e.target.value })}
                      className="flex-1 rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#04548c]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                  Pré-visualização
                </label>
                <div
                  className="h-10 flex items-center justify-center text-xs font-bold rounded-lg text-center px-4"
                  style={{
                    backgroundColor: topBarConfig.cor_fundo,
                    color: topBarConfig.cor_texto
                  }}
                >
                  {topBarConfig.texto || 'Texto da barra superior'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all"
              >
                Cancelar
              </button>

              <button
                onClick={saveTopBarConfig}
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
