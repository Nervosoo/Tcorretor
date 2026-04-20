import nodemailer from "nodemailer";
import { env } from "../config/env.js";

type LicenseEmailInput = {
  to: string;
  token: string;
  plan: string;
};

const isEmailConfigured = () => {
  return Boolean(env.smtpHost && env.smtpUser && env.smtpPass && env.emailFrom);
};

const createTransport = () => {
  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass
    }
  });
};

export const sendLicenseEmail = async (input: LicenseEmailInput) => {
  if (!isEmailConfigured()) {
    return { sent: false as const, reason: "Email delivery is not configured" };
  }

  const transporter = createTransport();
  const subject = "Sua licenca do Corretor pt-BR esta pronta";
  const text = [
    `Seu plano ${input.plan} foi ativado.`,
    "",
    "Token da licenca:",
    input.token,
    "",
    "Abra a extensao, entre em Configuracoes, selecione 'Servidor proprio' e cole esse token no campo 'Token da licenca'."
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.5;">
      <h1 style="font-size: 20px;">Sua licenca do Corretor pt-BR esta pronta</h1>
      <p>Seu plano <strong>${input.plan}</strong> foi ativado.</p>
      <p>Token da licenca:</p>
      <pre style="padding: 14px; border-radius: 12px; background: #f8fafc; border: 1px solid #cbd5e1; overflow: auto;">${input.token}</pre>
      <p>Abra a extensao, entre em <strong>Configuracoes</strong>, selecione <strong>Servidor proprio</strong> e cole esse token no campo <strong>Token da licenca</strong>.</p>
    </div>
  `;

  await transporter.sendMail({
    from: env.emailFrom,
    to: input.to,
    subject,
    text,
    html
  });

  return { sent: true as const };
};
