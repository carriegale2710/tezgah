"use strict";

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const CLI = path.resolve(__dirname, "..", "bin", "tezgah.js");
const SKILLS_SRC = path.resolve(__dirname, "..", "skills");

let tmpDir;
let passed = 0;
let failed = 0;

function run(args, cwd) {
  return execSync(`node ${CLI} ${args} --no-color`, {
    cwd: cwd || tmpDir,
    encoding: "utf-8",
    env: { ...process.env, NO_COLOR: "1" },
  });
}

function assert(condition, message) {
  if (condition) {
    console.log(`  \x1b[32m\u2713\x1b[0m ${message}`);
    passed++;
  } else {
    console.log(`  \x1b[31m\u2717\x1b[0m ${message}`);
    failed++;
  }
}

function setup() {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tezgah-test-"));
}

function cleanup() {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// --- Tests ---

function testVersion() {
  const output = run("--version");
  const pkg = require("../package.json");
  assert(output.trim() === pkg.version, `--version output: ${pkg.version}`);
}

function testHelp() {
  const output = run("help");
  assert(
    output.includes("tezgah init"),
    "help output includes the init command",
  );
  assert(output.includes("tezgah add"), "help output includes the add command");
  assert(
    output.includes("tezgah remove"),
    "help output includes the remove command",
  );
  assert(
    output.includes("tezgah update"),
    "help output includes the update command",
  );
  assert(
    output.includes("tezgah doctor"),
    "help output includes the doctor command",
  );
}

function testList() {
  const output = run("list");
  assert(output.includes("saas-launcher"), "list shows the orchestrator");
  assert(output.includes("saas-auth"), "list shows saas-auth");
  assert(output.includes("saas-database"), "list shows saas-database");

  const skillDirs = fs.readdirSync(SKILLS_SRC).filter((d) => {
    return (
      fs.statSync(path.join(SKILLS_SRC, d)).isDirectory() && !d.startsWith(".")
    );
  });
  assert(
    output.includes(`${skillDirs.length} skill`),
    `list shows ${skillDirs.length} skills`,
  );
}

function testInit() {
  const output = run("init");
  assert(
    output.includes("installed successfully"),
    "init displays a success message",
  );

  const installed = fs.existsSync(
    path.join(tmpDir, "skills", "saas-launcher", "SKILL.md"),
  );
  assert(installed, "init creates saas-launcher/SKILL.md");

  const installed2 = fs.existsSync(
    path.join(tmpDir, "skills", "saas-auth", "SKILL.md"),
  );
  assert(installed2, "init creates saas-auth/SKILL.md");

  const installed3 = fs.existsSync(
    path.join(tmpDir, "skills", "saas-database", "SKILL.md"),
  );
  assert(installed3, "init creates saas-database/SKILL.md");
}

function testInitNoOverwrite() {
  run("init");
  const output = run("init");
  assert(
    output.includes("already exists"),
    "init does not overwrite existing files",
  );
}

function testInitForce() {
  run("init");
  const output = run("init --force");
  assert(
    output.includes("installed successfully"),
    "init --force reinstalls skills",
  );
}

function testInitCustomDir() {
  const output = run("init --dir custom-skills");
  assert(output.includes("installed successfully"), "init --dir succeeds");

  const installed = fs.existsSync(
    path.join(tmpDir, "custom-skills", "saas-launcher", "SKILL.md"),
  );
  assert(installed, "init --dir installs to a custom directory");
}

function testAdd() {
  const output = run("add saas-auth");
  assert(output.includes("saas-auth/SKILL.md"), "add installs a single skill");

  const installed = fs.existsSync(
    path.join(tmpDir, "skills", "saas-auth", "SKILL.md"),
  );
  assert(installed, "add creates the file");
}

function testAddInvalidSkill() {
  const output = run("add saas-nonexistent");
  assert(output.includes("skill not found"), "add reports an invalid skill");
}

function testAddSuggestion() {
  const output = run("add saas-aut");
  assert(output.includes("saas-auth"), "add suggests a correction for a typo");
}

function testRemove() {
  run("init");
  const output = run("remove saas-auth");
  assert(output.includes("removed"), "remove displays a success message");

  const exists = fs.existsSync(
    path.join(tmpDir, "skills", "saas-auth", "SKILL.md"),
  );
  assert(!exists, "remove deletes the file");
}

function testRemoveNotInstalled() {
  const output = run("remove saas-auth");
  assert(
    output.includes("not installed"),
    "remove warns when a skill is not installed",
  );
}

function testUpdate() {
  run("init");
  // Modify a file to simulate an outdated installation
  const dest = path.join(tmpDir, "skills", "saas-auth", "SKILL.md");
  fs.writeFileSync(dest, "---\nname: saas-auth\n---\nOld content");

  const output = run("update");
  assert(output.includes("updated"), "update refreshes a changed skill");
}

function testUpdateNoChanges() {
  run("init");
  const output = run("update");
  assert(
    output.includes("up to date"),
    "update reports when everything is current",
  );
}

function testDoctor() {
  run("init");
  const output = run("doctor");
  assert(output.includes("Node.js"), "doctor checks the Node.js version");
  assert(
    output.includes("skill(s) installed"),
    "doctor shows the number of installed skills",
  );
  assert(
    output.includes("Everything is working"),
    "doctor confirms when there are no issues",
  );
}

function testDoctorMissingSkills() {
  const output = run("doctor");
  assert(
    output.includes("not found") || output.includes("missing"),
    "doctor reports missing skills",
  );
}

function testNoColor() {
  const output = run("list");
  assert(!output.includes("\x1b["), "NO_COLOR disables color codes");
}

// --- Runner ---

console.log();
console.log("\x1b[1mTezgah CLI Tests\x1b[0m");
console.log();

const tests = [
  ["version", testVersion],
  ["help", testHelp],
  ["list", testList],
  ["init", testInit],
  ["init (no overwrite)", testInitNoOverwrite],
  ["init --force", testInitForce],
  ["init --dir", testInitCustomDir],
  ["add", testAdd],
  ["add (invalid)", testAddInvalidSkill],
  ["add (suggestion)", testAddSuggestion],
  ["remove", testRemove],
  ["remove (not installed)", testRemoveNotInstalled],
  ["update", testUpdate],
  ["update (no changes)", testUpdateNoChanges],
  ["doctor", testDoctor],
  ["doctor (missing)", testDoctorMissingSkills],
  ["no-color", testNoColor],
];

for (const [name, fn] of tests) {
  setup();
  try {
    fn();
  } catch (err) {
    console.log(`  \x1b[31m\u2717\x1b[0m ${name}: ${err.message}`);
    failed++;
  }
  cleanup();
}

console.log();
console.log(`  ${passed} passed, ${failed} failed`);
console.log();

if (failed > 0) {
  process.exit(1);
}
