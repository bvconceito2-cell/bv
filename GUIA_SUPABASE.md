# Guia Supabase — Configuração do Backend

## 1. Estrutura de Tabelas
O arquivo `supabase_base_template.sql` contém toda a estrutura necessária:
- `profiles`: Usuários e permissões.
- `produtos`: Catálogo de produtos.
- `categorias`: Organização do catálogo.
- `pedidos`: Gestão de vendas.
- `clientes`: CRM básico.
- `integracoes`: Configurações de MP e Melhor Envio.
- `aparencia`: Cores, fontes e logos.
- `configuracoes`: Dados da loja (CNPJ, Whats, etc).
- `cupons`: Sistema de descontos.
- `banners_*`: Gestão de marketing visual.

## 2. Buckets de Storage
Os seguintes buckets devem ser **PÚBLICOS**:
- `site-assets`: Logos, favicons e arquivos do tema.
- `produtos`: Fotos dos produtos.
- `banners`: Imagens de marketing.
- `categorias`: Ícones de categorias.

## 3. Edge Functions
Certifique-se de implantar:
- `criar-preferencia-mercadopago`
- `webhook-mercadopago`
- `melhor-envio`

Lembre-se de configurar a secret `SUPABASE_SERVICE_ROLE_KEY` no Supabase.

