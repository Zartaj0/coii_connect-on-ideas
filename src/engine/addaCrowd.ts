import type { Person } from "@/data/types";
import { addaSpotLimit } from "@/engine/addaTent";
import type { AddaMapMember, AddaMapView } from "@/engine/types";
import type { World } from "@/sim/world";

/** What the engine does to put a stand-in bean on the map or take it off. */
export interface StandInHost {
  spawnStandIn(person: Person, zone: number): number;
  removeStandIn(index: number): void;
}

/**
 * Keeps one stand-in bean per adda member inside the tent plot, in sync with the view. The
 * person's real bean stays at their booth; the stand-in only mirrors their look.
 */
export class AddaStandIns {
  private readonly byPerson = new Map<string, number>();

  constructor(
    private readonly world: World,
    private readonly zone: number,
    private readonly host: StandInHost,
  ) {}

  /** Applies the view; returns the stand-ins of people who just went from invited to joined. */
  apply(view: AddaMapView | null): number[] {
    const members = view?.members ?? [];
    this.removeMissing(new Set(members.map((m) => m.person.id)));
    this.world.setSpotLimit(this.zone, addaSpotLimit(members.length));
    return members
      .filter((m) => this.sync(m))
      .map((m) => this.byPerson.get(m.person.id) ?? -1)
      .filter((index) => index >= 0);
  }

  private removeMissing(wanted: ReadonlySet<string>): void {
    for (const [id, index] of this.byPerson) {
      if (wanted.has(id)) continue;
      this.host.removeStandIn(index);
      this.byPerson.delete(id);
    }
  }

  /** Puts the member's stand-in in place; true when they just went from invited to joined. */
  private sync(member: AddaMapMember): boolean {
    const existing = this.byPerson.get(member.person.id);
    const index = existing ?? this.host.spawnStandIn(member.person, this.zone);
    this.byPerson.set(member.person.id, index);
    const justJoined = existing !== undefined && this.world.agent(index).frozen && !member.pending;
    this.world.setFrozen(index, member.pending);
    return justJoined;
  }

  /** Stand-in index for a person, if they are in the tent. */
  indexOf(personId: string): number | undefined {
    return this.byPerson.get(personId);
  }
}
