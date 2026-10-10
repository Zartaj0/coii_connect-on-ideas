import type { AddaLook } from "@/data/adda";
import type { Person, TopicId } from "@/data/types";

export interface AddaMapMember {
  readonly person: Person;
  /** Invited but not joined yet: stands still and see-through in the tent. */
  readonly pending: boolean;
}

/** The adda tent drawn on the map: yours or one you joined. */
export interface AddaMapView {
  readonly ownerId: string;
  /** Sign text, e.g. "Riya's adda". */
  readonly label: string;
  readonly look: AddaLook;
  /** Everyone in the tent, the owner included. */
  readonly members: readonly AddaMapMember[];
}

export interface EngineEvents {
  /** A bean was tapped (person id) or the selection was cleared on the map (null). */
  select: (personId: string | null) => void;
  boothTap: (topic: TopicId) => void;
  /** The adda tent was tapped. */
  addaTap: () => void;
  ready: () => void;
}

export interface EngineStats {
  readonly fps: number;
  readonly frameMs: number;
  readonly simMs: number;
  readonly beans: number;
  readonly particles: number;
  readonly zoom: number;
}

/**
 * Everything the React UI may ask of the venue. The real engine renders with PixiJS; a fake
 * implementation backs UI tests.
 */
export interface EngineApi {
  /** People present when the venue opens. Must be called before the first `mount`. */
  setPeople(people: readonly Person[]): void;
  mount(el: HTMLElement): void;
  unmount(): void;
  spawn(person: Person, fromGate: boolean): void;
  remove(personId: string): void;
  select(personId: string | null): void;
  locate(personId: string): void;
  focusBooth(topic: TopicId): void;
  highlightTopics(topics: readonly TopicId[]): void;
  fit(): void;
  /** "My tribe": these people glow and everyone else dims; an empty list clears it. */
  highlightPeople(personIds: readonly string[]): void;
  /** Sparkles above today's picks, visible only to you. */
  setPicks(personIds: readonly string[]): void;
  /** Two people walk up to each other and clink chai cups ("Chai's on!"). */
  chaiMoment(aId: string, bId: string): void;
  /** Their bean waves back at you (feedback after you wave at them). */
  greet(personId: string): void;
  /** A "+1 👋" floats up from their bean when they earn a wave point (if on screen). */
  pointPop(personId: string): void;
  /** The wave-points leaders wear crowns on the map. */
  setCrowns(personIds: readonly string[]): void;
  /**
   * Draws this adda's tent with a stand-in bean per member (their real bean stays at its booth);
   * null clears the plot.
   */
  setAdda(view: AddaMapView | null): void;
  /** Flies the camera to the adda tent. */
  focusAdda(): void;
  /** Screen pixels at the top of the map covered by UI, so framing keeps content visible. */
  setInsets(top: number): void;
  pause(): void;
  resume(): void;
  setReducedMotion(reduced: boolean): void;
  stats(): EngineStats;
  on<K extends keyof EngineEvents>(event: K, listener: EngineEvents[K]): () => void;
}
