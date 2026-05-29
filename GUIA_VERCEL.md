# Guia Vercel — Publicação do Frontend

## 1. Importação do Projeto
1. Suba o código para um repositório privado no GitHub.
2. No dashboard da Vercel, clique em **Add New -> Project**.
3. Importe o repositório.

## 2. Configurações de Build
- Framework Preset: `Vite`
- Root Directory: `./`
- Build Command: `npm run build`
- Output Directory: `dist`

## 3. Variáveis de Ambiente
Configure:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 4. Deploy
Clique em **Deploy**. Após a finalização, adicione seu domínio personalizado em **Settings -> Domains**.

