import { describe, expect, it } from "vitest";

import type { MyAdda } from "@/adda/storage";
import type { AddaView } from "@/app/store";
import { addaBadgeCount, addaCounts, addaFull, addaRelation, inviteToast } from "@/ui/adda";

const ADDA: MyAdda = {
  id: "x",
  name: "Rust crew",
  look: { style: "tambu", color: "leaf" },
  members: [
    { personId: "a", status: "joined", invitedAt: 0 },
    { personId: "b", status: "invited", invitedAt: 0 },
  ],
  declined: [],
  places: {},
};
const VIEW: AddaView = {
  addas: [ADDA],
  invites: [{ ownerId: "c", addaId: "y", name: "C's adda", at: 0 }],
  joined: [],
  viewing: null,
};

describe("adda UI helpers", () => {
  it("knows who is in, who is waiting and who is not invited", () => {
    expect(addaRelation(ADDA, "a")).toBe("member");
    expect(addaRelation(ADDA, "b")).toBe("invited");
    expect(addaRelation(ADDA, "z")).toBe("none");
  });

  it("counts joined and waiting people, and invites for the badge", () => {
    expect(addaCounts(ADDA)).toEqual({ joined: 1, waiting: 1 });
    expect(addaBadgeCount(VIEW)).toBe(1);
    expect(addaBadgeCount(null)).toBe(0);
    expect(addaFull(ADDA)).toBe(false);
  });

  it("tells you an invite shows who sent it, and which adda", () => {
    expect(inviteToast("invited", "Riya", "Rust crew")).toBe(
      "Invited Riya to Rust crew! They'll see it's from you.",
    );
    expect(inviteToast("already", "Riya", "Rust crew")).toBeNull();
  });
});
