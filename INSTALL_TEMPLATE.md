# Guia de Instalação — Template de Loja Virtual Profissional

Este guia orienta o processo de replicação deste template para um novo cliente.

## 1. Configuração do Supabase

1. Crie um novo projeto no [Supabase](https://supabase.com).
2. Vá em **SQL Editor** e crie uma nova query.
3. Copie o conteúdo do arquivo `supabase_base_template.sql` e execute.
4. Vá em **Storage** e crie os seguintes buckets públicos:
   - `site-assets`
   - `produtos`
   - `banners`
   - `categorias`
5. Em cada bucket, configure as policies para permitir leitura pública e escrita apenas para admins (o SQL base já cria as estruturas, mas verifique se os buckets existem).

## 2. Configuração de Autenticação

1. Em **Authentication -> Settings**, configure o URL do seu site (ex: `https://loja-cliente.vercel.app`).
2. Desabilite "Confirm Email" se desejar permitir acesso imediato.

## 3. Variáveis de Ambiente

No seu provedor de hospedagem (Vercel, Netlify, etc), configure:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

## 4. Edge Functions

Implante as funções na pasta `supabase/functions/` usando o Supabase CLI:

```bash
supabase functions deploy criar-preferencia-mercadopago
supabase functions deploy webhook-mercadopago
supabase functions deploy testar-conexao-mercadopago
```

Configure as secrets nas functions:
```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
```

## 5. Primeiro Acesso Admin

1. Crie uma conta de usuário na loja normalmente.
2. No dashboard do Supabase, vá na tabela `profiles`.
3. Localize seu usuário e mude a coluna `role` para `admin`.
4. Agora você terá acesso total à área `/admin`.

## 6. Personalização via Painel

Entre no painel administrativo e configure:
1. **Aparência**: Logo, favicon, cores e fontes.
2. **Configurações**: Nome da loja, CNPJ, WhatsApp e políticas.
3. **Integrações**: Chaves do Mercado Pago e Melhor Envio.
4. **Catálogo**: Cadastre suas categorias e produtos.

---
Pronto! Sua loja está configurada e pronta para vender.
