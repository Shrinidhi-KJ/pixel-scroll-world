# Contributing

Thanks for helping. Pixel Scroll World is a skill: Markdown that an agent reads, plus a small
starter site and one script. Most contributions are better instructions, new recipes or fixes to
the starter.

## How the repository fits together

```
skills/pixel-scroll-world/
├── SKILL.md            what the agent reads first: workflow, principles, checklist
├── references/         longer guides, read only when a task needs them
├── scripts/            model-sprite.mjs (3D model to pixel sprite)
└── assets/starter/     the site the agent copies and grows
.claude-plugin/         Claude Code plugin and marketplace manifests
docs/                   images for the README
```

Keep `SKILL.md` short: it is loaded every time the skill runs. Put detail in a reference file and
point to it from `SKILL.md`.

## Changing the starter

```bash
cd skills/pixel-scroll-world/assets/starter
npm install
npm run dev          # http://localhost:5173
npm run build
npm run shots        # screenshots on a laptop and a phone, plus page errors and overflow
```

Open the screenshots before you send a change. The starter must build with no console errors
and no horizontal scroll at phone width.

## Writing guidance for the agent

- Explain why, not just what. Agents follow reasons better than rules.
- Keep advice general. A recipe should work for anyone's story, not only the example site.
- Only real facts. Don't add invented numbers or claims to examples.
- No trademarked characters or logos in art or examples.

## Checks before a pull request

- `claude plugin validate .` passes, if you changed `.claude-plugin/`.
- The starter builds and `npm run shots` shows no errors.
- Links between Markdown files still work.

## Showing what you built

Made a site with this skill? Open a
[showcase issue](https://github.com/Shrinidhi-KJ/pixel-scroll-world/issues/new?template=showcase.yml)
with the link and a screenshot.
