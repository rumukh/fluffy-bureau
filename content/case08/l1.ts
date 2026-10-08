import { all, cl, dir, goto, has, L, menu, minigame, not, opt as mopt, reveal, skill, type VariantSource } from '../../tools/content/dsl.ts';
import { activity, anyOf, baseCutscenes, commonDecisions, comfort, eq, facts, finalScenes, heroCollections, intended, introScene, invitationCards, opt, rewardsFor, versionScene, what, where, who } from './common.ts';

const HUB = 'C8-HUB';
const required = all(has.clue('c8-invitation'), has.clue('c8-room'), has.clue('c8-sound'), has.clue('c8-compare'));
const noWho = anyOf('who', ['pukhlik', 'fitilyok', 'stella']);

export const level1: VariantSource = {
  pack: 'case08-l1', kind: 'case', title: 'C8-TITLE', case: { number: 8, level: 1 }, start: 'C8-0',
  scenes: [
    introScene('C8-0', 'C8-1'),
    { id: 'C8-1', title: 'Сложи приглашение', location: 'office-door', cast: ['khvosts'], presentation: 'minigame', steps: [
      skill('invitation', [L('C8-1-01')]), minigame('c8l1-invitation'), L('C8-1-03'), L('C8-1-04'), reveal('c8-invitation'), L('C8-1-05'), L('C8-1-06'), goto('C8-2'),
    ] },
    { id: 'C8-2', title: 'Маяк: вход', location: 'lighthouse-door', cast: ['damka'], presentation: 'dialogue', steps: [dir('C8-2-D01', 'У двери маяка стоит Дамка и говорит тихо, чтобы не будить Пухлика.'), L('C8-2-01'), L('C8-2-02'), L('C8-2-03'), goto(HUB)] },
    { id: HUB, title: 'Маяк: выбор', location: 'lighthouse-door', cast: ['damka'], presentation: 'hub', steps: [
      { t: 'if', when: all(has.clue('c8-room'), has.clue('c8-sound'), not(has.visited('C8-6'))), then: [goto('C8-6')], else: [] },
      menu('C8-M', null, [
        mopt('room', 'C8-2-B01', 'C8-3', { hideWhen: has.visited('C8-3') }),
        mopt('sound', 'C8-2-B02', 'C8-4', { hideWhen: has.visited('C8-4') }),
        mopt('residents', 'C8-2-B03', 'C8-5', { hideWhen: has.visited('C8-5'), optional: true }),
      ]),
    ] },
    { id: 'C8-3', title: 'Комната Пухлика: Лупа', location: 'pukhlik-room', cast: ['khvosts', 'pukhlik'], presentation: 'minigame', steps: [
      dir('C8-3-D01', 'Пухлик спит в гнёздышке из пледа; ребёнок только смотрит подсвеченные места.'), skill('magnifier', [L('C8-3-01')]), minigame('c8l1-room'), L('C8-3-06'), L('C8-N03'), reveal('c8-room'), goto(HUB),
    ] },
    { id: 'C8-4', title: 'Услышь разницу', location: 'pukhlik-room', cast: ['khvosts', 'pukhlik', 'stella', 'fitilyok'], presentation: 'minigame', steps: [
      skill('sound-match', [L('C8-4-01')]), minigame('c8l1-sound'), L('C8-4-02'), reveal('c8-sound'), goto(HUB),
    ] },
    { id: 'C8-5', title: 'Стелла и Фитилёк', location: 'lighthouse-rail', cast: ['stella', 'fitilyok'], presentation: 'dialogue', steps: [dir('C8-5-D01', 'На перилах маяка сидит Стелла, рядом мягко светится Фитилёк.'), L('C8-5-01'), L('C8-5-02'), L('C8-5-03'), goto(HUB)] },
    { id: 'C8-6', title: 'Сравни приметы', location: 'notebook', cast: ['khvosts'], presentation: 'minigame', steps: [skill('compare-traits', [L('C8-6-01'), L('C8-6-02')]), minigame('c8l1-compare'), L('C8-6-04'), L('C8-6-05'), reveal('c8-compare'), goto('C8-7')] },
    versionScene('C8-7', HUB),
    ...finalScenes('C8', 1),
  ],
  logic: {
    axes: [
      { id: 'who', title: 'C8-AX-who', values: [who.pukhlik, who.fitilyok, who.stella] },
      { id: 'where', title: 'C8-AX-where', values: [where.attic, where.lighthouse, where.cellar] },
      { id: 'what', title: 'C8-AX-what', values: [what.party, what.treasure, what.walks] },
    ], intended,
    clues: [
      { id: 'c8-invitation', title: 'C8-CL-invitation', required: true, predicate: { op: 'and', terms: [eq('where', 'attic'), eq('what', 'party')] }, requires: [], source: 'C8-1', summary: 'Шесть символов складывают приглашение на чердак Конторы и обещают сюрприз стажёру.' },
      { id: 'c8-room', title: 'C8-CL-room', required: true, predicate: noWho, requires: [], source: 'C8-3', summary: 'В комнате Пухлика есть ромашка, серое перо и инструменты ночного мастера.' },
      { id: 'c8-sound', title: 'C8-CL-sound', required: true, predicate: noWho, requires: [], source: 'C8-4', summary: 'Ночное «ух» совпадает со вздохом Пухлика.' },
      { id: 'c8-compare', title: 'C8-CL-compare', required: true, predicate: eq('who', 'pukhlik'), requires: ['c8-room', 'c8-sound'], source: 'C8-6', summary: 'Ромашка, серое перо и «ух» сходятся только у Пухлика.' },
    ],
    version: { button: 'UI-hud.version', available: all(has.visited('C8-7'), required), onSolved: 'C8-8' },
    wrongVersion: { intro: [cl('C8-7-03')], byValue: [
      { axis: 'who', value: 'fitilyok', clues: ['c8-compare'], lines: [cl('C8-7-05')] },
      { axis: 'who', value: 'stella', clues: ['c8-compare'], lines: [cl('C8-7-04')] },
      { axis: 'where', value: 'lighthouse', clues: ['c8-invitation'], lines: [cl('C8-7-06')] },
      { axis: 'where', value: 'cellar', clues: ['c8-invitation'], lines: [cl('C8-7-06')] },
      { axis: 'what', value: 'treasure', clues: ['c8-invitation'], lines: [cl('C8-7-07')] },
      { axis: 'what', value: 'walks', clues: ['c8-invitation'], lines: [cl('C8-7-07')] },
    ], outro: [cl('C8-7-08')] },
    redHerrings: [
      { id: 'rh-c8-adults', summary: 'Хвостс и Ватсони что-то скрывают, но это праздник.', presentedBy: ['C8-0-04'], explainedBy: ['C8-8-15', 'C8-8-16', 'C8-8-20'] },
      { id: 'rh-c8-fitilyok', summary: 'Фитилёк не спит ночью и светится, но без перьев и «уха».', presentedBy: ['C8-5-02'], explainedBy: ['C8-8-18'] },
      { id: 'rh-c8-stella', summary: 'У Стеллы есть перья и записки, но перья чёрно-белые и она стрекочет.', presentedBy: ['C8-5-01', 'C8-5-03'], explainedBy: ['C8-8-19'] },
    ],
  },
  notebookHelp: { mode: 'suggest', marks: [
    { axis: 'who', value: 'pukhlik', mark: 'confirmed', clues: ['c8-compare'], line: 'C8-NB-pukhlik-yes' },
    { axis: 'who', value: 'fitilyok', mark: 'excluded', clues: ['c8-compare'], line: 'C8-NB-fitilyok-no' },
    { axis: 'who', value: 'stella', mark: 'excluded', clues: ['c8-compare'], line: 'C8-NB-stella-no' },
    { axis: 'where', value: 'attic', mark: 'confirmed', clues: ['c8-invitation'], line: 'C8-NB-invite-place' },
    { axis: 'where', value: 'lighthouse', mark: 'excluded', clues: ['c8-invitation'], line: 'C8-NB-invite-place' },
    { axis: 'where', value: 'cellar', mark: 'excluded', clues: ['c8-invitation'], line: 'C8-NB-invite-place' },
    { axis: 'what', value: 'party', mark: 'confirmed', clues: ['c8-invitation'], line: 'C8-NB-invite-what' },
    { axis: 'what', value: 'treasure', mark: 'excluded', clues: ['c8-invitation'], line: 'C8-NB-invite-what' },
    { axis: 'what', value: 'walks', mark: 'excluded', clues: ['c8-invitation'], line: 'C8-NB-invite-what' },
  ], pointers: [], nothing: 'UI-notebook.nothing' },
  hints: { klubok: { speaker: 'khvosts', precision: 'exact', allowance: 3, rules: [
    { id: 'C8-H-01', when: not(has.clue('c8-invitation')), cites: [] },
    { id: 'C8-H-02', when: not(has.clue('c8-room')), cites: [] },
    { id: 'C8-H-03', when: not(has.clue('c8-sound')), cites: [] },
    { id: 'C8-H-06', when: not(has.clue('c8-sound')), cites: [] },
    { id: 'C8-H-04', when: not(has.clue('c8-compare')), cites: [] },
    { id: 'C8-H-05', when: all(has.visited('C8-7'), has.clue('c8-invitation'), has.clue('c8-room'), has.clue('c8-sound'), has.clue('c8-compare')), cites: ['c8-invitation', 'c8-room', 'c8-sound', 'c8-compare'] },
  ], review: 'C8-H-07', exhausted: 'UI-hint.klubokEmptyShell' }, shell: { speaker: 'watsony', precision: 'exact', allowance: null, rules: [
    { id: 'C8-R-03', when: not(has.clue('c8-invitation')), cites: [] },
    { id: 'C8-R-01', when: not(has.clue('c8-room')), cites: [] },
    { id: 'C8-R-04', when: not(has.clue('c8-sound')), cites: [] },
    { id: 'C8-R-02', when: not(has.clue('c8-compare')), cites: [] },
  ], review: 'C8-R-03', exhausted: null } },
  minigames: [
    { id: 'c8l1-invitation', skill: 'invitation', config: { kind: 'staged', mechanic: 'Сложи приглашение', description: 'Поставить шесть символов в окна письма.', lines: ['C8-N01', 'C8-N02', 'C8-1-02'], steps: [{ id: 'cards', prompt: null, pageSize: 3, options: invitationCards }] } },
    { id: 'c8l1-room', skill: 'magnifier', config: { kind: 'magnifier', targets: [
      { id: 'cup', label: 'C8-3-B01', required: true, reply: ['C8-3-02'] }, { id: 'feather', label: 'C8-3-B02', required: true, reply: ['C8-3-03'] }, { id: 'basket', label: 'C8-3-B03', required: true, reply: ['C8-3-04', 'C8-3-05'] },
    ], afterFirst: [], afterFirstSkill: null, assistAfterMisses: 3 } },
    { id: 'c8l1-sound', skill: 'sound-match', config: { kind: 'staged', mechanic: 'Услышь разницу', description: 'Выбрать звук, похожий на ночное «ух».', lines: ['C8-4-03'], steps: [{ id: 'sound', prompt: null, pageSize: 3, options: [opt('pukhlik', 'C8-4-B01', true, 'C8-4-02'), opt('stella', 'C8-4-B02', false, 'C8-4-03'), opt('fitilyok', 'C8-4-B03', false, 'C8-4-03')] }] } },
    { id: 'c8l1-compare', skill: 'compare-traits', config: { kind: 'staged', mechanic: 'Сравни приметы', description: 'Сопоставить три заметки с героями.', lines: ['C8-N04', 'C8-6-03', 'C8-6-B01', 'C8-6-B02', 'C8-6-B03'], steps: [{ id: 'who', prompt: null, pageSize: 3, options: [opt('pukhlik', 'C8-AX-pukhlik', true, 'C8-N04'), opt('stella', 'C8-AX-stella', false, 'C8-6-03'), opt('fitilyok', 'C8-AX-fitilyok', false, 'C8-6-03')] }] } },
    { id: 'c8l1-oath', skill: 'detective-oath', config: { kind: 'staged', mechanic: 'Клятва сыщика', description: 'Три обещания сыщика.', lines: ['C8-N05'], steps: [
      { id: 'evidence', prompt: null, pageSize: 3, options: [opt('evidence', 'C8-9-B01', true, 'C8-9-02'), opt('pies', 'C8-9-B02', false, 'C8-9-05'), opt('umbrellas', 'C8-9-B03', false, 'C8-9-05')] },
      { id: 'hypothesis', prompt: null, pageSize: 3, options: [opt('hypothesis', 'C8-9-B04', true, 'C8-9-03'), opt('alibi', 'C8-9-B05', false, 'C8-9-05'), opt('motive', 'C8-9-B06', false, 'C8-9-05')] },
      { id: 'truth', prompt: null, pageSize: 3, options: [opt('truth', 'C8-9-B07', true, 'C8-9-04'), opt('hurt', 'C8-9-B08', false, 'C8-9-05'), opt('hurry', 'C8-9-B09', false, 'C8-9-05')] },
    ] } },
  ], facts, glossary: [], rewards: rewardsFor(1), collections: heroCollections(['pukhlik', 'stella', 'fitilyok']), activities: [activity], comfort, cutscenes: [], plannedCutscenes: baseCutscenes, decisions: commonDecisions(1), reserved: [],
};
