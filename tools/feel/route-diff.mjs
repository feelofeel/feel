#!/usr/bin/env node

/**
 * route-diff — code-to-doc diff router
 *
 * Cross-references changed files (from git diff or explicit list) against the
 * FEEL doc registry and CLAUDE.md change-type router to output the minimal set
 * of docs an agent must read before acting.
 *
 * Usage:
 *   node tools/feel/route-diff.mjs                  # git diff HEAD (default)
 *   node tools/feel/route-diff.mjs --staged         # git diff --cached
 *   node tools/feel/route-diff.mjs --last=3         # last 3 commits
 *   node tools/feel/route-diff.mjs --files a.ts b.md # explicit file list
 *   node tools/feel/route-diff.mjs --json            # machine-readable output
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const configPath = join(root, 'docs', 'feel.config.yaml');
const claudePath = join(root, 'CLAUDE.md');

// ── arg parsing ───────────────────────────────────────────────────

function parseArgs() {
  const raw = process.argv.slice(2);
  const flags = { json: false, staged: false, last: 0, files: [] };
  let collectFiles = false;
  for (const a of raw) {
    if (a === '--json') { flags.json = true; collectFiles = false; continue; }
    if (a === '--staged') { flags.staged = true; collectFiles = false; continue; }
    if (a.startsWith('--last=')) { flags.last = parseInt(a.slice(7), 10) || 3; collectFiles = false; continue; }
    if (a === '--files') { collectFiles = true; continue; }
    if (collectFiles) flags.files.push(a);
  }
  return flags;
}

// ── git helpers ───────────────────────────────────────────────────

function hasGit() {
  try { execSync('git rev-parse --is-inside-work-tree', { cwd: root, stdio: 'pipe' }); return true; }
  catch { return false; }
}

function hasCommits() {
  try { execSync('git rev-parse HEAD', { cwd: root, stdio: 'pipe' }); return true; }
  catch { return false; }
}

function gitChangedFiles(flags) {
  if (flags.files.length) return { files: flags.files, source: 'explicit' };
  if (!hasGit()) return { files: [], source: 'no-git' };

  try {
    let cmd;
    let source;
    if (flags.staged) {
      cmd = 'git diff --cached --name-only';
      source = 'staged';
    } else if (flags.last > 0 && hasCommits()) {
      cmd = `git diff --name-only HEAD~${flags.last}`;
      source = `last-${flags.last}-commits`;
    } else if (hasCommits()) {
      // Default: uncommitted changes + last commit
      const uncommitted = execSync('git diff --name-only', { cwd: root, encoding: 'utf8' }).trim();
      const staged = execSync('git diff --cached --name-only', { cwd: root, encoding: 'utf8' }).trim();
      const lastCommit = execSync('git diff --name-only HEAD~1', { cwd: root, encoding: 'utf8' }).trim();
      const all = [...new Set([
        ...uncommitted.split('\n'),
        ...staged.split('\n'),
        ...lastCommit.split('\n'),
      ].filter(Boolean))];
      return { files: all, source: 'working+last-commit' };
    } else {
      // No commits: show untracked + modified
      const status = execSync('git status --porcelain', { cwd: root, encoding: 'utf8' }).trim();
      const files = status.split('\n').filter(Boolean).map(line => line.slice(3).trim());
      return { files, source: 'untracked' };
    }
    const out = execSync(cmd, { cwd: root, encoding: 'utf8' }).trim();
    return { files: out ? out.split('\n').filter(Boolean) : [], source };
  } catch {
    return { files: [], source: 'git-error' };
  }
}

// ── config parsing (lightweight, same as health.mjs) ─────────────

function parseConfigDocs(configText) {
  const lines = configText.split(/\r?\n/);
  const startIdx = lines.findIndex(l => l.trimEnd() === 'docs:');
  if (startIdx < 0) return [];

  const docs = [];
  let current = null;
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line && !/^\s/.test(line) && !line.startsWith('#')) break;
    const first = line.match(/^  - ([\w-]+):\s*(.*)$/);
    if (first) {
      current = { [first[1]]: first[2].trim() };
      docs.push(current);
      continue;
    }
    if (!current) continue;
    const field = line.match(/^    ([\w-]+):\s*(.*)$/);
    if (!field) continue;
    const value = field[2].split(/\s+#/)[0].trim();
    current[field[1]] = value;
  }
  return docs;
}

// ── change-type router extraction from CLAUDE.md ─────────────────

function parseChangeTypeRouter(claudeText) {
  // Extract the change-type router table from CLAUDE.md
  const routes = [];
  const tableRegex = /\|\s*Changing[^|]*\|\s*Read first[^|]*\|\s*Anchor\s*\|\s*\n\|[-|\s]+\n((?:\|[^\n]+\n)*)/i;
  const match = claudeText.match(tableRegex);
  if (!match) return routes;

  for (const row of match[1].split('\n').filter(Boolean)) {
    const cells = row.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length >= 3) {
      routes.push({
        changing: cells[0],
        readFirst: cells[1],
        anchor: cells[2],
      });
    }
  }
  return routes;
}

// ── matching logic ───────────────────────────────────────────────

function classifyFile(filePath) {
  const norm = filePath.replace(/\\/g, '/');
  return {
    isDoc: norm.endsWith('.md'),
    isSkill: norm.includes('.claude/commands/') || norm.includes('.claude/skills-archive/'),
    isConvention: norm.includes('docs/conventions/'),
    isTemplate: norm.includes('templates/'),
    isTool: norm.includes('tools/'),
    isConfig: norm.includes('feel.config'),
    isHistory: norm.includes('docs/history/'),
    dir: dirname(norm),
    ext: norm.split('.').pop(),
  };
}

function matchFileToRoutes(filePath, routes) {
  const norm = filePath.replace(/\\/g, '/').toLowerCase();
  const matched = [];

  for (const route of routes) {
    const anchor = (route.anchor || '').replace(/`/g, '').toLowerCase();
    // Direct path match
    if (anchor && norm.includes(anchor.replace(/`/g, ''))) {
      matched.push(route);
      continue;
    }
    // Directory prefix match (e.g. anchor=`templates/` matches templates/CLAUDE.md)
    if (anchor.endsWith('/') && norm.startsWith(anchor)) {
      matched.push(route);
      continue;
    }
  }

  return matched;
}

function matchFileToDocs(filePath, docs) {
  const norm = filePath.replace(/\\/g, '/');
  const matched = [];

  for (const doc of docs) {
    if (!doc.path) continue;
    const docPath = doc.path.replace(/\\/g, '/');
    // Direct match
    if (norm === docPath) {
      matched.push({ ...doc, matchType: 'direct' });
      continue;
    }
    // Same directory — related doc
    if (dirname(norm) === dirname(docPath)) {
      matched.push({ ...doc, matchType: 'sibling' });
    }
  }
  return matched;
}

// ── main ──────────────────────────────────────────────────────────

function main() {
  const flags = parseArgs();
  const { files, source } = gitChangedFiles(flags);

  if (!files.length) {
    if (flags.json) {
      console.log(JSON.stringify({ source, changedFiles: 0, recommendations: [] }, null, 2));
    } else {
      console.log(`FEEL route-diff — no changed files detected (source: ${source})`);
    }
    process.exit(0);
  }

  // Load config registry
  const docs = existsSync(configPath)
    ? parseConfigDocs(readFileSync(configPath, 'utf8'))
    : [];

  // Load change-type router
  const routes = existsSync(claudePath)
    ? parseChangeTypeRouter(readFileSync(claudePath, 'utf8'))
    : [];

  // Classify each changed file and find recommendations
  const recommendations = new Map(); // docId → { doc, reasons[] }

  for (const file of files) {
    const classified = classifyFile(file);

    // Match against change-type router
    const routeMatches = matchFileToRoutes(file, routes);
    for (const route of routeMatches) {
      const readTarget = route.readFirst.replace(/`/g, '').trim();
      if (!recommendations.has(readTarget)) {
        recommendations.set(readTarget, { target: readTarget, reasons: [], routeEntry: route });
      }
      recommendations.get(readTarget).reasons.push(`changed: ${file}`);
    }

    // Match against doc registry
    const docMatches = matchFileToDocs(file, docs);
    for (const doc of docMatches) {
      const key = doc.id || doc.path;
      if (!recommendations.has(key)) {
        recommendations.set(key, { target: doc.path, id: doc.id, role: doc.role, reasons: [], matchType: doc.matchType });
      }
      if (doc.matchType === 'direct') {
        recommendations.get(key).reasons.push(`directly changed`);
      } else {
        recommendations.get(key).reasons.push(`sibling of changed: ${file}`);
      }
    }

    // Heuristic: skill changes should reference feel.md §8
    if (classified.isSkill && !recommendations.has('feel-spec-skills')) {
      recommendations.set('feel-spec-skills', {
        target: 'docs/conventions/feel.md §8',
        reasons: [`skill changed: ${file}`],
      });
    }

    // Heuristic: tool changes should reference feel-adoption.md
    if (classified.isTool && !recommendations.has('feel-adoption-tools')) {
      recommendations.set('feel-adoption-tools', {
        target: 'docs/conventions/feel-adoption.md §2',
        reasons: [`tool changed: ${file}`],
      });
    }
  }

  // Deduplicate reasons
  for (const [, rec] of recommendations) {
    rec.reasons = [...new Set(rec.reasons)];
  }

  const recs = [...recommendations.values()];

  if (flags.json) {
    console.log(JSON.stringify({
      generatedAt: new Date().toISOString(),
      source,
      changedFiles: files.length,
      files,
      recommendations: recs,
    }, null, 2));
    process.exit(0);
  }

  // Human-readable output
  console.log(`FEEL route-diff — ${new Date().toISOString().slice(0, 10)}`);
  console.log(`Source: ${source}  |  Changed files: ${files.length}`);
  console.log('');

  if (!recs.length) {
    console.log('No doc routing recommendations for the current diff.');
    console.log('Changed files:');
    for (const f of files) console.log(`  ${f}`);
    process.exit(0);
  }

  console.log('Read before acting:');
  console.log('─'.repeat(60));
  for (const rec of recs) {
    const label = rec.id ? `${rec.id} (${rec.target})` : rec.target;
    console.log(`  → ${label}`);
    for (const reason of rec.reasons) {
      console.log(`      because: ${reason}`);
    }
  }
  console.log('─'.repeat(60));
  console.log(`\n${recs.length} doc(s) recommended for review.`);
}

main();
