import React, { useState, useEffect } from 'react';
import { Layout as LayoutIcon, Eye, EyeOff, GripVertical, Settings, Loader2 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { SecaoHome } from '../../../types/database';
import { toast } from 'sonner';

const HomeSections = () => {
  const [sections, setSections] = useState<SecaoHome[]>([]);
  const [loading, setLoading] = useState(true);

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
      toast.error('Erro ao atualizar visibilidade');
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
          <div className="flex justify-center p-20"><Loader2 className="animate-spin text-[#04548c]" /></div>
        ) : sections.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm text-center text-gray-500">
            Nenhuma seção cadastrada.
          </div>
        ) : (
          sections.map((section, idx) => (
            <div key={section.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 group hover:border-[#04548c]/30 transition-all">
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
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg text-[10px] font-bold uppercase hover:bg-gray-100 transition-all">
                    <Settings className="h-3.5 w-3.5" /> Configurar
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

export default HomeSections;