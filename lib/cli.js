"use strict";

const fs = require("fs");
const path = require("path");

const pkg = require("../package.json");
const SKILLS_SRC = path.resolve(__dirname, "..", "skills");

// --- Color support detection ---

const noColor =
  "NO_COLOR" in process.env || process.argv.includes("--no-color");
const forceColor = process.argv.includes("--color");
const useColor = forceColor || (!noColor && process.stdout.isTTY);

const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
};

function c(color, text) {
  if (!useColor) return text;
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

// --- Skill utilities ---

function getSkills() {
  return fs
    .readdirSync(SKILLS_SRC, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => {
      const skillPath = path.join(SKILLS_SRC, d.name, "SKILL.md");
      if (!fs.existsSync(skillPath)) return null;
      const content = fs.readFileSync(skillPath, "utf-8");
      const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
      let description = "";
      if (frontmatter) {
        const descMatch = frontmatter[1].match(
          /description:\s*>\s*\n([\s\S]*?)(?=\n\w|\n---|$)/,
        );
        if (descMatch) {
          description = descMatch[1].replace(/\s+/g, " ").trim();
        } else {
          const inlineMatch = frontmatter[1].match(
            /description:\s*["']?(.+?)["']?\s*$/m,
          );
          if (inlineMatch) {
            description = inlineMatch[1].trim();
          }
        }
      }
      return { name: d.name, description };
    })
    .filter(Boolean);
}

function getSkillNames() {
  return getSkills().map((s) => s.name);
}

function suggestSkill(input) {
  const names = getSkillNames();
  const exact = names.find((n) => n === input);
  if (exact) return null;

  // Prefix match
  const prefixMatches = names.filter((n) => n.startsWith(input));
  if (prefixMatches.length === 1) return prefixMatches[0];

  // Contains match
  const containsMatches = names.filter((n) => n.includes(input));
  if (containsMatches.length === 1) return containsMatches[0];

  // Levenshtein distance for typos
  let best = null;
  let bestDist = Infinity;
  for (const name of names) {
    const dist = levenshtein(input, name);
    if (dist < bestDist && dist <= Math.max(3, Math.floor(name.length / 3))) {
      bestDist = dist;
      best = name;
    }
  }
  return best;
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// --- Argument parsing ---

function parseArgs(args) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--dir" && args[i + 1]) {
      flags.dir = args[++i];
    } else if (args[i] === "--force" || args[i] === "-f") {
      flags.force = true;
    } else if (args[i] === "--no-color" || args[i] === "--color") {
      // handled globally
    } else if (args[i].startsWith("-")) {
      flags[args[i].replace(/^-+/, "")] = true;
    } else {
      positional.push(args[i]);
    }
  }
  return { flags, positional };
}

// --- File operations ---

function copySkill(skillName, targetDir, force) {
  const src = path.join(SKILLS_SRC, skillName, "SKILL.md");
  if (!fs.existsSync(src)) {
    const suggestion = suggestSkill(skillName);
    let msg = `${skillName} — skill not found`;
    if (suggestion) {
      msg += `. Did you mean ${c("cyan", suggestion)}?`;
    }
    console.log(`  ${c("red", "\u2717")} ${msg}`);
    return false;
  }

  const destDir = path.join(targetDir, skillName);
  const dest = path.join(destDir, "SKILL.md");

  if (fs.existsSync(dest) && !force) {
    console.log(
      `  ${c("yellow", "\u2022")} ${skillName} — already exists (use --force to replace)`,
    );
    return false;
  }

  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`  ${c("green", "\u2713")} ${skillName}/SKILL.md`);
  return true;
}

function removeSkill(skillName, targetDir) {
  const destDir = path.join(targetDir, skillName);
  const dest = path.join(destDir, "SKILL.md");

  if (!fs.existsSync(dest)) {
    console.log(`  ${c("yellow", "\u2022")} ${skillName} — not installed`);
    return false;
  }

  fs.unlinkSync(dest);
  // Remove directory if empty
  try {
    const remaining = fs.readdirSync(destDir);
    if (remaining.length === 0) {
      fs.rmdirSync(destDir);
    }
  } catch (_e) {
    // ignore
  }
  console.log(`  ${c("green", "\u2713")} ${skillName} removed`);
  return true;
}

// --- Commands ---

function cmdInit(args) {
  const { flags } = parseArgs(args);
  const targetDir = path.resolve(process.cwd(), flags.dir || "skills");

  console.log();
  console.log(`  ${c("bold", "Tezgah")} ${c("dim", `v${pkg.version}`)}`);
  console.log(`  ${c("dim", "Installing SaaS skills...")}`);
  console.log();

  const skills = getSkills();
  let installed = 0;

  for (const skill of skills) {
    if (copySkill(skill.name, targetDir, flags.force)) {
      installed++;
    }
  }

  console.log();
  if (installed > 0) {
    console.log(
      `  ${c("green", `${installed} skill(s) installed successfully.`)}`,
    );
  } else {
    console.log(
      `  ${c("yellow", "No new skills installed. Use --force to update existing skills.")}`,
    );
  }
  console.log();
  console.log(
    `  ${c("dim", "To get started, run")} ${c("cyan", "/saas-launcher")} ${c("dim", "in Claude Code.")}`,
  );
  console.log();
}

function cmdAdd(args) {
  const { flags, positional } = parseArgs(args);
  const skillName = positional[0];

  if (!skillName) {
    console.log();
    console.log(`  ${c("red", "Error:")} Skill name not specified.`);
    console.log(`  ${c("dim", "Usage:")} tezgah add <skill-name>`);
    console.log(`  ${c("dim", "Example:")} tezgah add saas-auth`);
    console.log();
    console.log(`  ${c("dim", "To view available skills:")} tezgah list`);
    console.log();
    process.exit(1);
  }

  const targetDir = path.resolve(process.cwd(), flags.dir || "skills");

  console.log();
  console.log(`  ${c("bold", "Tezgah")} ${c("dim", `v${pkg.version}`)}`);
  console.log();

  const success = copySkill(skillName, targetDir, flags.force);

  console.log();
  if (success) {
    console.log(
      `  ${c("dim", "To use it, run")} ${c("cyan", `/${skillName}`)} ${c("dim", "in Claude Code.")}`,
    );
    console.log();
  }
}

function cmdRemove(args) {
  const { flags, positional } = parseArgs(args);
  const skillName = positional[0];

  if (!skillName) {
    console.log();
    console.log(`  ${c("red", "Error:")} Skill name not specified.`);
    console.log(`  ${c("dim", "Usage:")} tezgah remove <skill-name>`);
    console.log();
    process.exit(1);
  }

  const targetDir = path.resolve(process.cwd(), flags.dir || "skills");

  console.log();
  console.log(`  ${c("bold", "Tezgah")} ${c("dim", `v${pkg.version}`)}`);
  console.log();

  removeSkill(skillName, targetDir);
  console.log();
}

function cmdUpdate(args) {
  const { flags } = parseArgs(args);
  const targetDir = path.resolve(process.cwd(), flags.dir || "skills");

  console.log();
  console.log(`  ${c("bold", "Tezgah")} ${c("dim", `v${pkg.version}`)}`);
  console.log(`  ${c("dim", "Updating skills...")}`);
  console.log();

  const skills = getSkills();
  let updated = 0;
  let skipped = 0;

  for (const skill of skills) {
    const src = path.join(SKILLS_SRC, skill.name, "SKILL.md");
    const dest = path.join(targetDir, skill.name, "SKILL.md");

    if (!fs.existsSync(dest)) {
      console.log(
        `  ${c("dim", "\u2022")} ${skill.name} — not installed, skipping`,
      );
      skipped++;
      continue;
    }

    const srcContent = fs.readFileSync(src, "utf-8");
    const destContent = fs.readFileSync(dest, "utf-8");

    if (srcContent === destContent) {
      console.log(`  ${c("dim", "\u2022")} ${skill.name} — no changes`);
      skipped++;
    } else {
      fs.copyFileSync(src, dest);
      console.log(`  ${c("green", "\u2713")} ${skill.name} updated`);
      updated++;
    }
  }

  console.log();
  if (updated > 0) {
    console.log(
      `  ${c("green", `${updated} skill(s) updated.`)} ${c("dim", `${skipped} unchanged.`)}`,
    );
  } else {
    console.log(`  ${c("dim", "All skills are up to date.")}`);
  }
  console.log();
}

function cmdDoctor(args) {
  const { flags } = parseArgs(args);
  const targetDir = path.resolve(process.cwd(), flags.dir || "skills");

  console.log();
  console.log(
    `  ${c("bold", "Tezgah")} ${c("dim", `v${pkg.version}`)} ${c("dim", "— System Check")}`,
  );
  console.log();

  let issues = 0;

  // Node.js version
  const nodeVersion = process.versions.node;
  const major = parseInt(nodeVersion.split(".")[0], 10);
  if (major >= 18) {
    console.log(
      `  ${c("green", "\u2713")} Node.js v${nodeVersion} (>= 18.0.0)`,
    );
  } else {
    console.log(
      `  ${c("red", "\u2717")} Node.js v${nodeVersion} — v18+ required`,
    );
    issues++;
  }

  // Skills directory
  if (fs.existsSync(targetDir)) {
    console.log(
      `  ${c("green", "\u2713")} ${path.relative(process.cwd(), targetDir) || "skills"}/ directory exists`,
    );
  } else {
    console.log(
      `  ${c("red", "\u2717")} ${path.relative(process.cwd(), targetDir) || "skills"}/ directory not found`,
    );
    issues++;
  }

  // Installed skills
  const allSkills = getSkills();
  let installedCount = 0;
  const missing = [];

  for (const skill of allSkills) {
    const dest = path.join(targetDir, skill.name, "SKILL.md");
    if (fs.existsSync(dest)) {
      installedCount++;
    } else {
      missing.push(skill.name);
    }
  }

  if (installedCount === allSkills.length) {
    console.log(
      `  ${c("green", "\u2713")} ${installedCount}/${allSkills.length} skill(s) installed`,
    );
  } else {
    console.log(
      `  ${c("yellow", "\u2022")} ${installedCount}/${allSkills.length} skill(s) installed`,
    );
    for (const m of missing) {
      console.log(`    ${c("dim", "\u2514")} ${c("yellow", m)} missing`);
    }
  }

  // Outdated check
  let outdated = 0;
  for (const skill of allSkills) {
    const src = path.join(SKILLS_SRC, skill.name, "SKILL.md");
    const dest = path.join(targetDir, skill.name, "SKILL.md");
    if (fs.existsSync(dest)) {
      const srcContent = fs.readFileSync(src, "utf-8");
      const destContent = fs.readFileSync(dest, "utf-8");
      if (srcContent !== destContent) outdated++;
    }
  }

  if (outdated > 0) {
    console.log(
      `  ${c("yellow", "\u2022")} ${outdated} skill(s) out of date — update with ${c("cyan", "tezgah update")}`,
    );
  } else if (installedCount > 0) {
    console.log(
      `  ${c("green", "\u2713")} All installed skills are up to date`,
    );
  }

  // Frontmatter validation
  let invalidFrontmatter = 0;
  for (const skill of allSkills) {
    const dest = path.join(targetDir, skill.name, "SKILL.md");
    if (fs.existsSync(dest)) {
      const content = fs.readFileSync(dest, "utf-8");
      if (!content.startsWith("---")) {
        console.log(
          `  ${c("red", "\u2717")} ${skill.name}/SKILL.md — frontmatter missing`,
        );
        invalidFrontmatter++;
        issues++;
      }
    }
  }
  if (invalidFrontmatter === 0 && installedCount > 0) {
    console.log(`  ${c("green", "\u2713")} Frontmatter is valid`);
  }

  console.log();
  if (issues === 0) {
    console.log(`  ${c("green", "Everything is working!")}`);
  } else {
    console.log(`  ${c("yellow", `${issues} issue(s) found.`)}`);
  }
  console.log();
}

function cmdList() {
  const skills = getSkills();

  console.log();
  console.log(
    `  ${c("bold", "Tezgah")} ${c("dim", `v${pkg.version}`)} ${c("dim", `— ${skills.length} skill`)}`,
  );
  console.log();

  const orchestrator = skills.find((s) => s.name === "saas-launcher");
  const experts = skills.filter((s) => s.name !== "saas-launcher");

  if (orchestrator) {
    console.log(
      `  ${c("cyan", "\u25B6")} ${c("bold", orchestrator.name)} ${c("dim", "(orchestrator)")}`,
    );
    if (orchestrator.description) {
      const short = orchestrator.description.substring(0, 80);
      console.log(
        `    ${c("dim", short + (orchestrator.description.length > 80 ? "..." : ""))}`,
      );
    }
    console.log();
  }

  for (const skill of experts) {
    console.log(`  ${c("green", "\u25CB")} ${c("bold", skill.name)}`);
    if (skill.description) {
      const short = skill.description.substring(0, 80);
      console.log(
        `    ${c("dim", short + (skill.description.length > 80 ? "..." : ""))}`,
      );
    }
  }

  console.log();
  console.log(`  ${c("dim", "To install all skills:")} tezgah init`);
  console.log(
    `  ${c("dim", "To install a single skill:")} tezgah add <skill-name>`,
  );
  console.log();
}

function cmdHelp() {
  console.log();
  console.log(`  ${c("bold", "Tezgah")} ${c("dim", `v${pkg.version}`)}`);
  console.log(`  ${c("dim", "SaaS starter kit for Claude Code")}`);
  console.log();
  console.log(`  ${c("bold", "Commands:")}`);
  console.log(
    `    ${c("cyan", "tezgah init")}    ${c("dim", "[--dir <directory>] [--force]")}   Install all skills in the project`,
  );
  console.log(
    `    ${c("cyan", "tezgah add")}     ${c("dim", "<skill> [--dir <directory>]")}     Add a single skill`,
  );
  console.log(
    `    ${c("cyan", "tezgah remove")}  ${c("dim", "<skill> [--dir <directory>]")}     Remove a skill`,
  );
  console.log(
    `    ${c("cyan", "tezgah update")}  ${c("dim", "[--dir <directory>]")}             Update installed skills`,
  );
  console.log(
    `    ${c("cyan", "tezgah doctor")}  ${c("dim", "[--dir <directory>]")}             Check the installation`,
  );
  console.log(
    `    ${c("cyan", "tezgah list")}                                List available skills`,
  );
  console.log(
    `    ${c("cyan", "tezgah help")}                                Show this help message`,
  );
  console.log();
  console.log(`  ${c("bold", "Flags:")}`);
  console.log(`    ${c("dim", "--force, -f")}    Overwrite existing files`);
  console.log(
    `    ${c("dim", "--dir <directory>")} Set the target directory (default: skills)`,
  );
  console.log(`    ${c("dim", "--no-color")}     Disable colored output`);
  console.log();
  console.log(`  ${c("bold", "Examples:")}`);
  console.log(`    ${c("dim", "$")} npx tezgah init`);
  console.log(`    ${c("dim", "$")} npx tezgah add saas-auth`);
  console.log(`    ${c("dim", "$")} npx tezgah remove saas-storage`);
  console.log(`    ${c("dim", "$")} npx tezgah update`);
  console.log(`    ${c("dim", "$")} npx tezgah doctor`);
  console.log(
    `    ${c("dim", "$")} npx tezgah init --dir .claude/skills --force`,
  );
  console.log();
  console.log(
    `  ${c("dim", "Documentation: https://github.com/komunite/tezgah")}`,
  );
  console.log();
}

function cmdVersion() {
  console.log(pkg.version);
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case "init":
      return cmdInit(args.slice(1));
    case "add":
      return cmdAdd(args.slice(1));
    case "remove":
      return cmdRemove(args.slice(1));
    case "update":
      return cmdUpdate(args.slice(1));
    case "doctor":
      return cmdDoctor(args.slice(1));
    case "list":
      return cmdList();
    case "help":
    case "--help":
    case "-h":
      return cmdHelp();
    case "version":
    case "--version":
    case "-v":
      return cmdVersion();
    default:
      return cmdHelp();
  }
}

main();
