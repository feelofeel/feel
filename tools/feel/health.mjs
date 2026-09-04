#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const configPath = join(root, 'docs', 'feel.config.yaml');
const args = new Set(process.argv.slice(2));
const tokenEstimate = (chars, path = '') => Math.round(chars / (/\.(json|ya?ml)$/i.test(path) ? 3.5 : 4));
const read = (path) => readFileSync(join(root, path), 'utf8');

function topBlock(lines, key) {
  const start = lines.findIndex((line) => line.trimEnd() === `${key}:`);
  if (start < 0) return [];
  const block = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line && !/^\s/.test(line) && !line.startsWith('#')) break;
    block.push(line);
  }
  return block;
}

function parseArray(value) {
  const inner = value.trim().replace(/^\[/, '').replace(/\]$/, '');
  return inner ? inner.split(',').map((item) => item.trim().replace(/^['"]|['"]$/g, '')) : [];
}

function parseItems(block) {
  const items = [];
  let current;
  for (const line of block) {
    const first = line.match(/^  - ([\w-]+):\s*(.*)$/);
    if (first) {
      current = { [first[1]]: first[2].trim() };
      items.push(current);
      continue;
    }
    if (!current) continue;
    const field = line.match(/^    ([\w-]+):\s*(.*)$/);
    if (!field) continue;
    const value = field[2].split(/\s+#/)[0].trim();
    current[field[1]] = value.startsWith('[') ? parseArray(value) : value.replace(/^['"]|['"]$/g, '');
  }
  return items;
}

function parseHeadCount(lines) {
  const result = {};
  for (const line of topBlock(lines, 'head_count')) {
    const match = line.match(/^  (heading_warning|heading_split|char_warning|char_split):\s*(\d+)/);
    if (match) result[match[1]] = Number(match[2]);
  }
  return result;
}

function parseSimpleMap(block) {
  const result = {};
  for (const line of block) {
    const match = line.match(/^  ([\w-]+):\s*(.*)$/);
    if (!match) continue;
    const value = match[2].split(/\s+#/)[0].trim();
    result[match[1]] = value.startsWith('[') ? parseArray(value) : value.replace(/^['"]|['"]$/g, '');
  }
  return result;
}

function parseHead(text) {
  const result = { fields: {}, raw: '', body: text, lines: 0, chars: 0, tokens: 0, malformed: false };
  if (!text.startsWith('---')) {
    result.malformed = true;
    return result;
  }
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    result.malformed = true;
    return result;
  }
  result.raw = match[0];
  result.body = text.slice(match[0].length);
  result.lines = match[0].replace(/\r\n/g, '\n').trimEnd().split('\n').length;
  result.chars = match[0].length;
  result.tokens = tokenEstimate(result.chars);
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!field) continue;
    const value = field[2].split(/\s+#/)[0].trim();
    result.fields[field[1]] = value.startsWith('[') ? parseArray(value) : value.replace(/^['"]|['"]$/g, '');
  }
  return result;
}

function pathChars(relativePath) {
  const absolute = join(root, relativePath);
  if (!existsSync(absolute)) return 0;
  const stat = statSync(absolute);
  if (stat.isFile()) return readFileSync(absolute, 'utf8').length;
  let total = 0;
  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const child = join(relativePath, entry.name);
    total += entry.isDirectory() ? pathChars(child) : readFileSync(join(root, child), 'utf8').length;
  }
  return total;
}

if (!existsSync(configPath)) {
  console.error('FEEL health: docs/feel.config.yaml not found');
  process.exit(1);
}

const configLines = readFileSync(configPath, 'utf8').split(/\r?\n/);
const registry = parseItems(topBlock(configLines, 'docs'));
const roles = parseItems(topBlock(configLines, 'roles'));
const thresholds = parseHeadCount(configLines);
const vocabularies = parseSimpleMap(topBlock(configLines, 'vocabularies'));
const publications = parseItems(topBlock(configLines, 'publications'));
const configuredSuperIndex = registry.find((doc) => doc.id === 'super-index')?.path;
const superIndexPath = configuredSuperIndex
  || (existsSync(join(root, 'CLAUDE.md')) ? 'CLAUDE.md' : 'AGENTS.md');
const superIndexText = superIndexPath && existsSync(join(root, superIndexPath))
  ? readFileSync(join(root, superIndexPath), 'utf8')
  : '';
const requiredHeadFields = ['title', 'id', 'role', 'status', 'doc_revision', 'updated', 'source_of', 'derived_from'];
const docMetrics = registry.map((doc) => {
  const absolute = join(root, doc.path);
  const missing = !existsSync(absolute);
  const text = missing ? '' : readFileSync(absolute, 'utf8');
  const head = parseHead(text);
  const body = head.body;
  const headings = (body.match(/^(##|###)\s/gm) || []).length;
  const flags = [];
  const headFindings = [];
  if (missing) headFindings.push('missing-file');
  else if (head.malformed) headFindings.push('malformed-head');
  else {
    for (const field of requiredHeadFields) if (!Object.hasOwn(head.fields, field)) headFindings.push(`missing:${field}`);
    if (head.fields.id && head.fields.id !== doc.id) headFindings.push(`id-mismatch:${head.fields.id}`);
    for (const [field, vocabulary] of [['role', 'roles'], ['status', 'statuses'], ['diataxis', 'diataxis'], ['page_kind', 'page_kinds']]) {
      const value = head.fields[field];
      const allowed = vocabularies[vocabulary];
      if (value && Array.isArray(allowed) && allowed.length && !allowed.includes(value)) headFindings.push(`invalid:${field}=${value}`);
    }
    if (head.fields.head_lines) {
      const declared = Number(head.fields.head_lines);
      if (!Number.isInteger(declared) || declared < head.lines) headFindings.push(`invalid:head_lines=${head.fields.head_lines}`);
    }
    for (const publication of publications) {
      const sourceRoot = String(publication.source_root || '').replace(/\\/g, '/').replace(/\/$/, '');
      const normalizedPath = String(doc.path || '').replace(/\\/g, '/');
      if (!sourceRoot || !(normalizedPath === sourceRoot || normalizedPath.startsWith(`${sourceRoot}/`))) continue;
      for (const field of publication.requires || []) if (!Object.hasOwn(head.fields, field)) headFindings.push(`publication-missing:${field}`);
      if (head.fields.page_kind === 'article') {
        for (const field of publication.article_requires || []) if (!Object.hasOwn(head.fields, field)) headFindings.push(`article-missing:${field}`);
      }
      if (head.fields.page_kind === 'landing') {
        for (const field of publication.landing_omits || []) if (Object.hasOwn(head.fields, field)) headFindings.push(`landing-forbids:${field}`);
      }
    }
    if (head.tokens > 256) flags.push('head-heavy');
  }
  if (headings >= thresholds.heading_warning) flags.push('heading-warning');
  if (headings >= thresholds.heading_split) flags.push('heading-split');
  if (body.length >= thresholds.char_warning) flags.push('size-warning');
  if (body.length >= thresholds.char_split) flags.push('size-split');
  if (flags.includes('heading-split') && flags.includes('size-split')) flags.push('split-recommended');
  if (doc.head_count_exempt === 'true' && flags.length) flags.push('exempt');
  if (missing) flags.push('missing');
  if (headFindings.length) flags.push('head-invalid');
  return {
    id: doc.id,
    path: doc.path,
    role: doc.role,
    chars: text.length,
    bodyChars: body.length,
    tokens: tokenEstimate(text.length, doc.path),
    headLines: head.lines,
    headChars: head.chars,
    headTokens: head.tokens,
    headFindings,
    headings,
    flags,
  };
});

const byId = new Map(docMetrics.map((doc) => [doc.id, doc]));
const skillFiles = existsSync(join(root, '.claude', 'commands'))
  ? readdirSync(join(root, '.claude', 'commands')).filter((name) => name.endsWith('.md'))
  : [];
const skillMetrics = skillFiles.map((name) => {
  const text = read(`.claude/commands/${name}`);
  const description = text.match(/^description:\s*(.+)$/m)?.[1] ?? '';
  return { id: name.replace(/\.md$/, ''), chars: text.length, tokens: tokenEstimate(text.length), description };
});
const skillsById = new Map(skillMetrics.map((skill) => [skill.id, skill]));
const roleUsage = new Map();
for (const role of roles) for (const id of role.required_docs || []) roleUsage.set(id, (roleUsage.get(id) || 0) + 1);

const roleMetrics = roles.map((role) => {
  const docTokens = (role.required_docs || []).reduce((sum, id) => sum + (byId.get(id)?.tokens || 0), 0);
  const codeTokens = (role.required_code || []).reduce((sum, path) => sum + tokenEstimate(pathChars(path), path), 0);
  const skillTokens = (role.required_skills || []).reduce((sum, id) => sum + (skillsById.get(id)?.tokens || 0), 0);
  return {
    name: role.name,
    ceremony: role.ceremony,
    recommendation: role.session_recommendation,
    docTokens,
    codeTokens,
    skillTokens,
    totalTokens: docTokens + codeTokens + skillTokens,
  };
});

const outliers = docMetrics.filter((doc) => {
  if (doc.tokens > 10000) return true;
  if (doc.tokens > 6000 && (roleUsage.get(doc.id) || 0) < 3) return true;
  return doc.tokens > 4000 && doc.flags.some((flag) => flag.includes('warning') || flag.includes('split'));
}).map((doc) => ({
  ...doc,
  category: doc.tokens > 10000
    ? 'heavy-doc'
    : doc.tokens > 6000 && (roleUsage.get(doc.id) || 0) < 3
      ? 'shrink-candidate'
      : 'structural',
}));

const superIndexTokens = tokenEstimate(superIndexText.length);
const descriptionTokens = skillMetrics.reduce((sum, skill) => sum + tokenEstimate(skill.description.length), 0);
const sessionFloor = 2000 + superIndexTokens + descriptionTokens;

// ── Git co-change coupling analysis (Improvement B) ──────────────

function hasGit() {
  try { execSync('git rev-parse --is-inside-work-tree', { cwd: root, stdio: 'pipe' }); return true; }
  catch { return false; }
}

function hasCommits() {
  try { execSync('git rev-parse HEAD', { cwd: root, stdio: 'pipe' }); return true; }
  catch { return false; }
}

function analyzeCoChangeCoupling(maxCommits = 200) {
  if (!hasGit() || !hasCommits()) {
    return { available: false, reason: 'no git history', pairs: [] };
  }

  try {
    // Get recent commits with their changed files
    const logOutput = execSync(
      `git log --name-only --pretty=format:"---COMMIT---" -n ${maxCommits}`,
      { cwd: root, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 },
    ).trim();

    const commits = logOutput.split('---COMMIT---').filter(Boolean).map(block => {
      return block.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('---'));
    }).filter(files => files.length > 1); // Only commits with 2+ files

    if (commits.length < 5) {
      return { available: false, reason: `too few multi-file commits (${commits.length})`, pairs: [] };
    }

    // Count co-occurrences for file pairs
    const pairCount = new Map();
    const fileCount = new Map();

    for (const files of commits) {
      for (const f of files) fileCount.set(f, (fileCount.get(f) || 0) + 1);
      // Generate pairs (limit to avoid combinatorial explosion on large commits)
      if (files.length > 20) continue;
      for (let i = 0; i < files.length; i++) {
        for (let j = i + 1; j < files.length; j++) {
          const key = [files[i], files[j]].sort().join(' <> ');
          pairCount.set(key, (pairCount.get(key) || 0) + 1);
        }
      }
    }

    // Filter to pairs with >= 30% co-change rate (relative to the less-frequent file)
    const pairs = [];
    for (const [key, count] of pairCount) {
      if (count < 3) continue; // minimum 3 co-occurrences
      const [fileA, fileB] = key.split(' <> ');
      const minFreq = Math.min(fileCount.get(fileA) || 0, fileCount.get(fileB) || 0);
      if (minFreq < 3) continue;
      const rate = count / minFreq;
      if (rate >= 0.3) {
        pairs.push({ fileA, fileB, coChanges: count, rate: Math.round(rate * 100) });
      }
    }

    pairs.sort((a, b) => b.rate - a.rate || b.coChanges - a.coChanges);
    return { available: true, commitsAnalyzed: commits.length, pairs: pairs.slice(0, 30) };
  } catch {
    return { available: false, reason: 'git log failed', pairs: [] };
  }
}

function findUnlinkedCoupling(couplingPairs, registryById) {
  // Check if co-changed pairs involving docs lack frontmatter relations
  const findings = [];
  for (const pair of couplingPairs) {
    const docA = [...registryById.values()].find(d => d.path === pair.fileA);
    const docB = [...registryById.values()].find(d => d.path === pair.fileB);

    // Both are registered docs — check if they have a relation
    if (docA && docB) {
      const aHead = parseHead(existsSync(join(root, pair.fileA)) ? readFileSync(join(root, pair.fileA), 'utf8') : '');
      const bHead = parseHead(existsSync(join(root, pair.fileB)) ? readFileSync(join(root, pair.fileB), 'utf8') : '');
      const aSourceOf = Array.isArray(aHead.fields.source_of) ? aHead.fields.source_of : [];
      const aDerivedFrom = Array.isArray(aHead.fields.derived_from) ? aHead.fields.derived_from : [];
      const bSourceOf = Array.isArray(bHead.fields.source_of) ? bHead.fields.source_of : [];
      const bDerivedFrom = Array.isArray(bHead.fields.derived_from) ? bHead.fields.derived_from : [];
      const aRelated = Array.isArray(aHead.fields.related) ? aHead.fields.related : [];
      const bRelated = Array.isArray(bHead.fields.related) ? bHead.fields.related : [];

      const hasRelation =
        aSourceOf.includes(docB.id) || aDerivedFrom.includes(docB.id) || aRelated.includes(docB.id) ||
        bSourceOf.includes(docA.id) || bDerivedFrom.includes(docA.id) || bRelated.includes(docA.id);

      if (!hasRelation) {
        findings.push({
          type: 'unlinked-doc-pair',
          fileA: pair.fileA,
          fileB: pair.fileB,
          idA: docA.id,
          idB: docB.id,
          rate: pair.rate,
          coChanges: pair.coChanges,
        });
      }
    }
  }
  return findings;
}

// ── Composite Doc Health Score (Improvement C) ────────────────────

function computeHealthScore(docMetricsArr, registryById) {
  const totalDocs = docMetricsArr.length;
  if (totalDocs === 0) return { score: 10, grade: 'A+', categories: {} };

  // Category 1: Head Validity & Syntax (25%)
  const docsWithValidHeads = docMetricsArr.filter(d => !d.flags.includes('head-invalid') && !d.flags.includes('missing')).length;
  const headValidityRatio = docsWithValidHeads / totalDocs;

  // Category 2: Relation Symmetry & Graph Integrity (25%)
  const allRelationFindings = docMetricsArr.flatMap(d => d.headFindings.filter(f => f.startsWith('missing:source_of') || f.startsWith('missing:derived_from')));
  // Check actual relation symmetry by scanning heads
  let totalRelations = 0;
  let brokenRelations = 0;
  for (const doc of docMetricsArr) {
    if (doc.flags.includes('missing')) continue;
    const text = existsSync(join(root, doc.path)) ? readFileSync(join(root, doc.path), 'utf8') : '';
    const head = parseHead(text);
    const sourceOf = Array.isArray(head.fields.source_of) ? head.fields.source_of : [];
    const derivedFrom = Array.isArray(head.fields.derived_from) ? head.fields.derived_from : [];
    for (const targetId of sourceOf) {
      totalRelations++;
      const targetDoc = docMetricsArr.find(d => d.id === targetId);
      if (!targetDoc || targetDoc.flags.includes('missing')) { brokenRelations++; continue; }
      const targetText = existsSync(join(root, targetDoc.path)) ? readFileSync(join(root, targetDoc.path), 'utf8') : '';
      const targetHead = parseHead(targetText);
      const targetDerived = Array.isArray(targetHead.fields.derived_from) ? targetHead.fields.derived_from : [];
      if (!targetDerived.includes(doc.id)) brokenRelations++;
    }
    for (const targetId of derivedFrom) {
      totalRelations++;
      const targetDoc = docMetricsArr.find(d => d.id === targetId);
      if (!targetDoc || targetDoc.flags.includes('missing')) { brokenRelations++; continue; }
      const targetText = existsSync(join(root, targetDoc.path)) ? readFileSync(join(root, targetDoc.path), 'utf8') : '';
      const targetHead = parseHead(targetText);
      const targetSourceOf = Array.isArray(targetHead.fields.source_of) ? targetHead.fields.source_of : [];
      if (!targetSourceOf.includes(doc.id)) brokenRelations++;
    }
  }
  const relationSymmetryRatio = totalRelations === 0 ? 1.0 : (totalRelations - brokenRelations) / totalRelations;

  // Category 3: Index & Catalog Coverage (20%)
  // Check if super-index exists and references registered docs
  let indexedDocs = 0;
  for (const doc of docMetricsArr) {
    if (doc.id === 'super-index') continue;
    if (superIndexText.includes(doc.id) || superIndexText.includes(doc.path)) indexedDocs++;
  }
  const indexCoverageRatio = totalDocs <= 1 ? 1.0 : indexedDocs / (totalDocs - 1);

  // Category 4: Structural Economy & TOC (15%)
  // Docs with >4 H2 sections should have toc in frontmatter
  let docsNeedingToc = 0;
  let docsWithToc = 0;
  for (const doc of docMetricsArr) {
    if (doc.flags.includes('missing')) continue;
    if (doc.headings >= 4) {
      docsNeedingToc++;
      const text = existsSync(join(root, doc.path)) ? readFileSync(join(root, doc.path), 'utf8') : '';
      const head = parseHead(text);
      if (head.fields.toc || head.raw.includes('toc:')) docsWithToc++;
    }
  }
  const tocRatio = docsNeedingToc === 0 ? 1.0 : docsWithToc / docsNeedingToc;
  // Also factor in split recommendations
  const splitCount = docMetricsArr.filter(d => d.flags.includes('split-recommended') && !d.flags.includes('exempt')).length;
  const splitPenalty = Math.min(splitCount * 0.15, 0.5);
  const structuralRatio = Math.max(0, tocRatio - splitPenalty);

  // Category 5: Token & Size Economy (15%)
  const avgTokens = docMetricsArr.reduce((s, d) => s + d.tokens, 0) / totalDocs;
  // Score based on average tokens: <=2000 = 1.0, >=8000 = 0.0
  const tokenRatio = Math.max(0, Math.min(1, 1 - (avgTokens - 2000) / 6000));
  const heavyCount = docMetricsArr.filter(d => d.tokens > 10000 && !d.flags.includes('exempt')).length;
  const heavyPenalty = Math.min(heavyCount * 0.1, 0.4);
  const economyRatio = Math.max(0, tokenRatio - heavyPenalty);

  // Weighted composite
  const raw = (
    headValidityRatio * 0.25 +
    relationSymmetryRatio * 0.25 +
    indexCoverageRatio * 0.20 +
    structuralRatio * 0.15 +
    economyRatio * 0.15
  );
  const score = Math.round(Math.max(1, Math.min(10, raw * 10)) * 10) / 10;

  const grade = score >= 9.5 ? 'A+' : score >= 8.5 ? 'A' : score >= 7.5 ? 'B+' :
    score >= 6.5 ? 'B' : score >= 5.5 ? 'C+' : score >= 4.5 ? 'C' :
    score >= 3.5 ? 'D' : 'F';

  return {
    score,
    grade,
    categories: {
      headValidity: { weight: '25%', ratio: Math.round(headValidityRatio * 100), detail: `${docsWithValidHeads}/${totalDocs} valid` },
      relationSymmetry: { weight: '25%', ratio: Math.round(relationSymmetryRatio * 100), detail: `${totalRelations - brokenRelations}/${totalRelations} symmetric` },
      indexCoverage: { weight: '20%', ratio: Math.round(indexCoverageRatio * 100), detail: `${indexedDocs}/${Math.max(totalDocs - 1, 1)} indexed` },
      structuralEconomy: { weight: '15%', ratio: Math.round(structuralRatio * 100), detail: `${docsWithToc}/${docsNeedingToc} have toc; ${splitCount} split-recommended` },
      tokenEconomy: { weight: '15%', ratio: Math.round(economyRatio * 100), detail: `avg ~${Math.round(avgTokens)} tokens; ${heavyCount} heavy` },
    },
  };
}

// ── Build model ───────────────────────────────────────────────────

const healthScore = computeHealthScore(docMetrics, byId);

const model = {
  generatedAt: new Date().toISOString(),
  sessionFloor,
  healthScore,
  docs: docMetrics,
  skills: skillMetrics,
  roles: roleMetrics,
  outliers,
  headFindings: docMetrics.flatMap((doc) => doc.headFindings.map((finding) => ({ id: doc.id, path: doc.path, finding }))),
  totals: {
    docs: docMetrics.length,
    docTokens: docMetrics.reduce((sum, doc) => sum + doc.tokens, 0),
    skills: skillMetrics.length,
    skillTokens: skillMetrics.reduce((sum, skill) => sum + skill.tokens, 0),
  },
};

if (args.has('--json')) {
  // Include coupling data in JSON if requested
  if (args.has('--coupling')) {
    const coupling = analyzeCoChangeCoupling();
    model.coupling = coupling;
    if (coupling.available) {
      model.coupling.unlinked = findUnlinkedCoupling(coupling.pairs, byId);
    }
  }
  console.log(JSON.stringify(model, null, 2));
  process.exit(0);
}

function sizes() {
  console.log('Doc sizes (estimated tokens)');
  console.log('ID'.padEnd(44), 'Tokens'.padStart(8), 'H2/H3'.padStart(6), 'Flags');
  for (const doc of docMetrics) {
    console.log(doc.id.slice(0, 43).padEnd(44), String(doc.tokens).padStart(8), String(doc.headings).padStart(6), doc.flags.join(', ') || '—');
  }
}

function headTable() {
  console.log('Complete FEEL heads (estimated tokens)');
  console.log('ID'.padEnd(44), 'Lines'.padStart(7), 'Tokens'.padStart(8), 'Findings');
  for (const doc of docMetrics) {
    console.log(
      doc.id.slice(0, 43).padEnd(44),
      String(doc.headLines || 0).padStart(7),
      String(doc.headTokens || 0).padStart(8),
      doc.headFindings.join(', ') || (doc.flags.includes('head-heavy') ? 'head-heavy' : '—'),
    );
  }
}

function roleTable() {
  console.log('Role budgets (estimated tokens; excludes conversation history)');
  console.log('Role'.padEnd(24), 'Docs'.padStart(8), 'Code'.padStart(8), 'Skills'.padStart(8), 'Total'.padStart(8), 'Rec.');
  for (const role of roleMetrics) {
    console.log(role.name.slice(0, 23).padEnd(24), String(role.docTokens).padStart(8), String(role.codeTokens).padStart(8), String(role.skillTokens).padStart(8), String(role.totalTokens).padStart(8), role.recommendation || '—');
  }
}

function outlierTable() {
  console.log('Outliers');
  if (!outliers.length) {
    console.log('  none');
    return;
  }
  for (const doc of outliers) console.log(`  ${doc.id}: ~${doc.tokens} tokens [${doc.category}]${doc.flags.includes('exempt') ? ' (exempt)' : ''}`);
}

function scoreTable() {
  console.log(`Doc Health Score: ${healthScore.score}/10  [${healthScore.grade}]`);
  console.log('');
  console.log('Category'.padEnd(28), 'Weight'.padStart(8), 'Score'.padStart(8), 'Detail');
  const cats = healthScore.categories;
  for (const [key, cat] of Object.entries(cats)) {
    const name = key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
    console.log(name.padEnd(28), cat.weight.padStart(8), `${cat.ratio}%`.padStart(8), `  ${cat.detail}`);
  }
}

function couplingTable() {
  const coupling = analyzeCoChangeCoupling();
  console.log('Git co-change coupling analysis');
  if (!coupling.available) {
    console.log(`  unavailable: ${coupling.reason}`);
    return;
  }
  console.log(`  Commits analyzed: ${coupling.commitsAnalyzed}`);
  if (!coupling.pairs.length) {
    console.log('  No significant co-change patterns found.');
    return;
  }
  console.log('');
  console.log('  File A'.padEnd(36), 'File B'.padEnd(36), 'Rate'.padStart(6), 'Co-changes'.padStart(12));
  for (const p of coupling.pairs.slice(0, 20)) {
    console.log(`  ${p.fileA.slice(0, 33).padEnd(34)} ${p.fileB.slice(0, 33).padEnd(34)} ${(p.rate + '%').padStart(6)} ${String(p.coChanges).padStart(12)}`);
  }
  const unlinked = findUnlinkedCoupling(coupling.pairs, byId);
  if (unlinked.length) {
    console.log('');
    console.log('  ⚠  Unlinked doc pairs (co-changed but no frontmatter relation):');
    for (const u of unlinked) {
      console.log(`    ${u.idA} <> ${u.idB}  (${u.rate}% co-change rate, ${u.coChanges} co-commits)`);
    }
  }
}

if (args.has('--sizes')) sizes();
else if (args.has('--heads')) headTable();
else if (args.has('--roles')) roleTable();
else if (args.has('--outliers')) outlierTable();
else if (args.has('--score')) scoreTable();
else if (args.has('--coupling')) couplingTable();
else {
  console.log(`FEEL health — ${new Date().toISOString().slice(0, 10)}`);
  console.log(`Session floor: ~${sessionFloor} tokens`);
  console.log(`Docs: ${model.totals.docs} files / ~${model.totals.docTokens} tokens`);
  console.log(`Skills: ${model.totals.skills} files / ~${model.totals.skillTokens} tokens`);
  console.log(`Heads: ${model.headFindings.length ? `${model.headFindings.length} finding(s)` : 'valid'}`);
  console.log(`Health: ${healthScore.score}/10  [${healthScore.grade}]`);
  console.log('');
  scoreTable();
  console.log('');
  roleTable();
  console.log('');
  outlierTable();
}
