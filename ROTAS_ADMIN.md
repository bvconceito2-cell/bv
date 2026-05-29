# Rotas Administrativas

O painel admin está disponível em `/admin`.

## Acesso
- **Login**: `/admin/login`
- **Segurança**: Protegido via hook `ProtectedAdminRoute` e coluna `role = 'admin'` na tabela `profiles`.

## Funcionalidades
- **Dashboard**: Visão geral de vendas e alertas.
- **Produtos**: Listagem, cadastro, edição e importação via CSV.
- **Categorias**: Gestão de estrutura do menu.
- **Pedidos**: Detalhes da venda, alteração de status e sincronização de pagamento.
- **Clientes**: Perfil completo do comprador e histórico.
- **CRM**: Dashboard de segmentação e retenção.
- **Marketing**: Criação de cupons e gestão de banners.
- **Aparência**: Personalização total do "look and feel" (Live Preview).
- **Integrações**: Configuração de chaves Mercado Pago e Melhor Envio.
- **Configurações**: Dados institucionais e políticas.
- **Logs**: Monitoramento técnico de erros e eventos.

---

**DICA:** Ao criar o primeiro admin, cadastre-se como usuário normal e mude o seu `role` para `admin` manualmente no banco de dados (tabela `profiles`).
