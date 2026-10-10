import { describe, expect, it } from "vitest";

import { createController } from "@/app/controller";
import type { JoinInput } from "@/app/controller";
import { WAVES_PER_DAY } from "@/app/meet";
import type { AddaView, AppState, Store } from "@/app/store";
import { ADDA_MAX } from "@/data/adda";
import { generateDemo } from "@/data/generateDemo";
import { FakeEngine } from "@/engine/fake";
import type { AddaMapView } from "@/engine/types";
import { fakeClock } from "@/test/fakeClock";

const START = Date.UTC(2026, 10, 3, 5, 0); // 3 Nov 2026, 10:30 IST
const CROWD = generateDemo({ seed: 5, count: 300, reserve: 0, now: START }).people;
const JOIN: JoinInput = {
  name: "Zara Khan",
  telegram: "zara_builds",
  x: null,
  topics: ["privacy", "core"],
  intent: ["building"],
  oneLiners: [],
  avatar: { skin: 1, hair: 0, hairColor: 0, accessory: 0 },
};
const LOOK = { style: "tambu", color: "leaf" } as const;

function setup() {
  const engine = new FakeEngine();
  const { clock, advance } = fakeClock(START);
  const controller = createController(engine, {
    people: CROWD,
    you: null,
    reducedMotion: false,
    clock,
  });
  return { engine, advance, store: controller.store, actions: controller.actions };
}

function addaOf(store: Store<AppState>): AddaView {
  const adda = store.get().adda;
  if (!adda) throw new Error("expected adda to be active after joining");
  return adda;
}

function lastMap(engine: FakeEngine): AddaMapView | null {
  const calls = engine.calls.filter((c) => c.method === "setAdda");
  return (calls.at(-1)?.args[0] as AddaMapView | null | undefined) ?? null;
}

function id(index: number): string {
  return CROWD[index]?.id ?? "";
}

describe("Adda: your tent", () => {
  it("is off until you join, then waits for you to build it", () => {
    const { store, actions, engine } = setup();
    expect(store.get().adda).toBeNull();
    actions.join(JOIN);
    expect(addaOf(store)).toMatchObject({ look: null, members: [], invites: [] });
    expect(lastMap(engine)).toBeNull();
  });

  it("only invites people you built a tent for and waved at", () => {
    const { store, actions, engine } = setup();
    actions.join(JOIN);
    expect(actions.inviteToAdda(id(0))).toBe("needs_adda");
    actions.buildAdda(LOOK);
    expect(actions.inviteToAdda(id(0))).toBe("needs_wave");
    actions.wave(id(0));
    expect(actions.inviteToAdda(id(0))).toBe("invited");
    expect(actions.inviteToAdda(id(0))).toBe("already");
    expect(addaOf(store).members).toEqual([
      { personId: id(0), status: "invited", invitedAt: START },
    ]);
    const map = lastMap(engine);
    expect(map?.label).toBe("Zara's adda");
    expect(map?.look).toEqual(LOOK);
    expect(map?.members.map((m) => [m.person.name, m.pending])).toEqual([
      ["Zara Khan", false],
      [CROWD[0]?.name, true],
    ]);
  });

  it("stops at the size cap", () => {
    const { actions } = setup();
    actions.join(JOIN);
    actions.buildAdda(LOOK);
    const results = CROWD.slice(0, ADDA_MAX + 1).map((p) => {
      actions.wave(p.id);
      return actions.inviteToAdda(p.id);
    });
    expect(results.filter((r) => r === "invited")).toHaveLength(ADDA_MAX);
    expect(results.at(-1)).toBe("full");
  });

  it("demo people answer: a yes joins and makes a chai, a no keeps showing as invited", () => {
    const { store, actions, advance, engine } = setup();
    actions.join(JOIN);
    actions.buildAdda(LOOK);
    const invited = CROWD.slice(0, 25).map((p) => p.id);
    for (const pid of invited) {
      actions.wave(pid);
      actions.inviteToAdda(pid);
    }
    advance(31_000);
    const members = addaOf(store).members;
    const joined = members.filter((m) => m.status === "joined").map((m) => m.personId);
    expect(joined.length).toBeGreaterThan(0);
    expect(joined.length).toBeLessThan(invited.length);
    expect(members).toHaveLength(invited.length);
    const chais = new Set(store.get().meet?.chais.map((c) => c.personId));
    expect(joined.every((pid) => chais.has(pid))).toBe(true);
    const pending = lastMap(engine)?.members.filter((m) => m.pending).length;
    expect(pending).toBe(invited.length - joined.length);
  });

  it("removing someone cancels their pending answer", () => {
    const { store, actions, advance } = setup();
    actions.join(JOIN);
    actions.buildAdda(LOOK);
    actions.wave(id(1));
    actions.inviteToAdda(id(1));
    actions.removeFromAdda(id(1));
    advance(31_000);
    expect(addaOf(store).members).toEqual([]);
  });

  it("is forgotten when you leave coii", () => {
    const { store, actions, engine } = setup();
    actions.join(JOIN);
    actions.buildAdda(LOOK);
    actions.leave();
    expect(store.get().adda).toBeNull();
    expect(lastMap(engine)).toBeNull();
  });
});

function withInvite() {
  const ctx = setup();
  ctx.actions.join(JOIN);
  ctx.advance(271_000);
  const invite = addaOf(ctx.store).invites[0];
  if (!invite) throw new Error("expected a demo invite within 270 s");
  return { ...ctx, ownerId: invite.ownerId };
}

describe("Adda: invites to you", () => {
  it("accepting joins their adda and makes a chai without using a wave", () => {
    const { store, actions, ownerId, engine } = withInvite();
    actions.acceptAddaInvite(ownerId);
    const adda = addaOf(store);
    expect(adda.invites.some((i) => i.ownerId === ownerId)).toBe(false);
    expect(adda.joined.map((j) => j.ownerId)).toContain(ownerId);
    expect(store.get().meet?.chais.some((c) => c.personId === ownerId)).toBe(true);
    expect(store.get().meet?.wavesLeft).toBe(WAVES_PER_DAY);
    expect(store.get().meet?.celebrate).toBeNull();
    actions.viewAdda(ownerId);
    const map = lastMap(engine);
    expect(map?.ownerId).toBe(ownerId);
    expect(map?.members.every((m) => !m.pending)).toBe(true);
    expect(engine.calls.at(-1)?.method).toBe("focusAdda");
  });

  it("saying not now just drops the invite", () => {
    const { store, actions, ownerId } = withInvite();
    actions.declineAddaInvite(ownerId);
    expect(addaOf(store).invites).toEqual([]);
    expect(store.get().meet?.chais.some((c) => c.personId === ownerId)).toBe(false);
  });

  it("leaving their adda puts your own tent back on the map", () => {
    const { store, actions, ownerId } = withInvite();
    actions.acceptAddaInvite(ownerId);
    actions.viewAdda(ownerId);
    actions.leaveAdda(ownerId);
    expect(addaOf(store)).toMatchObject({ joined: [], viewing: null });
  });
});
