import { describe, expect, it } from "vitest";

import type { AddaView } from "@/app/store";
import { addaBadgeCount, addaCounts, addaFull, addaRelation, inviteToast } from "@/ui/adda";

const VIEW: AddaView = {
  look: { style: "tambu", color: "leaf" },
  members: [
    { personId: "a", status: "joined", invitedAt: 0 },
    { personId: "b", status: "invited", invitedAt: 0 },
  ],
  invites: [{ ownerId: "c", at: 0 }],
  joined: [],
  viewing: null,
};

describe("adda UI helpers", () => {
  it("knows who is in, who is waiting and who is not invited", () => {
    expect(addaRelation(VIEW, "a")).toBe("member");
    expect(addaRelation(VIEW, "b")).toBe("invited");
    expect(addaRelation(VIEW, "z")).toBe("none");
    expect(addaRelation(null, "a")).toBe("none");
  });

  it("counts joined and waiting people, and invites for the badge", () => {
    expect(addaCounts(VIEW)).toEqual({ joined: 1, waiting: 1 });
    expect(addaBadgeCount(VIEW)).toBe(1);
    expect(addaBadgeCount(null)).toBe(0);
    expect(addaFull(VIEW)).toBe(false);
  });

  it("tells you an invite shows who sent it", () => {
    expect(inviteToast("invited", "Riya")).toContain("from you");
    expect(inviteToast("already", "Riya")).toBeNull();
  });
});
