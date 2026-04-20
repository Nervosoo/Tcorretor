import { describe, expect, it } from "vitest";
import { applyReplacement } from "./applyReplacement";

describe("applyReplacement", () => {
  it("replaces the selected range and returns the next caret position", () => {
    const result = applyReplacement("Eu fiz um teste errado", 16, 6, "certo");

    expect(result.text).toBe("Eu fiz um teste certo");
    expect(result.caretOffset).toBe(21);
  });
});
