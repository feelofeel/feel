import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const installer = join(root, 'tools', 'install.mjs');

function fixture({ version, git = false } = {}) {
  const target = mkdtempSync(join(tmpdir(), git ? 'feel-git-' : 'feel-no-git-'));
  mkdirSync(join(target, 'docs'), { recursive: true });
  writeFileSync(join(target, 'docs', 'existing.md'), '# Existing doc\n\nProject truth.\n', 'utf8');
  if (version) writeFileSync(join(target, 'package.json'), JSON.stringify({ name: 'fixture', version }), 'utf8');
  if (git) execFileSync('git', ['init', '--quiet'], { cwd: target });
  return target;
}

function install(target) {
  return execFileSync(process.execPath, [installer, target, '--yes'], { encoding: 'utf8' });
}

test('installs the complete core into a directory without git', () => {
  const target = fixture();
  try {
    const output = install(target);
    assert.match(output, /feel-install complete/);
    assert.equal(existsSync(join(target, '.git')), false);

    for (const path of [
      'docs/conventions/feel.md',
      'docs/conventions/feel-adoption.md',
      'docs/feel.config.yaml',
      'docs/history/decisions.md',
      'docs/index.md',
      'CLAUDE.md',
      'AGENTS.md',
      '.feel/feel.lock',
      '.feel/LICENSE',
      'tools/feel/health.mjs',
      'tools/feel/route-diff.mjs',
      '.claude/commands/feel-doc.md',
      '.claude/commands/feel-decision.md',
      '.claude/commands/feel-repeat.md',
      '.claude/commands/feel-session.md',
      '.claude/commands/feel-health.md',
    ]) assert.equal(existsSync(join(target, path)), true, `missing ${path}`);

    const existing = readFileSync(join(target, 'docs', 'existing.md'), 'utf8');
    assert.match(existing, /^---\ntitle: Existing doc\n/);
    assert.doesNotMatch(existing, /app_version:/);
    assert.match(readFileSync(join(target, '.feel', 'feel.lock'), 'utf8'), /feel_version: "1\.6"/);
    assert.match(readFileSync(join(target, '.feel', 'LICENSE'), 'utf8'), /^MIT License/);

    const sessionSkill = readFileSync(join(target, '.claude', 'commands', 'feel-session.md'), 'utf8');
    assert.match(sessionSkill, /Fails solely because git/);

    const config = readFileSync(join(target, 'docs', 'feel.config.yaml'), 'utf8');
    for (const line of config.split(/\r?\n/)) {
      const field = line.match(/^\s+[\w-]+:\s+(.+)$/);
      if (!field || !field[1].includes(': ')) continue;
      assert.match(field[1], /^(?:["'\[>{|])/, `unquoted nested colon in YAML scalar: ${line.trim()}`);
    }

    const healthOutput = execFileSync(process.execPath, [join(target, 'tools', 'feel', 'health.mjs')], {
      cwd: target,
      encoding: 'utf8',
    });
    assert.match(healthOutput, /FEEL health/);
    const headsOutput = execFileSync(process.execPath, [join(target, 'tools', 'feel', 'health.mjs'), '--heads'], {
      cwd: target,
      encoding: 'utf8',
    });
    assert.match(headsOutput, /Complete FEEL heads/);
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

test('validates complete heads and configured Diátaxis publication rules', () => {
  const target = fixture();
  try {
    install(target);
    const configPath = join(target, 'docs', 'feel.config.yaml');
    let config = readFileSync(configPath, 'utf8');
    config = config.replace(
      '\n\n# ── Relation registry',
      [
        '',
        '  - id: existing',
        '    path: docs/existing.md',
        '    role: guide',
        '    audience: [developer]',
        '    guards: validation fixture',
        '',
        '# ── Relation registry',
      ].join('\n'),
    );
    config = config.replace(
      'publications: []',
      [
        'publications:',
        '  - target: fixture',
        '    source_root: docs',
        '    requires: [page_kind]',
        '    article_requires: [diataxis]',
        '    landing_omits: [diataxis]',
      ].join('\n'),
    );
    writeFileSync(configPath, config, 'utf8');

    const docPath = join(target, 'docs', 'existing.md');
    let doc = readFileSync(docPath, 'utf8').replace(
      'derived_from: []',
      'derived_from: []\ncustom_metadata: retained\npage_kind: article\ndiataxis: how-to',
    );
    writeFileSync(docPath, doc, 'utf8');

    const run = () => JSON.parse(execFileSync(
      process.execPath,
      [join(target, 'tools', 'feel', 'health.mjs'), '--json'],
      { cwd: target, encoding: 'utf8' },
    ));

    assert.deepEqual(run().headFindings.filter((finding) => finding.id === 'existing'), []);

    writeFileSync(docPath, doc.replace('diataxis: how-to', 'diataxis: journey'), 'utf8');
    assert.ok(run().headFindings.some((finding) => finding.finding === 'invalid:diataxis=journey'));

    writeFileSync(docPath, doc.replace('page_kind: article', 'page_kind: landing'), 'utf8');
    assert.ok(run().headFindings.some((finding) => finding.finding === 'landing-forbids:diataxis'));

    writeFileSync(docPath, doc.replace(/\n---\n/, '\n'), 'utf8');
    assert.ok(run().headFindings.some((finding) => finding.finding === 'malformed-head'));
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

test('scores catalog coverage from the configured canonical super-index', () => {
  const target = fixture();
  try {
    install(target);
    const configPath = join(target, 'docs', 'feel.config.yaml');
    writeFileSync(
      configPath,
      readFileSync(configPath, 'utf8').replace('path: CLAUDE.md', 'path: AGENTS.md'),
      'utf8',
    );
    writeFileSync(
      join(target, 'AGENTS.md'),
      readFileSync(join(target, 'AGENTS.md'), 'utf8') + '\nCatalog: feel decisions\n',
      'utf8',
    );
    writeFileSync(join(target, 'CLAUDE.md'), 'AGENTS.md is canonical.\n', 'utf8');

    const health = JSON.parse(execFileSync(
      process.execPath,
      [join(target, 'tools', 'feel', 'health.mjs'), '--json'],
      { cwd: target, encoding: 'utf8' },
    ));
    assert.equal(health.healthScore.categories.indexCoverage.ratio, 100);
    assert.ok(health.sessionFloor > 2000);
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

test('uses a package version as an optional project stream', () => {
  const target = fixture({ version: '2.3.4' });
  try {
    install(target);
    const existing = readFileSync(join(target, 'docs', 'existing.md'), 'utf8');
    assert.match(existing, /app_version: 2\.3\.4/);
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

test('installs into an existing git worktree without committing or staging', () => {
  const target = fixture({ git: true });
  try {
    install(target);
    assert.equal(existsSync(join(target, '.git')), true);
    const status = execFileSync('git', ['status', '--short'], { cwd: target, encoding: 'utf8' });
    assert.match(status, /\?\? \.claude\//);
    assert.match(status, /\?\? \.feel\//);
    assert.doesNotMatch(status, /^[ MARC][MDARC] /m);
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

test('upgrades an existing installation non-destructively', () => {
  const target = fixture();
  try {
    // Initial install
    install(target);
    const docPath = join(target, 'docs', 'existing.md');
    writeFileSync(docPath, '---\ntitle: Custom\nid: existing\nrole: guide\ndoc_revision: 5\nupdated: 2026-01-01\nsource_of: []\nderived_from: []\n---\n\n# Custom project doc\n', 'utf8');
    const configPath = join(target, 'docs', 'feel.config.yaml');
    writeFileSync(
      configPath,
      readFileSync(configPath, 'utf8')
        .replace('project_key: {{PROJECT_KEY}}', 'project_key: KEEP-ME')
        .replace('from github.com/feelofeel/feel v1.6', 'from github.com/feelofeel/feel v1.5'),
      'utf8',
    );

    // Run upgrade
    const upgradeOutput = execFileSync(process.execPath, [installer, target, '--upgrade'], { encoding: 'utf8' });
    assert.match(upgradeOutput, /feel-upgrade complete/);
    assert.match(upgradeOutput, /upgraded to 1\.6/);

    // Verify project doc was not touched or overwritten
    const docAfter = readFileSync(docPath, 'utf8');
    assert.match(docAfter, /doc_revision: 5/);
    assert.match(docAfter, /Custom project doc/);

    // Verify lockfile was updated
    const lock = readFileSync(join(target, '.feel', 'feel.lock'), 'utf8');
    assert.match(lock, /feel_version: "1\.6"/);
    assert.match(lock, /upgraded_at:/);

    // Verify project config survives while the framework schema is refreshed
    const config = readFileSync(configPath, 'utf8');
    assert.match(config, /project_key: KEEP-ME/);
    assert.match(config, /from github\.com\/feelofeel\/feel v1\.6/);
    assert.match(readFileSync(join(target, '.feel', 'LICENSE'), 'utf8'), /^MIT License/);

    // Verify tools/feel/route-diff.mjs exists
    assert.equal(existsSync(join(target, 'tools', 'feel', 'route-diff.mjs')), true);
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});
