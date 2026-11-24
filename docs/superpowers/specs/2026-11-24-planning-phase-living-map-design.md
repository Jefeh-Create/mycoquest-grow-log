# Planning Phase, Process Trail, and the Living Mycelial Map: design

Status: draft for approval. App: `grow-log.html` (single file, plain HTML/CSS/JS, localStorage + IndexedDB).

## Intent and why

MycoQuest should not feel like a spreadsheet with a mushroom on it. The owner wants people to say
"there are very good mushroom grow logs, but none are like MycoQuest, and I love it."

The lever is documentation that becomes part of the game world:

1. A **Planning phase** that runs hand in hand with the First Grow Academy. While following a quest
   (dry grain, soaking, simmering, jars...) people capture photos and optional 10-15 s videos of their
   own process. Anyone who wants more can log a grow in full detail.
2. A **living Mycelial Map** that turns a finished grow into an animated, interactive, emoji-driven
   story of that person's actual grow, ending with their real harvest photo.
3. **Game feel everywhere**: every emoji reacts to hover and tap, and tapping opens small
   "field note" popups with the person's own photo, stage, and what they wrote.

## Goals

- Photos/videos are always optional. They never block a step, an XP claim, or a quest.
- The finished-grow replay is the signature feature: start to finish, using the user's own data and photos.
- Everything is mushroom-specific (substrate, spawn, mycelium, pins, flushes, contamination), not generic plant imagery.
- Mushrooms **spawn**: they emerge from substrate (jar, cake, bag, log, bed) the way fruiting bodies do,
  never "dissolve" or bloom like flowers.
- Interactive: hover and click/tap/keyboard activation animate every emoji; taps open a popup.
- High quality: accessible, touch-friendly, `prefers-reduced-motion` respected, no data loss.

## Non-goals

- No server, accounts, uploads, or cloud. Everything stays in the browser.
- No image recognition. The app cannot "see" what is in a photo (see "How the animation matches a grow").
- No video editing or trimming UI. Videos are capped, not edited.
- Not rewriting the existing Academy, trophy, XP, or stories systems beyond hooking into them.

## Anti-goals (a failure even if it technically works)

- Breaking v2 export/import compatibility with the storefront demo (HANDOFF.md "Don't break").
- Silent data loss: a photo or video that fails to save must say so, never vanish.
- A replay that looks identical for every grow. If two grows replay the same, the feature has failed.
- Gamification that nags or gates real record-keeping behind photos.
- Plant imagery (leaves, flowers, sprouts) in the map's visual language.

## Constraints

- Single file, no build step, no dependencies. Plain JS.
- XP rules in HANDOFF.md stay: curve 200 x block (1-45), 2,500 per level 46-49, cap 50 (55,000 XP).
- Photos stay in IndexedDB (`mycoquest-grow-log-photos`); localStorage holds journal text only.
- Export v2 shape `{ app, version: 2, grows, entries, recipes, academy }` must stay importable by the
  storefront. New data is added as **extra optional keys only**, which older importers ignore.
- Existing map code (`renderMap`, `renderMapKey`, seeded hyphae, `animateMotion` pulses, replay button,
  spore bursts) is extended, not discarded.
- Emoji rendering varies by OS. `🍄‍🟫` (brown mushroom) is newer than `🍄`; feature-detect it
  and fall back to `🍄`.

## Approaches considered

| | Approach | Trade-off |
|---|---|---|
| **A (chosen)** | Extend the existing SVG map; emoji as SVG `<text>` nodes in `<g>` wrappers driven by one replay timeline | Reuses hyphae, pulses, reduced-motion handling; every node is natively focusable/tappable. Density must be capped. |
| B | Rewrite the map on `<canvas>` with an emoji sprite engine | Smoothest for huge particle counts, but needs hand-built hit-testing, loses accessibility, rebuilds the existing look. |
| C | Absolutely-positioned DOM emoji over an SVG hyphae layer | Easy CSS animation, but two layers must stay in sync as the map scales; fragile. |

The owner handed over the "how" and approved A.

## Build in three pieces

### Piece 1: Planning phase and Academy capture slots

**Grow lifecycle.** "Planning" already exists as a stage but grows start at Inoculation. Add an
optional **Plan this grow** path: a grow can be created in Planning (no inoculation date required yet)
and moves to Inoculation when the date is set. Existing grows are untouched.

**Process trail.** Each grow gets a *process trail*: an ordered list of captures. Each capture has:
`id`, `growId`, optional `questId` + `stepId` (when taken from an Academy step), `kind`
(`photo` | `video`), `caption`, `takenAt`, optional conditions note, and a media key.
Because Academy steps are a fixed sequence, steps become natural slots.

**Capture slots.** Every Academy step (soak, simmer, dry, fill, sterilize...) gets an optional
**Capture** control: add photo, add video (10-15 s), caption. A step with a capture shows a small
filled indicator; empty slots are inviting, never nagging. Capturing is always allowed even if the
quest is not linked to a grow yet; the capture attaches to the grow when linked.

**Full-detail logging (optional).** A "Log in full detail" toggle per grow reveals extra fields
(substrate recipe, water ratio, sterilization time, ambient notes). Off by default; casual users never see it.

**Media storage.**
- Photos: reuse the existing IndexedDB photo store and its confirm-then-strip behavior.
- Videos: stored as `Blob` in a new IndexedDB object store (not base64). Cap: **15 seconds** (read
  `video.duration` after load; reject longer with a friendly message) and **~25 MB**. Show the size
  before saving.
- Storage failure is reported to the user, never swallowed.
- Hard fallback: if IndexedDB is unavailable, photos use the existing inline path; videos are
  disabled with a clear explanation.

**XP and trophies (small, honest).** Small one-time XP per documented step (suggested 10-15 XP,
tuned by the builder to sit below milestone XP), plus a **"Documented"** trophy tier. Media never
gates any step. Awarding is idempotent per step.

### Piece 2: The living Mycelial Map

**Emoji vocabulary (mushroom-specific):**

| Moment | Emoji |
|---|---|
| Dry grain | 🌾 |
| Soak / hydrate | 💧 |
| Simmer / sterilize | 🔥 (♨️ for the pressure cooker) |
| Jar / cake ready | 🫙 |
| Inoculation (syringe, culture) | 💉 / 🧫 |
| Mycelium spreading | 🕸️ (white threads) |
| Pins (baby mushrooms) | small 🍄‍🟫 / 🍄 |
| Fruiting bodies | 🍄 / 🍄‍🟫 |
| Spore release | 💨 |
| Log / bulk substrate | 🪵 |
| Contamination | 🦠 |
| Harvest | 🧺 |
| Conditions logged | 🌡️ |
| Achievement | 🏆 |

(Final set and per-species variants are the builder's, within "mushroom specific, no plants".)

**Variety (owner revision, approved with the design).** Unicode has only two mushroom emoji (🍄, 🍄‍🟫), so
repeating them would feel flat. Mushrooms, mycelium and spores are therefore drawn as **custom inline-SVG
"emoji-style" glyphs** (round, bold, friendly, same size as an emoji, and just as tappable). Real emoji stay
for process props (🌾 💧 🔥 🫙 💉 🧺 🌡️ 🏆 🦠).
- **Mushroom glyph library** (no two spawns identical): oyster shelf cluster (blue, pink, golden, grey),
  lion's mane spined clump, shiitake (brown, domed, cracked cap), reishi conk (glossy red-orange, lacquered),
  king oyster (thick stem, small cap), chestnut cluster, enoki bundle, button/cremini, chanterelle (gold, wavy),
  morel (honeycomb), turkey tail (rings), fly-agaric style red-and-white-dotted cap for rare "discovery" nodes.
- **Variation per spawn:** species picks the family; a seeded random (per grow + entry) picks cap color
  from that species' palette, size, tilt, stem length, and cluster arrangement. Pins, young, and mature
  forms of each glyph so growth reads as a life cycle.
- **Mycelium, defined:** drawn as branching rhizomorph threads with fine fan-out hyphae, white to cream,
  tinted by the grow's logged conditions; thicker "ropes" near the substrate and fine threads at the edge.
  Not a single emoji, and not a flat line.
- **Spores, defined:** small particle clouds in the species' real spore-print color (white, pink, brown,
  purple-brown) that drift upward from mature caps and can be tapped to "collect" for a tiny delight
  (no XP).
- **Tapping/hover reactions are per family** (shelf clusters sway, lion's mane shivers its spines, reishi gleams,
  enoki bundles sprout taller, morel pulses).

**Spawning, not blooming.** Mushrooms emerge from where they really fruit: the jar, cake, bag, log, or bed
node. Sequence: a tiny pin bump pushes up from the substrate, grows with a quick squash-and-stretch pop,
and releases a 💨 spore puff when mature. Clusters spawn in stages (pins → fruiting) at the substrate
node, sized by logged flush/yield. A flush that is harvested clears the cluster and a later flush spawns again.

**Interactivity: every emoji reacts.**
- **Hover/focus:** a wiggle, lift, or glow specific to the emoji (mushrooms bob and puff spores,
  🕸️ shimmers, 💧 ripples, 🔥 flickers, 🦠 shudders).
- **Click/tap/Enter/Space:** a distinct reaction (spore burst, pop) and a **field-note popup**.
- All emoji are focusable (`tabindex`, `role="button"`, accessible names such as
  "Fruiting, day 19, open field note").
- Reactions are cheap CSS/SMIL transforms; no per-frame JS per emoji.

**Field-note popup.** Small, anchored to the node, dismissible (Esc, click-away, close button).
Shows: the user's photo (or video poster with play), stage, day number and date, temperature and
humidity if logged, their observation. For a contamination node it shows the user's **"What happened
and why do you think it happened?"** note, framed supportively ("Honest logger" trophy already exists).

**New field.** An optional **"What happened and why do you think so?"** textarea appears on the
check-in form when appearance is "Possible contamination" or "Needs attention". Stored as an extra
optional entry key (`incidentNote`). Older importers ignore it; the existing observation field is unchanged.

**How the animation matches a grow.** No image recognition. The replay is driven only by data the
app has, so it differs per grow:
- Stage sequence and **real elapsed days** drive pacing (slow, cool grows visibly take longer).
- Temperature/humidity influence thread density and color warmth.
- Flagged check-ins spawn 🦠 patches that get cut back when the next check-in recovers.
- Flush number and fresh yield size the fruiting cluster; species picks the cluster shape
  (oyster = shelving clusters, lion's mane = spined clumps, shiitake = brown caps, reishi = conks, etc.).
- **Color sampling:** the substrate and thread tint can be sampled from the user's own photos using
  a small `<canvas>` average on a downscaled copy (cheap, local, optional).
- The user's own photos pop in at their real moments in the timeline.

**Replay controller.** One timeline object: play, pause, scrub, speed, replay. Falls back to the
final static state under `prefers-reduced-motion` (nothing animates; tap/focus still work). Large
grows cap emoji density and collapse older nodes into clusters.

### Piece 3: The Grow Reel finale

When a grow has reached Harvest and has a real harvest photo, the replay ends on it. The photo does
not "dissolve in": it **spawns up from the substrate** as the fruiting body does. The drawn mushrooms
rise around it, the photo grows up out of the substrate node in a cap-shaped frame, and a spore burst
settles. The result is a frame the user will want to screenshot and share.
- A "Replay my grow" button on the grow card and map, plus a shareable still ("Save as image",
  rendered locally via canvas).
- Grows without a harvest photo still get a complete replay ending on drawn mushrooms, with an
  invitation to add their real photo.

## Data and compatibility

- New state keys (additive): per-grow `trail` entries and a `media` index in `state`;
  video blobs in a new IndexedDB store; `incidentNote` on entries; optional `planning` fields on grows.
- **v2 export:** remains `{ app, version: 2, grows, entries, recipes, academy }`. New text-only data
  (trail captions, `incidentNote`) rides along as extra keys. Photos continue inline as today.
  **Videos are excluded from the v2 payload**; an entry carries only `hasVideo: true`. A separate
  optional "media backup" file (own filename, own format marker) carries videos so nothing is lost
  without bloating the storefront-compatible file.
- **Import** accepts old files unchanged and restores new keys when present.
- Sample journal (`buildSampleJournal`) is extended with a plan trail, a contamination incident with a note,
  and a harvest, so the feature can be previewed with no data. It stays flagged and never overwrites real data.

## Decisions made on the owner's behalf (please check)

- Video limit: 15 s and ~25 MB. (Owner said 10-15 s clips.)
- Videos excluded from v2; separate media backup file.
- Small XP for documenting steps, tuned below milestone XP; exact numbers are the builder's.
- Native `<input type="file" capture>` for camera/library, no custom camera UI.
- `🍄‍🟫` with feature-detected fallback to `🍄`.

## Left to the builder

- Exact emoji per step and per species, final animation timings and easing.
- Layout of capture slots inside the existing Academy step cards.
- Popup placement and focus management.
- Performance caps for node counts.
- Wording of copy and the contamination-note prompts.

## Done means

- A user can start a grow in Planning, follow an Academy quest, attach photos and a short video to
  steps, and see them again later.
- A finished grow replays start to finish on the map; tapping any emoji animates it and opens a popup
  with their photo/stage; contamination popups show their note.
- Their harvest photo spawns up out of the substrate at the end.
- v2 export still imports in the storefront demo; old backups still import; reduced-motion works;
  keyboard and touch work; no console errors; mobile layout holds.
