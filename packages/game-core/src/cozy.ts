// «Уютный денёк» (D23, T12, T28, T29) and ranks (D12): shop with refunds, wearing, office decor,
// tea parties with residents' stories. Pure functions over the profile; the commands live in rules.
import type { CozyDay, ShopItem } from '@fluffy/content';
import type { ProfileState } from './state.js';

/** Highest case number solved at any level (0 = the prologue only, -1 = nothing yet). */
export function casesSolved(profile: Pick<ProfileState, 'completed'>): number {
  let best = profile.completed.includes('prologue') ? 0 : -1;
  for (const id of profile.completed) {
    const match = /^case(\d\d)-l[123]$/.exec(id);
    if (match) best = Math.max(best, Number(match[1]));
  }
  return best;
}

function solved(profile: Pick<ProfileState, 'completed'>, n: number): boolean {
  if (n === 0) return profile.completed.includes('prologue');
  return profile.completed.some((id) => id.startsWith(`case${String(n).padStart(2, '0')}-l`));
}

export function itemOf(cozy: CozyDay, id: string): ShopItem {
  const item = cozy.shop.find((i) => i.id === id);
  if (!item) throw new Error(`Unknown shop item ${id}`);
  return item;
}

export function isOnSale(profile: ProfileState, item: ShopItem): boolean {
  return solved(profile, item.unlockAfter);
}

function purse(profile: ProfileState, item: ShopItem): 'buttons' | 'hearts' {
  return item.price.currency;
}

/** T29: buying never takes more than the child has; nothing random, no real money. */
export function canAfford(profile: ProfileState, item: ShopItem): boolean {
  return profile[purse(profile, item)] >= item.price.amount;
}

export function buy(profile: ProfileState, cozy: CozyDay, id: string): void {
  const item = itemOf(cozy, id);
  if (!isOnSale(profile, item)) throw new Error('Not in the shop yet');
  if (profile.owned.includes(id)) throw new Error('Already owned');
  if (!canAfford(profile, item)) throw new Error('Not enough');
  profile[purse(profile, item)] -= item.price.amount;
  profile.owned.push(id);
}

/** T11/Q40: a purchase can be returned for the full price; whatever used it is taken off. */
export function refund(profile: ProfileState, cozy: CozyDay, id: string): void {
  const item = itemOf(cozy, id);
  if (!profile.owned.includes(id)) throw new Error('Not owned');
  profile.owned = profile.owned.filter((owned) => owned !== id);
  profile[purse(profile, item)] += item.price.amount;
  if (profile.avatar.hat === id) profile.avatar.hat = null;
  if (profile.pattern === id) profile.pattern = null;
  profile.decor = profile.decor.filter((d) => d.item !== id);
}

/** Put on (or take off with `on: false`) an owned hat or scarf pattern. */
export function wear(profile: ProfileState, cozy: CozyDay, id: string, on: boolean): void {
  const item = itemOf(cozy, id);
  if (!profile.owned.includes(id)) throw new Error('Not owned');
  if (item.kind === 'hat') profile.avatar.hat = on ? id : null;
  else if (item.kind === 'scarf-pattern') profile.pattern = on ? id : null;
  else throw new Error('Decorations are placed, not worn');
}

export function residentsAvailable(profile: ProfileState, cozy: CozyDay) {
  return cozy.residents.filter((r) => solved(profile, r.unlockAfter));
}

/** One tea party: pays the hearts and returns the lines to play (the next untold story, then thanks). */
export function tea(profile: ProfileState, cozy: CozyDay, speaker: string): string[] {
  const resident = residentsAvailable(profile, cozy).find((r) => r.speaker === speaker);
  if (!resident) throw new Error('Nobody to invite');
  if (profile.hearts < resident.teaPrice) throw new Error('Not enough');
  profile.hearts -= resident.teaPrice;
  const entry = profile.teas.find((t) => t.speaker === speaker);
  const told = entry?.told ?? 0;
  if (entry) entry.told = told + 1;
  else profile.teas.push({ speaker, told: 1 });
  const story = resident.stories.length ? resident.stories[told % resident.stories.length]! : [];
  return [resident.invite, ...story, ...cozy.lines.teaThanks];
}

/** D12: the highest rank whose case is solved (content grants the title reward itself). */
export function rankFor(profile: ProfileState, cozy: CozyDay | null) {
  if (!cozy) return null;
  const reached = cozy.ranks.filter((r) => solved(profile, r.afterCase));
  return reached.sort((a, b) => b.afterCase - a.afterCase)[0] ?? null;
}

/** A rank the child has reached but not yet been told about (announced once, in the office). */
export function newRank(profile: ProfileState, cozy: CozyDay | null) {
  if (!cozy || profile.run) return null;
  // Only the highest reached rank is announced; lower ones are counted as seen with it.
  const top = cozy.ranks
    .filter((r) => r.afterCase > 0 && solved(profile, r.afterCase))
    .sort((a, b) => b.afterCase - a.afterCase)[0];
  return top && !profile.ranksSeen.includes(top.id) ? top : null;
}

export function seeRank(profile: ProfileState, cozy: CozyDay, id: string): void {
  const rank = cozy.ranks.find((r) => r.id === id)!;
  for (const r of cozy.ranks)
    if (r.afterCase <= rank.afterCase && !profile.ranksSeen.includes(r.id))
      profile.ranksSeen.push(r.id);
}
