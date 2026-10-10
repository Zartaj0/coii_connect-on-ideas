import { describe, expect, it } from "vitest";

import { joinUrl, readJoinLink, withoutJoinLink } from "@/app/joinLink";

describe("join links", () => {
  it("builds the link, with a booth when one is picked", () => {
    expect(joinUrl()).toBe("https://coii.decipherclub.com/join");
    expect(joinUrl("defi")).toBe("https://coii.decipherclub.com/join/defi");
  });

  it("reads /join, /join/<topic> and ?join", () => {
    expect(readJoinLink("/join", "")).toEqual({ topic: null });
    expect(readJoinLink("/join/", "")).toEqual({ topic: null });
    expect(readJoinLink("/JOIN/DeFi", "")).toEqual({ topic: "defi" });
    expect(readJoinLink("/", "?join")).toEqual({ topic: null });
    expect(readJoinLink("/", "?still&join=privacy")).toEqual({ topic: "privacy" });
  });

  it("still opens the form for a booth it doesn't know", () => {
    expect(readJoinLink("/join/nope", "")).toEqual({ topic: null });
    expect(readJoinLink("/", "?join=nope")).toEqual({ topic: null });
  });

  it("ignores everything else", () => {
    expect(readJoinLink("/", "")).toBeNull();
    expect(readJoinLink("/joinery", "")).toBeNull();
    expect(readJoinLink("/", "?still")).toBeNull();
  });

  it("takes the link out of the address and keeps the rest", () => {
    expect(withoutJoinLink("/join/defi", "?still", "")).toBe("/?still");
    expect(withoutJoinLink("/", "?join=defi&debug", "#x")).toBe("/?debug#x");
    expect(withoutJoinLink("/join", "", "")).toBe("/");
  });
});
