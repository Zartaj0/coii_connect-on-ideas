import { isAddaLook } from "@/data/adda";
import type { AddaLook } from "@/data/adda";

export type MemberStatus = "invited" | "joined";

export interface AddaMember {
  readonly personId: string;
  readonly status: MemberStatus;
  readonly invitedAt: number;
}

/** Someone invited you to their adda and you haven't answered yet. */
export interface AddaInvite {
  readonly ownerId: string;
  readonly at: number;
}

/** An adda you joined: who owns it, how it looks and who was in it when you joined. */
export interface JoinedAdda {
  readonly ownerId: string;
  readonly look: AddaLook;
  readonly memberIds: readonly string[];
}

/** Everything adda remembers for you in this browser (demo phase; the server owns it later). */
export interface AddaSave {
  readonly version: 1;
  readonly personId: string;
  /** Null until you build your adda. */
  readonly look: AddaLook | null;
  readonly members: readonly AddaMember[];
  /**
   * Demo people who said no. They keep showing as invited, so a "no" is never signalled
   * (the same rule as hidden waves).
   */
  readonly declined: readonly string[];
  readonly invites: readonly AddaInvite[];
  readonly joined: readonly JoinedAdda[];
  /** Owner whose tent is on the map; null shows yours. */
  readonly viewing: string | null;
}

const KEY = "coii:adda:v1";

export function emptyAdda(personId: string): AddaSave {
  return {
    version: 1,
    personId,
    look: null,
    members: [],
    declined: [],
    invites: [],
    joined: [],
    viewing: null,
  };
}

function isSave(value: unknown, personId: string): value is AddaSave {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  const lists = ["members", "declined", "invites", "joined"].every((k) => Array.isArray(v[k]));
  const look = v["look"] === null || isAddaLook(v["look"]);
  return v["version"] === 1 && v["personId"] === personId && lists && look;
}

/** Your saved adda, or a fresh one if none exists, it belongs to someone else, or storage fails. */
export function loadAdda(personId: string): AddaSave {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return isSave(parsed, personId) ? parsed : emptyAdda(personId);
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
