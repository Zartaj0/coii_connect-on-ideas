import type { AddaView } from "@/app/store";
import type { Avatar, Person, TopicId } from "@/data/types";

/** Where people land from a shared card. */
export const SHARE_URL = "https://coii.decipherclub.com";

/** One face on the share card. */
export interface CardFace {
  readonly name: string;
  readonly avatar: Avatar;
  readonly topic: TopicId;
  /** The person sharing: shown first, with a "host" tag. */
  readonly host: boolean;
}

/**
 * Who goes on the card: you, then everyone who said yes, in the order they joined the list.
 * Invitees who haven't answered (or said no) are left out: they never agreed to be shown.
 */
export function cardFaces(you: Person, adda: AddaView, people: readonly Person[]): CardFace[] {
  const byId = new Map(people.map((p) => [p.id, p]));
  const joined = adda.members
    .filter((m) => m.status === "joined")
    .flatMap((m) => {
      const person = byId.get(m.personId);
      return person ? [person] : [];
    });
  return [you, ...joined].map((p, i) => ({
    name: p.name,
    avatar: p.avatar,
    topic: p.topics[0] ?? "ai",
    host: i === 0,
  }));
}

export interface Grid {
  readonly cols: number;
  readonly rows: number;
  /** Width of one cell; a cell is `CELL_ASPECT` times as tall, for the face and the name. */
  readonly cell: number;
}

/** Height of a cell over its width: a round face with a name under it. */
export const CELL_ASPECT = 1.3;
/** Faces never get bigger than this, so a small adda doesn't look blown up. */
const MAX_CELL = 260;

/** The column count that gives the biggest faces for `count` people in a `width` × `height` box. */
export function cardGrid(count: number, width: number, height: number): Grid {
  let best: Grid = { cols: 1, rows: Math.max(1, count), cell: 0 };
  for (let cols = 1; cols <= Math.max(1, count); cols++) {
    const rows = Math.ceil(count / cols);
    const cell = Math.min(width / cols, height / (rows * CELL_ASPECT), MAX_CELL);
    if (cell > best.cell) best = { cols, rows, cell };
  }
  return best;
}

function firstName(name: string): string {
  return name.split(" ")[0] ?? name;
}

/** "Riya", "Riya and Arjun", "Riya, Arjun and Mei", "Riya, Arjun, Mei and 4 more". */
export function namesText(names: readonly string[]): string {
  const firsts = names.map(firstName);
  if (firsts.length <= 1) return firsts[0] ?? "";
  if (firsts.length <= 3) return `${firsts.slice(0, -1).join(", ")} and ${firsts.at(-1)}`;
  return `${firsts.slice(0, 3).join(", ")} and ${firsts.length - 3} more`;
}

/** The post text that goes with the image. */
export function shareCaption(faces: readonly CardFace[]): string {
  const crew = faces.filter((f) => !f.host).map((f) => f.name);
  const who = crew.length > 0 ? ` Meeting ${namesText(crew)} in Mumbai.` : "";
  return `My adda for Devcon 8 🎪${who} Build yours on coii: ${SHARE_URL}`;
}

export function shareTitle(faces: readonly CardFace[]): string {
  const host = faces.find((f) => f.host);
  return host ? `${firstName(host.name)}'s adda` : "My adda";
}

export function xIntentUrl(caption: string): string {
  return `https://x.com/intent/post?text=${encodeURIComponent(caption)}`;
}

export function linkedInShareUrl(): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SHARE_URL)}`;
}

/** File name for the downloaded card, e.g. "zaras-adda-coii.png". */
export function cardFileName(faces: readonly CardFace[]): string {
  const slug = shareTitle(faces)
    .toLowerCase()
    .replaceAll("'", "")
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "");
  return `${slug || "my-adda"}-coii.png`;
}
