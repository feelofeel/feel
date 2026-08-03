#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

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

const claudeTokens = existsSync(join(root, 'CLAUDE.md')) ? tokenEstimate(read('CLAUDE.md').length) : 0;
const descriptionTokens = skillMetrics.reduce((sum, skill) => sum + tokenEstimate(skill.description.length), 0);
const sessionFloor = 2000 + claudeTokens + descriptionTokens;
const model = {
  generatedAt: new Date().toISOString(),
  sessionFloor,
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

if (args.has('--sizes')) sizes();
else if (args.has('--heads')) headTable();
else if (args.has('--roles')) roleTable();
else if (args.has('--outliers')) outlierTable();
else {
  console.log(`FEEL health — ${new Date().toISOString().slice(0, 10)}`);
  console.log(`Session floor: ~${sessionFloor} tokens`);
  console.log(`Docs: ${model.totals.docs} files / ~${model.totals.docTokens} tokens`);
  console.log(`Skills: ${model.totals.skills} files / ~${model.totals.skillTokens} tokens`);
  console.log(`Heads: ${model.headFindings.length ? `${model.headFindings.length} finding(s)` : 'valid'}`);
  console.log('');
  roleTable();
  console.log('');
  outlierTable();
}
