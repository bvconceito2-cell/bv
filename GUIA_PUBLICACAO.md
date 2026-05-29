# Guia de Publicação — Produção Real

Este guia detalha os passos para colocar a loja em produção de forma profissional.

## 1. Domínio Próprio
1. Adquira um domínio (ex: Registro.br ou GoDaddy).
2. Configure o domínio na Vercel ou no seu provedor de preferência.
3. Configure o domínio no Supabase (Authentication -> Settings -> Site URL).

## 2. SSL e Segurança
- A Vercel e o Supabase já fornecem SSL automático.
- Certifique-se de que todas as URLs nas configurações da loja usem `https`.

## 3. Integrações de Pagamento (Mercado Pago)
1. Crie uma conta no Mercado Pago.
2. Vá em **Seu Perfil -> Credenciais**.
3. Obtenha a `Public Key` e o `Access Token` de Produção.
4. No Admin da loja, mude o ambiente para "Produção" e cole as chaves.

## 4. Integrações de Frete (Melhor Envio)
1. Crie uma conta no Melhor Envio.
2. Vá em **Gerenciar -> Aplicativos**.
3. Crie um novo App usando a URL de Redirect exibida no Admin da loja.
4. Obtenha o `Client ID` e `Client Secret`.
5. No Admin da loja, cole as credenciais e clique em "Conectar".

## 5. Webhooks (CRÍTICO)
No painel do Mercado Pago, cadastre a URL do Webhook:
`https://[SEU-ID-SUPABASE].supabase.co/functions/v1/webhook-mercadopago`
Eventos necessários: `payment`, `merchant_order`.

