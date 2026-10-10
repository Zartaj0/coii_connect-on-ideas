import { ADDA_COLORS, ADDA_STYLES } from "@/data/adda";
import type { AddaLook } from "@/data/adda";
import type { Person } from "@/data/types";
import { topicOverlap } from "@/match/score";

export interface DemoAnswer {
  readonly joins: boolean;
  readonly delayMs: number;
}

/**
 * Demo people answer adda invites so the tent fills up before real sign-ups. More shared topics
 * make a yes likelier. Never used for real people.
 */
export function demoAnswer(owner: Person, invitee: Person, random: () => number): DemoAnswer {
  const chance = Math.min(0.9, 0.5 + 0.15 * topicOverlap(owner, invitee));
  return { joins: random() < chance, delayMs: 5000 + random() * 25_000 };
}

/** A demo person sharing a topic with you who has no adda link with you yet, or null. */
export function demoInviter(
  you: Person,
  people: readonly Person[],
  exclude: ReadonlySet<string>,
  random: () => number,
): Person | null {
  const candidates = people.filter(
    (p) => p.isDemo && !exclude.has(p.id) && topicOverlap(you, p) > 0,
  );
  return candidates[Math.floor(random() * candidates.length)] ?? null;
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** A demo owner's tent always looks the same: picked from their id. */
export function demoLook(ownerId: string): AddaLook {
  const h = hash(ownerId);
  const style = ADDA_STYLES[h % ADDA_STYLES.length] ?? "shamiana";
  const color = ADDA_COLORS[(h >>> 4) % ADDA_COLORS.length]?.id ?? "rani";
  return { style, color };
}

/** A demo owner's crew: a few demo people who share their first topic. */
export function demoCrew(owner: Person, people: readonly Person[], youId: string): string[] {
  const topic = owner.topics[0];
  const h = hash(owner.id);
  const size = 3 + (h % 6);
  return people
    .filter((p) => p.isDemo && p.id !== owner.id && p.id !== youId)
    .filter((p) => topic !== undefined && p.topics.includes(topic))
    .slice(h % 7, (h % 7) + size)
    .map((p) => p.id);
}
