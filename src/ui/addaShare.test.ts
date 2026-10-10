import { describe, expect, it } from "vitest";

import type { AddaView } from "@/app/store";
import type { Person } from "@/data/types";
import {
  CELL_ASPECT,
  cardFaces,
  cardFileName,
  cardGrid,
  namesText,
  shareCaption,
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
const ADDA: AddaView = {
  look: { style: "tambu", color: "leaf" },
  members: [
    { personId: "a", status: "joined", invitedAt: 0 },
    { personId: "b", status: "invited", invitedAt: 0 },
    { personId: "c", status: "joined", invitedAt: 0 },
  ],
  invites: [],
  joined: [],
  viewing: null,
};

describe("adda share card", () => {
  it("shows you first as host, then only the people who said yes", () => {
    const faces = cardFaces(YOU, ADDA, PEOPLE);
    expect(faces.map((f) => [f.name, f.host])).toEqual([
      ["Zara Khan", true],
      ["Riya Verma", false],
      ["Mei Lin", false],
    ]);
  });

  it("fits any crew from 1 to 31 inside the grid area", () => {
    for (let n = 1; n <= 31; n++) {
      const { cols, rows, cell } = cardGrid(n, 1460, 560);
      expect(cols * rows).toBeGreaterThanOrEqual(n);
      expect(cols * cell).toBeLessThanOrEqual(1460 + 0.01);
      expect(rows * cell * CELL_ASPECT).toBeLessThanOrEqual(560 + 0.01);
      expect(cell).toBeGreaterThan(70);
    }
  });

  it("names the crew in the caption and links to coii", () => {
    expect(namesText(["Riya Verma"])).toBe("Riya");
    expect(namesText(["Riya Verma", "Mei Lin"])).toBe("Riya and Mei");
    expect(namesText(["A x", "B y", "C z", "D w", "E v"])).toBe("A, B, C and 2 more");
    const caption = shareCaption(cardFaces(YOU, ADDA, PEOPLE));
    expect(caption).toBe(
      "My adda for Devcon 8 🎪 Meeting Riya and Mei in Mumbai. Build yours on coii: https://coii.decipherclub.com",
    );
    expect(xIntentUrl(caption)).toContain(encodeURIComponent("Meeting Riya and Mei"));
  });

  it("names the downloaded file after the adda", () => {
    expect(cardFileName(cardFaces(YOU, ADDA, PEOPLE))).toBe("zaras-adda-coii.png");
  });
});
