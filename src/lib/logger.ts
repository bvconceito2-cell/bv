import { supabase } from "@/integrations/supabase/client";

export const logger = {
  async info(message: string, detalhes?: any, origem = 'sistema') {
    try {
      await supabase.from('logs_sistema').insert({
        nivel: 'info',
        mensagem: message,
        detalhes,
        origem,
        url: window.location.href,
        user_agent: navigator.userAgent
      });
    } catch (e) {
      // Falha silenciosa em logs para não quebrar a UI
    }
  },

  async error(message: string, detalhes?: any, origem = 'sistema') {
    try {
      await supabase.from('logs_sistema').insert({
        nivel: 'error',
        mensagem: message,
        detalhes,
        origem,
        url: window.location.href,
        user_agent: navigator.userAgent
      });
    } catch (e) {
      // Falha silenciosa
    }
  }
};
