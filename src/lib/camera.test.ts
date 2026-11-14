import { describe, expect, it } from "vitest";
import { cropRect } from "./camera";

describe("cropRect", () => {
  it("crops width of a landscape frame to 3:4", () => {
    const r = cropRect(1280, 720, 0.75);
    expect(r).toEqual({ sx: 370, sy: 0, sw: 540, sh: 720 });
  });
  it("crops height of a tall frame to 3:4", () => {
    const r = cropRect(720, 1280, 0.75);
    expect(r).toEqual({ sx: 0, sy: 160, sw: 720, sh: 960 });
  });
  it("keeps a frame that already matches", () => {
    expect(cropRect(600, 800, 0.75)).toEqual({ sx: 0, sy: 0, sw: 600, sh: 800 });
  });
});
