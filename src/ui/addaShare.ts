import type { MyAdda } from "@/adda/storage";
import { joinUrl, SITE_URL } from "@/app/joinLink";
import type { Avatar, Person, TopicId } from "@/data/types";
import { linkedInPostUrl, telegramPostUrl, xPostUrl } from "@/ui/shareLinks";

/** The address printed on the card. */
export const SHARE_URL = SITE_URL;

/** Where people land from a shared adda: straight into the join form. */
export const SHARE_LINK = joinUrl();

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
export function cardFaces(you: Person, adda: MyAdda, people: readonly Person[]): CardFace[] {
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

/** Height of a face cell over its width: a round face with a name under it. */
export const CELL_ASPECT = 1.3;

export interface Box {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface Placed {
  /** Centre of the face cell. */
  readonly x: number;
  readonly y: number;
  /** Cell width; the cell is `CELL_ASPECT` times as tall. */
  readonly cell: number;
}

export interface RingLayout {
  readonly host: Placed;
  readonly crew: readonly Placed[];
}

const MAX_CELL = 230;
const MIN_CELL = 56;

/** The host's face: a bit bigger than the crew's, within sensible bounds. */
function hostCell(cell: number): number {
  return Math.min(MAX_CELL * 1.1, Math.max(cell * 1.25, 220));
}

/** `count` angles that split the ellipse into equal arcs, the first at `start`. */
function evenAngles(count: number, a: number, b: number, start: number): number[] {
  const steps = 720;
  const lengths: number[] = [0];
  for (let i = 1; i <= steps; i++) {
    const t0 = start + ((i - 1) / steps) * Math.PI * 2;
    const t1 = start + (i / steps) * Math.PI * 2;
    const seg = Math.hypot(a * (Math.cos(t1) - Math.cos(t0)), b * (Math.sin(t1) - Math.sin(t0)));
    lengths.push((lengths[i - 1] ?? 0) + seg);
  }
  const total = lengths[steps] ?? 1;
  return Array.from({ length: count }, (_, k) => {
    const target = (k / count) * total;
    const i = lengths.findIndex((l) => l >= target);
    return start + (Math.max(0, i) / steps) * Math.PI * 2;
  });
}

/** Two face cells (face plus name) would touch. */
export function cellsOverlap(p: Placed, q: Placed): boolean {
  const w = (p.cell + q.cell) / 2;
  return Math.abs(p.x - q.x) < w && Math.abs(p.y - q.y) < w * CELL_ASPECT;
}

function ringAt(count: number, box: Box, cell: number): RingLayout {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const a = box.w / 2 - cell / 2;
  const b = box.h / 2 - (cell * CELL_ASPECT) / 2;
  const start = count <= 2 ? Math.PI : -Math.PI / 2;
  const crew = evenAngles(count, a, b, start).map((angle) => ({
    x: cx + Math.cos(angle) * a,
    y: cy + Math.sin(angle) * b,
    cell,
  }));
  return { host: { x: cx, y: cy, cell: hostCell(cell) }, crew };
}

function fits(ring: RingLayout): boolean {
  const { host, crew } = ring;
  if (crew.some((c) => cellsOverlap(c, host))) return false;
  return crew.every((c, i) => crew.every((d, j) => j <= i || !cellsOverlap(c, d)));
}

/**
 * The host in the middle of the box and the crew evenly around an ellipse, as big as fits:
 * faces shrink as the crew grows. One or two people sit left and right; more start at the top.
 */
export function ringLayout(count: number, box: Box): RingLayout {
  for (let cell = MAX_CELL; cell > MIN_CELL; cell -= 2) {
    const ring = ringAt(count, box, cell);
    if (fits(ring)) return ring;
  }
  return ringAt(count, box, MIN_CELL);
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

/** The post text, without the link (Telegram takes the link separately). */
export const SHARE_TEXT =
  "Check out my adda on coii 🎪 These are the people I'm meeting at Devcon 8, Mumbai:";

/** The post text that goes with the image. */
export function shareCaption(): string {
  return `${SHARE_TEXT} ${SHARE_LINK}`;
}

export function xIntentUrl(): string {
  return xPostUrl(SHARE_TEXT, SHARE_LINK);
}

export function linkedInShareUrl(): string {
  return linkedInPostUrl(SHARE_TEXT, SHARE_LINK);
}

export function telegramShareUrl(): string {
  return telegramPostUrl(SHARE_TEXT, SHARE_LINK);
}

/** File name for the downloaded card, e.g. "rust-crew-coii.png". */
export function cardFileName(title: string): string {
  const slug = title
    .toLowerCase()
    .replaceAll("'", "")
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "");
  return `${slug || "my-adda"}-coii.png`;
}
