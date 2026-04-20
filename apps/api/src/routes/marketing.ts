import { Router } from "express";
import { env } from "../config/env.js";

const marketingPageHtml = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Corretor pt-BR</title>
    <style>
      :root {
        color-scheme: light;
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        font-family: Arial, sans-serif;
        background: linear-gradient(180deg, #eef2ff 0%, #f8fafc 45%, #ffffff 100%);
        color: #0f172a;
      }
      main {
        max-width: 1100px;
        margin: 0 auto;
        padding: 48px 24px 72px;
      }
      .hero {
        display: grid;
        grid-template-columns: minmax(0, 1.2fr) minmax(320px, 420px);
        gap: 28px;
        align-items: start;
      }
      .hero-card,
      .checkout-card,
      .feature-card {
        background: rgba(255,255,255,0.9);
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 24px;
        box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
      }
      .hero-card {
        padding: 28px;
      }
      .eyebrow {
        margin: 0 0 14px;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1.6px;
        color: #4f46e5;
      }
      h1 {
        margin: 0 0 14px;
        font-size: clamp(34px, 6vw, 56px);
        line-height: 1.02;
      }
      .lede {
        margin: 0;
        max-width: 700px;
        font-size: 18px;
        line-height: 1.6;
        color: #334155;
      }
      .highlight {
        color: #4338ca;
      }
      .feature-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 18px;
        margin-top: 22px;
      }
      .feature-card {
        padding: 18px;
      }
      .feature-card h3 {
        margin: 0 0 8px;
        font-size: 17px;
      }
      .feature-card p {
        margin: 0;
        color: #475569;
        line-height: 1.55;
      }
      .checkout-card {
        padding: 22px;
        position: sticky;
        top: 24px;
      }
      .price {
        display: flex;
        align-items: baseline;
        gap: 10px;
        margin: 10px 0 18px;
      }
      .price strong {
        font-size: 34px;
      }
      .price span {
        color: #475569;
      }
      .list {
        display: grid;
        gap: 10px;
        margin: 18px 0 22px;
        padding: 0;
        list-style: none;
      }
      .list li {
        color: #334155;
      }
      form {
        display: grid;
        gap: 12px;
      }
      input,
      button {
        width: 100%;
        padding: 14px 16px;
        border-radius: 14px;
        font: inherit;
      }
      input {
        border: 1px solid #cbd5e1;
        background: #fff;
      }
      button {
        border: 0;
        background: #111827;
        color: #fff;
        font-weight: 700;
        cursor: pointer;
      }
      button:disabled {
        cursor: wait;
        opacity: 0.7;
      }
      .muted {
        margin: 0;
        color: #64748b;
        font-size: 13px;
        line-height: 1.5;
      }
      .status {
        min-height: 20px;
        margin: 2px 0 0;
        color: #b91c1c;
        font-size: 14px;
      }
      .faq {
        margin-top: 34px;
        display: grid;
        gap: 16px;
      }
      .faq-item {
        padding: 20px;
        background: rgba(255,255,255,0.82);
        border-radius: 20px;
        border: 1px solid rgba(148, 163, 184, 0.18);
      }
      .faq-item h3 {
        margin: 0 0 8px;
      }
      .faq-item p {
        margin: 0;
        color: #475569;
        line-height: 1.55;
      }
      @media (max-width: 900px) {
        .hero {
          grid-template-columns: 1fr;
        }
        .feature-grid {
          grid-template-columns: 1fr;
        }
        .checkout-card {
          position: static;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <div class="hero-card">
          <p class="eyebrow">Corretor pt-BR</p>
          <h1>Escreva melhor em qualquer campo da web com <span class="highlight">correcao instantanea</span>.</h1>
          <p class="lede">Uma extensao focada em portugues do Brasil, com sugestoes de ortografia, pontuacao e fluidez diretamente no texto, sem depender de produtos de terceiros na sua operacao.</p>

          <div class="feature-grid">
            <article class="feature-card">
              <h3>Correcao em tempo real</h3>
              <p>Detecta erros enquanto a pessoa digita e mostra sugestoes clicaveis diretamente na palavra.</p>
            </article>
            <article class="feature-card">
              <h3>Instalacao simples</h3>
              <p>O cliente recebe a licenca apos a compra e ativa a extensao em poucos segundos.</p>
            </article>
            <article class="feature-card">
              <h3>Backend proprio</h3>
              <p>Voce controla a API privada, o plano, os limites e a experiencia comercial do produto.</p>
            </article>
          </div>
        </div>

        <aside class="checkout-card">
          <p class="eyebrow">Assinatura mensal</p>
          <div class="price">
            <strong>${env.billingPriceDisplay}</strong>
            <span>Plano ${env.billingPlanName}</span>
          </div>
          <ul class="list">
            <li>Correcao ortografica e pontuacao em pt-BR</li>
            <li>Token de licenca enviado automaticamente</li>
            <li>Ativacao na extensao sem login</li>
          </ul>

          <form id="checkout-form">
            <input id="email" type="email" name="email" placeholder="Seu melhor e-mail" autocomplete="email" required />
            <button id="submit" type="submit">Assinar agora</button>
            <p class="muted">Voce sera redirecionado para o checkout seguro do Stripe.</p>
            <p id="status" class="status"></p>
          </form>
        </aside>
      </section>

      <section class="faq">
        <article class="faq-item">
          <h3>Como recebo minha licenca?</h3>
          <p>Assim que o pagamento for confirmado, sua licenca e gerada automaticamente. Se o SMTP estiver configurado, voce tambem recebe o token por e-mail.</p>
        </article>
        <article class="faq-item">
          <h3>Como ativo na extensao?</h3>
          <p>Abra a extensao, entre em Configuracoes, selecione o modo de servidor proprio e cole o token da licenca no campo correspondente.</p>
        </article>
      </section>
    </main>

    <script>
      const form = document.getElementById('checkout-form');
      const emailInput = document.getElementById('email');
      const submitButton = document.getElementById('submit');
      const statusElement = document.getElementById('status');

      form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = emailInput.value.trim();
        if (!email) {
          statusElement.textContent = 'Informe um e-mail valido para continuar.';
          return;
        }

        submitButton.disabled = true;
        statusElement.textContent = 'Criando checkout...';

        try {
          const response = await fetch('/api/billing/create-checkout-session', {
            method: 'POST',
            headers: {
              'content-type': 'application/json'
            },
            body: JSON.stringify({ email })
          });

          const payload = await response.json();
          if (!response.ok || !payload.checkoutUrl) {
            throw new Error(payload.error || 'Nao foi possivel iniciar o checkout.');
          }

          window.location.href = payload.checkoutUrl;
        } catch (error) {
          statusElement.textContent = error instanceof Error ? error.message : 'Erro ao iniciar checkout.';
          submitButton.disabled = false;
        }
      });
    </script>
  </body>
</html>`;

export const createMarketingRouter = () => {
  const router = Router();

  router.get("/", (_request, response) => {
    response.type("html").send(marketingPageHtml);
  });

  return router;
};
