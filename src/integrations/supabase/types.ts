export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      aparencia: {
        Row: {
          cores: Json
          favicon_url: string | null
          fontes: Json
          id: number
          logo_url: string | null
          updated_at: string | null
        }
        Insert: {
          cores?: Json
          favicon_url?: string | null
          fontes?: Json
          id?: number
          logo_url?: string | null
          updated_at?: string | null
        }
        Update: {
          cores?: Json
          favicon_url?: string | null
          fontes?: Json
          id?: number
          logo_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      banner_editorial: {
        Row: {
          ativo: boolean | null
          id: number
          imagem_url: string
          link_botao: string | null
          produtos_ids: number[] | null
          subtitulo: string | null
          texto_botao: string | null
          titulo: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          id?: number
          imagem_url: string
          link_botao?: string | null
          produtos_ids?: number[] | null
          subtitulo?: string | null
          texto_botao?: string | null
          titulo?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          id?: number
          imagem_url?: string
          link_botao?: string | null
          produtos_ids?: number[] | null
          subtitulo?: string | null
          texto_botao?: string | null
          titulo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      banners_hero: {
        Row: {
          ativo: boolean | null
          cor_botao: string | null
          created_at: string | null
          id: number
          imagem_desktop: string
          imagem_mobile: string | null
          link_botao: string | null
          ordem: number | null
          posicao_texto: string | null
          subtitulo: string | null
          texto_botao: string | null
          titulo: string | null
        }
        Insert: {
          ativo?: boolean | null
          cor_botao?: string | null
          created_at?: string | null
          id?: number
          imagem_desktop: string
          imagem_mobile?: string | null
          link_botao?: string | null
          ordem?: number | null
          posicao_texto?: string | null
          subtitulo?: string | null
          texto_botao?: string | null
          titulo?: string | null
        }
        Update: {
          ativo?: boolean | null
          cor_botao?: string | null
          created_at?: string | null
          id?: number
          imagem_desktop?: string
          imagem_mobile?: string | null
          link_botao?: string | null
          ordem?: number | null
          posicao_texto?: string | null
          subtitulo?: string | null
          texto_botao?: string | null
          titulo?: string | null
        }
        Relationships: []
      }
      banners_promocionais: {
        Row: {
          alinhamento: string | null
          ativo: boolean | null
          cor_botao: string | null
          cor_texto: string | null
          created_at: string | null
          id: number
          imagem_desktop: string
          imagem_mobile: string
          link_botao: string | null
          ordem: number | null
          overlay: boolean | null
          subtitulo: string | null
          texto_botao: string | null
          titulo: string | null
        }
        Insert: {
          alinhamento?: string | null
          ativo?: boolean | null
          cor_botao?: string | null
          cor_texto?: string | null
          created_at?: string | null
          id?: number
          imagem_desktop: string
          imagem_mobile: string
          link_botao?: string | null
          ordem?: number | null
          overlay?: boolean | null
          subtitulo?: string | null
          texto_botao?: string | null
          titulo?: string | null
        }
        Update: {
          alinhamento?: string | null
          ativo?: boolean | null
          cor_botao?: string | null
          cor_texto?: string | null
          created_at?: string | null
          id?: number
          imagem_desktop?: string
          imagem_mobile?: string
          link_botao?: string | null
          ordem?: number | null
          overlay?: boolean | null
          subtitulo?: string | null
          texto_botao?: string | null
          titulo?: string | null
        }
        Relationships: []
      }
      categorias: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          id: number
          imagem_url: string | null
          nome: string
          ordem: number | null
          slug: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          id?: number
          imagem_url?: string | null
          nome: string
          ordem?: number | null
          slug: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          id?: number
          imagem_url?: string | null
          nome?: string
          ordem?: number | null
          slug?: string
        }
        Relationships: []
      }
      checkout_logs: {
        Row: {
          created_at: string | null
          endpoint: string | null
          erro: string | null
          etapa: string
          id: string
          request_payload: Json | null
          response_payload: Json | null
          status_http: number | null
        }
        Insert: {
          created_at?: string | null
          endpoint?: string | null
          erro?: string | null
          etapa: string
          id?: string
          request_payload?: Json | null
          response_payload?: Json | null
          status_http?: number | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string | null
          erro?: string | null
          etapa?: string
          id?: string
          request_payload?: Json | null
          response_payload?: Json | null
          status_http?: number | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          cpf: string | null
          created_at: string | null
          data_nascimento: string | null
          email: string
          enderecos: Json | null
          genero: string | null
          id: string
          nome: string
          notas_internas: string | null
          segmento: string | null
          telefone: string | null
          total_gasto: number | null
          total_pedidos: number | null
          ultimo_pedido: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email: string
          enderecos?: Json | null
          genero?: string | null
          id?: string
          nome: string
          notas_internas?: string | null
          segmento?: string | null
          telefone?: string | null
          total_gasto?: number | null
          total_pedidos?: number | null
          ultimo_pedido?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string
          enderecos?: Json | null
          genero?: string | null
          id?: string
          nome?: string
          notas_internas?: string | null
          segmento?: string | null
          telefone?: string | null
          total_gasto?: number | null
          total_pedidos?: number | null
          ultimo_pedido?: string | null
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          chave: string
          id: number
          updated_at: string | null
          valor: Json
        }
        Insert: {
          chave: string
          id?: number
          updated_at?: string | null
          valor: Json
        }
        Update: {
          chave?: string
          id?: number
          updated_at?: string | null
          valor?: Json
        }
        Relationships: []
      }
      cupons: {
        Row: {
          ativo: boolean | null
          categorias_ids: number[] | null
          codigo: string
          created_at: string | null
          id: number
          limite_por_cliente: number | null
          limite_usos: number | null
          produtos_ids: number[] | null
          tipo: string
          usos_atuais: number | null
          validade: string | null
          valor: number
          valor_minimo_pedido: number | null
        }
        Insert: {
          ativo?: boolean | null
          categorias_ids?: number[] | null
          codigo: string
          created_at?: string | null
          id?: number
          limite_por_cliente?: number | null
          limite_usos?: number | null
          produtos_ids?: number[] | null
          tipo: string
          usos_atuais?: number | null
          validade?: string | null
          valor: number
          valor_minimo_pedido?: number | null
        }
        Update: {
          ativo?: boolean | null
          categorias_ids?: number[] | null
          codigo?: string
          created_at?: string | null
          id?: number
          limite_por_cliente?: number | null
          limite_usos?: number | null
          produtos_ids?: number[] | null
          tipo?: string
          usos_atuais?: number | null
          validade?: string | null
          valor?: number
          valor_minimo_pedido?: number | null
        }
        Relationships: []
      }
      favoritos: {
        Row: {
          created_at: string | null
          id: string
          produto_id: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          produto_id?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          produto_id?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favoritos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      integracoes: {
        Row: {
          ativo: boolean | null
          chave: string
          config: Json
          id: number
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          chave: string
          config?: Json
          id?: number
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          chave?: string
          config?: Json
          id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      logs_sistema: {
        Row: {
          created_at: string | null
          detalhes: Json | null
          id: string
          mensagem: string
          nivel: string
          origem: string
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          detalhes?: Json | null
          id?: string
          mensagem: string
          nivel: string
          origem: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          detalhes?: Json | null
          id?: string
          mensagem?: string
          nivel?: string
          origem?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      mercadopago_webhooks_logs: {
        Row: {
          error_message: string | null
          id: string
          order_id: string | null
          payload_bruto: Json | null
          payment_id: string | null
          processed_at: string | null
          status: string | null
          success: boolean | null
        }
        Insert: {
          error_message?: string | null
          id?: string
          order_id?: string | null
          payload_bruto?: Json | null
          payment_id?: string | null
          processed_at?: string | null
          status?: string | null
          success?: boolean | null
        }
        Update: {
          error_message?: string | null
          id?: string
          order_id?: string | null
          payload_bruto?: Json | null
          payment_id?: string | null
          processed_at?: string | null
          status?: string | null
          success?: boolean | null
        }
        Relationships: []
      }
      notificacoes_admin: {
        Row: {
          created_at: string | null
          id: string
          lida: boolean | null
          link: string | null
          mensagem: string
          metadata: Json | null
          tipo: string | null
          titulo: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lida?: boolean | null
          link?: string | null
          mensagem: string
          metadata?: Json | null
          tipo?: string | null
          titulo: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lida?: boolean | null
          link?: string | null
          mensagem?: string
          metadata?: Json | null
          tipo?: string | null
          titulo?: string
        }
        Relationships: []
      }
      pedidos: {
        Row: {
          cliente_email: string
          cliente_id: string | null
          cliente_nome: string
          cliente_telefone: string | null
          codigo: string
          codigo_rastreio: string | null
          created_at: string | null
          cupom_codigo: string | null
          desconto: number | null
          endereco_entrega: Json
          forma_pagamento: string
          frete: number | null
          historico_status: Json | null
          id: number
          idempotency_key: string | null
          itens: Json
          metodo_envio: Json | null
          mp_payment_id: string | null
          mp_preference_id: string | null
          observacoes_internas: string | null
          status: string | null
          status_pagamento: string | null
          subtotal: number
          total: number
          transportadora: string | null
          updated_at: string | null
        }
        Insert: {
          cliente_email: string
          cliente_id?: string | null
          cliente_nome: string
          cliente_telefone?: string | null
          codigo: string
          codigo_rastreio?: string | null
          created_at?: string | null
          cupom_codigo?: string | null
          desconto?: number | null
          endereco_entrega: Json
          forma_pagamento: string
          frete?: number | null
          historico_status?: Json | null
          id?: number
          idempotency_key?: string | null
          itens: Json
          metodo_envio?: Json | null
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          observacoes_internas?: string | null
          status?: string | null
          status_pagamento?: string | null
          subtotal: number
          total: number
          transportadora?: string | null
          updated_at?: string | null
        }
        Update: {
          cliente_email?: string
          cliente_id?: string | null
          cliente_nome?: string
          cliente_telefone?: string | null
          codigo?: string
          codigo_rastreio?: string | null
          created_at?: string | null
          cupom_codigo?: string | null
          desconto?: number | null
          endereco_entrega?: Json
          forma_pagamento?: string
          frete?: number | null
          historico_status?: Json | null
          id?: number
          idempotency_key?: string | null
          itens?: Json
          metodo_envio?: Json | null
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          observacoes_internas?: string | null
          status?: string | null
          status_pagamento?: string | null
          subtotal?: number
          total?: number
          transportadora?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean | null
          avaliacao: number | null
          categoria_id: number | null
          cores: Json | null
          created_at: string | null
          descricao: string | null
          destaque: boolean | null
          detalhes: Json | null
          estoque: number | null
          estoque_por_variacao: Json | null
          id: number
          imagem_principal: string | null
          imagens: string[] | null
          marca: string | null
          meta_description: string | null
          meta_title: string | null
          midias: Json | null
          nome: string
          novidade: boolean | null
          parcelas: number | null
          preco_atual: number
          preco_original: number
          slug: string | null
          tamanhos: string[] | null
          total_avaliacoes: number | null
          total_vendas: number | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          avaliacao?: number | null
          categoria_id?: number | null
          cores?: Json | null
          created_at?: string | null
          descricao?: string | null
          destaque?: boolean | null
          detalhes?: Json | null
          estoque?: number | null
          estoque_por_variacao?: Json | null
          id?: number
          imagem_principal?: string | null
          imagens?: string[] | null
          marca?: string | null
          meta_description?: string | null
          meta_title?: string | null
          midias?: Json | null
          nome: string
          novidade?: boolean | null
          parcelas?: number | null
          preco_atual: number
          preco_original: number
          slug?: string | null
          tamanhos?: string[] | null
          total_avaliacoes?: number | null
          total_vendas?: number | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          avaliacao?: number | null
          categoria_id?: number | null
          cores?: Json | null
          created_at?: string | null
          descricao?: string | null
          destaque?: boolean | null
          detalhes?: Json | null
          estoque?: number | null
          estoque_por_variacao?: Json | null
          id?: number
          imagem_principal?: string | null
          imagens?: string[] | null
          marca?: string | null
          meta_description?: string | null
          meta_title?: string | null
          midias?: Json | null
          nome?: string
          novidade?: boolean | null
          parcelas?: number | null
          preco_atual?: number
          preco_original?: number
          slug?: string | null
          tamanhos?: string[] | null
          total_avaliacoes?: number | null
          total_vendas?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          role: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          role?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          role?: string | null
        }
        Relationships: []
      }
      secoes_home: {
        Row: {
          chave: string
          config: Json | null
          id: number
          nome: string
          ordem: number | null
          updated_at: string | null
          visivel: boolean | null
        }
        Insert: {
          chave: string
          config?: Json | null
          id?: number
          nome: string
          ordem?: number | null
          updated_at?: string | null
          visivel?: boolean | null
        }
        Update: {
          chave?: string
          config?: Json | null
          id?: number
          nome?: string
          ordem?: number | null
          updated_at?: string | null
          visivel?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_columns_exist: {
        Args: { c_names: string[]; t_name: string }
        Returns: string[]
      }
      decrement_stock_atomic: {
        Args: { p_id: number; p_quantity: number }
        Returns: undefined
      }
      increment_coupon_usage: {
        Args: { coupon_id: number }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
