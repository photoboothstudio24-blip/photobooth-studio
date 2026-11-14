import { describe, expect, it } from "vitest";
import { buildParams, processPixels, ZERO_ADJ, ZERO_PARAMS } from "./imaging";
import { geometry, type LayoutId } from "./compose";

const px = () => new Uint8ClampedArray([100, 150, 200, 255]);

describe("imaging", () => {
  it("neutral params leave pixels nearly unchanged", () => {
    const d = px();
    processPixels(d, 1, 1, ZERO_PARAMS);
    expect(Array.from(d)).toEqual([100, 150, 200, 255]);
  });
  it("brightness raises values", () => {
    const d = px();
    processPixels(d, 1, 1, { ...ZERO_PARAMS, brightness: 20 });
    expect(d[0]).toBeGreaterThan(100);
  });
  it("black and white makes channels equal", () => {
    const d = px();
    processPixels(d, 1, 1, buildParams("bw", 100, ZERO_ADJ));
    expect(d[0]).toBe(d[1]);
    expect(d[1]).toBe(d[2]);
  });
  it("intensity 0 equals no filter", () => {
    expect(buildParams("vintage", 0, ZERO_ADJ)).toEqual(ZERO_PARAMS);
  });
});

describe("geometry", () => {
  it.each(["single", "strip2", "strip3", "strip4", "polaroid", "collage"] as LayoutId[])("%s keeps cells inside the canvas", (l) => {
    const g = geometry(l, 20, 10);
    g.cells.forEach((c) => {
      expect(c.x + c.w).toBeLessThanOrEqual(g.W);
      expect(c.y + c.h).toBeLessThanOrEqual(g.H);
    });
  });
});
