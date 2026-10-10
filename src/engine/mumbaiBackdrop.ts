import { Container, Graphics } from "pixi.js";

import { FLOOR_LINE, INK, MARIGOLD, PEACOCK, RANI } from "@/engine/palette";
import type { VenueLayout } from "@/sim/layout";

interface Point {
  readonly x: number;
  readonly y: number;
}

export interface MumbaiBackdropPlacement {
  readonly seaTop: number;
  readonly bottom: number;
  readonly sun: Point;
  readonly gateway: Point;
  readonly bridge: Point;
  readonly motifScale: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Keeps every landmark in the camera's default frame while leaving the busy centre untouched. */
export function mumbaiBackdropPlacement(layout: VenueLayout): MumbaiBackdropPlacement {
  const { fit } = layout;
  const bottom = fit.y + fit.h;
  const motifScale = clamp(Math.min(fit.w, fit.h) / 1450, 0.72, 1.65);
  return {
    seaTop: fit.y + fit.h * (layout.mode === "portrait" ? 0.82 : 0.79),
    bottom,
    sun: { x: fit.x + fit.w * 0.1, y: fit.y + fit.h * 0.095 },
    gateway: { x: fit.x + fit.w * (layout.mode === "portrait" ? 0.14 : 0.11), y: bottom - 18 },
    bridge: { x: fit.x + fit.w * (layout.mode === "portrait" ? 0.47 : 0.61), y: bottom - 42 },
    motifScale,
  };
}

function drawSea(layout: VenueLayout, placement: MumbaiBackdropPlacement): Graphics {
  const g = new Graphics({ label: "arabian-sea" });
  const height = layout.height - placement.seaTop;
  g.rect(0, placement.seaTop, layout.width, height).fill({ color: PEACOCK, alpha: 0.045 });

  const waveGap = 82 * placement.motifScale;
  const waveWidth = 74 * placement.motifScale;
  for (let row = 0; row < 4; row++) {
    const y = placement.seaTop + (row + 0.7) * waveGap;
    g.moveTo(0, y);
    for (let x = 0; x < layout.width + waveWidth; x += waveWidth) {
      g.quadraticCurveTo(
        x + waveWidth * 0.25,
        y - 9 * placement.motifScale,
        x + waveWidth * 0.5,
        y,
      );
      g.quadraticCurveTo(x + waveWidth * 0.75, y + 9 * placement.motifScale, x + waveWidth, y);
    }
    g.stroke({ color: PEACOCK, width: 3, alpha: 0.075 });
  }
  return g;
}

function cloudShape(g: Graphics, x: number, y: number, width: number, height: number): void {
  g.moveTo(x - width / 2, y + height * 0.2)
    .bezierCurveTo(
      x - width * 0.47,
      y - height * 0.18,
      x - width * 0.32,
      y - height * 0.28,
      x - width * 0.19,
      y - height * 0.16,
    )
    .bezierCurveTo(
      x - width * 0.08,
      y - height * 0.55,
      x + width * 0.18,
      y - height * 0.5,
      x + width * 0.22,
      y - height * 0.12,
    )
    .bezierCurveTo(
      x + width * 0.44,
      y - height * 0.23,
      x + width * 0.54,
      y + height * 0.04,
      x + width / 2,
      y + height * 0.2,
    )
    .closePath()
    .fill({ color: FLOOR_LINE, alpha: 0.64 })
    .stroke({ color: INK, width: 3, alpha: 0.055 });
}

function drawSun(placement: MumbaiBackdropPlacement): Container {
  const sun = new Container({ label: "mumbai-sun", x: placement.sun.x, y: placement.sun.y });
  sun.scale.set(placement.motifScale);
  const g = new Graphics();
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    g.moveTo(Math.cos(angle) * 95, Math.sin(angle) * 95)
      .lineTo(Math.cos(angle) * 128, Math.sin(angle) * 128)
      .stroke({ color: MARIGOLD, width: 7, alpha: 0.09, cap: "round" });
  }
  g.circle(0, 0, 78)
    .fill({ color: MARIGOLD, alpha: 0.14 })
    .stroke({ color: MARIGOLD, width: 5, alpha: 0.11 });
  cloudShape(g, 42, 16, 260, 105);
  cloudShape(g, -86, 76, 205, 78);
  sun.addChild(g);
  return sun;
}

function drawGateway(placement: MumbaiBackdropPlacement): Container {
  const gateway = new Container({
    label: "gateway-of-india",
    x: placement.gateway.x,
    y: placement.gateway.y,
  });
  gateway.scale.set(placement.motifScale);
  const g = new Graphics();

  // Broad facade and the two corner turrets.
  g.rect(-142, -112, 284, 112)
    .fill({ color: RANI, alpha: 0.025 })
    .stroke({ color: INK, width: 3, alpha: 0.07 });
  for (const side of [-1, 1]) {
    const x = side * 151;
    g.roundRect(x - 18, -158, 36, 158, 4)
      .fill({ color: MARIGOLD, alpha: 0.035 })
      .stroke({ color: INK, width: 3, alpha: 0.075 });
    g.moveTo(x - 24, -158)
      .quadraticCurveTo(x, -190, x + 24, -158)
      .closePath()
      .fill({ color: RANI, alpha: 0.035 })
      .stroke({ color: INK, width: 3, alpha: 0.075 });
    g.moveTo(x, -190).lineTo(x, -208).stroke({ color: INK, width: 3, alpha: 0.065 });
  }

  // Central dome and the recognisable horseshoe entrance.
  g.moveTo(-73, -112)
    .lineTo(-65, -145)
    .quadraticCurveTo(0, -213, 65, -145)
    .lineTo(73, -112)
    .closePath()
    .fill({ color: MARIGOLD, alpha: 0.035 })
    .stroke({ color: INK, width: 4, alpha: 0.08 });
  g.moveTo(-48, 0)
    .lineTo(-48, -48)
    .quadraticCurveTo(-48, -105, 0, -118)
    .quadraticCurveTo(48, -105, 48, -48)
    .lineTo(48, 0)
    .stroke({ color: INK, width: 5, alpha: 0.09 });

  // Quiet architectural rhythm; enough to read as Mumbai without competing with the booths.
  g.moveTo(-142, -83).lineTo(142, -83).stroke({ color: INK, width: 2, alpha: 0.055 });
  g.moveTo(-142, -58).lineTo(-48, -58).stroke({ color: INK, width: 2, alpha: 0.05 });
  g.moveTo(48, -58).lineTo(142, -58).stroke({ color: INK, width: 2, alpha: 0.05 });
  for (const x of [-112, -82, 82, 112]) {
    g.roundRect(x - 7, -42, 14, 30, 7).stroke({ color: INK, width: 2, alpha: 0.06 });
  }
  gateway.addChild(g);
  return gateway;
}

function deckY(x: number): number {
  return -6 - x * 0.035;
}

function drawPylon(g: Graphics, x: number, height: number): void {
  const y = deckY(x);
  g.moveTo(x - 30, y)
    .lineTo(x - 13, y - height)
    .lineTo(x + 13, y - height)
    .lineTo(x + 30, y)
    .stroke({ color: INK, width: 7, alpha: 0.085, join: "round" });
  g.moveTo(x - 16, y - height * 0.7)
    .lineTo(x + 16, y - height * 0.7)
    .stroke({ color: INK, width: 4, alpha: 0.07 });
}

function drawBridge(placement: MumbaiBackdropPlacement): Container {
  const bridge = new Container({
    label: "bandra-worli-sea-link",
    x: placement.bridge.x,
    y: placement.bridge.y,
  });
  bridge.scale.set(placement.motifScale);
  const g = new Graphics();
  const towers = [190, 455] as const;

  g.moveTo(-45, deckY(-45))
    .quadraticCurveTo(330, -8, 745, deckY(745))
    .stroke({ color: PEACOCK, width: 18, alpha: 0.065, cap: "round" });
  g.moveTo(-45, deckY(-45))
    .quadraticCurveTo(330, -8, 745, deckY(745))
    .stroke({ color: INK, width: 3, alpha: 0.075, cap: "round" });

  for (const x of towers) drawPylon(g, x, 190);
  for (const tower of towers) {
    const topY = deckY(tower) - 184;
    const anchors = tower === towers[0] ? [-30, 55, 105, 280, 335] : [315, 370, 535, 610, 705];
    for (const anchor of anchors) {
      g.moveTo(tower, topY)
        .lineTo(anchor, deckY(anchor))
        .stroke({ color: INK, width: 2.2, alpha: 0.055 });
    }
  }
  for (let x = 5; x <= 700; x += 58) {
    g.circle(x, deckY(x) - 8, 4).fill({ color: MARIGOLD, alpha: 0.12 });
  }
  bridge.addChild(g);
  return bridge;
}

/** Subtle Mumbai landmarks behind the venue. Static and deliberately low-contrast. */
export function buildMumbaiBackdrop(layout: VenueLayout): Container {
  const backdrop = new Container({ label: "mumbai-backdrop" });
  backdrop.eventMode = "none";
  const placement = mumbaiBackdropPlacement(layout);
  backdrop.addChild(drawSea(layout, placement));
  backdrop.addChild(drawSun(placement));
  backdrop.addChild(drawGateway(placement));
  backdrop.addChild(drawBridge(placement));
  return backdrop;
}
