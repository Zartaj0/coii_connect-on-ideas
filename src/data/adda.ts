import { containsLink } from "@/data/handles";
import { containsMention } from "@/data/oneLinerRules";

/**
 * Adda: your own crew for Devcon, drawn as a little tent on the map (spec: docs/prd/iteration_v2_feature.md).
 * Shared by the app, the engine and the UI.
 */

export const ADDA_STYLES = ["shamiana", "tambu", "chhatri"] as const;
export type AddaStyle = (typeof ADDA_STYLES)[number];

export const ADDA_STYLE_LABELS: Readonly<Record<AddaStyle, string>> = {
  shamiana: "Shamiana",
  tambu: "Tambu",
  chhatri: "Chhatri",
};

export interface AddaColor {
  readonly id: string;
  readonly label: string;
  readonly color: number;
  readonly css: string;
}

/** Six colours from the venue palette, so every tent sits well next to the booths. */
export const ADDA_COLORS: readonly AddaColor[] = [
  { id: "rani", label: "Rani pink", color: 0xff2e88, css: "#ff2e88" },
  { id: "marigold", label: "Marigold", color: 0xffb31a, css: "#ffb31a" },
  { id: "peacock", label: "Peacock", color: 0x0fa3a3, css: "#0fa3a3" },
  { id: "leaf", label: "Leaf", color: 0x2f9e5b, css: "#2f9e5b" },
  { id: "violet", label: "Violet", color: 0x7c4dff, css: "#7c4dff" },
  { id: "chai", label: "Chai", color: 0xb5651d, css: "#b5651d" },
];

export interface AddaLook {
  readonly style: AddaStyle;
  /** One of `ADDA_COLORS` ids. */
  readonly color: string;
}

export const DEFAULT_LOOK: AddaLook = { style: "shamiana", color: "rani" };

/** Most people in one adda, invited and joined together, owner not counted. */
export const ADDA_MAX = 30;

export function addaColor(id: string): AddaColor {
  return ADDA_COLORS.find((c) => c.id === id) ?? (ADDA_COLORS[0] as AddaColor);
}

export function isAddaLook(value: unknown): value is AddaLook {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    ADDA_STYLES.includes(v["style"] as AddaStyle) && ADDA_COLORS.some((c) => c.id === v["color"])
  );
}

/** The size the tent art is drawn at: small (1–5), medium (6–15) or large (16+ members). */
export function addaTier(members: number): 0 | 1 | 2 {
  if (members <= 5) return 0;
  return members <= 15 ? 1 : 2;
}

/** Most addas one person can run. */
export const ADDAS_MAX = 3;
export const ADDA_NAME_MAX = 24;

/** The map's two layouts; a tent remembers where it sits in each. */
export type PlotMode = "landscape" | "portrait";

/** A tent's place on the map as fractions of the world's width and height (0–1). */
export interface AddaSpot {
  readonly x: number;
  readonly y: number;
}

export type AddaPlaces = Partial<Readonly<Record<PlotMode, AddaSpot>>>;

/** A tidy adda name (spaces collapsed, ≤ 24 characters, no links or @handles), or null. */
export function cleanAddaName(raw: string): string | null {
  const name = raw.replaceAll(/\s+/g, " ").trim();
  if (name.length === 0 || name.length > ADDA_NAME_MAX) return null;
  return containsLink(name) || containsMention(name) ? null : name;
}

/** "Zara's adda", then "Zara's adda 2" and "Zara's adda 3". */
export function defaultAddaName(firstName: string, index: number): string {
  return index === 0 ? `${firstName}'s adda` : `${firstName}'s adda ${index + 1}`;
}

function inRange(n: unknown): boolean {
  return typeof n === "number" && n >= 0 && n <= 1;
}

export function isAddaSpot(value: unknown): value is AddaSpot {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return inRange(v["x"]) && inRange(v["y"]);
}
