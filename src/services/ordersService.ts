
import { supabase } from "../integrations/supabase/client";

export const ordersService = {
  async list() {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*, clientes(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("[OrdersService] Erro ao listar pedidos:", error);
      throw error;
    }
    return data;
  },

  async getById(id: number | string) {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*, clientes(*)')
      .eq('id', Number(id))
      .single();

    if (error) {
      console.error(`[OrdersService] Erro ao buscar pedido ${id}:`, error);
      throw error;
    }
    return data;
  },

  async updateStatus(id: number | string, status: string) {
    const { data, error } = await supabase
      .from('pedidos')
      .update({ status })
      .eq('id', Number(id))
      .select()
      .single();

    if (error) {
      console.error(`[OrdersService] Erro ao atualizar status do pedido ${id}:`, error);
      throw error;
    }
    return data;
  }
};
