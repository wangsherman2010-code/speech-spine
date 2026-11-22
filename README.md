# Speech Spine

A visual planner for speeches. Lay out the opening, the body acts and the closing on a wall, see the speech arc (energy over running time) as a graph, tie the parts together with Out and In transition lines, and add slides, props, a script and stage notes once the structure settles.

It is an installable web app (PWA) that works offline on a PC or phone.

## What is in a plan

- **Header:** title, central idea, a general purpose (inform, persuade, entertain or inspire), specific purpose statement, speaker, audience, occasion / venue, and target length in minutes.
- **Structure:** Opening → Body (Act 1, Act 2, Act 3, add or remove acts) → Closing. Opening and Closing hold cards directly. Each act holds segments (columns) and each segment holds cards.
- **Transitions:** a narrow card between each pair of adjacent parts with an **Out** line (closes the part before) and an **In** line (opens the next part), each with an optional length that counts toward running time and shows as a diamond on the arc. They are created automatically.
- **Cards (beats):** title, what I say, length, energy 1–10, why it's here, notes. With the **delivery layer** on: slides / visuals, props and media, script (word count and speaking time at 130 words per minute, with a warning when it runs longer than the card), and stage notes.
- **Lengths:** a plain number means seconds. `m:ss` and `h:mm:ss` also work.

## Where your plans live

- **On each device:** every plan is kept in the app's local storage, so it works offline.
- **As files:** *File → Save to file* writes a self-contained, interactive `.html` file. Double-click it to view and edit it in any browser, or open it again with *File → Open file…*. Overwriting the same file works in Chrome and Edge on desktop; other browsers download a new copy instead.
- **In your private GitHub repo:** with sync turned on, each plan is also stored as an `.html` file in the `plans/` folder of a private repository. That keeps your PC and phone in step, and Git history keeps every earlier version.

This repository contains only the app code. It holds no plans.

## Sync setup (once per device)

1. Create a fine-grained token at <https://github.com/settings/personal-access-tokens/new>.
2. **Repository access:** *Only select repositories* → `speech-spine-plans`.
3. **Permissions → Repository permissions → Contents:** *Read and write*. Nothing else.
4. In the app: *File → GitHub sync settings…*, then enter your username, the repository name and the token.

The token is stored only on that device. Sync runs when the app opens, when you come back to it, 30 seconds after you stop editing, and when you press **Save** or the sync button. If the same plan is changed on two devices before they sync, both versions are kept and the second is renamed “(copy from …)”.

## Sharing a site with Story Spine

Speech Spine and Story Spine are served from the same origin, so they share browser storage. Every storage name here is different: localStorage keys start with `speech.`, the IndexedDB database is `speech-spine`, and the service worker caches are `speech-app-*` and `speech-fonts`.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | App page |
| `editor.js` | Speech wall, transitions, arc graph and card editor |
| `shell.js` | Plan library, file open/save, GitHub sync; also runs inside saved plan files |
| `app.css` | Styles (light and dark) |
| `sw.js` | Offline cache. **Bump `VERSION` on every change** so devices pick up updates. |
| `manifest.webmanifest`, `icons/` | Install metadata and icons |

Hosted with GitHub Pages from the `main` branch.
