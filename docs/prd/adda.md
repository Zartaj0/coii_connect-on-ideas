# Adda: your crew for Devcon

Status: demo built (client) · database built (`supabase/migrations/*_adda.sql`) · app wiring
waits on real sign-ups (TRACKER L2).

## Idea

Every joined person can build one **adda**, their own crew of people they want to meet at Devcon,
drawn as a tent by the gate. You add people you've waved at; when they say yes you have both
agreed to meet. The tent grows as people join.

## Rules

- **Wave first.** "Add to my adda" appears on a profile only after you've waved at them. The
  50-waves-a-day limit also limits invites.
- **One adda each, up to 30 people** (invited and joined together, owner not counted).
- **Invites show who they're from.** Unlike a wave, the invitee sees your name and can say
  **Join** or **Not now**.
- **Join = chai.** Accepting waves back for free (no daily wave used), which makes a chai
  (contacts both ways, wave points). Chais made this way skip the big "Chai's on!" card; the
  adda celebrates with a toast and confetti in the tent.
- **"Not now" is never signalled.** The owner keeps seeing "waiting"; they can take the invite back.
- **Removing and leaving are silent**, one tap.
- **People stay at their booths.** The tent shows a stand-in bean per member; tapping it opens
  the real person.

## On the map

- A fixed plot right of the gate (`layout.addaIndex`), sized for 31 people, nudged down until it
  clears every booth and the plaza.
- Three tent styles (Shamiana, Tambu, Chhatri) in six palette colours. The tent art steps up in
  size at 6 and 16 members; the ground ring widens with every member, plus one bunting flag per
  joined member.
- Waiting people stand still and see-through; joined people stroll and chat inside the plot and
  hop with confetti the moment they join.
- The map shows one tent: yours, or an adda you joined ("Show on map" switches it).

## Screens

- **Profile:** Add to my adda → (first time: pick a look, build and invite in one go) →
  Invited · waiting → In your adda.
- **Adda tab** (phone tab bar and desktop side panel): your tent and look editor, members with
  remove, invites for you with Join / Not now, addas you're in with Show on map / Leave. The tab
  badge counts invites waiting for you.

## Demo behaviour

- Saved in this browser under `coii:adda:v1`.
- Demo people answer invites in 5–30 s; more shared topics make a yes likelier.
- Up to two demo invites arrive per visit, the first 2.5–4.5 minutes in.

## Database

- `private.addas (owner_id, style, color)` and `private.adda_members (owner_id, member_id,
status invited|joined|declined)`.
- RPCs: `save_adda`, `invite_to_adda`, `remove_from_adda`, `respond_to_adda_invite`, `leave_adda`,
  `get_adda_state`. Each checks that the caller waved first, the other person is visible, nobody
  blocked anybody, and the adda has room.
- A declined invite reads as `invited` to the owner. Blocking removes adda rows both ways.
- Realtime: `adda_invite` to the invitee, `adda_joined` to the owner, on the personal topic.
