import type { MyAdda } from "@/adda/storage";
import type { InviteResult, WaveAndAddResult } from "@/app/adda";
import type { AddaView } from "@/app/store";
import { ADDA_MAX } from "@/data/adda";

export type AddaRelation = "none" | "invited" | "member";

/** Where someone stands with one of your addas. A "no" still reads as invited, on purpose. */
export function addaRelation(adda: MyAdda, personId: string): AddaRelation {
  const member = adda.members.find((m) => m.personId === personId);
  if (!member) return "none";
  return member.status === "joined" ? "member" : "invited";
}

export function addaFull(adda: MyAdda): boolean {
  return adda.members.length >= ADDA_MAX;
}

/** "3 people", you not counted. */
export function crewText(count: number): string {
  return count === 1 ? "1 person" : `${count} people`;
}

/** Joined and still-waiting counts for an adda. */
export function addaCounts(adda: MyAdda): { joined: number; waiting: number } {
  const joined = adda.members.filter((m) => m.status === "joined").length;
  return { joined, waiting: adda.members.length - joined };
}

/** Toast after adding someone, or null when the button already explains it. */
export function inviteToast(
  result: InviteResult | WaveAndAddResult,
  name: string,
  addaName: string,
): string | null {
  switch (result) {
    case "invited":
      return `Invited ${name} to ${addaName}! They'll see it's from you.`;
    case "full":
      return `${addaName} is full (${ADDA_MAX} people).`;
    case "needs_wave":
      return `Wave at ${name} first, then add them.`;
    case "quota":
      return "You've used today's waves. They refill at 06:00.";
    default:
      return null;
  }
}

/** Badge on the Adda tab: invites waiting for your answer. */
export function addaBadgeCount(adda: AddaView | null): number {
  return adda?.invites.length ?? 0;
}
