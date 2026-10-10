import { isAddaLook, isAddaSpot } from "@/data/adda";
import type { AddaLook, AddaPlaces } from "@/data/adda";

export type MemberStatus = "invited" | "joined";

export interface AddaMember {
  readonly personId: string;
  readonly status: MemberStatus;
  readonly invitedAt: number;
}

/** One of your (up to three) addas. */
export interface MyAdda {
  readonly id: string;
  readonly name: string;
  readonly look: AddaLook;
  readonly members: readonly AddaMember[];
  /**
   * Demo people who said no. They keep showing as invited, so a "no" is never signalled
   * (the same rule as hidden waves).
   */
  readonly declined: readonly string[];
  /** Where you put the tent, per map layout; missing means its starting plot. */
  readonly places: AddaPlaces;
}

/** Points at one adda: its owner and its id. */
export interface AddaRef {
  readonly ownerId: string;
  readonly addaId: string;
}

/** Someone invited you to one of their addas and you haven't answered yet. */
export interface AddaInvite extends AddaRef {
  readonly name: string;
  readonly at: number;
}

/** An adda you joined: whose, how it looks and who was in it when you joined. */
export interface JoinedAdda extends AddaRef {
  readonly name: string;
  readonly look: AddaLook;
  readonly memberIds: readonly string[];
}

/** Everything adda remembers for you in this browser (demo phase; the server owns it later). */
export interface AddaSave {
  readonly version: 2;
  readonly personId: string;
  readonly addas: readonly MyAdda[];
  readonly invites: readonly AddaInvite[];
  readonly joined: readonly JoinedAdda[];
  /** A joined adda shown on the map next to yours, or null. */
  readonly viewing: AddaRef | null;
}

const KEY = "coii:adda:v1";

export function emptyAdda(personId: string): AddaSave {
  return { version: 2, personId, addas: [], invites: [], joined: [], viewing: null };
}

type Raw = Record<string, unknown>;

function list(value: unknown): Raw[] {
  return Array.isArray(value) ? value.filter((v): v is Raw => !!v && typeof v === "object") : [];
}

function places(value: unknown): AddaPlaces {
  const v = (value && typeof value === "object" ? value : {}) as Raw;
  return {
    ...(isAddaSpot(v["landscape"]) ? { landscape: v["landscape"] } : {}),
    ...(isAddaSpot(v["portrait"]) ? { portrait: v["portrait"] } : {}),
  };
}

function myAdda(raw: Raw): MyAdda | null {
  if (typeof raw["id"] !== "string" || typeof raw["name"] !== "string") return null;
  if (!isAddaLook(raw["look"])) return null;
  return {
    id: raw["id"],
    name: raw["name"],
    look: raw["look"],
    members: list(raw["members"]) as unknown as AddaMember[],
    declined: (Array.isArray(raw["declined"]) ? raw["declined"] : []) as string[],
    places: places(raw["places"]),
  };
}

/** The first save format had one adda at the top level; it becomes your first adda. */
function fromV1(v: Raw, personId: string): AddaSave {
  const look = isAddaLook(v["look"]) ? v["look"] : null;
  const addas: MyAdda[] = look
    ? [
        {
          id: "adda-1",
          name: "My adda",
          look,
          members: list(v["members"]) as unknown as AddaMember[],
          declined: (Array.isArray(v["declined"]) ? v["declined"] : []) as string[],
          places: {},
        },
      ]
    : [];
  return { ...emptyAdda(personId), addas };
}

function fromV2(v: Raw, personId: string): AddaSave {
  const viewing = v["viewing"] as AddaRef | null;
  return {
    version: 2,
    personId,
    addas: list(v["addas"]).flatMap((a) => myAdda(a) ?? []),
    invites: list(v["invites"]) as unknown as AddaInvite[],
    joined: (list(v["joined"]) as unknown as JoinedAdda[]).filter((j) => isAddaLook(j.look)),
    viewing: viewing && typeof viewing.addaId === "string" ? viewing : null,
  };
}

/** Your saved addas, or a fresh save if none exists, it belongs to someone else, or storage fails. */
export function loadAdda(personId: string): AddaSave {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== "object") return emptyAdda(personId);
    const v = parsed as Raw;
    if (v["personId"] !== personId) return emptyAdda(personId);
    if (v["version"] === 1) return fromV1(v, personId);
    return v["version"] === 2 ? fromV2(v, personId) : emptyAdda(personId);
  } catch {
    return emptyAdda(personId);
  }
}

export function saveAdda(save: AddaSave): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}

export function clearAdda(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Storage blocked; nothing was saved, so there is nothing to clear.
  }
}
