# Design de Billing Stripe com Licencas

## Objetivo

Adicionar uma camada comercial simples para vender a extensao por assinatura mensal, usando Stripe Checkout, webhook no backend e geracao automatica de licencas.

## Escopo inicial

- Um plano mensal unico
- Checkout publico via Stripe
- Webhook para sincronizar assinatura
- SQLite local para clientes, assinaturas e licencas
- Extensao usando token de licenca no modo privado
- Sem login e sem portal do cliente na primeira versao

## Arquitetura

- `POST /api/billing/create-checkout-session` cria a sessao Stripe
- `POST /api/billing/webhook` processa eventos Stripe
- SQLite guarda estado comercial local
- `GET /api/billing/session/:sessionId` permite consultar se a licenca da compra ja foi criada
- `GET /api/account` e `POST /api/check` validam a licenca ativa

## Dados

- `customers`
- `subscriptions`
- `licenses`

## Regras

- Licenca e um token aleatorio longo
- Licenca ativa acompanha status da assinatura
- Cada assinatura tem uma licenca unica
- Limite de texto e plano sao derivados da licenca

## Fora do escopo

- Portal do cliente
- Multiplos planos com regras diferentes
- Equipes e organizacoes
- Checkout embutido no frontend do produto
