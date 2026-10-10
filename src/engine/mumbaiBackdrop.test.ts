import { describe, expect, it } from "vitest";

import { mumbaiBackdropPlacement } from "@/engine/mumbaiBackdrop";
import { computeLayout } from "@/sim/layout";

const CAPACITIES = [300, 150, 200, 160, 180, 120, 100, 100, 90, 70];

describe("mumbaiBackdropPlacement", () => {
  for (const mode of ["landscape", "portrait"] as const) {
    it(`keeps the ${mode} landmarks around the edge of the default frame`, () => {
      const layout = computeLayout(mode, CAPACITIES, 60);
      const placement = mumbaiBackdropPlacement(layout);
      const { fit } = layout;

      expect(placement.sun.x).toBeGreaterThan(fit.x);
      expect(placement.sun.x).toBeLessThan(fit.x + fit.w * 0.2);
      expect(placement.sun.y).toBeLessThan(fit.y + fit.h * 0.2);
      expect(placement.seaTop).toBeGreaterThan(fit.y + fit.h * 0.75);
      expect(placement.gateway.x).toBeLessThan(fit.x + fit.w * 0.25);
      expect(placement.bridge.x).toBeGreaterThan(fit.x + fit.w * 0.4);
      expect(placement.bottom).toBe(fit.y + fit.h);
    });
  }
});
