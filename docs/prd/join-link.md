# Join link: a link anyone can pass around

Status: built (client) · Vercel rewrites in `vercel.json`.

## Idea

`https://coii.decipherclub.com/join` opens coii with the join form already up, over the live
venue. People share it in group chats, posts and DMs; whoever taps it is one form away from
being on the map.

## Rules

- **Addresses:** `/join`, `/join/<booth>` (for example `/join/defi`, which preselects DeFi),
  `?join` and `?join=<booth>`. Case doesn't matter; an unknown booth still opens the form.
- **Already joined in this browser:** the link opens your profile instead, with a toast
  "You're already on coii".
- **One shot:** the address is cleaned to `/` (other params kept) once the form opens, so a
  reload or a bookmark doesn't reopen it.
- **Hosting:** `/join` and `/join/:topic` rewrite to `index.html` on Vercel; the page carries
  the same og tags, so the link unfurls with the coii preview image.

## Invite screen

- **Invite friends**, in About and on your own profile, opens "Invite people to coii": the link
  with **Copy link**, a booth picker that changes the link to `/join/<booth>`, the system share
  sheet where the browser has one, and **Share on X / LinkedIn / Telegram / WhatsApp**.
- Text: "Join me on coii, the live map of who's into what at Devcon 8, Mumbai. Put your bean on
  it and let's meet:" plus the link.
- Adda share posts link to `/join` too.

## Code

- `src/app/joinLink.ts` (parse, build, clean), `controller.openJoinLink`, `src/main.tsx`.
- `src/ui/InviteOverlay.tsx`, `src/ui/shareLinks.ts` (composer links shared with the adda share).
