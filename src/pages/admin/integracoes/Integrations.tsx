import React, { useState, useEffect } from 'react';
import { CreditCard, Truck, Mail, Smartphone, ShieldCheck, ExternalLink, RefreshCw, Loader2, Save } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { Integracao } from '../../../types/database';

const IntegrationCard = ({ 
  title, 
  icon: Icon, 
  status, 
  onSave, 
  children,
  isSaving
}: any) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-50 rounded-lg">
          <Icon className="h-5 w-5 text-[#2D1B4E]" />
        </div>
        <div>
          <h3 className="font-bold text-gray-800">{title}</h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${status ? 'bg-green-500' : 'bg-gray-300'}`}></span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {status ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div className="p-6 flex-1 space-y-4">
      {children}
    </div>

    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
      <button 
        onClick={onSave}
        disabled={isSaving}
        className="bg-[#2D1B4E] text-white px-6 py-2 rounded-lg text-xs font-bold hover:bg-[#1a0f2e] transition-all flex items-center gap-2 disabled:opacity-50"
      >
        {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
        SALVAR CONFIGURAÇÕES
      </button>
    </div>
  </div>
);

const Integrations = () => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<Integracao[]>([]);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.from('integracoes').select('*');

      if (error) throw error;
      
      const defaultIntegrations = [
        { chave: 'mercadopago', config: { ambiente: 'sandbox', metodos: ['pix', 'card'] }, ativo: false },
        { chave: 'melhorenvio', config: { ambiente: 'sandbox' }, ativo: false },
        { chave: 'email', config: { provider: 'resend' }, ativo: false },
        { chave: 'whatsapp', config: {}, ativo: false }
      ];

      const merged = defaultIntegrations.map(def => {
        const found = data?.find(i => i.chave === def.chave);
        return found ? found : def;
      });

      setIntegrations(merged as any);
    } catch (error) {
      console.error('Error fetching integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConfig = (chave: string) => {
    const item = integrations.find(i => i.chave === chave);
    return item?.config || {};
  };

  const setConfig = (chave: string, newConfig: any) => {
    setIntegrations(prev =>
      prev.map(i =>
        i.chave === chave
          ? { ...i, config: { ...i.config, ...newConfig } }
          : i
      )
    );
  };

  const toggleAtivo = (chave: string) => {
    setIntegrations(prev =>
      prev.map(i =>
        i.chave === chave
          ? { ...i, ativo: !i.ativo }
          : i
      )
    );
  };

  const handleSave = async (chave: string) => {
    const item = integrations.find(i => i.chave === chave);

    if (!item) return false;

    try {
      setIsSaving(chave);

      const { error } = await supabase.from('integracoes').upsert({
        chave: item.chave,
        config: item.config,
        ativo: item.ativo
      }, { onConflict: 'chave' });

      if (error) throw error;

      toast.success(`Configurações de ${chave} salvas!`);
      return true;
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
      return false;
    } finally {
      setIsSaving(null);
    }
  };

  const getSupabaseFunctionsUrl = () => {
    const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
    return envUrl || 'https://lmegfvngqeznpfmnerwa.supabase.co';
  };

  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin text-[#2D1B4E]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Integrações</h1>
          <p className="text-sm text-gray-500">Conecte a Loja com serviços externos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <IntegrationCard 
          title="Mercado Pago" 
          icon={CreditCard} 
          status={integrations.find(i => i.chave === 'mercadopago')?.ativo}
          isSaving={isSaving === 'mercadopago'}
          onSave={() => handleSave('mercadopago')}
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="text-xs font-bold text-gray-700">INTEGRAÇÃO ATIVA</span>
              <input 
                type="checkbox" 
                checked={integrations.find(i => i.chave === 'mercadopago')?.ativo || false} 
                onChange={() => toggleAtivo('mercadopago')}
                className="w-5 h-5"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Ambiente</label>
              <select 
                value={getConfig('mercadopago').ambiente || 'sandbox'}
                onChange={e => setConfig('mercadopago', { ambiente: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm"
              >
                <option value="sandbox">Sandbox (Teste)</option>
                <option value="production">Produção (Real)</option>
              </select>
            </div>

            <div className="p-4 border border-blue-100 bg-blue-50 rounded-lg">
              <h4 className="text-xs font-bold text-blue-700 uppercase mb-3 flex items-center gap-2">
                <ShieldCheck className="h-3 w-3" /> Configurações Sandbox
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Public Key Sandbox</label>
                  <input 
                    type="text" 
                    value={getConfig('mercadopago').publicKeySandbox || ''} 
                    onChange={e => setConfig('mercadopago', { publicKeySandbox: e.target.value })}
                    className="w-full bg-white border border-gray-100 rounded-lg px-3 py-1.5 text-xs" 
                    placeholder="TEST-..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Access Token Sandbox</label>
                  <input 
                    type="password" 
                    value={getConfig('mercadopago').accessTokenSandbox || ''} 
                    onChange={e => setConfig('mercadopago', { accessTokenSandbox: e.target.value })}
                    className="w-full bg-white border border-gray-100 rounded-lg px-3 py-1.5 text-xs" 
                    placeholder="TEST-..."
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border border-gray-100 bg-gray-50 rounded-lg">
              <h4 className="text-xs font-bold text-gray-700 uppercase mb-3 flex items-center gap-2">
                <ShieldCheck className="h-3 w-3" /> Configurações Produção
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Public Key Produção</label>
                  <input 
                    type="text" 
                    value={getConfig('mercadopago').publicKeyProducao || ''} 
                    onChange={e => setConfig('mercadopago', { publicKeyProducao: e.target.value })}
                    className="w-full bg-white border border-gray-100 rounded-lg px-3 py-1.5 text-xs" 
                    placeholder="APP_USR-..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Access Token Produção</label>
                  <input 
                    type="password" 
                    value={getConfig('mercadopago').accessTokenProducao || ''} 
                    onChange={e => setConfig('mercadopago', { accessTokenProducao: e.target.value })}
                    className="w-full bg-white border border-gray-100 rounded-lg px-3 py-1.5 text-xs" 
                    placeholder="APP_USR-..."
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Métodos de Pagamento Ativos</label>
              <div className="grid grid-cols-3 gap-2">
                {['pix', 'card', 'boleto'].map(metodo => (
                  <label key={metodo} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-100 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={getConfig('mercadopago').metodos?.includes(metodo) || false}
                      onChange={e => {
                        const current = getConfig('mercadopago').metodos || [];

                        const next = e.target.checked 
                          ? [...current, metodo]
                          : current.filter((m: string) => m !== metodo);

                        setConfig('mercadopago', { metodos: next });
                      }}
                    />
                    <span className="text-[10px] font-bold uppercase">{metodo}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={async () => {
                const config = getConfig('mercadopago');
                const ambiente = config.ambiente || 'sandbox';
                const token = ambiente === 'sandbox'
                  ? config.accessTokenSandbox
                  : config.accessTokenProducao;
                
                if (!token) {
                  toast.error('Informe o Access Token para testar.');
                  return;
                }

                try {
                  toast.loading('Testando conexão...', { id: 'test-mp' });

                  const { data, error } = await supabase.functions.invoke('testar-conexao-mercadopago', {
                    body: { accessToken: token, ambiente }
                  });
                  
                  if (error) throw error;

                  if (data.success) {
                    toast.success('Conexão Mercado Pago OK!', { id: 'test-mp' });
                  } else {
                    toast.error('Erro na conexão: ' + data.error, { id: 'test-mp' });
                  }
                } catch (err: any) {
                  toast.error('Falha ao testar: ' + err.message, { id: 'test-mp' });
                }
              }}
              className="w-full py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2 mt-2"
            >
              <RefreshCw className="h-3 w-3" /> TESTAR CONEXÃO MERCADO PAGO
            </button>

            <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
              <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
                <strong>Webhook URL:</strong><br />
                Copie e cole no painel do Mercado Pago:<br />
                <code className="bg-white/50 px-1 py-0.5 rounded break-all select-all">
                  {`${getSupabaseFunctionsUrl()}/functions/v1/webhook-mercadopago`}
                </code>
              </p>
            </div>
          </div>
        </IntegrationCard>

        <IntegrationCard 
          title="Melhor Envio" 
          icon={Truck} 
          status={integrations.find(i => i.chave === 'melhorenvio')?.ativo}
          isSaving={isSaving === 'melhorenvio'}
          onSave={() => handleSave('melhorenvio')}
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="text-xs font-bold text-gray-700">INTEGRAÇÃO ATIVA</span>
              <input 
                type="checkbox" 
                checked={integrations.find(i => i.chave === 'melhorenvio')?.ativo || false} 
                onChange={() => toggleAtivo('melhorenvio')}
                className="w-5 h-5"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Ambiente</label>
                <select 
                  value={getConfig('melhorenvio').ambiente || 'sandbox'}
                  onChange={e => setConfig('melhorenvio', { ambiente: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm"
                >
                  <option value="sandbox">Sandbox (Teste)</option>
                  <option value="production">Produção (Real)</option>
                </select>

                <p className="text-[10px] text-gray-400 mt-1">
                  Se o app foi criado no Sandbox do Melhor Envio, selecione Sandbox. Se foi criado em produção, selecione Produção.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">CEP de Origem</label>
                <input 
                  type="text" 
                  value={getConfig('melhorenvio').cep_origem || ''} 
                  onChange={e => setConfig('melhorenvio', { cep_origem: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm" 
                  placeholder="00000-000" 
                />
              </div>
            </div>

            <div className="p-4 border border-gray-100 bg-gray-50 rounded-lg space-y-3">
              <h4 className="text-xs font-bold text-gray-700 uppercase flex items-center gap-2">
                <ShieldCheck className="h-3 w-3" /> Credenciais do App
              </h4>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Client ID</label>
                <input 
                  type="text" 
                  value={getConfig('melhorenvio').client_id || ''} 
                  onChange={e => setConfig('melhorenvio', { client_id: e.target.value })}
                  className="w-full bg-white border border-gray-100 rounded-lg px-3 py-1.5 text-xs" 
                  placeholder="ID do seu app no Melhor Envio"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Client Secret</label>
                <input 
                  type="password" 
                  value={getConfig('melhorenvio').client_secret || ''} 
                  onChange={e => setConfig('melhorenvio', { client_secret: e.target.value })}
                  className="w-full bg-white border border-gray-100 rounded-lg px-3 py-1.5 text-xs" 
                  placeholder="Secret do seu app"
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-[10px] text-blue-800 font-medium leading-relaxed">
                <strong>URL de Redirecionamento (Callback):</strong><br />
                Cadastre exatamente esta URL no seu app do Melhor Envio:<br />
                <code className="bg-white/50 px-1 py-0.5 rounded break-all select-all">
                  {`${window.location.origin}/admin/integracoes/melhor-envio/callback`}
                </code>
              </p>
            </div>

            <div className="p-4 border border-gray-200 bg-gray-50 rounded-lg space-y-3">
              <h4 className="text-xs font-bold text-gray-700 uppercase flex items-center gap-2">
                <Smartphone className="h-3 w-3" /> Debug Técnico do Token
              </h4>

              <div className="grid grid-cols-2 gap-2">
                {['access_token', 'refresh_token', 'expires_at', 'client_id', 'client_secret'].map(key => {
                  const val = getConfig('melhorenvio')[key];
                  const exists = !!val;

                  return (
                    <div key={key} className="flex flex-col p-2 bg-white border border-gray-100 rounded">
                      <span className="text-[9px] font-bold text-gray-400 uppercase">{key}</span>
                      <div className="flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${exists ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className={`text-[10px] font-mono ${exists ? 'text-green-700' : 'text-red-700'}`}>
                          {exists
                            ? (key.includes('token') || key.includes('secret')
                              ? `${String(val).substring(0, 8)}...`
                              : String(val).substring(0, 20))
                            : 'AUSENTE'}
                        </span>
                      </div>
                    </div>
                  );
                })}

                <div className="flex flex-col p-2 bg-white border border-gray-100 rounded">
                  <span className="text-[9px] font-bold text-gray-400 uppercase">Status Conexão</span>
                  <div className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${getConfig('melhorenvio').connected ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    <span className={`text-[10px] font-bold ${getConfig('melhorenvio').connected ? 'text-green-700' : 'text-gray-400'}`}>
                      {getConfig('melhorenvio').connected ? 'CONECTADO' : 'DESCONECTADO'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">URL OAuth (Debug)</label>

                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={(() => {
                      const config = getConfig('melhorenvio');

                      if (!config.client_id) return 'Aguardando Client ID...';

                      const isSandbox = config.ambiente === 'sandbox';

                      const baseUrl = isSandbox
                        ? 'https://sandbox.melhorenvio.com.br'
                        : 'https://melhorenvio.com.br';

                      const redirectUri = encodeURIComponent(
                        `${window.location.origin}/admin/integracoes/melhor-envio/callback`
                      );

                      const scopes = encodeURIComponent([
                        'cart-read',
                        'cart-write',
                        'companies-read',
                        'companies-write',
                        'coupons-read',
                        'coupons-write',
                        'notifications-read',
                        'orders-read',
                        'products-read',
                        'products-write',
                        'purchases-read',
                        'shipping-calculate',
                        'shipping-cancel',
                        'shipping-checkout',
                        'shipping-companies',
                        'shipping-generate',
                        'shipping-preview',
                        'shipping-print',
                        'shipping-share',
                        'shipping-tracking',
                        'ecommerce-shipping',
                        'transactions-read',
                        'users-read',
                        'users-write',
                        'webhooks-read',
                        'webhooks-write'
                      ].join(' '));

                      return `${baseUrl}/oauth/authorize?client_id=${config.client_id}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes}&state=${isSandbox ? 'sandbox' : 'production'}`;
                    })()}
                    className="flex-1 bg-white border border-gray-100 rounded px-2 py-1 text-[10px] text-gray-500 overflow-hidden text-ellipsis"
                  />
                </div>
              </div>

              <button
                onClick={async () => {
                  const config = getConfig('melhorenvio');

                  if (!config.client_id) {
                    toast.error('Informe o Client ID primeiro.');
                    return;
                  }

                  if (!config.client_secret) {
                    toast.error('Informe o Client Secret primeiro.');
                    return;
                  }
                  
                  const isSandbox = config.ambiente === 'sandbox';

                  const baseUrl = isSandbox
                    ? 'https://sandbox.melhorenvio.com.br'
                    : 'https://melhorenvio.com.br';

                  const redirectUri = encodeURIComponent(
                    `${window.location.origin}/admin/integracoes/melhor-envio/callback`
                  );

                  const scopes = encodeURIComponent([
                    'cart-read',
                    'cart-write',
                    'companies-read',
                    'companies-write',
                    'coupons-read',
                    'coupons-write',
                    'notifications-read',
                    'orders-read',
                    'products-read',
                    'products-write',
                    'purchases-read',
                    'shipping-calculate',
                    'shipping-cancel',
                    'shipping-checkout',
                    'shipping-companies',
                    'shipping-generate',
                    'shipping-preview',
                    'shipping-print',
                    'shipping-share',
                    'shipping-tracking',
                    'ecommerce-shipping',
                    'transactions-read',
                    'users-read',
                    'users-write',
                    'webhooks-read',
                    'webhooks-write'
                  ].join(' '));

                  const authUrl =
                    `${baseUrl}/oauth/authorize?client_id=${config.client_id}` +
                    `&redirect_uri=${redirectUri}` +
                    `&response_type=code` +
                    `&scope=${scopes}` +
                    `&state=${isSandbox ? 'sandbox' : 'production'}`;

                  const saved = await handleSave('melhorenvio');

                  if (!saved) return;

                  window.location.href = authUrl;
                }}
                className="w-full py-2 bg-[#2D1B4E] text-white rounded-lg text-xs font-bold hover:bg-[#1a0f2e] transition-all flex items-center justify-center gap-2"
              >
                <ExternalLink className="h-3 w-3" /> CONECTAR MELHOR ENVIO
              </button>

              <div className="space-y-2">
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={async () => {
                        try {
                          const config = getConfig('melhorenvio');

                          toast.loading('Validando App...', { id: 'test-me' });
                          
                          const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || '';
                          const SUPABASE_KEY = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY || '';

                          const response = await fetch(`${SUPABASE_URL}/functions/v1/melhor-envio`, {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${SUPABASE_KEY}`,
                              'apikey': SUPABASE_KEY,
                              'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ 
                              action: 'test-app',
                              client_id: config.client_id,
                              client_secret: config.client_secret,
                              ambiente: config.ambiente,
                              cep_origem: config.cep_origem
                            })
                          });

                          const status = response.status;
                          const text = await response.text();

                          let parsed = null;

                          try {
                            parsed = JSON.parse(text);
                          } catch (e) {}

                          (window as any).lastMelhorEnvioStatus = status;
                          (window as any).lastMelhorEnvioRaw = text;
                          (window as any).lastMelhorEnvioError = parsed;

                          if (response.ok && parsed?.success) {
                            toast.success('App Validado!', { id: 'test-me' });
                          } else {
                            document.getElementById('me-debug-panel')?.classList.remove('hidden');
                            toast.error(parsed?.message || 'Erro na validação do app', { id: 'test-me' });
                          }
                        } catch (err: any) {
                          toast.error('Erro de rede: ' + err.message, { id: 'test-me' });
                        }
                      }}
                      className="py-2 border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="h-3 w-3" /> TESTAR APP
                    </button>

                    <button
                      disabled={!getConfig('melhorenvio').access_token}
                      onClick={async () => {
                        try {
                          toast.loading('Validando Token...', { id: 'test-token' });

                          const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || '';
                          const SUPABASE_KEY = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY || '';

                          const response = await fetch(`${SUPABASE_URL}/functions/v1/melhor-envio`, {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${SUPABASE_KEY}`,
                              'apikey': SUPABASE_KEY,
                              'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ action: 'test-token' })
                          });

                          const status = response.status;
                          const text = await response.text();

                          let parsed = null;

                          try {
                            parsed = JSON.parse(text);
                          } catch (e) {}

                          (window as any).lastMelhorEnvioStatus = status;
                          (window as any).lastMelhorEnvioRaw = text;
                          (window as any).lastMelhorEnvioError = parsed;

                          if (response.ok && parsed?.success) {
                            toast.success(parsed.message, { id: 'test-token' });
                          } else {
                            document.getElementById('me-debug-panel')?.classList.remove('hidden');
                            toast.error(parsed?.message || 'Token inválido', { id: 'test-token' });
                          }
                        } catch (err: any) {
                          toast.error('Erro: ' + err.message, { id: 'test-token' });
                        }
                      }}
                      className={`py-2 border rounded-lg text-[10px] font-bold flex items-center justify-center gap-2 ${
                        getConfig('melhorenvio').access_token 
                          ? 'border-green-200 text-green-600 hover:bg-green-50' 
                          : 'border-gray-100 text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      <ShieldCheck className="h-3 w-3" /> TESTAR TOKEN
                    </button>
                  </div>

                  {!getConfig('melhorenvio').access_token && (
                    <div className="text-[10px] bg-amber-50 text-amber-700 p-2 rounded border border-amber-100 font-medium">
                      ⚠️ Aplicativo salvo, mas Melhor Envio ainda não conectado. 
                      Clique no botão roxo abaixo para conectar.
                    </div>
                  )}

                  <button
                    onClick={async () => {
                      try {
                        toast.loading('Testando Function Online...', { id: 'test-ping' });

                        const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || '';
                        const SUPABASE_KEY = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY || '';
                        
                        const response = await fetch(`${SUPABASE_URL}/functions/v1/melhor-envio`, {
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${SUPABASE_KEY}`,
                            'apikey': SUPABASE_KEY,
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({ action: 'ping' })
                        });

                        const status = response.status;
                        const text = await response.text();

                        let parsed = null;

                        try {
                          parsed = JSON.parse(text);
                        } catch (e) {}

                        (window as any).lastMelhorEnvioStatus = status;
                        (window as any).lastMelhorEnvioRaw = text;
                        (window as any).lastMelhorEnvioError = parsed;

                        if (response.ok && parsed?.success) {
                          toast.success('Function Online!', { id: 'test-ping' });
                        } else {
                          toast.error('Function Offline.', { id: 'test-ping' });
                        }
                      } catch (err: any) {
                        toast.error('Erro: ' + err.message, { id: 'test-ping' });
                      }
                    }}
                    className="py-1 text-[9px] text-gray-400 hover:text-gray-600 underline flex justify-center"
                  >
                    Verificar se servidor está online
                  </button>
                  
                  <button
                    onClick={() => {
                      setConfig('melhorenvio', { 
                        access_token: null, 
                        refresh_token: null, 
                        expires_at: null,
                        connected: false
                      });

                      handleSave('melhorenvio');

                      toast.info('Melhor Envio desconectado.');
                    }}
                    className="py-2 border border-red-100 rounded-lg text-[10px] font-bold text-red-600 hover:bg-red-50 flex items-center justify-center gap-2"
                  >
                    DESCONECTAR
                  </button>
                </div>

                <div id="me-debug-panel" className="hidden mt-4 p-4 bg-gray-900 rounded-lg border border-gray-800 shadow-2xl overflow-hidden">
                  <div className="flex justify-between items-center mb-3 border-b border-gray-800 pb-2">
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Última Resposta Técnica</span>
                    <button 
                      onClick={() => document.getElementById('me-debug-panel')?.classList.add('hidden')} 
                      className="text-gray-500 hover:text-white text-[10px] uppercase font-bold"
                    >
                      [Fechar]
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-[9px]">
                      <div>
                        <span className="text-gray-500 block uppercase font-bold">Status HTTP Real</span>
                        <span className="text-white font-mono">{(window as any).lastMelhorEnvioStatus || '---'}</span>
                      </div>

                      <div>
                        <span className="text-gray-500 block uppercase font-bold">Etapa (se JSON)</span>
                        <span className="text-white">{(window as any).lastMelhorEnvioError?.etapa || '---'}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-500 block text-[9px] uppercase font-bold mb-1">Response Text (Completo)</span>
                      <pre className="text-[9px] text-green-300 bg-black/30 p-2 rounded overflow-auto max-h-48 leading-tight font-mono whitespace-pre-wrap">
                        {(window as any).lastMelhorEnvioRaw || 'Nenhuma resposta recebida.'}
                      </pre>
                    </div>

                    <div>
                      <span className="text-gray-500 block text-[9px] uppercase font-bold mb-1">JSON Parseado</span>
                      <pre className="text-[9px] text-blue-300 bg-black/30 p-2 rounded overflow-auto max-h-32 leading-tight font-mono">
                        {JSON.stringify((window as any).lastMelhorEnvioError, null, 2) || '---'}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {getConfig('melhorenvio').access_token && (
              <div className="flex items-center justify-between text-[10px] text-gray-400 italic">
                <span>Status: Conectado</span>
                {getConfig('melhorenvio').expires_at && (
                  <span>Expira em: {new Date(getConfig('melhorenvio').expires_at).toLocaleDateString()}</span>
                )}
              </div>
            )}
          </div>
        </IntegrationCard>

        <IntegrationCard 
          title="E-mail Transacional" 
          icon={Mail} 
          status={integrations.find(i => i.chave === 'email')?.ativo}
          isSaving={isSaving === 'email'}
          onSave={() => handleSave('email')}
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="text-xs font-bold text-gray-700">INTEGRAÇÃO ATIVA</span>
              <input 
                type="checkbox" 
                checked={integrations.find(i => i.chave === 'email')?.ativo || false} 
                onChange={() => toggleAtivo('email')}
                className="w-5 h-5"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Provedor</label>
              <select 
                value={getConfig('email').provider || 'resend'}
                onChange={e => setConfig('email', { provider: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm"
              >
                <option value="resend">Resend (Recomendado)</option>
                <option value="smtp">SMTP Personalizado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">API Key / Senha</label>
              <input 
                type="password" 
                value={getConfig('email').apiKey || ''} 
                onChange={e => setConfig('email', { apiKey: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">E-mail do Remetente</label>
              <input 
                type="email" 
                value={getConfig('email').remetente || ''} 
                onChange={e => setConfig('email', { remetente: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm" 
              />
            </div>
          </div>
        </IntegrationCard>

        <IntegrationCard 
          title="WhatsApp (Z-API / Evolution)" 
          icon={Smartphone} 
          status={integrations.find(i => i.chave === 'whatsapp')?.ativo}
          isSaving={isSaving === 'whatsapp'}
          onSave={() => handleSave('whatsapp')}
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="text-xs font-bold text-gray-700">INTEGRAÇÃO ATIVA</span>
              <input 
                type="checkbox" 
                checked={integrations.find(i => i.chave === 'whatsapp')?.ativo || false} 
                onChange={() => toggleAtivo('whatsapp')}
                className="w-5 h-5"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">API URL</label>
              <input 
                type="text" 
                value={getConfig('whatsapp').apiUrl || ''} 
                onChange={e => setConfig('whatsapp', { apiUrl: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm" 
                placeholder="https://api.z-api.io/..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Instância / Token</label>
              <input 
                type="text" 
                value={getConfig('whatsapp').token || ''} 
                onChange={e => setConfig('whatsapp', { token: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm" 
              />
            </div>
          </div>
        </IntegrationCard>
      </div>
    </div>
  );
};

export default Integrations;
