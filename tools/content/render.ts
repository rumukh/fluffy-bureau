// Human-readable outputs: explicit per-variant scripts for PM review, change log, validation report.
import type { Cond, ContentPack, StageAction, Step } from '../../packages/content/src/schema.ts';
import type { BuildResult } from './compile.ts';
import type { VariantSource } from './dsl.ts';
import { sentences, tokenize } from './text.ts';

const GENERATED = '> Сгенерировано `node tools/content/build.ts` из `content/`. Не редактировать вручную.';

function cond(c: Cond | null): string {
  if (c === null) return 'всегда';
  if ('clue' in c) return `улика ${c.clue}`;
  if ('visited' in c) return `пройдена сцена ${c.visited}`;
  if ('flag' in c) return `флаг ${c.flag}`;
  if ('skill' in c) return `навык ${c.skill} уже знаком`;
  if ('notebookConfirmed' in c) return `в колонке ${c.notebookConfirmed} есть ✔`;
  if ('all' in c) return c.all.map(cond).join(' И ');
  if ('any' in c) return `(${c.any.map(cond).join(' ИЛИ ')})`;
  return `НЕ (${cond(c.not)})`;
}

export function renderVariant(r: BuildResult, v: VariantSource, pack: ContentPack): string {
  const line = (id: string) => r.lineIndex.get(id);
  const speaker = (id: string) => r.sources.shared.speakers.find((s) => s.id === id)?.name ?? id;
  const say = (id: string | null) => {
    if (!id) return '—';
    const l = line(id);
    if (!l) return `\`${id}\` ⚠ нет строки`;
    const rev = l.rev > 1 ? ` (ред. ${l.rev})` : '';
    return l.speaker === 'narrator' ? `\`${id}\`${rev} «${l.text}»` : `\`${id}\`${rev} **${speaker(l.speaker)}:** «${l.text}»`;
  };
  const txt = (id: string) => `«${line(id)?.text ?? id}»`;
  const out: string[] = [];
  const level = v.case ? `, сложность ${v.case.level}` : '';
  out.push(`# ${v.pack}: ${v.title ? txt(v.title) : ''}${level}`, '', GENERATED, '', `Ревизия пакета: \`${pack.revision.slice(0, 16)}\`. Старт: \`${v.start}\`.`, '');

  const L = v.logic;
  out.push('## Логика', '', '| Колонка | Значения | Ответ |', '|---|---|---|');
  for (const a of L.axes) out.push(`| ${txt(a.title)} | ${a.values.map((x) => `${txt(x.label)} (\`${x.id}\`)`).join(' · ')} | **${L.intended[a.id]}** |`);
  out.push('', '| Улика | Название | Обязательна | Условие | Открывается после | Где |', '|---|---|---|---|---|---|');
  for (const c of L.clues) out.push(`| \`${c.id}\` | ${txt(c.title)} | ${c.required ? 'да' : 'нет'} | \`${JSON.stringify(c.predicate)}\` | ${c.requires.join(', ') || '—'} | ${c.source} |`);
  out.push('', `Кнопка версии: ${txt(L.version.button)}, доступна когда: ${cond(L.version.available)}; при верной версии → \`${L.version.onSolved}\`.`, '');

  out.push('## Сценарий', '');
  const steps = (list: Step[], indent: string) => {
    for (const s of list) {
      switch (s.t) {
        case 'line': out.push(`${indent}- ${say(s.line)}`); break;
        case 'dir': {
          out.push(`${indent}- _[${s.id}] ${s.text}_${s.background ? ` · фон \`${s.background}\`` : ''}`);
          for (const a of s.actions ?? []) out.push(`${indent}  - ▸ ${describeAction(a)}`);
          break;
        }
        case 'await': out.push(`${indent}- ⏸ ждём действия игрока: \`${s.action}\`${s.hotspot ? ` (нажать «${s.hotspot}»)` : ''}`); break;
        case 'clue': out.push(`${indent}- 🔎 **Улика:** \`${s.clue}\` ${txt(L.clues.find((c) => c.id === s.clue)!.title)}`); break;
        case 'set': out.push(`${indent}- флаг \`${s.flag}\``); break;
        case 'reward': {
          const rw = r.sources.shared.rewards.find((x) => x.id === s.reward);
          out.push(`${indent}- 🎁 **Награда:** ${rw ? txt(rw.label) : s.reward}${rw && rw.amount > 1 ? ` ×${rw.amount}` : ''}`);
          break;
        }
        case 'cutscene': {
          const c = v.cutscenes.find((x) => x.id === s.cutscene);
          out.push(`${indent}- 🎬 **Ролик** \`${s.cutscene}\`${c ? `: ${c.summary}` : ' ⚠ нет ролика'}`);
          if (c?.document) {
            const ii = `${indent}  `;
            const cast = Object.entries(c.document.cast).map(([k, e]) => (e.role === 'avatar' ? `${k} = аватар игрока` : `${k} = ${e.rig}`));
            out.push(`${ii}- состав: ${cast.join(', ') || '—'}; после каждой реплики — «Дальше»`);
            for (const st of c.document.steps) {
              if (st.op === 'line') out.push(`${ii}- ${say(st.line)}`);
              else if (st.op === 'marker') out.push(`${ii}- ◆ метка \`${st.id}\``);
              else if (st.op === 'background') out.push(`${ii}- _фон \`${st.asset}\`_`);
              else if (st.op === 'music') out.push(`${ii}- _музыка ${st.asset ? `\`${st.asset}\`` : 'стихает'}_`);
              else if (st.op === 'enter') out.push(`${ii}- _входит ${st.actor}_`);
              else if (st.op === 'exit') out.push(`${ii}- _уходит ${st.actor}_`);
              else if (st.op === 'pose') out.push(`${ii}- _${st.actor}: ${[st.expression && `лицо ${st.expression}`, st.clip && `движение ${st.clip}`, st.face && `смотрит ${st.face === 'left' ? 'влево' : 'вправо'}`].filter(Boolean).join(', ')}_`);
              else if (st.op === 'emote') out.push(`${ii}- _${st.actor}: эмоция ${st.emote}_`);
              else if (st.op === 'effect') out.push(`${ii}- _эффект ${st.effect}_`);
              else if (st.op === 'sfx') out.push(`${ii}- _звук \`${st.asset}\`_`);
              else if (st.op === 'camera') out.push(`${ii}- _камера ${st.preset ?? `${st.to?.x},${st.to?.y}×${st.to?.zoom}`}_`);
              else if (st.op === 'wait' && st.seconds) out.push(`${ii}- _пауза ${st.seconds} с_`);
              else if (st.op === 'transition') out.push(`${ii}- _переход ${st.type}_`);
            }
          }
          break;
        }
        case 'goto': out.push(`${indent}- → \`${s.scene}\``); break;
        case 'end': out.push(`${indent}- ■ конец пакета`); break;
        case 'skill':
          out.push(`${indent}- **[НАВЫК: ${txt(`SK-${s.skill}`)}]** при первой встрече:`);
          steps(s.first, `${indent}  `);
          if (JSON.stringify(s.first) !== JSON.stringify(s.known)) {
            out.push(`${indent}  - если навык уже знаком:`);
            if (s.known.length === 0) out.push(`${indent}    - (ничего)`);
            steps(s.known, `${indent}    `);
          }
          break;
        case 'if':
          out.push(`${indent}- если ${cond(s.when)}:`);
          steps(s.then, `${indent}  `);
          if (s.else.length) { out.push(`${indent}- иначе:`); steps(s.else, `${indent}  `); }
          break;
        case 'menu':
          out.push(`${indent}- **Выбор** (\`${s.id}\`, не больше ${s.pageSize} на экране${s.back ? `, «Назад» → \`${s.back}\`` : ''}):`);
          for (const o of s.options) {
            const extra = [o.when ? `появляется: ${cond(o.when)}` : '', o.hideWhen ? `исчезает: ${cond(o.hideWhen)}` : '', o.optional ? 'необязательно' : ''].filter(Boolean).join('; ');
            out.push(`${indent}  - ${say(o.label)} → \`${o.to}\`${extra ? ` (${extra})` : ''}`);
          }
          break;
        case 'minigame': {
          const m = v.minigames.find((x) => x.id === s.minigame)!;
          out.push(`${indent}- 🎲 **Мини-игра** ${txt(`SK-${m.skill}`)} (\`${m.id}\`):`);
          const c = m.config;
          const ii = `${indent}  `;
          const opts = (os: { id: string; label: string; correct: boolean; reply: string[] }[]) => os.forEach((o) => {
            out.push(`${ii}- ${o.correct ? '✔' : '✖'} ${say(o.label)}`);
            o.reply.forEach((x) => out.push(`${ii}  - ${say(x)}`));
          });
          if (c.kind === 'magnifier') {
            c.targets.forEach((t) => { out.push(`${ii}- предмет ${say(t.label)}${t.required ? '' : ' (необязательный)'}`); t.reply.forEach((x) => out.push(`${ii}  - ${say(x)}`)); });
            if (c.afterFirst.length) { out.push(`${ii}- после первой находки${c.afterFirstSkill ? ` [НАВЫК: ${c.afterFirstSkill}]` : ''}:`); c.afterFirst.forEach((x) => out.push(`${ii}  - ${say(x)}`)); }
            out.push(`${ii}- после ${c.assistAfterMisses} касаний мимо подсвечивается область; таймера нет`);
          } else if (c.kind === 'cocoa') {
            c.rounds.forEach((rd, i) => { out.push(`${ii}- Раунд ${i + 1}:`); opts(rd.options.map((o) => ({ ...o }))); rd.retry.forEach((x) => out.push(`${ii}  - при неудаче: ${say(x)}`)); });
            out.push(`${ii}- неудачный ответ — раунд повторяется без штрафа`);
          } else if (c.kind === 'tracks') {
            c.steps.forEach((st) => { out.push(`${ii}- Шаг \`${st.id}\`${st.prompt ? `: ${say(st.prompt)}` : ''} (страницы по ${st.pageSize}):`); opts(st.options); });
            if (c.question) { out.push(`${ii}- Вопрос: ${say(c.question.prompt)}`); opts(c.question.options); }
            out.push(`${ii}- неверная карточка гаснет, выбор продолжается; штрафа нет`);
          } else if (c.kind === 'timeline') {
            out.push(`${ii}- Порядок: ${c.solution.map((id) => { const it = c.items.find((x) => x.id === id)!; return txt(it.label); }).join(' → ')}`);
            c.wrong.forEach((x) => out.push(`${ii}- ошибка порядка: ${say(x)}`));
          } else if (c.kind === 'scent-pairs') {
            c.fields.forEach((f) => out.push(`${ii}- поле ${txt(f.label)}: ${[...new Set(f.cards.map((x) => txt(x.label)))].join(', ')} (по две карточки)`));
            c.mismatch.forEach((x) => out.push(`${ii}- не пара: ${say(x)}`));
            if (c.question) { out.push(`${ii}- Вопрос: ${say(c.question.prompt)}`); opts(c.question.options); }
          } else if (c.kind === 'cipher') {
            out.push(`${ii}- таблица: ${c.table.map((g) => `${g.letter} = ${g.colour}, ${g.shape}, ${g.holes} дыр.`).join('; ')}`);
            c.intro.forEach((x) => out.push(`${ii}- ${say(x)}`));
            c.words.forEach((w) => { out.push(`${ii}- слово «${w.answer}»: ${w.slots.map((sl) => sl.options.map((o) => c.table.find((g) => g.id === o)?.letter).join('/')).join(' · ')}`); w.solved.forEach((x) => out.push(`${ii}  - ${say(x)}`)); });
            c.wrong.forEach((x) => out.push(`${ii}- неверная буква: ${say(x)}`));
          } else if (c.kind === 'postman') {
            c.intro.forEach((x) => out.push(`${ii}- ${say(x)}`));
            c.letters.forEach((x) => out.push(`${ii}- ${say(x.label)}: пуговицы ${x.buttons.join('+')} → домик ${x.house}${x.street ? `, улица ${x.street}` : ''} (варианты ${x.houseOptions.join('/')})`));
            [...c.wrongStreet, ...c.wrongHouse].forEach((x) => out.push(`${ii}- ошибка: ${say(x)}`));
            c.correct.forEach((x) => out.push(`${ii}- верно: ${say(x)}`));
          } else if (c.kind === 'sound-match') {
            c.intro.forEach((x) => out.push(`${ii}- ${say(x)}`));
            c.rounds.forEach((rd) => { out.push(`${ii}- раунд \`${rd.id}\`: ночной звук \`${rd.target}\` (беззвучная форма — карточка-волна A)`); opts(rd.options); rd.wrong.forEach((x) => out.push(`${ii}  - неверно: ${say(x)}`)); });
            c.after.forEach((x) => out.push(`${ii}- ${say(x)}`));
          } else if (c.kind === 'light-signals') {
            c.intro.forEach((x) => out.push(`${ii}- ${say(x)}`));
            c.signals.forEach((sg) => { out.push(`${ii}- ${say(sg.label)}: ${sg.pattern.map((p) => (p === 'dot' ? '•' : '—')).join(' ')}`); sg.correct.forEach((x) => out.push(`${ii}  - ${say(x)}`)); });
            c.wrong.forEach((x) => out.push(`${ii}- неверно: ${say(x)}`));
            if (c.own) { out.push(`${ii}- свой сигнал: ${c.own.min}–${c.own.max} огоньков, принимается любой (D22)`); [...c.own.prompt, ...c.own.done].forEach((x) => out.push(`${ii}  - ${say(x)}`)); }
          } else if (c.kind === 'read-blink') {
            out.push(`${ii}- рисунок: ${c.drawing.map((p) => (p === 'dot' ? '•' : '—')).join(' ')}`);
            c.lessons.forEach((l) => { out.push(`${ii}- ${l.correct ? '✔' : '✖'} ${say(l.label)} ${l.pattern.map((p) => (p === 'dot' ? '•' : '—')).join(' ')}`); l.reply.forEach((x) => out.push(`${ii}  - ${say(x)}`)); });
            c.wrong.forEach((x) => out.push(`${ii}- неверно: ${say(x)}`));
          } else if (c.kind === 'dream-keeper') {
            c.intro.forEach((x) => out.push(`${ii}- ${say(x)}`));
            c.rounds.forEach((rd) => { out.push(`${ii}- раунд «${rd.axis}» → \`${rd.answer}\`:`); rd.cards.forEach((cd, n) => out.push(`${ii}  - сон ${n + 1} 🔒: ${say(cd.label)} (\`${cd.image}\`)`)); rd.correct.forEach((x) => out.push(`${ii}  - верно: ${say(x)}`)); rd.wrong.forEach((x) => out.push(`${ii}  - неверно: ${say(x)}`)); });
            c.after.forEach((x) => out.push(`${ii}- ${say(x)}`));
            out.push(`${ii}- семейный режим (T31): ${[...c.family.intro, ...c.family.keeperPick, ...c.family.ask, ...c.family.win].map(say).join(' · ')}`);
            out.push(`${ii}  - игроки: ${c.family.players.map((p) => txt(p.label)).join(', ')}`);
            out.push(`${ii}  - вопросы: ${c.family.questions.map((q) => txt(q.label)).join(' · ')}`);
            out.push(`${ii}  - звания: ${c.family.titles.map((x) => `${txt(x.label)} (${x.for})`).join(', ')}`);
          } else if (c.kind === 'equal-share') {
            c.intro.forEach((x) => out.push(`${ii}- ${say(x)}`));
            c.tasks.forEach((tk) => { out.push(`${ii}- ${say(tk.prompt)}: ${tk.items} × ${txt(tk.itemLabel)} на ${tk.groups} × ${txt(tk.groupLabel)}${tk.reserve ? `, запас ${tk.reserve}` : ''}`); tk.correct.forEach((x) => out.push(`${ii}  - ${say(x)}`)); });
            c.uneven.forEach((x) => out.push(`${ii}- неровно: ${say(x)}`));
          } else if (c.kind === 'compare') {
            out.push(`${ii}- сравниваем: ${say(c.subject.label)} (\`${c.subject.image}\`)`);
            c.steps.forEach((st) => { out.push(`${ii}- шаг \`${st.id}\`${st.prompt ? `: ${say(st.prompt)}` : ''}`); opts(st.options); });
            if (c.question) { out.push(`${ii}- Вопрос: ${say(c.question.prompt)}`); opts(c.question.options); }
          } else if (c.kind === 'staged') {
            out.push(`${ii}- механика «${c.mechanic}»: ${c.description}`);
            c.steps.forEach((st) => { out.push(`${ii}- Шаг \`${st.id}\`${st.prompt ? `: ${say(st.prompt)}` : ''}`); opts(st.options); });
            c.lines.forEach((x) => out.push(`${ii}- реплика механики: ${say(x)}`));
          } else if (c.kind === 'baker') {
            out.push(`${ii}- мерки: ${c.measures.map((x) => `${txt(x.label)} = ${x.units}/8 стакана`).join(', ')}`);
            c.steps.forEach((st) => { out.push(`${ii}- ${say(st.prompt)} → нужно ${st.target}/8 стакана (${st.ideal.join(' или ')})`); st.afterWrong.forEach((x) => out.push(`${ii}  - после ошибки: ${say(x)}`)); });
            c.tooMuch.forEach((x) => out.push(`${ii}- перебор: ${say(x)}`));
            c.tooLittle.forEach((x) => out.push(`${ii}- недобор: ${say(x)}`));
          }
          break;
        }
      }
    }
  };
  for (const sc of v.scenes) {
    out.push(`### ${sc.id}. ${sc.title}`, '', `Место: \`${sc.location}\` · герои: ${sc.cast.map(speaker).join(', ') || '—'} · подача: ${sc.presentation}`, '');
    steps(sc.steps, '');
    out.push('');
  }

  out.push('## Неверная версия', '', 'Сначала:', ...L.wrongVersion.intro.map((c) => `- ${say(c.line)}${c.when ? ` (если ${cond(c.when)})` : ''}`), '',
    'Затем объясняется **первое** неверное значение по порядку колонок:', '', '| Неверно | Исключает улика | Реплика |', '|---|---|---|');
  for (const b of L.wrongVersion.byValue) {
    const val = L.axes.find((a) => a.id === b.axis)!.values.find((x) => x.id === b.value)!;
    out.push(`| ${txt(L.axes.find((a) => a.id === b.axis)!.title)} ${txt(val.label)} | ${b.clues.join(', ')} | ${b.lines.map((c) => `${say(c.line)}${c.when ? ` (если ${cond(c.when)})` : ''}`).join('<br>')} |`);
  }
  if (L.wrongVersion.outro.length) out.push('', 'В конце:', ...L.wrongVersion.outro.map((c) => `- ${say(c.line)}`));
  out.push('', 'Попыток сколько угодно; награды не теряются (Q16).', '');

  if (L.redHerrings.length) {
    out.push('## Ложные следы', '', '| ID | Суть | Появляется | Объясняется |', '|---|---|---|---|');
    for (const h of L.redHerrings) out.push(`| \`${h.id}\` | ${h.summary} | ${h.presentedBy.join(', ')} | ${h.explainedBy.join(', ')} |`);
    out.push('');
  }
  if (v.hints) {
    out.push('## Подсказки', '');
    for (const [name, ch] of [['Клубок', v.hints.klubok], ['Телефон-ракушка', v.hints.shell]] as const) {
      if (!ch) { out.push(`**${name}:** недоступен на этой сложности (D03).`, ''); continue; }
      out.push(`**${name}** (${speaker(ch.speaker)}, ${ch.precision === 'exact' ? 'точно' : 'расплывчато'}, ${ch.allowance === null ? 'без ограничений' : `${ch.allowance} на дело`}). Выдаётся первая подходящая:`, '');
      ch.rules.forEach((h, i) => out.push(`${i + 1}. ${say(h.id)} — когда ${cond(h.when)}${h.cites.length ? `; опирается на ${h.cites.join(', ')}` : ''}`));
      out.push(`- Если ничего не подходит — разбор известного (клубок не тратится): ${say(ch.review)}`);
      if (ch.exhausted) out.push(`- Когда клубки кончились: ${say(ch.exhausted)}`);
      out.push('');
    }
  }
  if (v.notebookHelp) {
    const nb = v.notebookHelp;
    out.push('## «Помоги заполнить»', '', nb.mode === 'suggest' ? 'Предлагает стикер и объясняет почему; сам не ставит (Q14).' : 'Только показывает, к какой улике вернуться (D03).', '',
      '| Стикер | Значение | Улики | Реплика |', '|---|---|---|---|');
    for (const m of nb.marks) out.push(`| ${m.mark === 'confirmed' ? '✔' : '✖'} | ${m.axis}=${m.value} | ${m.clues.join(', ')} | ${nb.mode === 'suggest' ? say(m.line) : '—'} |`);
    if (nb.pointers.length) { out.push('', 'Указатели:'); nb.pointers.forEach((p) => out.push(`- \`${p.clue}\`: ${say(p.line)}`)); }
    out.push(`- Нечего предложить: ${say(nb.nothing)}`, '');
  }
  if (v.facts.length || v.glossary.length) {
    out.push('## Факты и словарик', '');
    v.facts.forEach((f) => out.push(`- Факт \`${f.id}\`: ${say(f.line)}`));
    v.glossary.forEach((g) => out.push(`- Слово ${txt(g.label)}: ${say(g.definition)}`));
    const flows = r.flows.get(v.pack) ?? [];
    for (const g of v.glossary) out.push(`  - «${g.word}»: минимум ${Math.min(...flows.map((f) => f.minGlossary[g.id] ?? 0))} разных реплик на любом маршруте`);
    out.push('');
  }
  if (v.activities.length) {
    out.push('## Карточки «Настоящее дело»', '');
    for (const a of v.activities) {
      out.push(`### ${txt(a.title)}`, '');
      a.steps.forEach((s) => out.push(`- ${s.adultOnly ? '**[взрослый]** ' : ''}${say(s.line)}`));
      out.push('', 'Безопасность:', ...a.safety.map((x) => `- ${say(x)}`), '', `Аллергены: ${a.allergens.join(', ')}.`, '');
    }
  }
  if (v.cutscenes.length) {
    out.push('## Ролики', '');
    v.cutscenes.forEach((c) => out.push(`- \`${c.id}\` в сцене \`${c.scene}\`: ${c.summary}`));
    out.push('');
  }
  if (v.notebookPages?.length) {
    out.push('## Страницы Блокнота', '');
    v.notebookPages.forEach((p) => out.push(`- \`${p.id}\` (${p.kind}): ${say(p.title)}; открывается наградой \`${p.unlock}\``));
    out.push('');
  }
  if (v.reserved?.length) {
    out.push('## Строки для систем следующих этапов', '');
    for (const r of v.reserved) { out.push(`- ${r.reason}:`); r.lines.forEach((x) => out.push(`  - ${say(x)}`)); }
    out.push('');
  }
  if (v.decisions.length) {
    out.push('## Решения нормализации', '');
    v.decisions.forEach((d) => out.push(`- **${d.id}** (${d.ref}): ${d.text}`));
    out.push('');
  }
  return out.join('\n');
}

export function renderChangelog(r: BuildResult): string {
  const out = ['# Журнал изменений контента', '', GENERATED, '',
    'Исходные сценарии PM (`docs/pm/**`) не меняются. Каждая правка текста живёт в нормализованных данных `content/` и попадает сюда автоматически: строка сохраняет ID, номер редакции растёт. Правила новых ID — `docs/content/ID_PATTERNS.md`.', ''];
  const all = [r.sources.shared.lines, ...r.sources.cases.map((c) => c.lines)].flat();
  const edited = all.filter((l) => l.changes.some((c) => c.before !== null));
  out.push('## Изменённые реплики PM', '', '| ID | Ред. | Было | Стало | Причина | Ссылка |', '|---|---|---|---|---|---|');
  for (const l of edited) for (const c of l.changes.filter((x) => x.before !== null)) out.push(`| \`${l.id}\` | ${l.rev} | «${c.before}» | «${l.text}» | ${c.reason} | ${c.ref} |`);
  const added = all.filter((l) => l.changes.some((c) => c.before === null));
  const groups = new Map<string, typeof added>();
  for (const l of added) { const k = l.changes[0]!.ref; groups.set(k, [...(groups.get(k) ?? []), l]); }
  out.push('', '## Новые строки', '', 'Строк, которых нет в сценариях PM: ' + added.length + '.', '');
  for (const [ref, list] of [...groups].sort()) {
    out.push(`### ${ref}`, '', '| ID | Говорит | Текст | Причина |', '|---|---|---|---|');
    for (const l of list) out.push(`| \`${l.id}\` | ${l.speaker} | «${l.text}» | ${l.changes[0]!.reason} |`);
    out.push('');
  }
  out.push('## Структурные решения (без изменения текста)', '');
  for (const c of r.sources.cases) for (const v of c.variants) for (const d of v.decisions) out.push(`- **${v.pack} / ${d.id}** (${d.ref}): ${d.text}`);
  out.push('');
  return out.join('\n');
}

export function renderReport(r: BuildResult): string {
  const errors = r.issues.filter((i) => i.level === 'error');
  const warnings = r.issues.filter((i) => i.level === 'warning');
  const out = ['# Отчёт проверки контента', '', GENERATED, '',
    `**Итог:** ${errors.length === 0 ? '✅ ошибок нет' : `❌ ошибок: ${errors.length}`}; предупреждений: ${warnings.length}.`, '',
    '## Что проверяется (сборка падает при ошибке)', '',
    '- Предложение — отрезок текста до «.», «!», «?» или «…», за которым идёт пробел; подпись без точки — одно предложение.',
    '- Слово — непрерывная последовательность букв и цифр Юникода; дефис и апостроф внутри оставляют одно слово («лапа-лопатка»); знаки препинания и тире словами не считаются; `{имя}` — одно слово (T04); «8:00» — два слова. Токенизатор сверяется с `tokenizeWords` из `@aegis/narrative`.',
    '- Не больше 10 слов в предложении (все строки, включая подписи) и 1–3 предложения в реплике (Q24).',
    '- Ровно 3 факта на дело; не больше 3 новых слов словарика на дело; каждое слово — минимум в 3 разных репликах на **каждом** проходимом маршруте (полный перебор состояний для нового и опытного профиля).',
    '- Все ID существуют, уникальны и в допустимом формате; все ссылки (реплики, сцены, улики, мини-игры, навыки, награды) разрешаются; каждая строка в пакете озвучена (есть запись в манифесте).',
    '- Не больше 3 вариантов выбора на экране в любом достижимом состоянии; больше — только страницами по 3 (Q11).',
    '- Обращение к игроку без рода: эвристика + ручной разбор (`content/shared/gender-review.ts`).',
    '- Текст совпадает с PM, либо есть запись в журнале изменений с верным «было» и номером редакции; новые строки помечены.',
    '- Логика: после обязательных улик ровно один кандидат (своим решателем и `validateDeduction` из `@aegis/narrative`); ни одна улика не противоречит ответу; каждое неверное значение объяснено, и указанная улика **сама** его исключает (R03); ложные следы не являются уликами и объясняются на каждом маршруте, где появились; подсказки и «помоги заполнить» опираются только на открытые улики; к каждой обязательной улике ведёт точная подсказка клубка; кнопка версии не появляется раньше обязательных улик.',
    '- Каждая сцена безопасна при повторном входе с начала (требование G).', '',
    '## Пакеты', '', '| Пакет | Строк | Предложений | Макс. слов | Кандидатов | Обяз. улик | Осталось | Неверных значений | Ложных следов | Состояний (новый/опытный) | Концовок | Макс. вариантов |',
    '|---|---|---|---|---|---|---|---|---|---|---|---|'];
  for (const [pack, s] of r.stats) {
    const f = r.flows.get(pack) ?? [];
    out.push(`| ${pack} | ${s.lines} | ${s.spokenSentences} | ${s.maxWords} | ${s.candidates} | ${s.requiredClues} | ${s.afterRequired} (aegis: ${s.aegisRemaining}) | ${s.wrongValues} | ${s.redHerrings} | ${f.map((x) => x.states).join(' / ')} | ${f.map((x) => x.endings).join(' / ')} | ${Math.max(...f.map((x) => x.maxVisibleOptions))} |`);
  }
  out.push('', '## Словарик: минимум разных реплик на маршруте', '');
  for (const c of r.sources.cases) for (const v of c.variants) {
    const f = r.flows.get(v.pack) ?? [];
    if (v.glossary.length) out.push(`- ${v.pack}: ${v.glossary.map((g) => `«${g.word}» ${Math.min(...f.map((x) => x.minGlossary[g.id] ?? 0))}`).join(', ')}`);
  }
  const all = [r.sources.shared.lines, ...r.sources.cases.map((c) => c.lines)].flat();
  const words = all.flatMap((l) => sentences(l.text).map((s) => tokenize(s).length));
  out.push('', `Всего строк: ${all.length}; предложений: ${words.length}; максимум слов: ${Math.max(...words)}.`, '');
  out.push(`Манифест озвучки: ${r.manifest.entries.length} записей, из них уникальных записей для студии: ${r.manifest.entries.filter((e) => !('sameAudioAs' in e)).length}.`, '');
  out.push('## Ошибки', '', ...(errors.length ? errors.map((i) => `- \`${i.code}\` ${i.where}: ${i.message}`) : ['Нет.']), '');
  out.push('## Предупреждения', '', ...(warnings.length ? warnings.map((i) => `- \`${i.code}\` ${i.where}: ${i.message}`) : ['Нет.']), '');
  return out.join('\n');
}

function describeAction(a: StageAction): string {
  switch (a.op) {
    case 'pose': return `${a.actor}: ${[a.expression && `лицо ${a.expression}`, a.clip && `движение ${a.clip}`, a.face && `смотрит ${a.face === 'left' ? 'влево' : 'вправо'}`].filter(Boolean).join(', ')}`;
    case 'emote': return `${a.actor}: эмоция ${a.emote}`;
    case 'sfx': return `звук \`${a.asset}\``;
    case 'effect': return `эффект ${a.effect}`;
    case 'move': return `${a.actor} идёт к ${a.to.x},${a.to.y}`;
    case 'enter': return `появляется ${a.actor}`;
    case 'exit': return `исчезает ${a.actor}`;
  }
}

export function renderAssetRequests(r: BuildResult): string {
  const out = ['# Запросы ассетов для Этапа 2 (C → A)', '', GENERATED, '',
    'Ассеты, на которые ссылаются производственные пакеты Этапа 2 (дела 2–4, «Уютный денёк»), но которых ещё нет в `assets/`. Пока список не пуст, сборка показывает их как ожидаемые; после поставки A проверка становится строгой.', ''];
  if (!r.assetRequests.length) { out.push('Все ассеты на месте.'); return out.join('\n'); }
  const kinds = [...new Set(r.assetRequests.map((x) => x.kind))].sort();
  for (const k of kinds) {
    out.push(`## ${k}`, '', '| ID | Пакеты | Где |', '|---|---|---|');
    const byId = new Map<string, { packs: Set<string>; where: Set<string> }>();
    for (const x of r.assetRequests.filter((y) => y.kind === k)) {
      const e = byId.get(x.id) ?? { packs: new Set(), where: new Set() };
      e.packs.add(x.pack); e.where.add(x.where); byId.set(x.id, e);
    }
    for (const [id, e] of [...byId].sort()) out.push(`| \`${id}\` | ${[...e.packs].join(', ')} | ${[...e.where].slice(0, 6).join('; ')}${e.where.size > 6 ? ' …' : ''} |`);
    out.push('');
  }
  return out.join('\n');
}
