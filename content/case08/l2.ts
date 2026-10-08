import { all, cl, dir, goto, has, L, menu, minigame, not, opt as mopt, reveal, seq, skill, type VariantSource, retarget } from '../../tools/content/dsl.ts';
import { activity, anyOf, baseCutscenes, commonDecisions, comfort, eq, facts, finalScenes, heroCollections, intended, introScene, invitationCards, opt, rewardsFor, versionScene, what, where, who } from './common.ts';

const HUB = 'C8-L2-HUB';
const required = all(has.clue('c8-invitation'), has.clue('c8-room'), has.clue('c8-sound'), has.clue('c8-compare'));
const noWho = anyOf('who', ['pukhlik', 'fitilyok', 'stella', 'damka']);

export const level2: VariantSource = {
  pack: 'case08-l2', kind: 'case', title: 'C8-TITLE', case: { number: 8, level: 2 }, start: 'C8-L2-0',
  scenes: [
    introScene('C8-L2-0', 'C8-L2-1'),
    { id: 'C8-L2-1', title: 'Сложи приглашение и шифр', location: 'office-door', cast: ['khvosts'], presentation: 'minigame', steps: [
      skill('invitation', [L('C8-1-01')]), minigame('c8l2-invitation'), skill('button-cipher', [L('C8-L2-1-01'), L('C8-L2-1-02'), L('C8-L2-1-03')]), minigame('c8l2-cipher'), L('C8-1-03'), L('C8-1-04'), reveal('c8-invitation'), L('C8-1-05'), L('C8-1-06'), goto('C8-L2-2'),
    ] },
    { id: 'C8-L2-2', title: 'Маяк: вход', location: 'lighthouse-door', cast: ['damka'], presentation: 'dialogue', steps: [dir('C8-L2-2-D01', 'Дамка стоит у маяка; рядом табличка «тихо». Она честно говорит о своём мастерстве.'), ...seq('C8-2-', 1, 3), L('C8-L2-2-01'), L('C8-L2-2-02'), goto(HUB)] },
    { id: HUB, title: 'Маяк: выбор', location: 'lighthouse-door', cast: ['damka'], presentation: 'hub', steps: [
      { t: 'if', when: all(has.clue('c8-room'), has.clue('c8-sound'), not(has.visited('C8-L2-6'))), then: [goto('C8-L2-6')], else: [] },
      menu('C8-L2-M', null, [
        mopt('room', 'C8-2-B01', 'C8-L2-3', { hideWhen: has.visited('C8-L2-3') }),
        mopt('sound', 'C8-2-B02', 'C8-L2-4', { hideWhen: has.visited('C8-L2-4') }),
        mopt('residents', 'C8-2-B04', 'C8-L2-5', { hideWhen: has.visited('C8-L2-5'), optional: true }),
      ]),
    ] },
    { id: 'C8-L2-3', title: 'Лупа: четыре предмета', location: 'pukhlik-room', cast: ['khvosts', 'pukhlik'], presentation: 'minigame', steps: [dir('C8-L2-3-D01', 'Пухлик спит. Игрок рассматривает чашку, перо, корзинку и книгу, ничего не двигая.'), skill('magnifier', [L('C8-L2-3-01')]), minigame('c8l2-room'), L('C8-3-06'), L('C8-N03'), reveal('c8-room'), goto(HUB)] },
    { id: 'C8-L2-4', title: 'Услышь разницу', location: 'pukhlik-room', cast: ['khvosts', 'pukhlik', 'stella', 'fitilyok', 'damka'], presentation: 'minigame', steps: [skill('sound-match', [L('C8-4-01')]), minigame('c8l2-sound'), L('C8-4-02'), L('C8-L2-4-01'), reveal('c8-sound'), goto(HUB)] },
    { id: 'C8-L2-5', title: 'Стелла, Фитилёк и Дамка', location: 'lighthouse-rail', cast: ['stella', 'fitilyok', 'damka', 'khvosts'], presentation: 'dialogue', steps: [dir('C8-L2-5-D01', 'Жители говорят тихо у перил маяка; Фитилёк сам исправляет ошибку.'), ...seq('C8-5-', 1, 3), ...seq('C8-L2-5-', 1, 5), goto(HUB)] },
    { id: 'C8-L2-6', title: 'Сравни приметы', location: 'notebook', cast: ['khvosts'], presentation: 'minigame', steps: [skill('compare-traits', [L('C8-L2-6-01')]), minigame('c8l2-compare'), L('C8-6-04'), L('C8-6-05'), reveal('c8-compare'), goto('C8-L2-7')] },
    versionScene('C8-L2-7', HUB),
    ...finalScenes('C8-L2', 2),
  ],
  logic: { axes: [
      { id: 'who', title: 'C8-AX-who', values: [who.pukhlik, who.fitilyok, who.stella, who.damka] },
      { id: 'where', title: 'C8-AX-where', values: [where.attic, where.lighthouse, where.cellar, where.library] },
      { id: 'what', title: 'C8-AX-what', values: [what.party, what.treasure, what.walks, what.repair] },
    ], intended,
    clues: [
      { id: 'c8-invitation', title: 'C8-CL-invitation', required: true, predicate: { op: 'and', terms: [eq('where', 'attic'), eq('what', 'party')] }, requires: [], source: 'C8-L2-1', summary: 'Символы и пуговичный шифр дают чердак и сюрприз стажёру.' },
      { id: 'c8-room', title: 'C8-CL-room', required: true, predicate: noWho, requires: [], source: 'C8-L2-3', summary: 'Комната даёт ромашку, серое перо, инструменты и книгу с датами добрых дел.' },
      { id: 'c8-sound', title: 'C8-CL-sound', required: true, predicate: noWho, requires: [], source: 'C8-L2-4', summary: '«Ух» Пухлика тихое; у Дамки хруст громкий и частый.' },
      { id: 'c8-compare', title: 'C8-CL-compare', required: true, predicate: eq('who', 'pukhlik'), requires: ['c8-room', 'c8-sound'], source: 'C8-L2-6', summary: 'Все три заметки совпадают только у Пухлика; Дамка не подходит.' },
    ], version: { button: 'UI-hud.version', available: all(has.visited('C8-L2-7'), required), onSolved: 'C8-L2-8' },
    wrongVersion: { intro: [cl('C8-7-03')], byValue: [
      { axis: 'who', value: 'fitilyok', clues: ['c8-compare'], lines: [cl('C8-7-05')] }, { axis: 'who', value: 'stella', clues: ['c8-compare'], lines: [cl('C8-7-04')] }, { axis: 'who', value: 'damka', clues: ['c8-compare'], lines: [cl('C8-L2-7-01')] },
      { axis: 'where', value: 'lighthouse', clues: ['c8-invitation'], lines: [cl('C8-7-06')] }, { axis: 'where', value: 'cellar', clues: ['c8-invitation'], lines: [cl('C8-7-06')] }, { axis: 'where', value: 'library', clues: ['c8-invitation'], lines: [cl('C8-7-06')] },
      { axis: 'what', value: 'treasure', clues: ['c8-invitation'], lines: [cl('C8-7-07')] }, { axis: 'what', value: 'walks', clues: ['c8-invitation'], lines: [cl('C8-7-07')] }, { axis: 'what', value: 'repair', clues: ['c8-invitation'], lines: [cl('C8-7-07')] },
    ], outro: [cl('C8-7-08')] },
    redHerrings: [
      { id: 'rh-c8-adults', summary: 'Хвостс и Ватсони скрывали праздник, не разгадку.', presentedBy: ['C8-0-04'], explainedBy: ['C8-8-15', 'C8-8-16', 'C8-8-20'] },
      { id: 'rh-c8-fitilyok', summary: 'Фитилёк видел светящуюся Тень, но это был его отблеск.', presentedBy: ['C8-L2-5-01'], explainedBy: ['C8-L2-5-02', 'C8-8-18'] },
      { id: 'rh-c8-stella', summary: 'Стелла с перьями не подходит: чёрно-белые перья и стрекот.', presentedBy: ['C8-5-01', 'C8-5-03'], explainedBy: ['C8-8-19'] },
      { id: 'rh-c8-damka', summary: 'Дамка мастер, но у неё шерсть, хруст и кора.', presentedBy: ['C8-L2-2-01', 'C8-L2-5-04'], explainedBy: ['C8-L2-7-01', 'C8-L2-8-01'] },
    ] },
  notebookHelp: { mode: 'suggest', marks: [
    { axis: 'who', value: 'pukhlik', mark: 'confirmed', clues: ['c8-compare'], line: 'C8-NB-pukhlik-yes' }, { axis: 'who', value: 'fitilyok', mark: 'excluded', clues: ['c8-compare'], line: 'C8-NB-fitilyok-no' }, { axis: 'who', value: 'stella', mark: 'excluded', clues: ['c8-compare'], line: 'C8-NB-stella-no' }, { axis: 'who', value: 'damka', mark: 'excluded', clues: ['c8-compare'], line: 'C8-NB-damka-no' },
    { axis: 'where', value: 'attic', mark: 'confirmed', clues: ['c8-invitation'], line: 'C8-NB-invite-place' }, { axis: 'where', value: 'lighthouse', mark: 'excluded', clues: ['c8-invitation'], line: 'C8-NB-invite-place' }, { axis: 'where', value: 'cellar', mark: 'excluded', clues: ['c8-invitation'], line: 'C8-NB-invite-place' }, { axis: 'where', value: 'library', mark: 'excluded', clues: ['c8-invitation'], line: 'C8-NB-invite-place' },
    { axis: 'what', value: 'party', mark: 'confirmed', clues: ['c8-invitation'], line: 'C8-NB-invite-what' }, { axis: 'what', value: 'treasure', mark: 'excluded', clues: ['c8-invitation'], line: 'C8-NB-invite-what' }, { axis: 'what', value: 'walks', mark: 'excluded', clues: ['c8-invitation'], line: 'C8-NB-invite-what' }, { axis: 'what', value: 'repair', mark: 'excluded', clues: ['c8-invitation'], line: 'C8-NB-invite-what' },
  ], pointers: [], nothing: 'UI-notebook.nothing' },
  hints: { klubok: { speaker: 'khvosts', precision: 'exact', allowance: 3, rules: [
    { id: 'C8-L2-H-01', when: not(has.clue('c8-invitation')), cites: [] }, { id: 'C8-L2-H-03', when: not(has.clue('c8-room')), cites: [] }, { id: 'C8-L2-H-06', when: not(has.clue('c8-room')), cites: [] }, { id: 'C8-L2-H-04', when: not(has.clue('c8-sound')), cites: [] }, { id: 'C8-L2-H-05', when: not(has.clue('c8-compare')), cites: [] }, { id: 'C8-L2-H-07', when: not(has.clue('c8-compare')), cites: [] },
  ], review: 'C8-L2-H-02', exhausted: 'UI-hint.klubokEmptyShell' }, shell: { speaker: 'watsony', precision: 'vague', allowance: null, rules: [
    { id: 'C8-L2-R-01', when: not(has.clue('c8-invitation')), cites: [] }, { id: 'C8-L2-R-02', when: not(has.clue('c8-room')), cites: [] }, { id: 'C8-L2-R-03', when: not(has.clue('c8-sound')), cites: [] },
  ], review: 'C8-L2-R-03', exhausted: null } },
  minigames: [
    { id: 'c8l2-invitation', skill: 'invitation', config: { kind: 'staged', mechanic: 'Сложи приглашение', description: 'Собрать письмо из шести символов.', lines: ['C8-N01', 'C8-N02', 'C8-1-02'], steps: [{ id: 'cards', prompt: null, pageSize: 3, options: invitationCards }] } },
    { id: 'c8l2-cipher', skill: 'button-cipher', config: { kind: 'staged', mechanic: 'Шифр на пуговицах', description: 'Расшифровать слово ЧЕРДАК.', lines: ['C8-L2-1-01', 'C8-L2-1-02', 'C8-L2-1-03'], steps: [{ id: 'word', prompt: null, pageSize: 3, options: [opt('ch', 'C8-1-B10', true), opt('e', 'C8-1-B11', true), opt('r', 'C8-1-B12', true), opt('d', 'C8-1-B13', true), opt('a', 'C8-1-B14', true), opt('k', 'C8-1-B15', true)] }] } },
    { id: 'c8l2-room', skill: 'magnifier', config: { kind: 'magnifier', targets: [
      { id: 'cup', label: 'C8-3-B01', required: true, reply: ['C8-3-02'] }, { id: 'feather', label: 'C8-3-B02', required: true, reply: ['C8-3-03'] }, { id: 'basket', label: 'C8-3-B03', required: true, reply: ['C8-3-04', 'C8-3-05'] }, { id: 'book', label: 'C8-3-B04', required: true, reply: ['C8-L2-3-02', 'C8-L2-3-03'] },
    ], afterFirst: [], afterFirstSkill: null, assistAfterMisses: 3 } },
    { id: 'c8l2-sound', skill: 'sound-match', config: { kind: 'staged', mechanic: 'Услышь разницу', description: 'Сравнить четыре звука.', lines: ['C8-4-03'], steps: [{ id: 'sound', prompt: null, pageSize: 3, options: [opt('pukhlik', 'C8-4-B01', true, 'C8-4-02'), opt('stella', 'C8-4-B02', false, 'C8-4-03'), opt('fitilyok', 'C8-4-B03', false, 'C8-4-03'), opt('damka', 'C8-4-B04', false, 'C8-L2-4-01')] }] } },
    { id: 'c8l2-compare', skill: 'compare-traits', config: { kind: 'staged', mechanic: 'Сравни приметы', description: 'Сопоставить три заметки с четырьмя героями.', lines: ['C8-N04', 'C8-6-03', 'C8-6-B01', 'C8-6-B02', 'C8-6-B03'], steps: [{ id: 'who', prompt: null, pageSize: 3, options: [opt('pukhlik', 'C8-AX-pukhlik', true, 'C8-N04'), opt('stella', 'C8-AX-stella', false, 'C8-6-03'), opt('fitilyok', 'C8-AX-fitilyok', false, 'C8-6-03'), opt('damka', 'C8-AX-damka', false, 'C8-L2-7-01')] }] } },
    { id: 'c8l2-oath', skill: 'detective-oath', config: { kind: 'staged', mechanic: 'Клятва сыщика', description: 'Три обещания сыщика.', lines: ['C8-N05'], steps: [
      { id: 'evidence', prompt: null, pageSize: 3, options: [opt('evidence', 'C8-9-B01', true, 'C8-9-02'), opt('pies', 'C8-9-B02', false, 'C8-9-05'), opt('umbrellas', 'C8-9-B03', false, 'C8-9-05')] },
      { id: 'hypothesis', prompt: null, pageSize: 3, options: [opt('hypothesis', 'C8-9-B04', true, 'C8-9-03'), opt('alibi', 'C8-9-B05', false, 'C8-9-05'), opt('motive', 'C8-9-B06', false, 'C8-9-05')] },
      { id: 'truth', prompt: null, pageSize: 3, options: [opt('truth', 'C8-9-B07', true, 'C8-9-04'), opt('hurt', 'C8-9-B08', false, 'C8-9-05'), opt('hurry', 'C8-9-B09', false, 'C8-9-05')] },
    ] } },
  ], facts, glossary: [], rewards: rewardsFor(2), collections: heroCollections(['pukhlik', 'stella', 'fitilyok', 'damka']), activities: [activity], comfort, cutscenes: [], plannedCutscenes: retarget(baseCutscenes, { "C8-0": "C8-L2-0", "C8-8": "C8-L2-8", "C8-9": "C8-L2-9", "C8-12": "C8-L2-12" }), decisions: [...commonDecisions(2), { id: 'C8L2-D7', text: 'Ракушка на уровне 2 расплывчатая; точные пробелы закрывает Клубок.', ref: 'D03' }], reserved: [],
};
