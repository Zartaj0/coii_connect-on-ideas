# Adda: your crews for Devcon

Status: demo built (client) · database built (`supabase/migrations/*_adda.sql`) · app wiring
waits on real sign-ups (TRACKER L2).

## Idea

Every joined person can build up to three **addas**: crews of people they want to meet at
Devcon (say, one for the ZK crowd and one for founders), each drawn as a tent on the map. You add
people you've waved at; when they say yes you have both agreed to meet. Tents grow as people
join, and you can put them anywhere outside the ring of booths.

## Rules

- **Up to three addas, up to 30 people each** (invited and joined together, owner not counted).
  Each has a name (≤ 24 characters, no links or @handles; empty means "Zara's adda", "Zara's
  adda 2", …), a tent style and a colour. The same person can be in more than one of your addas.
- **Wave first.** "Add to <adda>" appears on a profile only after you've waved at them. The
  50-waves-a-day limit also limits invites.
- **Drag and drop.** Drag someone's bean onto one of your tents. If you haven't waved at and
  added them yet, a centred popup says so, and **Wave + add** does both in one tap: their
  stand-in falls into the tent from above and the camera follows it (like joining coii).
  Someone already in that adda just gets a toast.
- **Invites show who they're from.** Unlike a wave, the invitee sees your name and the adda's
  name, and can say **Join** or **Not now**.
- **Join = chai.** Accepting waves back for free (no daily wave used), which makes a chai
  (contacts both ways, wave points). Chais made this way skip the big "Chai's on!" card; the
  adda celebrates with a toast and confetti in the tent.
- **"Not now" is never signalled.** The owner keeps seeing "waiting"; they can take the invite
  back.
- **Removing, leaving and taking a tent down are silent.**
- **People stay at their booths.** A tent shows a stand-in bean per member; tapping it opens the
  real person.

## On the map

- The world has a free band around the venue for tents. A tent can sit anywhere in it that is
  outside the ring of booths (their convex hull) and clear of every booth, the plaza, the gate
  and your other tents (`plotFits`).
- **Moving a tent:** drag it with the mouse, or long-press it and drag on a phone. Its ground
  ring turns green where it fits and red where it doesn't; let go on red and it springs back.
  Its crowd walks over to the new place. The place is saved per layout (landscape and portrait
  maps differ), as fractions of the world.
- New tents start beside the gate (right, then left), then around the ring. The default view
  frames the venue plus those first two plots.
- Three tent styles (Shamiana, Tambu, Chhatri) in six palette colours. The tent art steps up in
  size at 6 and 16 members; the ground ring widens with every member, plus one bunting flag per
  joined member.
- Waiting people stand still and see-through; joined people stroll and chat inside the plot and
  hop with confetti the moment they join.
- The map shows your tents plus, if you choose, one adda you joined ("Show on map").

## Screens

- **Profile:** with no adda yet, "Add to my adda" opens name + look and builds and invites in
  one go. Then one line per adda: Add to <adda> → Invited to <adda> · waiting → In <adda>.
- **Adda tab** (phone tab bar and desktop side panel): one card per adda (Share, On map, Edit,
  Take down, members with remove), New adda (n of 3), invites for you with Join / Not now, addas
  you're in with Show on map / Leave. The tab badge counts invites waiting for you.

## Sharing an adda

- **Share** on an adda (once someone said yes) opens a share card: a 1350 × 1350 PNG drawn in
  the browser with the same bean art as the map. Square, so X, LinkedIn and Telegram show it
  uncropped.
- On the card: you in the middle (marked "host"), everyone who said yes in a ring around you,
  each with their bean and full name. Faces shrink as the ring fills so all 30 fit. People still
  waiting, or who said no, are left out: they never agreed to be shown. No handles.
- Header in the adda's colour with its name and "N people meeting at Devcon 8 · Mumbai"; footer
  with the coii wordmark and `coii.decipherclub.com`.
- Text: "Check out my adda on coii 🎪 These are the people I'm meeting at Devcon 8, Mumbai:
  https://coii.decipherclub.com".
- Buttons:
  - **Share picture + text** (browsers that can share files, mainly phones): the system share
    sheet, so X, LinkedIn, Telegram, WhatsApp and the rest get the picture and the text in one
    go.
  - **Share on X / LinkedIn / Telegram**: opens the composer with the text filled in and puts
    the picture on the clipboard (or downloads it), with a toast to paste it in.
  - **Download picture** and **Copy text**.
- Why not attach the picture automatically from a link: none of the three accepts an image
  through its share link (X `intent/post` takes text, LinkedIn `shareActive` takes text,
  Telegram `share/url` takes a link and text). The only way a link alone shows the picture is
  for the link itself to carry it: a hosted page per adda with `og:image` set to its card. That
  needs storage and hosting (TRACKER L2 and L6).

## Demo behaviour

- Saved in this browser under `coii:adda:v1` (format 2; a format-1 save becomes your first
  adda).
- Demo people answer invites in 5–30 s; more shared topics make a yes likelier. A wave made
  while adding someone doesn't also schedule a separate demo wave-back.
- Up to two demo invites arrive per visit, the first 2.5–4.5 minutes in.

## Database

- `private.addas (id, owner_id, name, style, color, places)`, at most three per owner, and
  `private.adda_members (adda_id, member_id, status invited|joined|declined)`.
- RPCs: `create_adda`, `update_adda`, `delete_adda`, `move_adda`, `invite_to_adda`,
  `remove_from_adda`, `respond_to_adda_invite`, `leave_adda`, `get_adda_state`. Names are
  cleaned and checked like bean names (blocklist, no links or @handles). Invites check that the
  caller waved first, the other person is visible, nobody blocked anybody, and the adda has room.
- A declined invite reads as `invited` to the owner. Blocking removes adda rows both ways;
  addas are purged after the event with waves and chais.
- Realtime: `adda_invite` to the invitee, `adda_joined` to the owner, on the personal topic.
