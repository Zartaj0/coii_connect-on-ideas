import type { Container } from "pixi.js";

import type { AddaSpot } from "@/data/adda";
import type { Person } from "@/data/types";
import { AddaStandIns } from "@/engine/addaCrowd";
import { AddaTent } from "@/engine/addaTent";
import type { AddaMapView } from "@/engine/types";
import type { Circle, Point } from "@/sim/geometry";
import { addaZone, plotFits } from "@/sim/layout";
import type { VenueLayout } from "@/sim/layout";
import type { World } from "@/sim/world";

/** What the plots need from the engine. */
export interface AddaPlotsHost {
  spawnStandIn(person: Person, zone: number): number;
  removeStandIn(index: number): void;
  /** Someone just joined (or dropped in): a little celebration at this point. */
  celebrate(index: number, x: number, y: number): void;
}

/** How high a newly added person falls from, in world units. */
const DROP_HEIGHT = 520;

interface Slot {
  readonly zone: number;
  readonly tent: AddaTent;
  readonly standIns: AddaStandIns;
}

/**
 * The adda plots on the map: your tents in the first three slots, one you joined in the last.
 * Places tents where you put them (if that still fits), lets you drag your own tents around
 * outside the ring, and spots people dropped on them.
 */
export class AddaPlots {
  private readonly slots: Slot[];

  constructor(
    private readonly world: World,
    private readonly layout: VenueLayout,
    displayFont: string,
    private readonly host: AddaPlotsHost,
  ) {
    this.slots = layout.addaSlots.map((zone) => {
      const tent = new AddaTent(world.zones[zone] ?? addaZone(0, 0, false), displayFont);
      const standIns = new AddaStandIns(world, zone, host);
      return { zone, tent, standIns };
    });
  }

  /** Ground rings go on the floor layer, tents with the booths. */
  addTo(floor: Container, stalls: Container): void {
    for (const slot of this.slots) {
      floor.addChild(slot.tent.ground);
      stalls.addChild(slot.tent.tent);
    }
  }

  apply(views: readonly AddaMapView[]): void {
    const mine = views.filter((v) => v.mine).slice(0, this.slots.length - 1);
    const theirs = views.find((v) => !v.mine) ?? null;
    const placed: Circle[] = [];
    this.slots.forEach((slot, i) => {
      const view = i < this.slots.length - 1 ? (mine[i] ?? null) : theirs;
      this.applySlot(slot, i, view, placed);
    });
  }

  private applySlot(slot: Slot, index: number, view: AddaMapView | null, placed: Circle[]): void {
    const current = this.world.zones[slot.zone];
    if (!view || !current) {
      const home = this.layout.defaultPlots[index] ?? { x: 0, y: 0 };
      this.world.placeZone(slot.zone, addaZone(home.x, home.y, false));
      slot.tent.show(null);
      slot.standIns.apply(null);
      return;
    }
    const at = this.placeFor(view, index, placed);
    placed.push({ x: at.x, y: at.y, r: current.r1 });
    const zone = addaZone(at.x, at.y, true);
    this.world.placeZone(slot.zone, zone);
    slot.tent.setZone(zone);
    slot.tent.show(view);
    for (const joined of slot.standIns.apply(view)) {
      const a = this.world.agent(joined);
      this.host.celebrate(joined, a.x, a.y);
    }
  }

  /** Where you put it in this layout, else where it is now, else the first free starting plot. */
  private placeFor(view: AddaMapView, index: number, placed: readonly Circle[]): Point {
    const saved = view.places[this.layout.mode];
    const zone = this.world.zones[this.slots[index]?.zone ?? -1];
    const options: Point[] = [
      ...(saved ? [{ x: saved.x * this.layout.width, y: saved.y * this.layout.height }] : []),
      ...(zone && zone.obstacle.r > 0 ? [zone] : []),
      ...rotate(this.layout.defaultPlots, index),
    ];
    return (
      options.find((p) => plotFits(this.layout, p.x, p.y, placed)) ??
      options.at(-1) ?? { x: 0, y: 0 }
    );
  }

  private slotOf(addaId: string): Slot | undefined {
    return this.slots.find((s) => s.tent.addaId === addaId);
  }

  /** The tent's plot, for the camera. */
  zoneOf(addaId: string): { x: number; y: number; r: number } | null {
    const slot = this.slotOf(addaId);
    const zone = slot && this.world.zones[slot.zone];
    return zone && slot.tent.addaId ? { x: zone.x, y: zone.y, r: zone.r1 } : null;
  }

  /** Their stand-in falls into the tent from above; returns where it will land. */
  dropIn(addaId: string, personId: string): Point | null {
    const index = this.slotOf(addaId)?.standIns.indexOf(personId);
    if (index === undefined) return null;
    this.world.dropFromSky(index, DROP_HEIGHT);
    const a = this.world.agent(index);
    return { x: a.x, y: a.y };
  }

  /** Slot index of a visible tent under this world point (for taps), or -1. */
  tentAt(wx: number, wy: number): number {
    return this.slots.findIndex((s) => s.tent.contains(wx, wy));
  }

  addaIdAt(slot: number): string | null {
    return this.slots[slot]?.tent.addaId ?? null;
  }

  /** One of your tents under this point, which you can pick up and move; -1 if none. */
  myTentAt(wx: number, wy: number): number {
    return this.slots.findIndex((s) => s.tent.mine && s.tent.contains(wx, wy));
  }

  /** Your adda whose ground is under this point (where a dropped bean would land), or null. */
  myGroundAt(wx: number, wy: number): string | null {
    return this.slots.find((s) => s.tent.mine && s.tent.onGround(wx, wy))?.tent.addaId ?? null;
  }

  private others(slot: number): Circle[] {
    return this.slots.flatMap((s, i) => {
      const zone = this.world.zones[s.zone];
      return i !== slot && s.tent.addaId && zone ? [{ x: zone.x, y: zone.y, r: zone.r1 }] : [];
    });
  }

  /** Shows the tent under your pointer while you drag it, green where it fits, red where not. */
  dragTo(slot: number, wx: number, wy: number): void {
    const tent = this.slots[slot]?.tent;
    if (!tent) return;
    tent.moveTo(wx, wy);
    tent.setDragging(plotFits(this.layout, wx, wy, this.others(slot)));
  }

  /**
   * Lets go of a dragged tent: it moves there if it fits (returns the new spot, as fractions of
   * the world), otherwise it springs back.
   */
  endDrag(slot: number, wx: number, wy: number): { addaId: string; spot: AddaSpot } | null {
    const s = this.slots[slot];
    if (!s?.tent.addaId) return null;
    if (!plotFits(this.layout, wx, wy, this.others(slot))) {
      s.tent.setZone(s.tent.zone);
      return null;
    }
    const zone = addaZone(wx, wy, true);
    this.world.placeZone(s.zone, zone);
    s.tent.setZone(zone);
    return {
      addaId: s.tent.addaId,
      spot: { x: wx / this.layout.width, y: wy / this.layout.height },
    };
  }
}

/** The list starting at `start`, wrapping round: each slot tries its own starting plot first. */
function rotate<T>(items: readonly T[], start: number): T[] {
  return [...items.slice(start), ...items.slice(0, start)];
}
