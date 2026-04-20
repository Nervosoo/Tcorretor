# Corretor pt-BR

Monorepo com uma extensao Chrome MV3 e uma API privada para correcao de texto em pt-BR usando LanguageTool open source.

## Estrutura

- `apps/api`: API Express que valida requisicoes e consulta o LanguageTool
- `apps/extension`: extensao Chrome MV3 feita com Vite, React e TypeScript
- `docker/languagetool`: imagem Docker do LanguageTool self-hosted

## Scripts

- `npm install`: instala dependencias do workspace
- `npm run build`: gera build da API e da extensao
- `npm run test`: executa os testes disponiveis
- `npm run dev:api`: sobe a API em desenvolvimento
- `npm run dev:extension`: gera build de desenvolvimento da extensao

## Variaveis da API

- `PORT`: porta principal da API em producao, compativel com Railway
- `API_PORT`: porta local alternativa da API, padrao `3001`
- `API_KEY`: token usado pela extensao
- `LICENSE_CATALOG`: JSON com tokens de licenca e planos para uso comercial
- `DB_PATH`: caminho do banco SQLite local
- `LT_BASE_URL`: URL base do LanguageTool, padrao `http://localhost:8010`
- `LT_TIMEOUT_MS`: timeout das chamadas ao LanguageTool, padrao `5000`
- `MAX_TEXT_LENGTH`: tamanho maximo aceito pela API, padrao `4000`
- `BILLING_PLAN_NAME`: nome do plano mensal padrao
- `BILLING_PLAN_MAX_TEXT_LENGTH`: limite de texto do plano pago
- `STRIPE_SECRET_KEY`: chave secreta da conta Stripe
- `STRIPE_WEBHOOK_SECRET`: segredo do webhook Stripe
- `STRIPE_PRICE_ID`: preco mensal criado no Stripe
- `CHECKOUT_SUCCESS_URL`: URL de retorno apos compra
- `CHECKOUT_CANCEL_URL`: URL de retorno se o cliente cancelar o checkout
- `SMTP_HOST`: host SMTP para envio da licenca por e-mail
- `SMTP_PORT`: porta SMTP
- `SMTP_SECURE`: `true` para TLS direto, `false` para STARTTLS
- `SMTP_USER`: usuario SMTP
- `SMTP_PASS`: senha SMTP
- `EMAIL_FROM`: remetente do e-mail de entrega da licenca

Exemplo de `LICENSE_CATALOG`:

```json
[
  {
    "token": "cliente-pro-001",
    "name": "Cliente Pro",
    "plan": "pro",
    "maxTextLength": 8000,
    "commercialUse": true
  },
  {
    "token": "time-empresa-001",
    "name": "Equipe Comercial",
    "plan": "team",
    "maxTextLength": 15000,
    "commercialUse": true
  }
]
```

## Billing

Rotas principais:

- `POST /api/billing/create-checkout-session`: cria a sessao Stripe para assinatura mensal
- `POST /api/billing/webhook`: recebe eventos Stripe e gera/atualiza a licenca automaticamente
- `GET /api/billing/session/:sessionId`: permite consultar se a licenca daquela compra ja esta pronta
- `GET /api/account`: valida o token/licenca e retorna plano/status

Paginas publicas:

- `GET /`: landing page com CTA de assinatura e redirecionamento para o checkout
- `GET /billing/success?session_id=...`: pagina de sucesso que consulta e mostra a licenca pronta
- `GET /billing/cancel`: pagina simples de cancelamento do checkout

## Build Da Extensao

- `VITE_DEFAULT_API_BASE_URL`: URL privada padrao embutida na extensao para o modo comercial

Empacotar a extensao de producao em ZIP:

```powershell
.
\scripts\build-extension-production.ps1 -ApiBaseUrl "https://seu-dominio.com"
```

Saida padrao:

```text
dist/corretor-ptbr-extension.zip
```

## Docker

Use `docker compose up --build` para subir a API e o LanguageTool juntos.
