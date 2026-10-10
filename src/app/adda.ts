import { demoAnswer, demoCrew, demoInviter, demoLook } from "@/adda/demo";
import { clearAdda, loadAdda, saveAdda } from "@/adda/storage";
import type { AddaMember, AddaSave } from "@/adda/storage";
import type { MeetClock, MeetController } from "@/app/meet";
import type { AddaView, AppState, Store, Toast } from "@/app/store";
import { ADDA_MAX } from "@/data/adda";
import type { AddaLook } from "@/data/adda";
import type { IconId, Person } from "@/data/types";
import type { AddaMapMember, AddaMapView, EngineApi } from "@/engine/types";

/** Most demo invites that arrive on their own per visit. */
const INVITE_DRIP_MAX = 2;
/** Demo invites wait a couple of minutes, so they never land on top of joining. */
const FIRST_INVITE_MS = 150_000;
const INVITE_SPREAD_MS = 120_000;

export type InviteResult =
  | "invited"
  | "needs_adda"
  | "needs_wave"
  | "full"
  | "already"
  | "unavailable";

export interface AddaActions {
  /** Builds your adda, or changes how it looks. */
  buildAdda(look: AddaLook): void;
  /** Invites someone you have waved at. They see it's you. */
  inviteToAdda(personId: string): InviteResult;
  /** Takes back an invite or removes a member, silently. */
  removeFromAdda(personId: string): void;
  /** Joins their adda: you wave back for free, which makes it a chai. */
  acceptAddaInvite(ownerId: string): void;
  /** Says "not now"; they are never told. */
  declineAddaInvite(ownerId: string): void;
  leaveAdda(ownerId: string): void;
  /** Shows this owner's tent on the map (null: yours) and flies there. */
  viewAdda(ownerId: string | null): void;
  focusAdda(): void;
}

export interface AddaController extends AddaActions {
  /** Re-reads you; call after joining or leaving. */
  sync(): void;
  /** Forget everything adda stored for you (on leaving). */
  forget(): void;
}

type PushToast = (text: string, icon: IconId | null, tone: Toast["tone"]) => void;

export interface AddaDeps {
  readonly engine: EngineApi;
  readonly store: Store<AppState>;
  readonly meet: MeetController;
  readonly pushToast: PushToast;
  readonly clock: MeetClock;
}

export function firstName(person: Person): string {
  return person.name.split(" ")[0] ?? person.name;
}

function viewOf(save: AddaSave): AddaView {
  return {
    look: save.look,
    members: save.members,
    invites: save.invites,
    joined: save.joined,
    viewing: save.viewing,
  };
}

function withStatus(save: AddaSave, personId: string, status: AddaMember["status"]): AddaSave {
  return {
    ...save,
    members: save.members.map((m) => (m.personId === personId ? { ...m, status } : m)),
  };
}

/**
 * Adda game loop for the demo phase: your tent, invites both ways and demo answers, persisted in
 * this browser. The map shows one tent: yours, or one you joined.
 */
class Adda implements AddaController {
  private save: AddaSave | null = null;
  private readonly answers = new Map<string, () => void>();
  private cancelDrip: (() => void) | null = null;
  private drips = 0;

  constructor(private readonly deps: AddaDeps) {}

  // ---- lifecycle -------------------------------------------------------------------------------

  readonly sync = (): void => {
    const me = this.you();
    if (!me) return this.reset();
    if (this.save?.personId !== me.id) this.save = loadAdda(me.id);
    this.publish();
    if (!this.cancelDrip) this.scheduleDrip();
  };

  readonly forget = (): void => {
    clearAdda();
    this.reset();
  };

  private reset(): void {
    this.save = null;
    for (const cancel of this.answers.values()) cancel();
    this.answers.clear();
    this.cancelDrip?.();
    this.cancelDrip = null;
    this.deps.store.set({ adda: null });
    this.deps.engine.setAdda(null);
  }

  // ---- helpers ---------------------------------------------------------------------------------

  private you(): Person | null {
    return this.deps.store.get().you;
  }

  private personById(id: string): Person | undefined {
    return this.deps.store.get().people.find((p) => p.id === id);
  }

  private update(change: (save: AddaSave) => AddaSave): void {
    if (!this.save) return;
    this.save = change(this.save);
    this.publish();
  }

  private publish(): void {
    if (!this.save) return;
    saveAdda(this.save);
    this.deps.store.set({ adda: viewOf(this.save) });
    this.deps.engine.setAdda(this.mapView(this.save));
  }

  private mapMember(id: string, pending: boolean): AddaMapMember[] {
    const person = this.personById(id);
    return person ? [{ person, pending }] : [];
  }

  private mapView(save: AddaSave): AddaMapView | null {
    const me = this.you();
    if (!me) return null;
    const other = save.joined.find((j) => j.ownerId === save.viewing);
    if (other) {
      const owner = this.personById(other.ownerId);
      if (!owner) return null;
      const ids = [owner.id, me.id, ...other.memberIds.filter((id) => id !== me.id)];
      const members = ids.flatMap((id) => this.mapMember(id, false));
      return { ownerId: owner.id, label: `${firstName(owner)}'s adda`, look: other.look, members };
    }
    if (!save.look) return null;
    const members = [
      ...this.mapMember(me.id, false),
      ...save.members.flatMap((m) => this.mapMember(m.personId, m.status === "invited")),
    ];
    return { ownerId: me.id, label: `${firstName(me)}'s adda`, look: save.look, members };
  }

  // ---- your adda -------------------------------------------------------------------------------

  readonly buildAdda = (look: AddaLook): void => {
    if (!this.save) return;
    const first = this.save.look === null;
    this.update((s) => ({ ...s, look, viewing: first ? null : s.viewing }));
    if (first) {
      this.deps.pushToast("Your adda is up! Find it by the gate.", "party_popper", "success");
    }
  };

  private inviteBlocker(personId: string): InviteResult | null {
    const me = this.you();
    const target = this.personById(personId);
    if (!this.save || !me || !target || target.id === me.id) return "unavailable";
    return this.inviteRule(this.save, personId);
  }

  private inviteRule(save: AddaSave, personId: string): InviteResult | null {
    if (!save.look) return "needs_adda";
    if (save.members.some((m) => m.personId === personId)) return "already";
    if (!this.deps.meet.hasWaved(personId)) return "needs_wave";
    return save.members.length >= ADDA_MAX ? "full" : null;
  }

  readonly inviteToAdda = (personId: string): InviteResult => {
    const blocked = this.inviteBlocker(personId);
    const me = this.you();
    const target = this.personById(personId);
    if (blocked || !me || !target) return blocked ?? "unavailable";
    const member: AddaMember = { personId, status: "invited", invitedAt: this.deps.clock.now() };
    this.update((s) => ({ ...s, members: [...s.members, member], viewing: null }));
    if (target.isDemo) this.scheduleAnswer(me, target);
    return "invited";
  };

  private scheduleAnswer(me: Person, target: Person): void {
    const answer = demoAnswer(me, target, this.deps.clock.random);
    const cancel = this.deps.clock.schedule(() => {
      this.answers.delete(target.id);
      const member = this.save?.members.find((m) => m.personId === target.id);
      if (member?.status !== "invited") return;
      if (answer.joins) this.memberJoined(target);
      else this.update((s) => ({ ...s, declined: [...s.declined, target.id] }));
    }, answer.delayMs);
    this.answers.set(target.id, cancel);
  }

  private memberJoined(person: Person): void {
    this.update((s) => withStatus(s, person.id, "joined"));
    this.deps.meet.theyWaved(person.id);
    this.deps.pushToast(
      `${firstName(person)} joined your adda! You're meeting at Devcon.`,
      "handshake",
      "success",
    );
  }

  readonly removeFromAdda = (personId: string): void => {
    this.answers.get(personId)?.();
    this.answers.delete(personId);
    this.update((s) => ({
      ...s,
      members: s.members.filter((m) => m.personId !== personId),
      declined: s.declined.filter((id) => id !== personId),
    }));
  };

  // ---- other people's addas --------------------------------------------------------------------

  readonly acceptAddaInvite = (ownerId: string): void => {
    const owner = this.personById(ownerId);
    const me = this.you();
    if (!this.save?.invites.some((i) => i.ownerId === ownerId) || !owner || !me) return;
    const joined = {
      ownerId,
      look: demoLook(ownerId),
      memberIds: demoCrew(owner, this.deps.store.get().people, me.id),
    };
    this.update((s) => ({
      ...s,
      invites: s.invites.filter((i) => i.ownerId !== ownerId),
      joined: [...s.joined.filter((j) => j.ownerId !== ownerId), joined],
    }));
    this.deps.meet.theyWaved(ownerId);
    this.deps.meet.waveFree(ownerId);
    this.deps.pushToast(
      `You're in ${firstName(owner)}'s adda! You're meeting at Devcon.`,
      "handshake",
      "success",
    );
  };

  readonly declineAddaInvite = (ownerId: string): void => {
    this.update((s) => ({ ...s, invites: s.invites.filter((i) => i.ownerId !== ownerId) }));
  };

  readonly leaveAdda = (ownerId: string): void => {
    this.update((s) => ({
      ...s,
      joined: s.joined.filter((j) => j.ownerId !== ownerId),
      viewing: s.viewing === ownerId ? null : s.viewing,
    }));
  };

  readonly viewAdda = (ownerId: string | null): void => {
    if (!this.save) return;
    const known = ownerId === null || this.save.joined.some((j) => j.ownerId === ownerId);
    if (!known) return;
    this.update((s) => ({ ...s, viewing: ownerId }));
    this.deps.engine.focusAdda();
  };

  readonly focusAdda = (): void => {
    this.deps.engine.focusAdda();
  };

  /** Now and then a demo person who shares your topics invites you to their adda. */
  private scheduleDrip(): void {
    if (this.drips >= INVITE_DRIP_MAX) return;
    this.cancelDrip = this.deps.clock.schedule(
      () => {
        this.cancelDrip = null;
        this.drip();
        this.scheduleDrip();
      },
      FIRST_INVITE_MS + this.deps.clock.random() * INVITE_SPREAD_MS,
    );
  }

  private drip(): void {
    const me = this.you();
    const save = this.save;
    if (!me || !save) return;
    const taken = new Set([
      me.id,
      ...save.members.map((m) => m.personId),
      ...save.invites.map((i) => i.ownerId),
      ...save.joined.map((j) => j.ownerId),
    ]);
    const inviter = demoInviter(me, this.deps.store.get().people, taken, this.deps.clock.random);
    if (!inviter) return;
    this.drips++;
    const invite = { ownerId: inviter.id, at: this.deps.clock.now() };
    this.update((s) => ({ ...s, invites: [...s.invites, invite] }));
    this.deps.pushToast(
      `${firstName(inviter)} wants you in their adda! Answer in the Adda tab.`,
      "handshake",
      "info",
    );
  }
}

export function createAdda(deps: AddaDeps): AddaController {
  return new Adda(deps);
}
