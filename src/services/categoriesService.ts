
import { supabase } from "../integrations/supabase/client";

export const categoriesService = {
  async list() {
    const { data, error } = await supabase
      .from('categorias')
      .select('id, nome, slug')
      .order('ordem', { ascending: true });

    if (error) {
      console.error("[CategoriesService] Erro ao listar categorias:", error);
      return [];
    }
    return data;
  },

  async getById(id: number | string) {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('id', Number(id))
      .single();

    if (error) {
      console.error(`[CategoriesService] Erro ao buscar categoria ${id}:`, error);
      throw error;
    }
    return data;
  },

  async create(category: any) {
    const { data, error } = await supabase
      .from('categorias')
      .insert([category])
      .select()
      .single();

    if (error) {
      console.error("[CategoriesService] Erro ao criar categoria:", error);
      throw error;
    }
    return data;
  },

  async update(id: number | string, category: any) {
    const { data, error } = await supabase
      .from('categorias')
      .update(category)
      .eq('id', Number(id))
      .select()
      .single();

    if (error) {
      console.error(`[CategoriesService] Erro ao atualizar categoria ${id}:`, error);
      throw error;
    }
    return data;
  },

  async delete(id: number | string) {
    const { error } = await supabase
      .from('categorias')
      .delete()
      .eq('id', Number(id));

    if (error) {
      console.error(`[CategoriesService] Erro ao deletar categoria ${id}:`, error);
      throw error;
    }
  }
};
