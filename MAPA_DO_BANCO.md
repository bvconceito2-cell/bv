# Mapa do Banco de Dados (Supabase)

Este documento descreve a finalidade de cada tabela no template.

| Tabela | Descrição |
| :--- | :--- |
| `profiles` | Dados de autenticação e perfil (admin/user). |
| `configuracoes` | Dados gerais da loja (nome, cnpj, whatsapp, etc). |
| `aparencia` | Identidade visual (logo, cores, fontes, favicon). |
| `categorias` | Organização do catálogo de produtos. |
| `produtos` | Catálogo completo de itens à venda. |
| `pedidos` | Registro de vendas e status de pagamento. |
| `clientes` | Base CRM para marketing e relacionamento. |
| `cupons` | Regras de descontos promocionais. |
| `integracoes` | Chaves de API (Mercado Pago, Melhor Envio, etc). |
| `favoritos` | Lista de desejos dos clientes logados. |
| `secoes_home` | Controle de visibilidade dos blocos da página inicial. |
| `banners_hero` | Banners principais do topo (carrossel). |
| `banners_promocionais` | Banners de meia página para ofertas. |
| `banner_editorial` | Seção de "lookbook" ou coleção em destaque. |
| `logs_sistema` | Auditoria de erros e eventos importantes. |
| `notificacoes_admin` | Alertas em tempo real para o painel administrativo. |

---

**Nota:** Todas as tabelas possuem RLS (Row Level Security) habilitado por padrão.
