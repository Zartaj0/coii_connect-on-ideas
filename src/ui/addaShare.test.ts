import { describe, expect, it } from "vitest";

import type { MyAdda } from "@/adda/storage";
import type { Person } from "@/data/types";
import {
  CELL_ASPECT,
  cardFaces,
  cellsOverlap,
  cardFileName,
  linkedInShareUrl,
  namesText,
  ringLayout,
  shareCaption,
  telegramShareUrl,
  xIntentUrl,
} from "@/ui/addaShare";

function person(id: string, name: string): Person {
  return {
    id,
    name,
    telegram: null,
    x: null,
    topics: ["ai"],
    intent: [],
    oneLiners: [],
    avatar: { skin: 0, hair: 0, hairColor: 0, accessory: 0 },
    telegramVerified: false,
    ticketVerified: false,
    isDemo: true,
    isYou: false,
    origin: null,
    joinedAt: 0,
  };
}

const YOU = { ...person("me", "Zara Khan"), isYou: true };
const PEOPLE = [person("a", "Riya Verma"), person("b", "Arjun Rao"), person("c", "Mei Lin")];
const ADDA: MyAdda = {
  id: "x",
  name: "Rust crew",
  look: { style: "tambu", color: "leaf" },
  members: [
    { personId: "a", status: "joined", invitedAt: 0 },
    { personId: "b", status: "invited", invitedAt: 0 },
    { personId: "c", status: "joined", invitedAt: 0 },
  ],
  declined: [],
  places: {},
};
const BOX = { x: 50, y: 190, w: 1250, h: 1060 };
const overlaps = cellsOverlap;

describe("adda share card", () => {
  it("shows you first as host, then only the people who said yes", () => {
    const faces = cardFaces(YOU, ADDA, PEOPLE);
    expect(faces.map((f) => [f.name, f.host])).toEqual([
      ["Zara Khan", true],
      ["Riya Verma", false],
      ["Mei Lin", false],
    ]);
  });

  it("puts the host in the middle and the crew in a ring, shrinking faces as it grows", () => {
    for (let n = 1; n <= 30; n++) {
      const { host, crew } = ringLayout(n, BOX);
      expect(crew).toHaveLength(n);
      expect(host.x).toBe(BOX.x + BOX.w / 2);
      for (const c of crew) {
        expect(c.x - c.cell / 2).toBeGreaterThanOrEqual(BOX.x - 0.01);
        expect(c.x + c.cell / 2).toBeLessThanOrEqual(BOX.x + BOX.w + 0.01);
        expect(c.y - (c.cell * CELL_ASPECT) / 2).toBeGreaterThanOrEqual(BOX.y - 0.01);
        expect(c.y + (c.cell * CELL_ASPECT) / 2).toBeLessThanOrEqual(BOX.y + BOX.h + 0.01);
        expect(overlaps(c, host)).toBe(false);
      }
      for (let i = 0; i < crew.length; i++) {
        for (let j = i + 1; j < crew.length; j++) expect(overlaps(crew[i]!, crew[j]!)).toBe(false);
      }
    }
    expect(ringLayout(30, BOX).crew[0]!.cell).toBeLessThan(ringLayout(3, BOX).crew[0]!.cell);
  });

  it("shares the same text everywhere, with the link", () => {
    expect(shareCaption()).toBe(
      "Check out my adda on coii 🎪 These are the people I'm meeting at Devcon 8, Mumbai: https://coii.decipherclub.com",
    );
    expect(xIntentUrl()).toContain("x.com/intent/post?text=");
    expect(linkedInShareUrl()).toContain("linkedin.com/feed/?shareActive=true&text=");
    expect(telegramShareUrl()).toContain("t.me/share/url?url=https%3A%2F%2Fcoii.decipherclub.com");
    expect(namesText(["Riya Verma", "Mei Lin"])).toBe("Riya and Mei");
    expect(namesText(["A x", "B y", "C z", "D w", "E v"])).toBe("A, B, C and 2 more");
  });

  it("names the downloaded file after the adda", () => {
    expect(cardFileName("Zara's adda")).toBe("zaras-adda-coii.png");
    expect(cardFileName("Rust crew")).toBe("rust-crew-coii.png");
  });
});
