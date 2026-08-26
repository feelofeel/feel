#!/usr/bin/env node
/**
 * feel-install — deploy FEEL to a project, measure the cost
 *
 * Usage:
 *   node feel/tools/install.mjs [target-dir] [options]
 *
 * Options:
 *   --dry-run   show what would happen, don't write files
 *   --yes       skip interactive prompts (use safe defaults)
 *   --bench     benchmark mode: implies --yes, prints timing, writes session brief
 *   --upgrade   replace FEEL-owned core files while preserving project data
 *
 * What it does (all mechanical, no AI, $0):
 *   Phase 1  Copy FEEL core files into target (feel.md, skills, templates)
 *   Phase 2  Resolve CLAUDE.md conflict interactively (or auto with --yes)
 *   Phase 3  Create AGENTS.md bridge if missing
 *   Phase 4  Add skeleton YAML heads to every .md that lacks one
 *   Phase 5  Write .feel/install-brief.md — ready to paste into an AI session
 *
 * The AI verification pass (head review, relation wiring, index build) happens
 * in a separate session AFTER this script. That pass is the metered part;
 * this script outputs the token/cost estimate for it so you know before you start.
 */

import {
  readFileSync, writeFileSync, existsSync, mkdirSync,
  readdirSync, statSync, copyFileSync,
} from 'fs'
import { join, relative, basename, extname, dirname, resolve } from 'path'
import { createInterface } from 'readline'
import { fileURLToPath } from 'url'

// ── paths ─────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

// This script lives at tools/install.mjs inside the standalone FEEL repo.
const FEEL_DIR     = resolve(__dirname, '..')
const SPEC_FILE    = join(FEEL_DIR, 'docs', 'conventions', 'feel.md')
const ADOPTION_FILE = join(FEEL_DIR, 'docs', 'conventions', 'feel-adoption.md')
const CFG_FILE     = join(FEEL_DIR, 'templates', 'feel.config.yaml')
const SKILLS_DIR   = join(FEEL_DIR, '.claude', 'commands')
const HEALTH_TOOL  = join(FEEL_DIR, 'tools', 'feel', 'health.mjs')
const ROUTE_DIFF_TOOL = join(FEEL_DIR, 'tools', 'feel', 'route-diff.mjs')
const LICENSE_FILE = join(FEEL_DIR, 'LICENSE')
const TMPL_DIR   = join(FEEL_DIR, 'templates')

const CORE_SKILLS = ['feel-doc', 'feel-decision', 'feel-repeat', 'feel-session', 'feel-health']

const START_MS = Date.now()

// ── arg parsing ───────────────────────────────────────────────────

function parseArgs() {
  const raw  = process.argv.slice(2)
  const flags = new Set()
  let targetDir = null
  for (const a of raw) {
    if (a.startsWith('--')) flags.add(a.slice(2))
    else if (!targetDir) targetDir = resolve(a)
  }
  const bench   = flags.has('bench')
  const yes     = flags.has('yes') || bench
  const dryRun  = flags.has('dry-run')
  const upgrade = flags.has('upgrade')
  return { targetDir: targetDir || process.cwd(), dryRun, yes, bench, upgrade }
}

// ── terminal I/O ──────────────────────────────────────────────────

const rl = createInterface({ input: process.stdin, output: process.stdout })

const prompt = q => new Promise(res => rl.question(q, res))

const log  = (...a) => console.log(...a)
const step = msg    => console.log(`\n▸ ${msg}`)
const ok   = msg    => console.log(`  ✓  ${msg}`)
const skip = msg    => console.log(`  ·  ${msg}`)
const warn = msg    => console.log(`  ⚠  ${msg}`)

// ── file utilities ────────────────────────────────────────────────

function ensureDir(dir, dryRun) {
  if (!dryRun && !existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function write(dest, content, dryRun) {
  ensureDir(dirname(dest), dryRun)
  if (!dryRun) writeFileSync(dest, content, 'utf8')
}

function safeCopy(src, dest, dryRun) {
  ensureDir(dirname(dest), dryRun)
  if (!dryRun) copyFileSync(src, dest)
}

function read(p) { return readFileSync(p, 'utf8') }

function walkMd(dir, base, out = []) {
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.') || entry === 'node_modules') continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) { walkMd(full, base, out); continue }
    if (entry.endsWith('.md')) out.push({ full, rel: relative(base, full) })
  }
  return out
}

// ── head detection & building ─────────────────────────────────────

function hasFeelHead(content) {
  if (!content.startsWith('---')) return false
  const close = content.indexOf('\n---', 4)
  if (close === -1) return false
  const head = content.slice(0, close)
  return head.includes('doc_revision:') || head.includes('feel_version:')
}

function guessRole(rel) {
  const p = rel.replace(/\\/g, '/')
  if (/\/(index)\.md$/i.test(p) || /^(CLAUDE|AGENTS)\.md$/i.test(p))  return 'index'
  if (/\/history\//i.test(p) || /decisions/i.test(p))                  return 'log'
  if (/\/guides\//i.test(p))                                            return 'guide'
  if (/\/conventions\//i.test(p))                                       return 'convention'
  if (/\/research\//i.test(p))                                          return 'research'
  if (/architecture|rationale/i.test(p))                               return 'rationale'
  if (/invariants|glossary|endpoints|reference/i.test(p))              return 'reference'
  if (/roadmap|plan/i.test(p))                                         return 'plan'
  return 'spec'
}

function guessId(rel) {
  return basename(rel, extname(rel)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function readTitle(content) {
  const m = content.match(/^#{1,2}\s+(.+)$/m)
  return m ? m[1].replace(/\*\*/g, '').trim() : null
}

function today() { return new Date().toISOString().slice(0, 10) }

function buildHead({ title, id, role, updated, appVersion }) {
  const lines = ['---', `title: ${title}`, `id: ${id}`, `role: ${role}`, `status: draft`, `doc_revision: 1`]
  if (appVersion) lines.push(`app_version: ${appVersion}`)
  lines.push(`updated: ${updated}`, `source_of: []`, `derived_from: []`, '---', '')
  return lines.join('\n')
}

// ── package version ───────────────────────────────────────────────

function readPackageVersion(targetDir) {
  const p = join(targetDir, 'package.json')
  if (!existsSync(p)) return null
  try { return JSON.parse(read(p)).version || null } catch { return null }
}

// ── phase 1: copy FEEL core ───────────────────────────────────────

function copyFeelCore(targetDir, dryRun) {
  const copied = [], skipped = []

  const tryFile = (src, dest, label) => {
    if (!existsSync(src)) { warn(`source missing: ${src}`); return }
    if (existsSync(dest)) { skipped.push(`${label} (exists)`); return }
    safeCopy(src, dest, dryRun)
    copied.push(label)
  }

  // feel.md spec
  tryFile(SPEC_FILE, join(targetDir, 'docs', 'conventions', 'feel.md'), 'docs/conventions/feel.md')
  tryFile(ADOPTION_FILE, join(targetDir, 'docs', 'conventions', 'feel-adoption.md'), 'docs/conventions/feel-adoption.md')

  // core skills
  const cmdDir = join(targetDir, '.claude', 'commands')
  ensureDir(cmdDir, dryRun)
  for (const s of CORE_SKILLS) {
    tryFile(join(SKILLS_DIR, `${s}.md`), join(cmdDir, `${s}.md`), `.claude/commands/${s}.md`)
  }

  // deterministic helper used by feel-health and feel-repeat size checks
  tryFile(HEALTH_TOOL, join(targetDir, 'tools', 'feel', 'health.mjs'), 'tools/feel/health.mjs')
  tryFile(ROUTE_DIFF_TOOL, join(targetDir, 'tools', 'feel', 'route-diff.mjs'), 'tools/feel/route-diff.mjs')

  // feel.config.yaml (template — user must replace PROJECT DATA)
  tryFile(CFG_FILE, join(targetDir, 'docs', 'feel.config.yaml'), 'docs/feel.config.yaml (template)')

  // skeleton docs
  tryFile(join(TMPL_DIR, 'decisions.md'), join(targetDir, 'docs', 'history', 'decisions.md'), 'docs/history/decisions.md')
  tryFile(join(TMPL_DIR, 'docs-index.md'), join(targetDir, 'docs', 'index.md'), 'docs/index.md')

  // Preserve FEEL's license notice without changing the host project's license.
  tryFile(LICENSE_FILE, join(targetDir, '.feel', 'LICENSE'), '.feel/LICENSE')

  // Version pin for future drift checks. Version control is optional.
  const lockDest = join(targetDir, '.feel', 'feel.lock')
  if (!existsSync(lockDest)) {
    const spec = existsSync(SPEC_FILE) ? read(SPEC_FILE) : ''
    const feelVersion = spec.match(/^feel_version:\s*["']?([^"'\s]+)["']?/m)?.[1] || 'unknown'
    write(lockDest, [
      'framework: FEEL',
      `feel_version: "${feelVersion}"`,
      'source: https://github.com/feelofeel/feel',
      `installed_at: ${today()}`,
      'adoption_layer: undecided',
      '',
    ].join('\n'), dryRun)
    copied.push('.feel/feel.lock')
  } else {
    skipped.push('.feel/feel.lock (exists)')
  }

  return { copied, skipped }
}

// ── upgrade mode: replace core files non-destructively ───────────

function upgradeFeelCore(targetDir, dryRun) {
  const updated = [], skipped = []
  const spec = existsSync(SPEC_FILE) ? read(SPEC_FILE) : ''
  const feelVersion = spec.match(/^feel_version:\s*["']?([^"'\s]+)["']?/m)?.[1] || 'unknown'

  const overwriteFile = (src, dest, label) => {
    if (!existsSync(src)) { warn(`source missing: ${src}`); return }
    safeCopy(src, dest, dryRun)
    updated.push(label)
  }

  // Update spec and adoption guide
  overwriteFile(SPEC_FILE, join(targetDir, 'docs', 'conventions', 'feel.md'), 'docs/conventions/feel.md')
  overwriteFile(ADOPTION_FILE, join(targetDir, 'docs', 'conventions', 'feel-adoption.md'), 'docs/conventions/feel-adoption.md')

  // Update core skills
  const cmdDir = join(targetDir, '.claude', 'commands')
  ensureDir(cmdDir, dryRun)
  for (const s of CORE_SKILLS) {
    overwriteFile(join(SKILLS_DIR, `${s}.md`), join(cmdDir, `${s}.md`), `.claude/commands/${s}.md`)
  }

  // Update tools
  overwriteFile(HEALTH_TOOL, join(targetDir, 'tools', 'feel', 'health.mjs'), 'tools/feel/health.mjs')
  overwriteFile(ROUTE_DIFF_TOOL, join(targetDir, 'tools', 'feel', 'route-diff.mjs'), 'tools/feel/route-diff.mjs')
  overwriteFile(LICENSE_FILE, join(targetDir, '.feel', 'LICENSE'), '.feel/LICENSE')

  // Merge feel.config.yaml framework schema (preserving project data)
  const cfgDest = join(targetDir, 'docs', 'feel.config.yaml')
  if (existsSync(cfgDest) && existsSync(CFG_FILE)) {
    const existingCfg = read(cfgDest)
    const tmplCfg = read(CFG_FILE)
    const schemaMarker = '# FRAMEWORK SCHEMA'
    // The explanatory header also names FRAMEWORK SCHEMA. The final occurrence
    // is the actual section boundary that separates project data from FEEL data.
    const schemaIdxExisting = existingCfg.lastIndexOf(schemaMarker)
    const schemaIdxTmpl = tmplCfg.lastIndexOf(schemaMarker)

    if (schemaIdxTmpl !== -1) {
      const frameworkSchema = tmplCfg.slice(schemaIdxTmpl)
      let mergedCfg = ''
      if (schemaIdxExisting !== -1) {
        mergedCfg = existingCfg.slice(0, schemaIdxExisting) + frameworkSchema
      } else {
        mergedCfg = existingCfg.trimEnd() + '\n\n' + frameworkSchema
      }
      write(cfgDest, mergedCfg, dryRun)
      updated.push('docs/feel.config.yaml (framework schema merged)')
    }
  } else if (!existsSync(cfgDest)) {
    safeCopy(CFG_FILE, cfgDest, dryRun)
    updated.push('docs/feel.config.yaml (template)')
  }

  // Update lockfile
  const lockDest = join(targetDir, '.feel', 'feel.lock')
  const existingLock = existsSync(lockDest) ? read(lockDest) : ''
  const installedAt = existingLock.match(/^installed_at:\s*(.+)$/m)?.[1] || today()
  const adoptionLayer = existingLock.match(/^adoption_layer:\s*(.+)$/m)?.[1] || 'undecided'

  write(lockDest, [
    'framework: FEEL',
    `feel_version: "${feelVersion}"`,
    'source: https://github.com/feelofeel/feel',
    `installed_at: ${installedAt}`,
    `upgraded_at: ${today()}`,
    `adoption_layer: ${adoptionLayer}`,
    '',
  ].join('\n'), dryRun)
  updated.push('.feel/feel.lock')

  return { updated, skipped, feelVersion }
}

// ── phase 2: CLAUDE.md ────────────────────────────────────────────

async function resolveClaudeMd(targetDir, dryRun, yes) {
  const dest     = join(targetDir, 'CLAUDE.md')
  const template = join(TMPL_DIR, 'CLAUDE.md')

  if (!existsSync(dest)) {
    if (existsSync(template)) { safeCopy(template, dest, dryRun); ok('CLAUDE.md created from template') }
    else warn('no CLAUDE.md template found — create one from feel/templates/CLAUDE.md')
    return 'created'
  }

  // existing CLAUDE.md — show summary
  const existing = read(dest)
  const headers  = (existing.match(/^#{1,3} .+$/gm) || []).slice(0, 10)
  log('\n  Existing CLAUDE.md sections:')
  headers.forEach(h => log(`    ${h}`))

  if (existing.includes('<!-- FEEL framework rules -->')) {
    skip('CLAUDE.md already contains FEEL framework rules block')
    return 'already-wired'
  }

  log('\n  FEEL wants to append its operating-rules block (Behavioral guidelines, Project excellency, Skill family).')

  let choice = 'A'
  if (!yes) {
    log('\n  A) Append FEEL block to your existing CLAUDE.md  (recommended)')
    log('  B) Skip — I will merge manually after the script')
    log('  C) Replace entirely with the FEEL template (loses your current content)')
    choice = ((await prompt('  Choice [A/b/c]: ')) || 'A').toUpperCase().trim()[0] || 'A'
  } else {
    log('  --yes: appending FEEL block (A)')
  }

  if (choice === 'C') {
    if (existsSync(template)) { safeCopy(template, dest, dryRun); ok('CLAUDE.md replaced with template') }
    return 'replaced'
  }
  if (choice === 'B') {
    skip('CLAUDE.md skipped — merge manually; the FEEL block to append is in feel/templates/CLAUDE.md between the <!-- FEEL framework rules --> fences')
    return 'skipped'
  }

  // option A: append the FEEL block
  if (!existsSync(template)) { warn('template missing — cannot append'); return 'error' }
  const tmpl  = read(template)
  const start = tmpl.indexOf('<!-- FEEL framework rules -->')
  const end   = tmpl.indexOf('<!-- /FEEL framework rules -->')
  const block = start !== -1 && end !== -1
    ? tmpl.slice(start, end + '<!-- /FEEL framework rules -->'.length)
    : tmpl  // fallback: append whole template

  write(dest, existing.trimEnd() + '\n\n' + block + '\n', dryRun)
  ok('CLAUDE.md: FEEL block appended')
  return 'appended'
}

// ── phase 3: AGENTS.md ────────────────────────────────────────────

function resolveAgentsMd(targetDir, dryRun) {
  const dest = join(targetDir, 'AGENTS.md')
  if (existsSync(dest)) {
    const content = read(dest)
    if (content.includes('CLAUDE.md')) { skip('AGENTS.md exists and references CLAUDE.md'); return }
    warn('AGENTS.md exists but does not reference CLAUDE.md — check it points to the super-index')
    return
  }
  write(dest, [
    '---',
    'title: Agent entry point',
    'id: agents-bridge',
    'role: index',
    'status: living',
    'doc_revision: 1',
    `updated: ${today()}`,
    'source_of: []',
    'derived_from: []',
    '---',
    '',
    '# Agent entry point',
    '',
    '`CLAUDE.md` is the canonical super-index for this repository.',
    '',
    'Agents that load `AGENTS.md` must immediately read and follow `CLAUDE.md`.',
    'If this file and `CLAUDE.md` ever conflict, `CLAUDE.md` wins.',
    'Drift is expected because `CLAUDE.md` is the always-current super-index;',
    'do not duplicate project rules here.',
    '',
  ].join('\n'), dryRun)
  ok('AGENTS.md created')
}

// ── phase 4: skeleton heads ───────────────────────────────────────

function addSkeletonHeads(targetDir, dryRun, appVersion) {
  const rootMd = ['CLAUDE.md', 'AGENTS.md', 'README.md']
    .map(f => ({ full: join(targetDir, f), rel: f }))
    .filter(f => existsSync(f.full))

  // skip README.md — it's a project file, not a FEEL doc
  const candidates = [
    ...rootMd.filter(f => f.rel !== 'README.md'),
    ...walkMd(join(targetDir, 'docs'), targetDir),
  ].filter(f => !f.rel.replace(/\\/g, '/').startsWith('docs/feel.config'))

  const briefLines = []
  let headed = 0, added = 0

  for (const { full, rel } of candidates) {
    const content = read(full)
    if (hasFeelHead(content)) { headed++; continue }

    const id    = guessId(rel)
    const role  = guessRole(rel)
    const title = readTitle(content) || id
    const head  = buildHead({ title, id, role, updated: today(), appVersion })
    write(full, head + content, dryRun)
    added++
    briefLines.push(`  - \`${rel}\`  role: ${role}  → verify, add relations`)
  }

  const totalChars = candidates.reduce((s, { full }) => {
    try { return s + statSync(full).size } catch { return s }
  }, 0)

  return { headed, added, totalChars, briefLines }
}

// ── phase 5: session brief ────────────────────────────────────────

function writeSessionBrief(targetDir, { core, heads, claudeMd, elapsed, dryRun }) {
  // Token estimates — conservative: 4 chars/token
  // AI phase: ~1.5k tokens per file needing head review (verify + possible edit)
  //          + ~5k for one index/catalog pass + feel-health + feel-repeat
  const aiTokens = heads.added * 1500 + 5000
  // Sonnet 4.6: $3/Mtok input. Assume 40% cache hit on second+ files → ×0.7 effective.
  const aiCostUsd = ((aiTokens * 0.7 * 3) / 1_000_000).toFixed(3)

  const lines = [
    '# FEEL install — AI session brief',
    `generated: ${new Date().toISOString().slice(0, 16)}`,
    `target: ${targetDir}`,
    `install-time: ${elapsed.toFixed(1)}s  (mechanical only, no AI)`,
    '',
    '## Installed',
    ...core.copied.map(f => `- ✓ ${f}`),
    ...(core.skipped.length ? core.skipped.map(f => `- · ${f}`) : []),
    `- CLAUDE.md: ${claudeMd}`,
    '',
    '## AI verification phase (this is the metered part)',
    `Files with new skeleton heads: ${heads.added}`,
    `Files already headed:          ${heads.headed}`,
    `Token estimate:                ~${(aiTokens / 1000).toFixed(0)}k tokens`,
    `Cost estimate:                 ~$${aiCostUsd}  (Sonnet 4.6, 70% cache rate)`,
    '',
    '## What the AI needs to do',
    '1. For each file below, run /feel-doc: verify guessed role/status, fill title if placeholder, add source_of/derived_from relations.',
    '2. Populate the CLAUDE.md catalog and change-type router (replace {{placeholders}}).',
    '3. Run /feel-repeat to check relation symmetry.',
    '4. Run /feel-health to confirm session floor and outliers.',
    '',
    '## Files needing head verification',
    ...heads.briefLines,
    '',
    '## Session opener — paste this at the start of your AI session',
    '```',
    `FEEL was just installed into this repo. ${heads.added} docs have skeleton heads that need`,
    `verification (role, status, relations). Start with /feel-session to orient, then work`,
    `through the file list in .feel/install-brief.md — /feel-doc on each. When the list is`,
    `clear, build the CLAUDE.md catalog and router, then run /feel-health and /feel-repeat.`,
    '```',
  ]

  const brief = lines.join('\n')
  const briefDir = join(targetDir, '.feel')
  if (!dryRun) {
    ensureDir(briefDir, dryRun)
    writeFileSync(join(briefDir, 'install-brief.md'), brief, 'utf8')
  }
  return { brief, aiTokens, aiCostUsd }
}

// ── main ──────────────────────────────────────────────────────────

async function main() {
  const { targetDir, dryRun, yes, bench, upgrade } = parseArgs()

  if (upgrade) {
    log(`\nfeel-upgrade${dryRun ? '  (dry run — no files written)' : ''}`)
    log(`target: ${targetDir}`)

    if (!existsSync(targetDir)) {
      log(`error: target directory does not exist`)
      process.exit(1)
    }

    step('1/1  Upgrading FEEL core files')
    const res = upgradeFeelCore(targetDir, dryRun)
    res.updated.forEach(ok)
    res.skipped.forEach(skip)

    const elapsed = (Date.now() - START_MS) / 1000
    log('\n' + '─'.repeat(52))
    log(`feel-upgrade complete in ${elapsed.toFixed(1)}s (upgraded to ${res.feelVersion})`)
    log(`Zero-churn upgrade: project docs, doc_revisions, and custom rules preserved.`)
    log('─'.repeat(52))
    log()

    rl.close()
    return
  }

  log(`\nfeel-install${dryRun ? '  (dry run — no files written)' : ''}`)
  log(`target: ${targetDir}`)

  if (!existsSync(targetDir)) {
    log(`error: target directory does not exist`)
    process.exit(1)
  }

  const appVersion = readPackageVersion(targetDir)
  if (appVersion) log(`package version: ${appVersion}`)

  // ── phases ─────────────────────────────────────────────────────

  step('1/4  Copy FEEL core files')
  const core = copyFeelCore(targetDir, dryRun)
  core.copied.forEach(ok)
  core.skipped.forEach(skip)

  step('2/4  Resolve CLAUDE.md')
  const claudeMd = await resolveClaudeMd(targetDir, dryRun, yes)

  step('3/4  AGENTS.md')
  resolveAgentsMd(targetDir, dryRun)

  step('4/4  Add skeleton heads to existing docs')
  const heads = addSkeletonHeads(targetDir, dryRun, appVersion)
  log(`  ${heads.added} new heads written · ${heads.headed} already present`)

  // ── brief + summary ────────────────────────────────────────────

  const elapsed = (Date.now() - START_MS) / 1000
  const { aiTokens, aiCostUsd } = writeSessionBrief(targetDir, { core, heads, claudeMd, elapsed, dryRun })

  log('\n' + '─'.repeat(52))
  log(`feel-install complete in ${elapsed.toFixed(1)}s`)
  log(`Mechanical phase:  $0.00  (no AI used)`)
  log(`AI phase estimate: ~${(aiTokens / 1000).toFixed(0)}k tokens  ~$${aiCostUsd}`)
  if (!dryRun) log(`Session brief:     .feel/install-brief.md`)
  log('─'.repeat(52))
  log()
  log(`Next: open an AI session in ${targetDir}`)
  log(`      paste the session opener from .feel/install-brief.md`)
  log()

  rl.close()
}

main().catch(e => { console.error(e); rl.close(); process.exit(1) })
