// Text rules: sentence segmentation, tokenization (T04, Q24) and gendered-address heuristics (R07, D05).
import { NAME_PLACEHOLDER } from '../../packages/content/src/schema.ts';

/**
 * Tokenization (same expression as @aegis/narrative `tokenizeWords`): a word is a run of Unicode
 * letters/digits; internal hyphens and apostrophes keep it one word («лапа-лопатка», «Ватсони»).
 * Punctuation, dashes and emoji are not words. `{имя}` is one word (T04: names are a single word).
 * Digits count: «8:00» is two words («8», «00»).
 */
export function tokenize(sentence: string): string[] {
  return sentence.replaceAll(NAME_PLACEHOLDER, 'ИМЯ').match(/[\p{L}\p{N}]+(?:['\u2019-][\p{L}\p{N}]+)*/gu) ?? [];
}

/**
 * Sentence segmentation: a sentence ends at «.», «!», «?» or «…» (any run of them, optionally
 * followed by closing quotes) when followed by whitespace and a capital letter, digit, opening
 * quote, dash or {имя}. «Ой… и правда!» stays one sentence (lowercase continuation). Text
 * without terminal punctuation (labels) is one sentence.
 */
export function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…]+[»“"”)]*)\s+(?=[\p{Lu}\p{N}«„{—-])/u)
    .map((s) => s.trim())
    .filter((s) => tokenize(s).length > 0);
}

const SECOND_PERSON = new Set(['ты', 'тебя', 'тебе', 'тобой', 'тобою', 'твой', 'твоя', 'твоё', 'твое', 'твои', 'твоего', 'твоей', 'твоему', 'твою', 'твоим', 'твоих', 'имя']);
const SHORT_GENDERED = new Set([
  'готов', 'готова', 'рад', 'рада', 'уверен', 'уверена', 'знаком', 'знакома', 'должен', 'должна', 'сам', 'сама',
  'один', 'одна', 'устал', 'устала', 'смел', 'смела', 'молодчина', 'новенький', 'новенькая', 'умный', 'умная',
  'умница', 'хороший', 'хорошая', 'добрый', 'добрая', 'смелый', 'смелая', 'заметил', 'заметила', 'нашёл', 'нашла',
  'пришёл', 'пришла', 'прошёл', 'прошла', 'шёл', 'шла', 'сумел', 'сумела', 'справился', 'справилась',
]);
const NOT_VERBS = new Set(['стол', 'пол', 'мол', 'ел', 'был', 'была', 'мыла', 'пчела', 'пила', 'игла', 'мгла', 'скала', 'стрела', 'дела', 'села', 'весла', 'котла', 'тепла', 'стекла', 'зла', 'светла', 'угла', 'кола', 'школа', 'смола', 'юла', 'пушинка', 'котёл', 'котел', 'орёл', 'осёл', 'козёл', 'посол', 'футбол']);

/** Words that mark the sentence as addressed to the player. */
function addressesPlayer(words: string[]): boolean {
  return words.some((w) => SECOND_PERSON.has(w) || /(?:ешь|ишь|ёшь)$/u.test(w));
}

function gendered(w: string): boolean {
  if (SHORT_GENDERED.has(w)) return true;
  if (NOT_VERBS.has(w)) return false;
  return /^[а-яё]{2,}(?:л|ла|лся|лась)$/u.test(w);
}

export interface GenderFlag {
  sentence: string;
  words: string[];
}

/**
 * Heuristic for gendered address to the player (D05): flags sentences that address the player
 * (2nd person, {имя}) and contain a gendered singular form, plus well-known risky patterns
 * («спасибо, что спросил»). Every flag must be reviewed in content/shared/gender-review.ts.
 */
export function genderFlags(text: string): GenderFlag[] {
  const out: GenderFlag[] = [];
  for (const s of sentences(text)) {
    const words = tokenize(s.replaceAll(NAME_PLACEHOLDER, ' имя ')).map((w) => w.toLowerCase());
    const hits = words.filter(gendered);
    const risky = /спасибо,?\s+что\s+[а-яё]+л[аи]?(?![а-яё])/iu.test(s) || /^(?:ой,\s*)?(?:устал|устала|готов|готова|новенький|новенькая)(?![а-яё])/iu.test(s);
    if ((hits.length > 0 && addressesPlayer(words)) || risky) out.push({ sentence: s, words: hits });
  }
  return out;
}

/** Normalized form for glossary matching. */
export function norm(w: string): string {
  return w.toLowerCase().replaceAll('ё', 'е');
}
