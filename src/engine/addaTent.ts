import { Container, Graphics, Text } from "pixi.js";

import { addaColor, addaTier } from "@/data/adda";
import type { AddaLook, AddaStyle } from "@/data/adda";
import { INK, MARIGOLD, WHITE } from "@/engine/palette";
import type { AddaMapView } from "@/engine/types";
import { ADDA_SPOTS } from "@/sim/layout";
import type { Zone } from "@/sim/layout";

/** Tent art scale for the small, medium and large tiers. */
const TIER_SCALE = [0.78, 0.9, 1] as const;
/** Spare spots past the member count, so the crowd has room to stroll. */
export const ADDA_SPARE_SPOTS = 6;
const SIGN_Y = 74;

/** Spots in use for this many people in the tent (owner included). */
export function addaSpotLimit(people: number): number {
  return Math.min(ADDA_SPOTS, people + ADDA_SPARE_SPOTS);
}

/** Radius of the ground ring around the tent for this many people. */
export function addaGroundRadius(zone: Zone, people: number): number {
  const inner = zone.r0 * zone.r0;
  const span = zone.r1 * zone.r1 - inner;
  return Math.sqrt(inner + (span * addaSpotLimit(people)) / ADDA_SPOTS) + 14;
}

function drawShamiana(g: Graphics, color: number): void {
  g.ellipse(0, 46, 96, 18).fill({ color: INK, alpha: 0.12 });
  g.roundRect(-74, 20, 148, 34, 10).fill({ color: 0xfff1d6 }).stroke({ color: INK, width: 3 });
  for (const x of [-82, 82]) g.roundRect(x - 4, -60, 8, 108, 4).fill({ color: INK });
  const stripes = 9;
  const width = 200 / stripes;
  for (let i = 0; i < stripes; i++) {
    const x = -100 + i * width;
    g.moveTo(x, -64)
      .lineTo(x + width, -64)
      .lineTo(x + width, -36)
      .arc(x + width / 2, -36, width / 2, 0, Math.PI)
      .closePath()
      .fill({ color: i % 2 ? WHITE : color });
  }
  g.moveTo(-100, -64).lineTo(100, -64).stroke({ color: INK, width: 4 });
  g.moveTo(-108, -64)
    .quadraticCurveTo(0, -112, 108, -64)
    .closePath()
    .fill({ color })
    .stroke({ color: INK, width: 4 });
  g.circle(0, -94, 7).fill({ color: MARIGOLD }).stroke({ color: INK, width: 3 });
}

function drawTambu(g: Graphics, color: number): void {
  g.ellipse(0, 48, 92, 16).fill({ color: INK, alpha: 0.12 });
  g.poly([-88, 44, 0, -104, 88, 44]).fill({ color }).stroke({ color: INK, width: 4 });
  for (const x of [-44, 44]) {
    g.moveTo(0, -104).lineTo(x, 44).stroke({ color: WHITE, width: 7, alpha: 0.85 });
  }
  g.poly([-26, 44, 0, -12, 26, 44]).fill({ color: INK, alpha: 0.85 });
  g.poly([0, -12, 26, 44, 12, 44]).fill({ color: WHITE, alpha: 0.25 });
  g.moveTo(0, -104).lineTo(0, -138).stroke({ color: INK, width: 4 });
  g.poly([0, -138, 30, -128, 0, -118]).fill({ color: MARIGOLD }).stroke({ color: INK, width: 3 });
}

function drawChhatri(g: Graphics, color: number): void {
  g.ellipse(0, 50, 94, 16).fill({ color: INK, alpha: 0.12 });
  g.roundRect(-86, 34, 172, 20, 8).fill({ color: 0xfff1d6 }).stroke({ color: INK, width: 3 });
  for (const x of [-70, -24, 24, 70]) {
    g.roundRect(x - 6, -34, 12, 70, 4)
      .fill({ color: WHITE })
      .stroke({ color: INK, width: 3 });
  }
  g.roundRect(-90, -44, 180, 16, 6).fill({ color }).stroke({ color: INK, width: 4 });
  g.moveTo(-78, -44)
    .arc(0, -44, 78, Math.PI, Math.PI * 2)
    .closePath()
    .fill({ color })
    .stroke({ color: INK, width: 4 });
  g.moveTo(-40, -44)
    .arc(0, -44, 40, Math.PI, Math.PI * 2)
    .stroke({ color: WHITE, width: 5, alpha: 0.7 });
  g.moveTo(0, -122).lineTo(0, -144).stroke({ color: INK, width: 4 });
  g.circle(0, -148, 8).fill({ color: MARIGOLD }).stroke({ color: INK, width: 3 });
}

const DRAW: Readonly<Record<AddaStyle, (g: Graphics, color: number) => void>> = {
  shamiana: drawShamiana,
  tambu: drawTambu,
  chhatri: drawChhatri,
};

/** Little triangle flags around the ring, one per member who has joined (owner included). */
function drawBunting(g: Graphics, radius: number, flags: number, color: number): void {
  if (flags <= 1) return;
  for (let i = 0; i < flags; i++) {
    const angle = (i / flags) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const tx = -Math.sin(angle) * 7;
    const ty = Math.cos(angle) * 7;
    const ox = Math.cos(angle) * 14;
    const oy = Math.sin(angle) * 14;
    g.poly([x - tx, y - ty, x + tx, y + ty, x + ox, y + oy])
      .fill({ color: i % 2 ? MARIGOLD : color })
      .stroke({ color: INK, width: 1.5, alpha: 0.5 });
  }
}

/** Key for what is drawn, so the art is only rebuilt when it actually changes. */
function artKey(look: AddaLook, people: number, joined: number, label: string): string {
  return `${look.style}:${look.color}:${people}:${joined}:${label}`;
}

/**
 * The adda plot: a ground ring that widens with the crowd (floor layer) and the tent with its
 * sign (booth layer). Hidden when there is no adda to show.
 */
export class AddaTent {
  readonly ground: Graphics;
  readonly tent: Container;
  private readonly art = new Graphics();
  private readonly sign: Text;
  private readonly signBack = new Graphics();
  private key = "";
  /** Which adda this plot shows right now, or null. */
  addaId: string | null = null;
  /** One of yours: you can drag it and drop people on it. */
  mine = false;
  private readonly ring = new Graphics();

  constructor(
    public zone: Zone,
    displayFont: string,
  ) {
    this.ground = new Graphics({ label: "adda-ground", x: zone.x, y: zone.y, visible: false });
    this.tent = new Container({ label: "adda-tent", x: zone.x, y: zone.y, visible: false });
    this.sign = new Text({
      text: "",
      style: { fontFamily: displayFont, fontWeight: "800", fontSize: 22, fill: INK },
      anchor: 0.5,
      y: SIGN_Y,
      resolution: 2,
    });
    this.tent.addChild(this.art, this.signBack, this.sign);
    this.ground.addChild(this.ring);
  }

  show(view: AddaMapView | null): void {
    this.ground.visible = view !== null;
    this.tent.visible = view !== null;
    this.addaId = view?.id ?? null;
    this.mine = view?.mine ?? false;
    if (!view) return;
    const people = view.members.length;
    const joined = view.members.filter((m) => !m.pending).length;
    const label = `${view.label} · ${people}`;
    const key = artKey(view.look, people, joined, label);
    if (key === this.key) return;
    this.key = key;
    const color = addaColor(view.look.color).color;
    this.drawGround(color, people, joined);
    this.drawTent(view.look, color, people);
    this.drawSign(label, color);
  }

  /** Puts the plot somewhere else (after the world moved its zone). */
  setZone(zone: Zone): void {
    this.zone = zone;
    this.moveTo(zone.x, zone.y);
    this.setDragging(null);
  }

  /** Draws the plot at a point without moving its zone (while you drag it). */
  moveTo(x: number, y: number): void {
    this.ground.position.set(x, y);
    this.tent.position.set(x, y);
  }

  /** While dragging: a green ring where it can go, red where it can't; null when not dragging. */
  setDragging(fits: boolean | null): void {
    this.ring.clear();
    this.tent.alpha = fits === false ? 0.6 : 1;
    if (fits === null) return;
    this.ring
      .circle(0, 0, this.zone.r1)
      .stroke({ color: fits ? 0x2f9e5b : 0xe5383b, width: 8, alpha: 0.9 });
  }

  contains(wx: number, wy: number): boolean {
    if (!this.tent.visible) return false;
    const x = wx - this.tent.x;
    const y = wy - this.tent.y;
    return Math.abs(x) <= 100 && y >= -150 && y <= SIGN_Y + 20;
  }

  /** Whether a point is on the plot's ground (where people can be dropped). */
  onGround(wx: number, wy: number): boolean {
    return this.tent.visible && Math.hypot(wx - this.zone.x, wy - this.zone.y) <= this.zone.r1;
  }

  private drawGround(color: number, people: number, joined: number): void {
    const radius = addaGroundRadius(this.zone, people);
    const g = this.ground;
    g.clear();
    g.circle(0, 0, radius).fill({ color, alpha: 0.1 }).stroke({ color, width: 4, alpha: 0.4 });
    g.circle(0, 0, radius - 12).stroke({ color: WHITE, width: 3, alpha: 0.7 });
    drawBunting(g, radius, joined, color);
  }

  private drawTent(look: AddaLook, color: number, people: number): void {
    this.art.clear();
    DRAW[look.style](this.art, color);
    this.art.scale.set(TIER_SCALE[addaTier(people - 1)]);
  }

  private drawSign(label: string, color: number): void {
    this.sign.text = label;
    const w = this.sign.width + 28;
    const h = 36;
    this.signBack
      .clear()
      .roundRect(-w / 2 + 4, SIGN_Y - h / 2 + 4, w, h, 18)
      .fill({ color: INK })
      .roundRect(-w / 2, SIGN_Y - h / 2, w, h, 18)
      .fill({ color: WHITE })
      .stroke({ color, width: 4 });
  }
}
