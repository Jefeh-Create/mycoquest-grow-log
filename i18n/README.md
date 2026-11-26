# Grow log translations

`grow-log.html` loads these files, in this order:

| File | What it is |
| --- | --- |
| `en.js` | English. The source text and the fallback for every other language. |
| `es.js` | Spanish for U.S. visitors ("tú"). A complete draft. `meta.review` lists lines that need review. |
| `hmn.js` | Hmong. Prepared but empty and switched off (`enabled: false`). |
| `i18n.js` | The runtime, the same one the MycoQuest shop uses: lookup, English fallback, plurals, the language selector, and date and number formatting. |

## How text gets on the page

- **Static markup:** `data-i18n="key"` sets an element's text, and `data-i18n-attr="placeholder: key; aria-label: key"` sets attributes.
  Child elements marked `data-slot="name"`, such as links, are kept and placed where the text has `{name}`.
- **Script:** `t("key", { name: value })` returns text. Plural entries are objects like `{ one: "...", other: "..." }`, chosen by `count`.
- **Academy quest text** lives under `quest.<quest>.*` and `quest.<quest>.step.<step>.*`, with checklist items numbered
  `.check.1`, `.check.2` and so on. The `QUESTS` array in the page holds only structure (ids, XP, timers and the number of
  checklist items), and getters read the text in the current language.
- **Missing keys:** a key missing from a language shows the English text, marked `lang="en"`, and logs a console warning.

## What is never translated

These stay exactly as they are:

- anything a person types: grow names, species, notes, captions;
- scientific names;
- measurements.

Saved data keeps English values for stages (`Colonization`, `Harvest` and the rest) and for the "How does it look?" choices.
Changing the language never rewrites the journal or its backups, and v2 exports stay compatible with the shop.

The sample journal is the one exception: it's written in the language in use when you load it.

## The language setting

The choice is saved in the browser under `mycoquest-language`, separately from the journal (`mycoquest-standalone-grow-log-v3`)
and from backups. It holds only a language code. English is used until someone picks another language.

The shop on the same site uses the same key, so on `jefeh-create.github.io` the choice carries over between the two.

## Adding a language

1. Copy `hmn.js` to `<code>.js`. Set `name` (the language's own name for itself) and `htmlLang`, and keep `enabled: false`.
2. Translate every key in `en.js`. Keep each `{placeholder}` exactly as it is.
3. Add `<script src="i18n/<code>.js"></script>` to `grow-log.html`, after `es.js` and before `i18n.js`.
4. Run `node tools/check-translations.mjs`. It lists missing keys, changed placeholders and incomplete plurals.
5. Have a fluent speaker who didn't write the translation review it in the running app, including at phone width.
   The cultivation and safety steps in the Academy also need someone who grows mushrooms.
6. Set `enabled: true`. The language then appears in the selector.
