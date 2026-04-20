import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import type { CheckTextService } from "../src/types.js";

const authHeader = {
  Authorization: "Bearer dev-token"
};

describe("POST /api/check", () => {
  it("returns normalized matches", async () => {
    const checkText: CheckTextService = async ({ text, language }) => ({
      language,
      textLength: text.length,
      matches: [
        {
          id: "MORFOLOGIK_RULE_PT_BR",
          message: "Possivel erro de digitacao.",
          shortMessage: "",
          offset: 0,
          length: 4,
          category: "Typos",
          replacements: ["Esta"]
        }
      ]
    });

    const app = createApp({ checkText });
    const response = await request(app).post("/api/check").set(authHeader).send({ text: "Esta errado", language: "pt-BR" });

    expect(response.status).toBe(200);
    expect(response.body.matches).toHaveLength(1);
    expect(response.body.matches[0].replacements).toEqual(["Esta"]);
  });

  it("rejects empty text", async () => {
    const app = createApp({ checkText: async () => ({ language: "pt-BR", textLength: 0, matches: [] }) });
    const response = await request(app).post("/api/check").set(authHeader).send({ text: "   " });

    expect(response.status).toBe(400);
  });

  it("requires bearer token", async () => {
    const app = createApp({ checkText: async () => ({ language: "pt-BR", textLength: 0, matches: [] }) });
    const response = await request(app).post("/api/check").send({ text: "teste" });

    expect(response.status).toBe(401);
  });

  it("returns account data for the current license", async () => {
    const app = createApp({ checkText: async () => ({ language: "pt-BR", textLength: 0, matches: [] }) });
    const response = await request(app).get("/api/account").set(authHeader);

    expect(response.status).toBe(200);
    expect(response.body.account.plan).toBe("pro");
    expect(response.body.account.name).toBe("Conta local");
  });

  it("serves the public landing page", async () => {
    const app = createApp({ checkText: async () => ({ language: "pt-BR", textLength: 0, matches: [] }) });
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.text).toContain("Assinar agora");
    expect(response.text).toContain("/api/billing/create-checkout-session");
  });
});
