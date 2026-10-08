import type { CipherConfig, PostmanConfig } from '../../packages/content/src/schema.ts';

const glyphs = [
  { id: 'g', letter: 'Г', colour: 'honey', holes: 1, shape: 'circle', label: 'C2-3-G01' },
  { id: 'n', letter: 'Н', colour: 'blue', holes: 2, shape: 'square', label: 'C2-3-G02' },
  { id: 'e', letter: 'Е', colour: 'rose', holes: 3, shape: 'flower', label: 'C2-3-G03' },
  { id: 'z', letter: 'З', colour: 'green', holes: 4, shape: 'heart', label: 'C2-3-G04' },
  { id: 'd', letter: 'Д', colour: 'honey', holes: 2, shape: 'circle', label: 'C2-3-G05' },
  { id: 'o', letter: 'О', colour: 'blue', holes: 3, shape: 'square', label: 'C2-3-G06' },
  { id: 'j', letter: 'Ж', colour: 'rose', holes: 4, shape: 'flower', label: 'C2-3-G07' },
  { id: 'soft', letter: 'Ь', colour: 'green', holes: 1, shape: 'heart', label: 'C2-3-G08' },
  { id: 'u', letter: 'У', colour: 'honey', holes: 3, shape: 'circle', label: 'C2-3-G09' },
  { id: 'b', letter: 'Б', colour: 'blue', holes: 4, shape: 'square', label: 'C2-3-G10' },
  { id: 'a', letter: 'А', colour: 'rose', holes: 1, shape: 'flower', label: 'C2-3-G11' },
  { id: 'r', letter: 'Р', colour: 'green', holes: 2, shape: 'heart', label: 'C2-3-G12' },
  { id: 'm', letter: 'М', colour: 'honey', holes: 4, shape: 'circle', label: 'C2-3-G13' },
  { id: 'l', letter: 'Л', colour: 'blue', holes: 1, shape: 'square', label: 'C2-3-G14' },
  { id: 'v', letter: 'В', colour: 'rose', holes: 2, shape: 'flower', label: 'C2-3-G15' },
  { id: 'k', letter: 'К', colour: 'green', holes: 3, shape: 'heart', label: 'C2-3-G16' },
] as const;

const table = (n: number): CipherConfig['table'] => glyphs.slice(0, n).map((g) => ({ ...g }));
const slot = (glyph: string, options: string[]) => ({ glyph, options });

export const cipherL1 = (): CipherConfig => ({
  kind: 'cipher', table: table(10), intro: [], wrong: ['C2-3-04'],
  words: [
    { id: 'nest', answer: 'ГНЕЗДО', slots: [slot('g', ['g', 'n', 'b']), slot('n', ['n', 'd', 'soft']), slot('e', ['e', 'u', 'o']), slot('z', ['z', 'j', 'b']), slot('d', ['d', 'n', 'g']), slot('o', ['o', 'e', 'u'])], solved: ['C2-3-05'] },
    { id: 'rain', answer: 'ДОЖДЬ', slots: [slot('d', ['d', 'n', 'g']), slot('o', ['o', 'e', 'u']), slot('j', ['j', 'z', 'b']), slot('d', ['d', 'n', 'g']), slot('soft', ['soft', 'g', 'z'])], solved: ['C2-3-06'] },
  ],
});

export const cipherL2 = (): CipherConfig => ({
  kind: 'cipher', table: table(12), intro: [], wrong: ['C2-3-04'],
  words: [
    { id: 'oak', answer: 'ДУБ', slots: [slot('d', ['d', 'n', 'r']), slot('u', ['u', 'e', 'o']), slot('b', ['b', 'z', 'j'])], solved: ['C2-L2-4-02', 'C2-L2-4-03'] },
    { id: 'rain', answer: 'ДОЖДЬ', slots: [slot('d', ['d', 'n', 'r']), slot('o', ['o', 'e', 'u']), slot('j', ['j', 'z', 'b']), slot('d', ['d', 'n', 'r']), slot('soft', ['soft', 'g', 'a'])], solved: ['C2-3-06'] },
  ],
});

export const cipherL3 = (): CipherConfig => ({
  ...cipherL2(),
  table: table(16),
});

const houseLabels = [
  { number: 1, label: 'C2-8-B01' },
  { number: 2, label: 'C2-8-B02' },
  { number: 4, label: 'C2-8-B03' },
  { number: 5, label: 'C2-L2-8-B01' },
  { number: 6, label: 'C2-L2-8-B02' },
];

export const postmanL1 = (): PostmanConfig => ({
  kind: 'postman', cipher: 'c2l1-cipher', streets: null, streetByShape: null,
  intro: [], wrongStreet: [], wrongHouse: ['C2-8-03'], correct: ['C2-8-04'], houseLabels,
  letters: [
    { id: 'to-tyopa', label: 'C2-8-L01', buttons: ['d'], street: null, streetOptions: null, house: 2, houseOptions: [1, 2, 4] },
    { id: 'to-kartofan', label: 'C2-8-L02', buttons: ['z'], street: null, streetOptions: null, house: 4, houseOptions: [1, 2, 4] },
    { id: 'to-bakery', label: 'C2-8-L03', buttons: ['g'], street: null, streetOptions: null, house: 1, houseOptions: [1, 2, 4] },
  ],
});

export const postmanL2 = (): PostmanConfig => ({
  kind: 'postman', cipher: 'c2l2-cipher', streets: null, streetByShape: null,
  intro: [], wrongStreet: [], wrongHouse: ['C2-8-03'], correct: ['C2-8-04'], houseLabels,
  letters: [
    { id: 'two-three', label: 'C2-8-L04', buttons: ['n', 'u'], street: null, streetOptions: null, house: 5, houseOptions: [4, 5, 6] },
    { id: 'one-four', label: 'C2-8-L05', buttons: ['g', 'z'], street: null, streetOptions: null, house: 5, houseOptions: [4, 5, 6] },
    { id: 'two-two', label: 'C2-8-L06', buttons: ['d', 'n'], street: null, streetOptions: null, house: 4, houseOptions: [4, 5, 6] },
    { id: 'three-three', label: 'C2-8-L07', buttons: ['e', 'u'], street: null, streetOptions: null, house: 6, houseOptions: [4, 5, 6] },
  ],
});

export const postmanL3 = (): PostmanConfig => ({
  kind: 'postman', cipher: 'c2l3-cipher',
  streets: [{ id: 'pirog', label: 'C2-L3-10-B01', icon: 'honeycomb' }, { id: 'park', label: 'C2-L3-10-B02', icon: 'leaf' }],
  streetByShape: { circle: 'pirog', flower: 'pirog', square: 'park', heart: 'park' },
  intro: [], wrongStreet: ['C2-L3-10-04'], wrongHouse: ['C2-8-03'], correct: ['C2-8-04'], houseLabels,
  letters: [
    { id: 'pirog-four', label: 'C2-8-L08', buttons: ['d', 'v'], street: 'pirog', streetOptions: ['pirog', 'park'], house: 4, houseOptions: [4, 5, 6] },
    { id: 'pirog-five', label: 'C2-8-L09', buttons: ['g', 'm'], street: 'pirog', streetOptions: ['pirog', 'park'], house: 5, houseOptions: [4, 5, 6] },
    { id: 'park-five', label: 'C2-8-L10', buttons: ['n', 'o'], street: 'park', streetOptions: ['pirog', 'park'], house: 5, houseOptions: [4, 5, 6] },
    { id: 'park-six', label: 'C2-8-L11', buttons: ['z', 'r'], street: 'park', streetOptions: ['pirog', 'park'], house: 6, houseOptions: [4, 5, 6] },
    { id: 'pirog-six', label: 'C2-8-L12', buttons: ['u', 'e'], street: 'pirog', streetOptions: ['pirog', 'park'], house: 6, houseOptions: [4, 5, 6] },
  ],
});
