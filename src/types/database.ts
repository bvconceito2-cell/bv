export interface Produto {
  id: number;
  nome: string;
  slug: string;
  marca: string;
  categoria_id: number;
  descricao: string;
  detalhes: any;
  preco_original: number;
  preco_atual: number;
  parcelas: number;
  cores: any[];
  tamanhos: string[];
  imagem_principal: string;
  imagens: string[];
  midias: any;
  estoque: number;
  estoque_por_variacao: any;
  destaque: boolean;
  novidade: boolean;
  ativo: boolean;
  avaliacao: number;
  total_avaliacoes: number;
  total_vendas: number;
  meta_title: string;
  meta_description: string;
  created_at: string;
  updated_at: string;
}

export interface Categoria {
  id: number;
  nome: string;
  slug: string;
  imagem_url: string;
  ordem: number;
  ativo: boolean;
  created_at: string;
}

export interface Pedido {
  id: number;
  codigo: string;
  cliente_id: string;
  cliente_nome: string;
  cliente_email: string;
  cliente_telefone: string;
  itens: any[];
  subtotal: number;
  desconto: number;
  frete: number;
  total: number;
  cupom_codigo: string;
  endereco_entrega: any;
  metodo_envio: any;
  codigo_rastreio: string;
  transportadora: string;
  forma_pagamento: string;
  status_pagamento: string;
  mp_payment_id: string;
  mp_preference_id: string;
  status: string;
  historico_status: any[];
  observacoes_internas: string;
  created_at: string;
  updated_at: string;
}

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  data_nascimento: string;
  genero: string;
  enderecos: any[];
  segmento: string;
  notas_internas: string;
  total_pedidos: number;
  total_gasto: number;
  ultimo_pedido: string;
  created_at: string;
}

export interface BannerHero {
  id: number;
  imagem_desktop: string;
  imagem_mobile: string;
  titulo: string;
  subtitulo: string;
  texto_botao: string;
  link_botao: string;
  cor_botao: string;
  posicao_texto: string;
  ativo: boolean;
  ordem: number;
  created_at: string;
}

export interface BannerEditorial {
  id: number;
  imagem_url: string;
  titulo: string;
  subtitulo: string;
  texto_botao: string;
  link_botao: string;
  produtos_ids: number[];
  ativo: boolean;
  updated_at: string;
}

export interface BannerPromocional {
  id: number;
  imagem_desktop: string;
  imagem_mobile: string;
  titulo: string;
  subtitulo: string;
  texto_botao: string;
  link_botao: string;
  alinhamento: string;
  overlay: boolean;
  cor_texto: string;
  cor_botao: string;
  ativo: boolean;
  ordem: number;
  created_at: string;
}

export interface SecaoHome {
  id: number;
  chave: string;
  nome: string;
  visivel: boolean;
  ordem: number;
  config: any;
  updated_at: string;
}

export interface Cupom {
  id: number;
  codigo: string;
  tipo: string;
  valor: number;
  valor_minimo_pedido: number;
  limite_usos: number;
  usos_atuais: number;
  limite_por_cliente: number;
  validade: string;
  categorias_ids: number[];
  produtos_ids: number[];
  ativo: boolean;
  created_at: string;
}

export interface Integracao {
  id: number;
  chave: string;
  config: any;
  ativo: boolean;
  updated_at: string;
}

export interface Aparencia {
  id: number;
  cores_primarias: any;
  fontes: any;
  logo_url: string;
  favicon_url: string;
  config_logo: any;
  layout: any;
  updated_at: string;
}

export interface Configuracao {
  id: number;
  chave: string;
  valor: any;
  updated_at: string;
}

