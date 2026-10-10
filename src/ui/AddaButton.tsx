import "@/ui/adda.css";
import { useState } from "react";

import { useActions, useApp } from "@/app/context";
import { DEFAULT_LOOK } from "@/data/adda";
import type { AddaLook } from "@/data/adda";
import type { Person } from "@/data/types";
import { addaFull, addaRelation, inviteToast } from "@/ui/adda";
import { AddaLookPicker } from "@/ui/AddaLookPicker";
import { Glyph, Icon } from "@/ui/Icon";
import { firstName } from "@/ui/meet";

type AddaStatus = "hidden" | "build" | "add" | "full" | "invited" | "member";

/** What the profile shows for someone and your adda; nothing until you've waved at them. */
function useAddaStatus(personId: string): AddaStatus {
  return useApp((s) => {
    const { adda, meet } = s;
    if (!adda || !meet?.waved.includes(personId)) return "hidden";
    const relation = addaRelation(adda, personId);
    if (relation !== "none") return relation;
    if (!adda.look) return "build";
    return addaFull(adda) ? "full" : "add";
  });
}

function useInvite(person: Person): () => void {
  const actions = useActions();
  return () => {
    const text = inviteToast(actions.inviteToAdda(person.id), firstName(person.name));
    if (text) actions.pushToast(text, "circus_tent", "success");
  };
}

/** First invite with no adda yet: pick a look, build it and invite in one go. */
function BuildAndInvite({ person }: { readonly person: Person }) {
  const actions = useActions();
  const invite = useInvite(person);
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" className="btn btn--adda" onClick={() => setOpen(true)}>
        <Icon id="circus_tent" size={22} />
        Add to my adda
      </button>
    );
  }
  const build = (look: AddaLook): void => {
    actions.buildAdda(look);
    invite();
    setOpen(false);
  };
  return (
    <div className="adda-build">
      <p className="adda-build__title">Build your adda first</p>
      <p className="adda-build__hint">
        Your crew's tent by the gate. Pick a look; it grows as people join.
      </p>
      <AddaLookPicker
        initial={DEFAULT_LOOK}
        submitLabel={`Build it and add ${firstName(person.name)}`}
        onSubmit={build}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}

/**
 * After a wave: add them to your adda. Moves through Add → Invited (waiting) → In your adda.
 * The invite tells them who it's from, unlike a wave.
 */
export function AddaButton({ person }: { readonly person: Person }) {
  const status = useAddaStatus(person.id);
  const invite = useInvite(person);
  const name = firstName(person.name);
  switch (status) {
    case "hidden":
      return null;
    case "build":
      return <BuildAndInvite person={person} />;
    case "add":
      return (
        <button type="button" className="btn btn--adda" onClick={invite}>
          <Icon id="circus_tent" size={22} />
          Add to my adda
        </button>
      );
    case "full":
      return <p className="adda-status">Your adda is full. Remove someone to add {name}.</p>;
    case "invited":
      return (
        <p className="adda-status" role="status">
          <Icon id="circus_tent" size={22} />
          <span>Invited to your adda · waiting for {name}</span>
        </p>
      );
    case "member":
      return (
        <p className="adda-status adda-status--in" role="status">
          <Glyph name="check" size={18} />
          <span>In your adda. You're meeting at Devcon.</span>
        </p>
      );
  }
}
