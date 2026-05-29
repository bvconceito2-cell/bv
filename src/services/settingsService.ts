
import { supabase } from "../integrations/supabase/client";

export const settingsService = {
  async get() {
    const { data, error } = await supabase
      .from('configuracoes')
      .select('*')
      .single();

    if (error) {
      console.error("[SettingsService] Erro ao buscar configurações:", error);
      throw error;
    }
    return data;
  },

  async update(settings: any) {
    const { data, error } = await supabase
      .from('configuracoes')
      .update(settings)
      .eq('id', settings.id)
      .select()
      .single();

    if (error) {
      console.error("[SettingsService] Erro ao atualizar configurações:", error);
      throw error;
    }
    return data;
  }
};
