### Checklist Replicável do Template

- [x] **Nome Dinâmico**: O nome "ÉLARA" foi removido e substituído por `config?.nome_loja`.
- [x] **Domínio Dinâmico**: URLs hardcoded foram substituídas por referências dinâmicas.
- [x] **WhatsApp Dinâmico**: O número é carregado das configurações do banco de dados.
- [x] **Aparência Editável**: Cores, fontes, logo e favicon são salvos na tabela `aparencia` e aplicados globalmente.
- [x] **Integrações Flexíveis**: Mercado Pago e Melhor Envio usam credenciais salvas no banco por admin.
- [x] **Segurança Sensível**: Tokens e chaves de API não são expostos no frontend; o processamento ocorre via Edge Functions.
- [x] **SQL de Instalação**: Arquivo `supabase_base_template.sql` pronto para configurar novos bancos do zero.
- [x] **RLS e Policies**: Políticas de segurança prontas para produção (leitura pública, escrita admin).
- [x] **Checkout Anônimo**: O sistema permite que visitantes comprem sem conta obrigatória, ou vinculem ao perfil se logados.
- [x] **SEO Dinâmico**: Tags meta e JSON-LD alimentados pelos dados configurados no admin.
- [x] **Documentação**: Arquivo `INSTALL_TEMPLATE.md` com o passo a passo completo para novas lojas.
