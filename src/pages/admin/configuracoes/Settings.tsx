import React, { useState, useEffect } from 'react';
import { Store, MapPin, Globe, Share2, Shield, Info, Smartphone, Mail, Camera as InstagramIcon } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';


const SettingsSection = ({ title, icon: Icon, children }: any) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="p-6 border-b border-gray-100 flex items-center gap-3">
      <div className="p-2 bg-gray-50 rounded-lg">
        <Icon className="h-5 w-5 text-[#2D1B4E]" />
      </div>
      <h3 className="font-bold text-gray-800">{title}</h3>
    </div>
    <div className="p-6 space-y-6">
      {children}
    </div>
  </div>
);

const Settings = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<any>({
    nome: '',
    tagline: '',
    cnpj: '',
    email: '',
    cepOrigem: '',
    endereco: '',
    instagram: '',
    whatsapp: '',
    googleAnalyticsId: '',
    facebookPixelId: '',
    politicaPrivacidade: 'Seus dados estão seguros conosco...',
    politicaTroca: 'O prazo para troca é de 7 dias...'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from('configuracoes').select('*');
    if (data) {
      const formatted = data.reduce((acc: any, item: any) => {
        acc[item.chave] = item.valor;
        return acc;
      }, {});
      if (Object.keys(formatted).length > 0) setSettings((prev: any) => ({ ...prev, ...formatted }));
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const promises = Object.entries(settings).map(([chave, valor]) => 
        supabase.from('configuracoes').upsert({ chave, valor: valor as any }, { onConflict: 'chave' })
      );
      await Promise.all(promises);
      toast.success('Configurações salvas!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Configurações Gerais</h1>
          <p className="text-sm text-gray-500">Gerencie as informações fundamentais da sua loja.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#2D1B4E] text-white px-8 py-2.5 rounded-lg text-sm font-bold hover:bg-[#1a0f2e] transition-all shadow-sm disabled:opacity-50"
        >
          {isSaving ? 'SALVANDO...' : 'SALVAR TUDO'}
        </button>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <SettingsSection title="Informações da Loja" icon={Store}>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nome da Loja</label>
              <input type="text" value={settings.nome} onChange={e => setSettings({...settings, nome: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#2D1B4E]/10" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tagline / Slogan</label>
              <input type="text" value={settings.tagline} onChange={e => setSettings({...settings, tagline: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#2D1B4E]/10" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">CNPJ</label>
                <input type="text" value={settings.cnpj} onChange={e => setSettings({...settings, cnpj: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#2D1B4E]/10" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">E-mail de Contato</label>
                <input type="email" value={settings.email} onChange={e => setSettings({...settings, email: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#2D1B4E]/10" />
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* Localização & Origem */}
        <SettingsSection title="Origem & Logística" icon={MapPin}>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">CEP de Origem (Para Frete)</label>
              <input type="text" value={settings.cepOrigem} onChange={e => setSettings({...settings, cepOrigem: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#2D1B4E]/10" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Endereço Completo</label>
              <textarea rows={3} value={settings.endereco} onChange={e => setSettings({...settings, endereco: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#2D1B4E]/10" />
            </div>
          </div>
        </SettingsSection>

        {/* Social Media */}
        <SettingsSection title="Redes Sociais" icon={Share2}>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-50 rounded-lg">
                <InstagramIcon className="h-4 w-4 text-pink-600" />
              </div>
              <input type="text" placeholder="URL do Instagram" value={settings.instagram} onChange={e => setSettings({...settings, instagram: e.target.value})} className="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm" />
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Smartphone className="h-4 w-4 text-blue-600" />
              </div>
              <input type="text" placeholder="Link do WhatsApp" value={settings.whatsapp} onChange={e => setSettings({...settings, whatsapp: e.target.value})} className="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm" />
            </div>
          </div>
        </SettingsSection>

        {/* SEO & Tracking */}
        <SettingsSection title="SEO & Analytics" icon={Globe}>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Google Analytics ID</label>
              <input type="text" placeholder="G-XXXXXXXXXX" className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#2D1B4E]/10" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Facebook Pixel ID</label>
              <input type="text" placeholder="XXXXXXXXXXXXXXX" className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#2D1B4E]/10" />
            </div>
          </div>
        </SettingsSection>

        {/* Legal Policies */}
        <div className="lg:col-span-2">
          <SettingsSection title="Políticas & Termos" icon={Shield}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Política de Privacidade</label>
                <textarea 
                  rows={10} 
                  className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-xs focus:ring-2 focus:ring-[#2D1B4E]/10" 
                  value={settings.politicaPrivacidade}
                  onChange={e => setSettings({...settings, politicaPrivacidade: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Trocas e Devoluções</label>
                <textarea 
                  rows={10} 
                  className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-xs focus:ring-2 focus:ring-[#2D1B4E]/10" 
                  value={settings.politicaTroca}
                  onChange={e => setSettings({...settings, politicaTroca: e.target.value})}
                />
              </div>
            </div>
          </SettingsSection>
        </div>

      </div>
    </div>
  );
};

export default Settings;
