# Checklist de Validação Manual (Pré-Entrega)

Antes de entregar a loja para o cliente, siga este checklist para garantir que o template foi replicado corretamente.

## 1. Banco de Dados (Supabase)
- [ ] Todas as tabelas foram criadas com o script `supabase_base_template.sql`.
- [ ] O RLS (Row Level Security) está ativo em todas as tabelas.
- [ ] As policies de `admin` estão configuradas corretamente usando a função `is_admin()`.

## 2. Autenticação e Perfil
- [ ] O cadastro de novo usuário funciona.
- [ ] O perfil de administrador (`is_admin = true`) permite acesso a `/admin/*`.
- [ ] O perfil de cliente comum (`is_admin = false`) é redirecionado ou bloqueado no admin.

## 3. Integrações (Painel Admin)
- [ ] **Mercado Pago:**
    - [ ] Credenciais Sandbox inseridas e conexão testada (Verde).
    - [ ] Webhook configurado no painel do Mercado Pago com a URL da Edge Function.
- [ ] **Melhor Envio:**
    - [ ] Client ID e Secret inseridos.
    - [ ] Ambiente (Sandbox/Produção) selecionado corretamente.
    - [ ] Conexão realizada via OAuth (Botão Conectar).
    - [ ] Teste de conexão retorna os dados do usuário logado.

## 4. Fluxo de Compra
- [ ] Produtos carregam na Home e Categorias.
- [ ] Cálculo de frete (Melhor Envio) funciona no carrinho/checkout.
- [ ] Checkout gera o pagamento no Mercado Pago.
- [ ] Após pagamento (simulado ou real), o status do pedido atualiza via Webhook.

## 5. Gestão Admin
- [ ] Cadastro de produtos com imagens (Storage funcionando).
- [ ] Cadastro de categorias com imagens.
- [ ] Banner principal configurável pelo admin.
- [ ] Pedidos aparecem na listagem e permitem alteração de status.

## 6. Documentação Técnica
- [ ] Arquivo `.env` na Vercel contém todas as chaves do `ENV_EXAMPLE.md`.
- [ ] Edge Functions foram implantadas (`supabase functions deploy`).
- [ ] Buckets de Storage (`produtos`, `categorias`, `banners`, `loja`) foram criados.

---
**Status Final:** Se todos os itens acima estiverem marcados, a loja está pronta para produção.
