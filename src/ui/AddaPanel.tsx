import "@/ui/adda.css";
import { useId, useState } from "react";
import type { CSSProperties } from "react";

import type { AddaInvite, AddaMember, JoinedAdda } from "@/adda/storage";
import { useActions, useApp } from "@/app/context";
import type { AddaView } from "@/app/store";
import { addaColor, DEFAULT_LOOK } from "@/data/adda";
import type { Person } from "@/data/types";
import { addaCounts, crewText } from "@/ui/adda";
import { AddaLookPicker } from "@/ui/AddaLookPicker";
import { BeanAvatar } from "@/ui/BeanAvatar";
import { Glyph, Icon } from "@/ui/Icon";
import { firstName } from "@/ui/meet";
import { Awning, PanelNav } from "@/ui/PanelChrome";
import type { PanelChrome } from "@/ui/PanelChrome";
import { TentPreview } from "@/ui/TentPreview";

function usePerson(id: string): Person | null {
  return useApp((s) => s.people.find((p) => p.id === id) ?? null);
}

function Avatar({ person, size = 44 }: { readonly person: Person; readonly size?: number }) {
  return (
    <BeanAvatar
      className="adda-row__bean"
      avatar={person.avatar}
      topic={person.topics[0] ?? "ai"}
      size={size}
      face="happy"
    />
  );
}

/** Puts this tent on the map (null: yours), flies there and gets the panel out of the way. */
function useShowOnMap(): (ownerId: string | null) => void {
  const actions = useActions();
  return (ownerId) => {
    actions.viewAdda(ownerId);
    actions.closePanel();
  };
}

function AddaHeader({
  adda,
  chrome,
  titleId,
}: {
  readonly adda: AddaView | null;
  readonly chrome: PanelChrome;
  readonly titleId: string;
}) {
  const showOnMap = useShowOnMap();
  const color = addaColor(adda?.look?.color ?? DEFAULT_LOOK.color).css;
  const counts = adda?.look ? addaCounts(adda) : null;
  return (
    <header
      className="panel__head adda__band"
      style={{ "--adda": color } as CSSProperties}
      data-sheet-grab
    >
      <Awning color={color} />
      <PanelNav chrome={chrome} />
      <h2 id={titleId} className="adda__title">
        Your adda
      </h2>
      {counts ? (
        <div className="adda__stats">
          <p className="adda-stat">
            {crewText(counts.joined)} in · {counts.waiting} waiting
          </p>
          <button
            type="button"
            className="btn btn--secondary btn--small"
            onClick={() => showOnMap(null)}
          >
            <Glyph name="pin" size={18} />
            Show on map
          </button>
        </div>
      ) : (
        <p className="adda__blurb">Your crew for Devcon, in a tent by the gate.</p>
      )}
    </header>
  );
}

function LockedAdda() {
  const actions = useActions();
  return (
    <div className="adda-empty">
      <TentPreview kind="shamiana" color="var(--rani)" size={120} />
      <p className="adda-empty__title">Build your own adda</p>
      <p className="adda-empty__hint">
        Gather the people you want to meet at Devcon into one tent. When they say yes, you're both
        meeting there.
      </p>
      <button
        type="button"
        className="btn btn--primary btn--big"
        onClick={() => actions.startJoin(null)}
      >
        Join to build your adda
      </button>
    </div>
  );
}

function InviteRow({ invite }: { readonly invite: AddaInvite }) {
  const actions = useActions();
  const owner = usePerson(invite.ownerId);
  if (!owner) return null;
  const name = firstName(owner.name);
  return (
    <li className="adda-invite">
      <div className="adda-invite__who">
        <Avatar person={owner} />
        <p>
          <strong>{owner.name}</strong> wants you in their adda. Say yes and you're both meeting at
          Devcon (chai's on).
        </p>
      </div>
      <div className="adda-invite__actions">
        <button
          type="button"
          className="btn btn--wave"
          onClick={() => actions.acceptAddaInvite(owner.id)}
        >
          Join {name}'s adda
        </button>
        <button
          type="button"
          className="btn btn--quiet"
          onClick={() => actions.declineAddaInvite(owner.id)}
        >
          Not now
        </button>
      </div>
    </li>
  );
}

function Invites({ invites }: { readonly invites: readonly AddaInvite[] }) {
  const headingId = useId();
  if (invites.length === 0) return null;
  return (
    <section className="adda-section" aria-labelledby={headingId}>
      <h3 id={headingId} className="list-heading">
        Invites for you
      </h3>
      <ul className="adda-rows">
        {invites.map((invite) => (
          <InviteRow key={invite.ownerId} invite={invite} />
        ))}
      </ul>
      <p className="adda-note">Not now is private: they never find out.</p>
    </section>
  );
}

function ViewingBanner({ ownerId }: { readonly ownerId: string }) {
  const actions = useActions();
  const owner = usePerson(ownerId);
  if (!owner) return null;
  return (
    <p className="adda-viewing" role="status">
      <Icon id="circus_tent" size={24} />
      <span>The map shows {firstName(owner.name)}'s adda.</span>
      <button type="button" className="btn btn--quiet" onClick={() => actions.viewAdda(null)}>
        Show mine
      </button>
    </p>
  );
}

function MemberRow({ member }: { readonly member: AddaMember }) {
  const actions = useActions();
  const person = usePerson(member.personId);
  if (!person) return null;
  const joined = member.status === "joined";
  return (
    <li className="adda-member">
      <button type="button" className="adda-row" onClick={() => actions.locate(person.id)}>
        <Avatar person={person} />
        <span className="adda-row__name">{person.name}</span>
        <span className="adda-pill" data-status={member.status}>
          {joined ? "In" : "Waiting"}
          {joined ? <Glyph name="check" size={14} /> : null}
        </span>
      </button>
      <button
        type="button"
        className="nav-btn adda-member__remove"
        aria-label={`Remove ${person.name} from your adda`}
        onClick={() => actions.removeFromAdda(person.id)}
      >
        <Glyph name="close" size={16} />
      </button>
    </li>
  );
}

function Members({ members }: { readonly members: readonly AddaMember[] }) {
  const headingId = useId();
  const sorted = members.toSorted((a, b) =>
    a.status === b.status ? 0 : a.status === "joined" ? -1 : 1,
  );
  return (
    <section className="adda-section" aria-labelledby={headingId}>
      <h3 id={headingId} className="list-heading">
        In your tent
      </h3>
      {sorted.length === 0 ? (
        <p className="empty-note">
          Open someone's profile, wave, then tap <strong>Add to my adda</strong>. Waiting people
          stand see-through in your tent until they say yes.
        </p>
      ) : (
        <ul className="adda-rows">
          {sorted.map((m) => (
            <MemberRow key={m.personId} member={m} />
          ))}
        </ul>
      )}
    </section>
  );
}

function MyTent({ adda }: { readonly adda: AddaView }) {
  const actions = useActions();
  const [editing, setEditing] = useState(false);
  if (!adda.look) {
    return (
      <section className="adda-section adda-new">
        <p className="adda-empty__title">Build your adda</p>
        <p className="adda-empty__hint">
          Pick a tent. It goes up by the gate and grows as your people join.
        </p>
        <AddaLookPicker
          initial={DEFAULT_LOOK}
          submitLabel="Build my adda"
          onSubmit={actions.buildAdda}
        />
      </section>
    );
  }
  if (editing) {
    return (
      <section className="adda-section">
        <AddaLookPicker
          initial={adda.look}
          submitLabel="Save look"
          onSubmit={(look) => {
            actions.buildAdda(look);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </section>
    );
  }
  return (
    <div className="adda-tent">
      <TentPreview kind={adda.look.style} color={addaColor(adda.look.color).css} size={96} />
      <div className="adda-tent__actions">
        <ShareButton adda={adda} />
        <button
          type="button"
          className="btn btn--secondary btn--small"
          onClick={() => setEditing(true)}
        >
          Edit look
        </button>
      </div>
    </div>
  );
}

/** Opens the share card; it needs at least one person who said yes. */
function ShareButton({ adda }: { readonly adda: AddaView }) {
  const actions = useActions();
  const ready = addaCounts(adda).joined > 0;
  return (
    <>
      <button
        type="button"
        className="btn btn--wave btn--small"
        disabled={!ready}
        onClick={() => actions.openOverlay("share")}
      >
        <Icon id="circus_tent" size={20} />
        Share my adda
      </button>
      {ready ? null : <p className="adda-note">You can share once someone says yes.</p>}
    </>
  );
}

function JoinedRow({
  joined,
  viewing,
}: {
  readonly joined: JoinedAdda;
  readonly viewing: boolean;
}) {
  const actions = useActions();
  const showOnMap = useShowOnMap();
  const owner = usePerson(joined.ownerId);
  if (!owner) return null;
  return (
    <li className="adda-joined">
      <Avatar person={owner} />
      <span className="adda-row__name">
        {firstName(owner.name)}'s adda
        <small>{crewText(joined.memberIds.length + 2)}</small>
      </span>
      <button
        type="button"
        className="btn btn--secondary btn--small"
        aria-pressed={viewing}
        onClick={() => showOnMap(owner.id)}
      >
        {viewing ? "On the map" : "Show on map"}
      </button>
      <button type="button" className="btn btn--quiet" onClick={() => actions.leaveAdda(owner.id)}>
        Leave
      </button>
    </li>
  );
}

function JoinedAddas({ adda }: { readonly adda: AddaView }) {
  const headingId = useId();
  if (adda.joined.length === 0) return null;
  return (
    <section className="adda-section" aria-labelledby={headingId}>
      <h3 id={headingId} className="list-heading">
        Addas you're in
      </h3>
      <ul className="adda-rows">
        {adda.joined.map((j) => (
          <JoinedRow key={j.ownerId} joined={j} viewing={adda.viewing === j.ownerId} />
        ))}
      </ul>
    </section>
  );
}

function AddaBody({ adda }: { readonly adda: AddaView }) {
  return (
    <>
      <Invites invites={adda.invites} />
      {adda.viewing ? <ViewingBanner ownerId={adda.viewing} /> : null}
      <MyTent adda={adda} />
      {adda.look ? <Members members={adda.members} /> : null}
      <JoinedAddas adda={adda} />
      <p className="adda-note">
        <Icon id="shield" size={18} />
        Your people stay at their booths too; the tent shows your crew in one place.
      </p>
    </>
  );
}

/** Adda tab: your tent and crew, invites for you, and other addas you're in. */
export function AddaPanel({ chrome }: { readonly chrome: PanelChrome }) {
  const adda = useApp((s) => s.adda);
  const titleId = useId();
  return (
    <section className="panel adda" aria-labelledby={titleId}>
      <AddaHeader adda={adda} chrome={chrome} titleId={titleId} />
      <div className="panel__scroll adda__body">
        {adda ? <AddaBody adda={adda} /> : <LockedAdda />}
      </div>
    </section>
  );
}
