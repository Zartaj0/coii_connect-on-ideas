import type { InviteResult } from "@/app/adda";
import type { AddaView } from "@/app/store";
import { ADDA_MAX } from "@/data/adda";

export type AddaRelation = "none" | "invited" | "member";

/** Where someone stands with your adda. A "no" still reads as invited, on purpose. */
export function addaRelation(adda: AddaView | null, personId: string): AddaRelation {
  const member = adda?.members.find((m) => m.personId === personId);
  if (!member) return "none";
  return member.status === "joined" ? "member" : "invited";
}

export function addaFull(adda: AddaView | null): boolean {
  return (adda?.members.length ?? 0) >= ADDA_MAX;
}

/** "3 people" in your adda, you not counted. */
export function crewText(count: number): string {
  return count === 1 ? "1 person" : `${count} people`;
}

/** Joined and still-waiting counts for the panel header. */
export function addaCounts(adda: AddaView): { joined: number; waiting: number } {
  const joined = adda.members.filter((m) => m.status === "joined").length;
  return { joined, waiting: adda.members.length - joined };
}

/** Toast after tapping "Add to my adda", or null when the button already explains it. */
export function inviteToast(result: InviteResult, name: string): string | null {
  switch (result) {
    case "invited":
      return `Invited ${name}! They'll see it's from you.`;
    case "full":
      return `Your adda is full (${ADDA_MAX} people).`;
    case "needs_wave":
      return `Wave at ${name} first, then add them.`;
    default:
      return null;
  }
}

/** Badge on the Adda tab: invites waiting for your answer. */
export function addaBadgeCount(adda: AddaView | null): number {
  return adda?.invites.length ?? 0;
}
