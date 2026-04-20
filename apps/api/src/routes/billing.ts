import express, { Router } from "express";
import { createCheckoutSession, getCheckoutSessionStatus, handleStripeWebhook } from "../services/stripeBilling.js";

type CreateCheckoutPayload = {
  email?: string;
  successUrl?: string;
  cancelUrl?: string;
};

const successPageHtml = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Licenca pronta</title>
    <style>
      body { margin: 0; font-family: Arial, sans-serif; background: #f8fafc; color: #0f172a; }
      main { max-width: 760px; margin: 40px auto; padding: 24px; }
      .card { background: white; border-radius: 20px; padding: 24px; box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08); }
      .token { background: #0f172a; color: #e2e8f0; padding: 16px; border-radius: 16px; overflow: auto; word-break: break-all; }
      .muted { color: #475569; }
      .hidden { display: none; }
      button { border: 0; border-radius: 12px; padding: 12px 16px; font-weight: 700; cursor: pointer; }
      .primary { background: #0f172a; color: white; }
      .secondary { background: #e2e8f0; color: #0f172a; }
      .row { display: flex; gap: 12px; flex-wrap: wrap; }
    </style>
  </head>
  <body>
    <main>
      <section class="card">
        <p style="margin:0; font-size:12px; text-transform:uppercase; letter-spacing:1.2px; color:#6366f1;">Corretor pt-BR</p>
        <h1 style="margin:12px 0 8px;">Estamos preparando sua licenca</h1>
        <p id="status" class="muted">Validando sua assinatura...</p>
        <div id="ready" class="hidden">
          <p class="muted">Sua assinatura foi ativada. Copie o token abaixo e cole na extensao em <strong>Configuracoes</strong> -> <strong>Servidor proprio</strong>.</p>
          <div id="token" class="token"></div>
          <p id="meta" class="muted"></p>
          <div class="row">
            <button id="copy" class="primary">Copiar token</button>
            <button id="reload" class="secondary">Atualizar status</button>
          </div>
        </div>
        <div id="error" class="hidden">
          <p class="muted">Nao foi possivel localizar sua licenca ainda. Se voce acabou de pagar, espere alguns segundos e atualize.</p>
          <button id="retry" class="primary">Tentar novamente</button>
        </div>
      </section>
    </main>
    <script>
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get('session_id');
      const statusElement = document.getElementById('status');
      const readyElement = document.getElementById('ready');
      const errorElement = document.getElementById('error');
      const tokenElement = document.getElementById('token');
      const metaElement = document.getElementById('meta');
      const copyButton = document.getElementById('copy');

      const setProcessing = (message) => {
        statusElement.textContent = message;
        readyElement.classList.add('hidden');
        errorElement.classList.add('hidden');
      };

      const setReady = (payload) => {
        statusElement.textContent = 'Licenca pronta para uso';
        readyElement.classList.remove('hidden');
        errorElement.classList.add('hidden');
        tokenElement.textContent = payload.token;
        metaElement.textContent = 'Plano: ' + payload.plan + (payload.emailSent ? ' · Enviado por e-mail' : ' · Ainda nao enviado por e-mail');
        copyButton.onclick = async () => {
          await navigator.clipboard.writeText(payload.token);
          copyButton.textContent = 'Token copiado';
          window.setTimeout(() => { copyButton.textContent = 'Copiar token'; }, 1800);
        };
      };

      const setError = (message) => {
        statusElement.textContent = message;
        readyElement.classList.add('hidden');
        errorElement.classList.remove('hidden');
      };

      const fetchStatus = async () => {
        if (!sessionId) {
          setError('Sessao de checkout nao encontrada na URL.');
          return;
        }

        try {
          const response = await fetch('/api/billing/session/' + encodeURIComponent(sessionId));
          const payload = await response.json();

          if (!response.ok) {
            throw new Error(payload.error || 'Falha ao consultar sessao');
          }

          if (payload.status === 'ready') {
            setReady(payload);
            return;
          }

          setProcessing('Pagamento confirmado. Gerando sua licenca...');
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Erro ao consultar sua licenca.');
        }
      };

      document.getElementById('reload').onclick = fetchStatus;
      document.getElementById('retry').onclick = fetchStatus;
      fetchStatus();
      window.setInterval(fetchStatus, 3000);
    </script>
  </body>
</html>`;

const cancelPageHtml = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Checkout cancelado</title>
    <style>
      body { margin: 0; font-family: Arial, sans-serif; background: #f8fafc; color: #0f172a; }
      main { max-width: 720px; margin: 40px auto; padding: 24px; }
      .card { background: white; border-radius: 20px; padding: 24px; box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08); }
      .muted { color: #475569; }
    </style>
  </head>
  <body>
    <main>
      <section class="card">
        <p style="margin:0; font-size:12px; text-transform:uppercase; letter-spacing:1.2px; color:#6366f1;">Corretor pt-BR</p>
        <h1 style="margin:12px 0 8px;">Checkout cancelado</h1>
        <p class="muted">Sua compra nao foi concluida. Voce pode fechar esta pagina e iniciar o checkout novamente quando quiser.</p>
      </section>
    </main>
  </body>
</html>`;

export const createBillingRouter = () => {
  const router = Router();

  router.get("/billing/success", (_request, response) => {
    response.type("html").send(successPageHtml);
  });

  router.get("/billing/cancel", (_request, response) => {
    response.type("html").send(cancelPageHtml);
  });

  router.post("/api/billing/create-checkout-session", express.json(), async (request, response) => {
    const body = request.body as CreateCheckoutPayload | undefined;
    const email = body?.email?.trim();

    if (!email) {
      response.status(400).json({ error: "Email is required" });
      return;
    }

    try {
      const session = await createCheckoutSession({
        email,
        successUrl: body?.successUrl,
        cancelUrl: body?.cancelUrl
      });

      response.json(session);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create checkout session";
      response.status(500).json({ error: message });
    }
  });

  router.post("/api/billing/webhook", express.raw({ type: "application/json" }), async (request, response) => {
    try {
      await handleStripeWebhook(request.body as Buffer, request.header("stripe-signature"));
      response.json({ received: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid webhook";
      response.status(400).json({ error: message });
    }
  });

  router.get("/api/billing/session/:sessionId", (request, response) => {
    response.json(getCheckoutSessionStatus(request.params.sessionId));
  });

  return router;
};
