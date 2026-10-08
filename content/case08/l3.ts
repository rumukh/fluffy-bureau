import { all, cl, dir, goto, has, L, menu, minigame, not, opt as mopt, reveal, seq, skill, type VariantSource, retarget } from '../../tools/content/dsl.ts';
import { activity, anyOf, baseCutscenes, commonDecisions, comfort, eq, facts, finalScenes, heroCollections, intended, introScene, invitationCards, opt, rewardsFor, versionScene, what, where, who } from './common.ts';

const HUB = 'C8-L3-HUB';
const required = all(has.clue('c8-invitation'), has.clue('c8-room'), has.clue('c8-smell'), has.clue('c8-sound'), has.clue('c8-compare'));
const noWho = anyOf('who', ['pukhlik', 'fitilyok', 'stella', 'damka', 'mouse']);

export const level3: VariantSource = {
  pack: 'case08-l3', kind: 'case', title: 'C8-TITLE', case: { number: 8, level: 3 }, start: 'C8-L3-0',
  scenes: [
    introScene('C8-L3-0', 'C8-L3-1'),
    { id: 'C8-L3-1', title: 'Сложи приглашение: компас и шифр', location: 'office-door', cast: ['khvosts'], presentation: 'minigame', steps: [
      skill('compass', [L('C8-L3-1-01'), L('C8-L3-1-02')]), minigame('c8l3-compass'), skill('invitation', [L('C8-1-01')]), minigame('c8l3-invitation'), skill('button-cipher', [L('C8-L2-1-01'), L('C8-L2-1-02'), L('C8-L2-1-03')]), minigame('c8l3-cipher'), L('C8-1-03'), L('C8-1-04'), reveal('c8-invitation'), L('C8-1-05'), L('C8-1-06'), goto('C8-L3-2'),
    ] },
    { id: 'C8-L3-2', title: 'Маяк: вход', location: 'lighthouse-door', cast: ['damka', 'mouse'], presentation: 'dialogue', steps: [dir('C8-L3-2-D01', 'У маяка Дамка и мышонок говорят тихо; никто не будит Пухлика.'), ...seq('C8-2-', 1, 3), L('C8-L2-2-01'), L('C8-L2-2-02'), L('C8-L3-2-01'), L('C8-L3-2-02'), goto(HUB)] },
    { id: HUB, title: 'Маяк: выбор', location: 'lighthouse-door', cast: ['damka', 'mouse'], presentation: 'hub', steps: [
      { t: 'if', when: all(has.clue('c8-room'), has.clue('c8-smell'), has.clue('c8-sound'), not(has.visited('C8-L3-7'))), then: [goto('C8-L3-7')], else: [] },
      menu('C8-L3-M', null, [
        mopt('room', 'C8-2-B01', 'C8-L3-3', { hideWhen: has.visited('C8-L3-3') }),
        mopt('smell', 'C8-2-B05', 'C8-L3-4', { when: has.clue('c8-room'), hideWhen: has.visited('C8-L3-4') }),
        mopt('sound', 'C8-2-B02', 'C8-L3-5', { hideWhen: has.visited('C8-L3-5') }),
        mopt('residents', 'C8-2-B04', 'C8-L3-6', { hideWhen: has.visited('C8-L3-6'), optional: true }),
      ]),
    ] },
    { id: 'C8-L3-3', title: 'Лупа: пустая чашка', location: 'pukhlik-room', cast: ['khvosts', 'pukhlik'], presentation: 'minigame', steps: [dir('C8-L3-3-D01', 'Пухлик спит. Чашка пуста, поэтому запах проверяется отдельно.'), skill('magnifier', [L('C8-L2-3-01')]), minigame('c8l3-room'), L('C8-L3-3-01'), L('C8-L3-3-02'), L('C8-N03'), reveal('c8-room'), goto(HUB)] },
    { id: 'C8-L3-4', title: 'Пары запахов', location: 'pukhlik-room', cast: ['khvosts'], presentation: 'minigame', steps: [skill('scent-pairs', [L('C8-L3-4-01')]), minigame('c8l3-smell'), L('C8-L3-4-02'), L('C8-L3-4-03'), reveal('c8-smell'), goto(HUB)] },
    { id: 'C8-L3-5', title: 'Услышь разницу', location: 'pukhlik-room', cast: ['khvosts', 'pukhlik', 'stella', 'fitilyok', 'damka', 'mouse'], presentation: 'minigame', steps: [skill('sound-match', [L('C8-4-01')]), minigame('c8l3-sound'), L('C8-4-02'), L('C8-L2-4-01'), L('C8-L3-5-01'), reveal('c8-sound'), goto(HUB)] },
    { id: 'C8-L3-6', title: 'Жители и ошибка мышонка', location: 'lighthouse-rail', cast: ['stella', 'fitilyok', 'damka', 'mouse', 'khvosts'], presentation: 'dialogue', steps: [dir('C8-L3-6-D01', 'Мышонок сам исправляет ошибку о пёрышке.'), ...seq('C8-5-', 1, 3), ...seq('C8-L2-5-', 1, 5), ...seq('C8-L3-6-', 1, 4), goto(HUB)] },
    { id: 'C8-L3-7', title: 'Сравни приметы', location: 'notebook', cast: ['khvosts'], presentation: 'minigame', steps: [skill('compare-traits', [L('C8-L3-7-01')]), minigame('c8l3-compare'), L('C8-6-04'), L('C8-6-05'), reveal('c8-compare'), goto('C8-L3-8')] },
    versionScene('C8-L3-8', HUB),
    ...finalScenes('C8-L3F', 3),
  ],
  logic: { axes: [
      { id: 'who', title: 'C8-AX-who', values: [who.pukhlik, who.fitilyok, who.stella, who.damka, who.mouse] },
      { id: 'where', title: 'C8-AX-where', values: [where.attic, where.lighthouse, where.cellar, where.library, where.hall] },
      { id: 'what', title: 'C8-AX-what', values: [what.party, what.treasure, what.walks, what.repair] },
    ], intended,
    clues: [
      { id: 'c8-invitation', title: 'C8-CL-invitation', required: true, predicate: { op: 'and', terms: [eq('where', 'attic'), eq('what', 'party')] }, requires: [], source: 'C8-L3-1', summary: 'Компас, символы и шифр дают чердак и праздник.' },
      { id: 'c8-room', title: 'C8-CL-room', required: true, predicate: noWho, requires: [], source: 'C8-L3-3', summary: 'В комнате есть перо, корзинка, книга и пустая чашка.' },
      { id: 'c8-smell', title: 'C8-CL-smell', required: true, predicate: noWho, requires: ['c8-room'], source: 'C8-L3-4', summary: 'В комнате Пухлика пахнет ромашкой.' },
      { id: 'c8-sound', title: 'C8-CL-sound', required: true, predicate: noWho, requires: [], source: 'C8-L3-5', summary: 'Писк мышат высокий, а «ух» Пухлика низкое.' },
      { id: 'c8-compare', title: 'C8-CL-compare', required: true, predicate: eq('who', 'pukhlik'), requires: ['c8-room', 'c8-smell', 'c8-sound'], source: 'C8-L3-7', summary: 'Все три заметки совпадают только у Пухлика; мышата не подходят.' },
    ], version: { button: 'UI-hud.version', available: all(has.visited('C8-L3-8'), required), onSolved: 'C8-L3F-8' },
    wrongVersion: { intro: [cl('C8-7-03')], byValue: [
      { axis: 'who', value: 'fitilyok', clues: ['c8-compare'], lines: [cl('C8-7-05')] }, { axis: 'who', value: 'stella', clues: ['c8-compare'], lines: [cl('C8-7-04')] }, { axis: 'who', value: 'damka', clues: ['c8-compare'], lines: [cl('C8-L2-7-01')] }, { axis: 'who', value: 'mouse', clues: ['c8-compare'], lines: [cl('C8-L3-8-01')] },
      { axis: 'where', value: 'lighthouse', clues: ['c8-invitation'], lines: [cl('C8-7-06')] }, { axis: 'where', value: 'cellar', clues: ['c8-invitation'], lines: [cl('C8-7-06')] }, { axis: 'where', value: 'library', clues: ['c8-invitation'], lines: [cl('C8-7-06')] }, { axis: 'where', value: 'hall', clues: ['c8-invitation'], lines: [cl('C8-7-06')] },
      { axis: 'what', value: 'treasure', clues: ['c8-invitation'], lines: [cl('C8-7-07')] }, { axis: 'what', value: 'walks', clues: ['c8-invitation'], lines: [cl('C8-7-07')] }, { axis: 'what', value: 'repair', clues: ['c8-invitation'], lines: [cl('C8-7-07')] },
    ], outro: [cl('C8-7-08')] },
    redHerrings: [
      { id: 'rh-c8-adults', summary: 'Хвостс и Ватсони скрывали праздник, не разгадку.', presentedBy: ['C8-0-04'], explainedBy: ['C8-8-15', 'C8-8-16', 'C8-8-20'] },
      { id: 'rh-c8-fitilyok', summary: 'Фитилёк ошибся: светилась его отражённая искра.', presentedBy: ['C8-L2-5-01'], explainedBy: ['C8-L2-5-02', 'C8-8-18'] },
      { id: 'rh-c8-stella', summary: 'Стелла с перьями не подходит: чёрно-белые перья и стрекот.', presentedBy: ['C8-5-01', 'C8-5-03'], explainedBy: ['C8-8-19'] },
      { id: 'rh-c8-damka', summary: 'Дамка мастер, но у неё шерсть, хруст и кора.', presentedBy: ['C8-L2-2-01', 'C8-L2-5-04'], explainedBy: ['C8-L2-7-01', 'C8-L2-8-01'] },
      { id: 'rh-c8-mouse', summary: 'Мышата серые и ночные, но пушистые и пищат.', presentedBy: ['C8-L3-2-01', 'C8-L3-2-02', 'C8-L3-6-01'], explainedBy: ['C8-L3-6-02', 'C8-L3-8-01', 'C8-L3-9-01'] },
    ] },
  notebookHelp: { mode: 'point', marks: [
    { axis: 'who', value: 'pukhlik', mark: 'confirmed', clues: ['c8-compare'], line: 'C8-NB-pukhlik-yes' }, { axis: 'who', value: 'fitilyok', mark: 'excluded', clues: ['c8-compare'], line: 'C8-NB-fitilyok-no' }, { axis: 'who', value: 'stella', mark: 'excluded', clues: ['c8-compare'], line: 'C8-NB-stella-no' }, { axis: 'who', value: 'damka', mark: 'excluded', clues: ['c8-compare'], line: 'C8-NB-damka-no' }, { axis: 'who', value: 'mouse', mark: 'excluded', clues: ['c8-compare'], line: 'C8-NB-mouse-no' },
    { axis: 'where', value: 'attic', mark: 'confirmed', clues: ['c8-invitation'], line: 'C8-NB-invite-place' }, { axis: 'where', value: 'lighthouse', mark: 'excluded', clues: ['c8-invitation'], line: 'C8-NB-invite-place' }, { axis: 'where', value: 'cellar', mark: 'excluded', clues: ['c8-invitation'], line: 'C8-NB-invite-place' }, { axis: 'where', value: 'library', mark: 'excluded', clues: ['c8-invitation'], line: 'C8-NB-invite-place' }, { axis: 'where', value: 'hall', mark: 'excluded', clues: ['c8-invitation'], line: 'C8-NB-invite-place' },
    { axis: 'what', value: 'party', mark: 'confirmed', clues: ['c8-invitation'], line: 'C8-NB-invite-what' }, { axis: 'what', value: 'treasure', mark: 'excluded', clues: ['c8-invitation'], line: 'C8-NB-invite-what' }, { axis: 'what', value: 'walks', mark: 'excluded', clues: ['c8-invitation'], line: 'C8-NB-invite-what' }, { axis: 'what', value: 'repair', mark: 'excluded', clues: ['c8-invitation'], line: 'C8-NB-invite-what' },
  ], pointers: [
    { clue: 'c8-invitation', line: 'C8-NB-point-invitation' }, { clue: 'c8-room', line: 'C8-NB-point-room' }, { clue: 'c8-smell', line: 'C8-NB-point-smell' }, { clue: 'c8-sound', line: 'C8-NB-point-sound' }, { clue: 'c8-compare', line: 'C8-NB-point-compare' },
  ], nothing: 'UI-notebook.nothing' },
  hints: { klubok: { speaker: 'khvosts', precision: 'exact', allowance: 3, rules: [
    { id: 'C8-L3-H-02', when: not(has.clue('c8-invitation')), cites: [] }, { id: 'C8-L3-H-07', when: not(has.clue('c8-room')), cites: [] }, { id: 'C8-L3-H-03', when: not(has.clue('c8-smell')), cites: [] }, { id: 'C8-L3-H-04', when: not(has.clue('c8-sound')), cites: [] }, { id: 'C8-L3-H-05', when: not(has.clue('c8-compare')), cites: [] }, { id: 'C8-L3-H-06', when: not(has.clue('c8-compare')), cites: [] }, { id: 'C8-L3-H-08', when: not(has.clue('c8-compare')), cites: [] },
  ], review: 'C8-L3-H-01', exhausted: 'UI-hint.klubokEmpty' }, shell: null },
  minigames: [
    { id: 'c8l3-compass', skill: 'compass', config: { kind: 'staged', mechanic: 'Компас', description: 'Повернуть карточки стрелкой на север.', lines: ['C8-L3-1-03'], steps: [{ id: 'north', prompt: null, pageSize: 3, options: [opt('left', 'C8-1-B07', false, 'C8-L3-1-03'), opt('right', 'C8-1-B08', false, 'C8-L3-1-03'), opt('check', 'C8-1-B09', true)] }] } },
    { id: 'c8l3-invitation', skill: 'invitation', config: { kind: 'staged', mechanic: 'Сложи приглашение', description: 'Собрать письмо из шести символов.', lines: ['C8-N01', 'C8-N02', 'C8-1-02'], steps: [{ id: 'cards', prompt: null, pageSize: 3, options: invitationCards }] } },
    { id: 'c8l3-cipher', skill: 'button-cipher', config: { kind: 'staged', mechanic: 'Шифр на пуговицах', description: 'Расшифровать слово ЧЕРДАК.', lines: ['C8-L2-1-01', 'C8-L2-1-02', 'C8-L2-1-03'], steps: [{ id: 'word', prompt: null, pageSize: 3, options: [opt('ch', 'C8-1-B10', true), opt('e', 'C8-1-B11', true), opt('r', 'C8-1-B12', true), opt('d', 'C8-1-B13', true), opt('a', 'C8-1-B14', true), opt('k', 'C8-1-B15', true)] }] } },
    { id: 'c8l3-room', skill: 'magnifier', config: { kind: 'magnifier', targets: [
      { id: 'cup', label: 'C8-3-B01', required: true, reply: ['C8-L3-3-01', 'C8-L3-3-02'] }, { id: 'feather', label: 'C8-3-B02', required: true, reply: ['C8-3-03'] }, { id: 'basket', label: 'C8-3-B03', required: true, reply: ['C8-3-04', 'C8-3-05'] }, { id: 'book', label: 'C8-3-B04', required: true, reply: ['C8-L2-3-02', 'C8-L2-3-03'] },
    ], afterFirst: [], afterFirstSkill: null, assistAfterMisses: 3 } },
    { id: 'c8l3-smell', skill: 'scent-pairs', config: { kind: 'scent-pairs', fields: [{ id: 'room', label: 'C8-CL-smell', cards: [
      { id: 'chamomile-a', pair: 'chamomile', label: 'C8-L3-4-B01' }, { id: 'paper-a', pair: 'paper', label: 'C8-L3-4-B02' }, { id: 'wax-a', pair: 'wax', label: 'C8-L3-4-B03' }, { id: 'chamomile-b', pair: 'chamomile', label: 'C8-L3-4-B04' }, { id: 'paper-b', pair: 'paper', label: 'C8-L3-4-B05' }, { id: 'wax-b', pair: 'wax', label: 'C8-L3-4-B06' },
    ] }], mismatch: ['C8-L3-4-B07'], question: null } },
    { id: 'c8l3-sound', skill: 'sound-match', config: { kind: 'staged', mechanic: 'Услышь разницу', description: 'Сравнить пять звуков.', lines: ['C8-4-03'], steps: [{ id: 'sound', prompt: null, pageSize: 3, options: [opt('pukhlik', 'C8-4-B01', true, 'C8-4-02'), opt('stella', 'C8-4-B02', false, 'C8-4-03'), opt('fitilyok', 'C8-4-B03', false, 'C8-4-03'), opt('damka', 'C8-4-B04', false, 'C8-L2-4-01'), opt('mouse', 'C8-4-B05', false, 'C8-L3-5-01')] }] } },
    { id: 'c8l3-compare', skill: 'compare-traits', config: { kind: 'staged', mechanic: 'Сравни приметы', description: 'Сопоставить три заметки с пятью героями.', lines: ['C8-N04', 'C8-6-03', 'C8-6-B01', 'C8-6-B02', 'C8-6-B03'], steps: [{ id: 'who', prompt: null, pageSize: 3, options: [opt('pukhlik', 'C8-AX-pukhlik', true, 'C8-N04'), opt('stella', 'C8-AX-stella', false, 'C8-6-03'), opt('fitilyok', 'C8-AX-fitilyok', false, 'C8-6-03'), opt('damka', 'C8-AX-damka', false, 'C8-L2-7-01'), opt('mouse', 'C8-AX-mouse', false, 'C8-L3-8-01')] }] } },
    { id: 'c8l3-oath', skill: 'detective-oath', config: { kind: 'staged', mechanic: 'Клятва сыщика', description: 'Три обещания сыщика.', lines: ['C8-N05'], steps: [
      { id: 'evidence', prompt: null, pageSize: 3, options: [opt('evidence', 'C8-9-B01', true, 'C8-9-02'), opt('pies', 'C8-9-B02', false, 'C8-9-05'), opt('umbrellas', 'C8-9-B03', false, 'C8-9-05')] },
      { id: 'hypothesis', prompt: null, pageSize: 3, options: [opt('hypothesis', 'C8-9-B04', true, 'C8-9-03'), opt('alibi', 'C8-9-B05', false, 'C8-9-05'), opt('motive', 'C8-9-B06', false, 'C8-9-05')] },
      { id: 'truth', prompt: null, pageSize: 3, options: [opt('truth', 'C8-9-B07', true, 'C8-9-04'), opt('hurt', 'C8-9-B08', false, 'C8-9-05'), opt('hurry', 'C8-9-B09', false, 'C8-9-05')] },
    ] } },
  ], facts, glossary: [], rewards: rewardsFor(3), collections: heroCollections(['pukhlik', 'stella', 'fitilyok', 'damka', 'mouse']), activities: [activity], comfort, cutscenes: [], plannedCutscenes: retarget(baseCutscenes, { "C8-0": "C8-L3-0", "C8-8": "C8-L3F-8", "C8-9": "C8-L3F-9", "C8-12": "C8-L3F-12" }), decisions: [...commonDecisions(3), { id: 'C8L3-D7', text: 'Ракушки на уровне 3 нет; подсказки дают только три точных Клубка.', ref: 'D03' }, { id: 'C8L3-D8', text: 'Свой световой сигнал игрока показывается в финале маяка как визуальный результат профиля.', ref: 'D22' }], reserved: [],
};
