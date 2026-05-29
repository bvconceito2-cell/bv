# Edge Functions (Backend Serverless)

As funcionalidades sensíveis são processadas em Edge Functions no Supabase.

## Funções Disponíveis

### 1. `criar-preferencia-mercadopago`
- **Trigger**: Checkout do cliente.
- **O que faz**: Recalcula o total do pedido no backend (segurança), cria a preferência no Mercado Pago e retorna o link de pagamento.
- **Segurança**: Valida preços contra a tabela `produtos` no banco.

### 2. `webhook-mercadopago`
- **Trigger**: Notificação do Mercado Pago.
- **O que faz**: Recebe atualizações de pagamento (Aprovado, Recusado, Pendente), atualiza o status do pedido no banco e reduz o estoque automaticamente.

### 3. `testar-conexao-mercadopago`
- **Trigger**: Clique no botão "Testar" nas Integrações do Admin.
- **O que faz**: Valida se o token inserido é válido chamando a API do MP.

---

## Como Fazer Deploy

1. Instale o [Supabase CLI](https://supabase.com/docs/guides/cli).
2. Autentique: `supabase login`.
3. Link o projeto: `supabase link --project-ref seu-id-do-projeto`.
4. Deploy: `supabase functions deploy --all`.
