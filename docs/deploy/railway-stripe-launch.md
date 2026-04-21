# Railway Stripe Launch Checklist

## 1. Preparar o Railway

Crie um servico web apontando para este repositório.

O projeto ja inclui:

- `railway.json`
- `npm run build:api`
- `npm start`
- health check em `/health`

Anexe um volume persistente e use um caminho como `/data/corretor.sqlite` em `DB_PATH`.
Apesar do nome do arquivo, a API agora usa esse caminho como armazenamento persistente local compatível com Railway.

## 2. Variaveis da API

Configure no Railway:

- `PORT`
- `DB_PATH=/data/corretor.sqlite`
- `LT_BASE_URL`
- `LT_TIMEOUT_MS`
- `MAX_TEXT_LENGTH`
- `CORS_ORIGIN`
- `BILLING_PLAN_NAME`
- `BILLING_PRICE_DISPLAY`
- `BILLING_PLAN_MAX_TEXT_LENGTH`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID`
- `CHECKOUT_SUCCESS_URL`
- `CHECKOUT_CANCEL_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM`

## 3. Stripe

No Stripe:

1. Crie um produto
2. Crie um preco mensal
3. Copie o `price_id`
4. Configure o webhook para:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

URL do webhook:

```text
https://seu-dominio.com/api/billing/webhook
```

## 4. LanguageTool

Voce precisa de uma instancia acessivel pela API.

Opcoes:

1. Outro servico Railway so para LanguageTool
2. VPS proprio
3. Infra separada com URL publica/privada

Defina `LT_BASE_URL` apontando para essa instancia.

## 5. SMTP

Se quiser envio automatico de licenca por e-mail, configure SMTP.

Sem SMTP:

- a licenca continua aparecendo em `/billing/success`
- mas nao sera enviada por e-mail

## 6. Teste de ponta a ponta

1. Abra `/`
2. Digite um e-mail e clique em `Assinar agora`
3. Conclua a compra em modo teste no Stripe
4. Confirme que o webhook foi recebido
5. Abra `/billing/success?session_id=...`
6. Copie o token da licenca
7. Cole o token na extensao em `Servidor proprio`
8. Valide o popup e a correcao em tempo real

## 7. Build da extensao para producao

Antes de gerar a extensao final, defina:

```text
VITE_DEFAULT_API_BASE_URL=https://seu-dominio.com
```

Depois rode:

```text
npm run build:extension
```

O build fica em:

```text
apps/extension/dist
```

## 8. Chrome Web Store

Antes de publicar, prepare:

- politica de privacidade
- termos de uso
- pagina de suporte
- descricao clara do uso de `all_urls`
- screenshots da extensao
