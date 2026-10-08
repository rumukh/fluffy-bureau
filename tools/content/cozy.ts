// «Уютный денёк» pack checks: residents' tea stories (T28), the shop (T29, T11), decor slots and
// ranks (D12). Economy (T11, T32): level 1 buttons cover about half of the cosmetics and levels 1+2
// cover all; level 1 hearts buy a first decoration with a cup of tea, and levels 1+2 cover almost all
// decorations. Hearts are counted from the case data, not from constants.
import type { CozyDay, Reward } from '../../packages/content/src/schema.ts';
import type { Issue } from './flow.ts';
import { checkAssetId, type AssetLedger, type AssetTier } from './staging.ts';

/** T11: buttons per first solve of a case at levels 1/2/3, and for the prologue. */
export const BUTTONS = { prologue: 5, l1: 10, l2: 15, l3: 20 };
export const PRICE = { cosmetic: [5, 25], decor: [3, 8], tea: 2 } as const;
/** T32: share of the decorations (through the shop horizon) that hearts from levels 1+2 must cover. */
export const DECOR_COVER_L12 = 0.75;

const HEART_KEY = /^case(\d\d):(?:l([123]):)?heart:/;

/**
 * Hearts a player earns through case `horizon` playing only the given levels: cocoa hearts and the
 * T32 finale help-hearts, each claimed once per difficulty. Keys without a level are level 1 (Stage 1).
 */
export function heartsEarned(rewards: Reward[], horizon: number, levels: number[]): number {
  let n = 0;
  for (const r of rewards) {
    if (r.kind !== 'hearts') continue;
    const m = HEART_KEY.exec(r.claimKey);
    if (!m) continue;
    if (Number(m[1]) <= horizon && levels.includes(Number(m[2] ?? 1))) n += r.amount;
  }
  return n;
}

export function cozyRefs(c: CozyDay, rewards: Reward[]): string[] {
  const out: string[] = [];
  for (const r of c.residents) { out.push(r.invite); r.stories.forEach((s) => out.push(...s)); }
  for (const s of c.shop) out.push(s.label);
  for (const d of c.decorSlots) out.push(d.label);
  for (const r of c.ranks) {
    out.push(r.label, ...r.message);
    const rw = rewards.find((x) => x.id === r.reward);
    if (rw) out.push(rw.label);
  }
  out.push(...c.lines.intro, ...c.lines.bought, ...c.lines.returned, ...c.lines.notEnough, ...c.lines.teaThanks);
  return out;
}

interface Ctx {
  speakers: string[];
  rewards: Reward[];
  lineText: (id: string) => string | undefined;
  tier: AssetTier;
  ledger: AssetLedger;
  issues: Issue[];
}

export function checkCozy(c: CozyDay, x: Ctx): void {
  const err = (where: string, message: string) => x.issues.push({ level: 'error', code: 'COZY', where: `cozy: ${where}`, message });
  const seen = new Set<string>();
  for (const r of c.residents) {
    if (!x.speakers.includes(r.speaker)) err(r.speaker, 'unknown speaker');
    if (seen.has(r.speaker)) err(r.speaker, 'resident listed twice');
    seen.add(r.speaker);
    if (r.teaPrice !== PRICE.tea) err(r.speaker, `tea costs ${PRICE.tea} hearts (T11)`);
    if (r.stories.length === 0) err(r.speaker, 'needs at least one story');
    for (const s of r.stories) if (s.length < 3 || s.length > 5) err(r.speaker, `a story has ${s.length} lines (T28: 3–5)`);
    if (r.unlockAfter < 0 || r.unlockAfter > 8) err(r.speaker, 'unlockAfter is a case number 0–8');
  }
  const ids = new Set<string>();
  for (const s of c.shop) {
    if (ids.has(s.id)) err(s.id, 'shop item twice');
    ids.add(s.id);
    const decor = s.kind === 'decor';
    const want = decor ? 'hearts' : 'buttons';
    if (s.price.currency !== want) err(s.id, `${s.kind} is paid in ${want} (T11)`);
    const [lo, hi] = decor ? PRICE.decor : PRICE.cosmetic;
    if (s.price.amount < lo || s.price.amount > hi) err(s.id, `price ${s.price.amount} outside ${lo}–${hi} (T11)`);
    if (s.kind !== 'hat') checkAssetId(s.asset, 'image', 'cozy', s.id, x.tier, x.ledger, x.issues);
  }
  if (new Set(c.decorSlots.map((d) => d.id)).size !== c.decorSlots.length) err('decorSlots', 'duplicate slot');
  let last = -1;
  for (const r of c.ranks) {
    if (r.afterCase <= last) err(r.id, 'ranks must be in campaign order');
    last = r.afterCase;
    if (r.reward && x.rewards.find((w) => w.id === r.reward)?.kind !== 'title') err(r.id, `reward ${r.reward} must be a title reward`);
  }

  // Economy per stage horizon: every case that unlocks shop items.
  const horizon = Math.max(0, ...c.shop.map((s) => s.unlockAfter));
  const cosmetics = c.shop.filter((s) => s.kind !== 'decor' && s.unlockAfter <= horizon).reduce((n, s) => n + s.price.amount, 0);
  const l1 = BUTTONS.prologue + BUTTONS.l1 * horizon;
  const l12 = l1 + BUTTONS.l2 * horizon;
  if (cosmetics > 0) {
    const share = l1 / cosmetics;
    if (share < 0.4 || share > 0.65) err('economy', `level 1 earnings through case ${horizon} (${l1}) cover ${Math.round(share * 100)}% of cosmetics (${cosmetics}); T11 wants about half`);
    if (l12 < cosmetics) err('economy', `levels 1+2 earnings (${l12}) do not cover all cosmetics (${cosmetics}) (T11)`);
  }

  for (const r of x.rewards) if (r.kind === 'hearts' && !HEART_KEY.test(r.claimKey)) err(r.id, 'heart claimKey must be caseNN:[lN:]heart:<name>');
  const decor = c.shop.filter((s) => s.kind === 'decor' && s.unlockAfter <= horizon).map((s) => s.price.amount);
  if (decor.length > 0) {
    const total = decor.reduce((n, p) => n + p, 0);
    const h1 = heartsEarned(x.rewards, horizon, [1]);
    const h12 = heartsEarned(x.rewards, horizon, [1, 2]);
    if (h1 < Math.min(...decor) + PRICE.tea) err('economy', `level 1 hearts through case ${horizon} (${h1}) do not buy the cheapest decoration and a cup of tea (T32)`);
    if (h12 < DECOR_COVER_L12 * total) err('economy', `levels 1+2 hearts through case ${horizon} (${h12}) cover under ${DECOR_COVER_L12 * 100}% of decorations (${total}) (T32)`);
  }
}
