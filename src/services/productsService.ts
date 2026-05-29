import { supabase } from "@/integrations/supabase/client";

export const productsService = {
  async list() {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("[ProductsService] Erro ao listar produtos:", error);
      throw error;
    }
    return data;
  },

  async getById(id: number | string) {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('id', id as any)
      .single();

    if (error) {
      console.error(`[ProductsService] Erro ao buscar produto ${id}:`, error);
      throw error;
    }
    return data;
  },

  async create(product: any) {
    const { data, error } = await supabase
      .from('produtos')
      .insert([product])
      .select()
      .single();

    if (error) {
      console.error("[ProductsService] Erro ao criar produto:", error);
      throw error;
    }
    return data;
  },

  async update(id: number | string, product: any) {
    const { data, error } = await supabase
      .from('produtos')
      .update(product)
      .eq('id', id as any)
      .select()
      .single();

    if (error) {
      console.error(`[ProductsService] Erro ao atualizar produto ${id}:`, error);
      throw error;
    }
    return data;
  },

  async delete(id: number | string) {
    const { error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', id as any);

    if (error) {
      console.error(`[ProductsService] Erro ao deletar produto ${id}:`, error);
      throw error;
    }
  }
};

