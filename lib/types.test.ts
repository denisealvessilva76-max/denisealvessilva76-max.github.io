import { describe, it, expect } from "vitest";

/**
 * Testes para classificação de pressão arterial
 */

function classifyPressure(systolic: number, diastolic: number): "normal" | "pre-hipertensao" | "hipertensao" {
  if (systolic <= 120 && diastolic <= 80) return "normal";
  if (systolic <= 129 && diastolic < 80) return "normal";
  if (systolic < 140 && diastolic < 90) return "pre-hipertensao";
  return "hipertensao";
}

describe("Classificação de Pressão Arterial", () => {
  it("deve classificar 120/80 como normal", () => {
    expect(classifyPressure(120, 80)).toBe("normal");
  });

  it("deve classificar 119/79 como normal", () => {
    expect(classifyPressure(119, 79)).toBe("normal");
  });

  it("deve classificar 129/79 como normal", () => {
    expect(classifyPressure(129, 79)).toBe("normal");
  });

  it("deve classificar 130/80 como pré-hipertensão", () => {
    expect(classifyPressure(130, 80)).toBe("pre-hipertensao");
  });

  it("deve classificar 139/89 como pré-hipertensão", () => {
    expect(classifyPressure(139, 89)).toBe("pre-hipertensao");
  });

  it("deve classificar 140/90 como hipertensão", () => {
    expect(classifyPressure(140, 90)).toBe("hipertensao");
  });

  it("deve classificar 160/100 como hipertensão", () => {
    expect(classifyPressure(160, 100)).toBe("hipertensao");
  });

  it("deve classificar 180/120 como hipertensão", () => {
    expect(classifyPressure(180, 120)).toBe("hipertensao");
  });
});
