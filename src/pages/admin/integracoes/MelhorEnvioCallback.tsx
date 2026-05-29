import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

const MelhorEnvioCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processando conexão com Melhor Envio...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state') || 'production';

        if (!code) {
          setStatus('error');
          setMessage('Código de autorização não encontrado.');
          return;
        }

        const { data: integration, error: fetchError } = await supabase
          .from('integracoes')
          .select('config')
          .eq('chave', 'melhorenvio')
          .single();

        if (fetchError) throw fetchError;

        const config = (integration?.config as any) || {};

        if (!config.client_id || !config.client_secret) {
          throw new Error('Client ID ou Client Secret não configurados.');
        }

        const redirectUri = `${window.location.origin}/admin/integracoes/melhor-envio/callback`;

        const { data, error } = await supabase.functions.invoke('melhor-envio', {
  body: {
    action: 'exchange-code',
    code,
    client_id: config.client_id,
    client_secret: config.client_secret,
    redirect_uri: redirectUri,
    ambiente: state
  }
});

console.log('FUNCTION RESPONSE:', data);
console.log('FUNCTION ERROR:', error);

        if (error) throw error;

        if (data?.success === false) {
          throw new Error(data?.message || 'Erro ao conectar Melhor Envio.');
        }

        setStatus('success');
        setMessage('Melhor Envio conectado com sucesso!');

        setTimeout(() => {
          navigate('/admin/integracoes');
        }, 2000);
      } catch (error: any) {
        console.error(error);
        setStatus('error');
        setMessage(error.message || 'Erro ao conectar Melhor Envio.');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full border border-gray-100">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-[#2D1B4E] mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-800 mb-2">Conectando...</h1>
            <p className="text-sm text-gray-500">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-800 mb-2">Sucesso!</h1>
            <p className="text-sm text-gray-500">{message}</p>
            <button
              onClick={() => navigate('/admin/integracoes')}
              className="mt-5 text-[#2D1B4E] font-bold text-sm underline"
            >
              Voltar agora
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-800 mb-2">Erro</h1>
            <p className="text-sm text-red-600">{message}</p>
            <button
              onClick={() => navigate('/admin/integracoes')}
              className="mt-5 bg-[#2D1B4E] text-white px-6 py-3 rounded-xl font-bold text-sm"
            >
              Voltar para integrações
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MelhorEnvioCallback;
