import { describe, it, expect } from "vitest";
import {
  toKey, fromKey, isDone, nextStatus,
  currentStreak, bestStreak, monthCount, dailyHint,
} from "../src/streaks.js";

const today = new Date(2026, 9, 8); // 8 oct 2026

describe("toKey / fromKey", () => {
  it("convierte una fecha a YYYY-MM-DD", () => {
    expect(toKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
  it("hace el camino de vuelta", () => {
    expect(toKey(fromKey("2026-10-08"))).toBe("2026-10-08");
  });
});

describe("isDone / nextStatus", () => {
  it("completa y mínima cuentan, vacío no", () => {
    expect(isDone({ a: "f" }, "a")).toBe(true);
    expect(isDone({ a: "m" }, "a")).toBe(true);
    expect(isDone({}, "a")).toBe(false);
  });
  it("cicla vacío -> f -> m -> vacío", () => {
    expect(nextStatus(undefined)).toBe("f");
    expect(nextStatus("f")).toBe("m");
    expect(nextStatus("m")).toBeNull();
  });
});

describe("currentStreak", () => {
  it("es 0 sin datos", () => {
    expect(currentStreak({}, today)).toBe(0);
  });
  it("cuenta 3 días seguidos terminando ayer", () => {
    const data = { "2026-10-05": "f", "2026-10-06": "m", "2026-10-07": "f" };
    expect(currentStreak(data, today)).toBe(3);
  });
  it("incluye hoy si ya está marcado", () => {
    const data = { "2026-10-07": "f", "2026-10-08": "f" };
    expect(currentStreak(data, today)).toBe(2);
  });
  it("se rompe si hay un hueco", () => {
    const data = { "2026-10-05": "f", "2026-10-07": "f" };
    expect(currentStreak(data, today)).toBe(1);
  });
  it("es 0 si ayer ni hoy se entrenó", () => {
    expect(currentStreak({ "2026-10-05": "f" }, today)).toBe(0);
  });
});

describe("bestStreak", () => {
  it("encuentra la racha más larga aunque no sea la actual", () => {
    const data = {
      "2026-09-20": "f", "2026-09-21": "f", "2026-09-22": "m", "2026-09-23": "f",
      "2026-10-07": "f",
    };
    expect(bestStreak(data)).toBe(4);
  });
  it("es 0 sin datos", () => {
    expect(bestStreak({})).toBe(0);
  });
  it("funciona cruzando de mes", () => {
    const data = { "2026-09-30": "f", "2026-10-01": "f" };
    expect(bestStreak(data)).toBe(2);
  });
});

describe("monthCount", () => {
  it("cuenta solo los días entrenados del mes pedido", () => {
    const data = { "2026-10-01": "f", "2026-10-02": "m", "2026-09-30": "f" };
    expect(monthCount(data, 2026, 9)).toBe(2);
  });
});

describe("dailyHint", () => {
  it("done si hoy está marcado", () => {
    expect(dailyHint({ "2026-10-08": "f" }, today)).toBe("done");
  });
  it("must si ayer no se entrenó", () => {
    expect(dailyHint({}, today)).toBe("must");
  });
  it("rest si ayer se entrenó y hoy no", () => {
    expect(dailyHint({ "2026-10-07": "m" }, today)).toBe("rest");
  });
});
