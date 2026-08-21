# Contributing Guide

Thank you for wanting to contribute to Tezgah! This guide explains the contribution process.

## How Can I Contribute?

### Bug Reports

- Report via [GitHub Issues](https://github.com/komunite/tezgah/issues)
- Specify which skill has the problem
- If possible, describe the expected behaviour vs what actually happened

### Improving Existing Skills

- Fix outdated information (API changes, price updates, etc.)
- Add new gotchas or best practices
- Update region-specific information

### Adding New Skills

If you want to add a new skill to Tezgah:

1. Create a `skills/<skill-name>/SKILL.md` file
2. Fill in the `name` and `description` fields in the YAML frontmatter
3. Follow the format of existing skills
4. Specify dependencies and related skills

#### Skill File Format

```markdown
---
name: skill-name
description: >
  A detailed description explaining what the skill does and when it
  should be triggered. Claude Code uses this description to activate
  the skill at the right time.
---

# Skill Title

Skill content...
```

#### Skill Writing Principles

- **Write in English.** All skill content must be in English.
- **Be practical.** Give actionable steps, not theoretical information.
- **Add a Gotchas section.** Warnings from real-world experience are very valuable.
- **Specify dependencies.** Which other skills does this skill depend on?
- **Think about context.** What local constraints or advantages are relevant?

### Translation

If you want to translate skills into other languages:

- Use the `skills/<skill-name>/SKILL.<lang-code>.md` format (e.g. `SKILL.tr.md`)
- Open a PR to add language support to the CLI

## Development Setup

```bash
# Clone the repo
git clone https://github.com/komunite/tezgah.git
cd tezgah

# Test the CLI
node bin/tezgah.js list
node bin/tezgah.js --help

# Run tests
npm test
```

## Pull Request Process

1. Fork the repo
2. Create a feature branch (`git checkout -b new-feature`)
3. Commit your changes
4. Push your branch (`git push origin new-feature`)
5. Open a Pull Request

### PR Checklist

- [ ] Does it follow the existing skill format?
- [ ] Is it written in English?
- [ ] Has CHANGELOG.md been updated?
- [ ] Does `npm test` pass?

## Code of Conduct

This project is governed by the [Code of Conduct](CODE_OF_CONDUCT.md). By participating you agree to abide by its terms.

## Questions?

Ask on [GitHub Discussions](https://github.com/komunite/tezgah/discussions).
