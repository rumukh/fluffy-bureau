// «Родительский уголок» (T17): hold-to-enter gate plus a multiplication question; text-only (Q29).
import { importBackup, type BreakMinutes } from '@fluffy/game-session';
import type { App } from './app.js';
import { downloadText } from './app.js';
import { button, h } from './dom.js';
import { CREDITS } from './credits.js';

const HOLD_MS = 3000;

export function renderParentGate(app: App, close: () => HTMLElement): HTMLElement {
  const gate = (app.ui.gate as { a: number; b: number } | undefined) ?? null;
  if (gate) {
    const input = h('input', {
      type: 'text',
      inputmode: 'numeric',
      id: 'gate-answer',
      autocomplete: 'off',
      'data-key': 'gate-answer',
      'data-primary': '',
    });
    const error = h('p', { class: 'field-error', role: 'alert' });
    const check = async () => {
      if (Number(input.value.trim()) === gate.a * gate.b) {
        app.ui.gate = undefined;
        await app.setOverlay('parent');
      } else {
        error.textContent = 'Неверно. Попробуйте ещё раз.';
        input.value = '';
        input.focus();
      }
    };
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') void check();
    });
    return h(
      'div',
      { class: 'parent-gate' },
      close(),
      h('h2', null, 'Для взрослых'),
      h('label', { for: 'gate-answer' }, `Сколько будет ${gate.a} × ${gate.b}?`),
      input,
      error,
      button({ label: 'Войти', key: 'gate-ok', class: 'primary' }, check),
    );
  }
  const hold = h(
    'button',
    { type: 'button', class: 'hold primary', 'data-key': 'gate-hold', 'data-primary': '' },
    h('span', { class: 'hold-fill', 'aria-hidden': 'true' }),
    h('span', { class: 'label' }, app.labels('parent.hold').text),
  );
  let timer: number | undefined;
  const start = (event: Event) => {
    if (
      event instanceof KeyboardEvent &&
      (event.repeat || (event.key !== ' ' && event.key !== 'Enter'))
    )
      return;
    event.preventDefault();
    if (timer !== undefined) return;
    hold.classList.add('holding');
    timer = window.setTimeout(() => {
      timer = undefined;
      const random = new Uint8Array(2);
      crypto.getRandomValues(random);
      app.ui.gate = { a: 12 + (random[0]! % 88), b: 2 + (random[1]! % 8) };
      app.render();
    }, HOLD_MS);
  };
  const stop = () => {
    hold.classList.remove('holding');
    if (timer !== undefined) window.clearTimeout(timer);
    timer = undefined;
  };
  hold.addEventListener('pointerdown', start);
  hold.addEventListener('keydown', start);
  for (const type of ['pointerup', 'pointerleave', 'pointercancel', 'keyup', 'blur'])
    hold.addEventListener(type, stop);
  hold.addEventListener('contextmenu', (event) => event.preventDefault());
  return h(
    'div',
    { class: 'parent-gate' },
    close(),
    h('h2', null, app.labels('parent.enter').text),
    h('p', null, 'Нажмите и удерживайте кнопку 3 секунды.'),
    hold,
  );
}

export function renderParentCorner(app: App, close: () => HTMLElement): HTMLElement {
  const device = app.device;
  const section = (title: string, ...children: (Node | null)[]) =>
    h('section', { class: 'parent-section' }, h('h3', null, title), ...children);
  const volume = (key: 'narration' | 'music' | 'effects', label: string) => {
    const input = h('input', {
      type: 'range',
      min: 0,
      max: 100,
      step: 10,
      value: Math.round(device.volumes[key] * 100),
      'data-key': `pc-vol-${key}`,
    });
    input.addEventListener(
      'change',
      () =>
        void app.updateDevice((d) => {
          d.volumes[key] = Number(input.value) / 100;
        }),
    );
    return h('label', { class: 'setting' }, h('span', null, label), input);
  };
  const breaks: BreakMinutes[] = [0, 15, 20, 30, 45];
  const status = h(
    'p',
    { class: 'parent-status', role: 'status' },
    String(app.ui.parentStatus ?? ''),
  );
  const say = (text: string) => {
    app.ui.parentStatus = text;
    status.textContent = text;
  };
  const fileInput = h('input', {
    type: 'file',
    accept: 'application/json',
    id: 'backup-file',
    'data-key': 'backup-file',
  });
  const profiles = device.profiles.map((profile) => {
    const name = profile.name || 'Без имени';
    return h(
      'li',
      { class: 'parent-profile' },
      h('strong', null, name),
      h(
        'span',
        { class: 'progress', dataset: { profile: profile.id } },
        progressText(app, profile.id),
      ),
      h(
        'div',
        { class: 'row' },
        button(
          {
            label: `Сохранить копию: ${name}`,
            key: `pc-export-${profile.id}`,
            content: 'Сохранить копию',
          },
          async () => {
            const text = await exportProfile(app, profile.id);
            if (text) {
              downloadText(`fluffy-bureau-${name}.json`, text);
              say(`Копия профиля «${name}» сохранена в файл.`);
            } else say('У этого профиля ещё нет сохранений.');
          },
        ),
        button(
          {
            label: `Загрузить копию в профиль ${name}`,
            key: `pc-import-${profile.id}`,
            content: 'Загрузить копию',
          },
          async () => {
            const file = fileInput.files?.[0];
            if (!file) {
              say('Сначала выберите файл копии ниже.');
              return;
            }
            if (file.size > 4 * 1024 * 1024) {
              say('Файл слишком большой.');
              return;
            }
            if (!confirm(`Заменить прогресс профиля «${name}» данными из файла?`)) return;
            if (app.session?.profileId === profile.id) await app.closeSession();
            try {
              await importBackup(
                {
                  storage: app.storage,
                  profileId: profile.id,
                  library: app.library,
                  engineRevision: '17ed4bebd329',
                },
                await file.text(),
              );
              say(`Копия загружена в профиль «${name}».`);
            } catch (error) {
              say(
                `Не удалось загрузить копию: ${error instanceof Error ? error.message : String(error)}`,
              );
            }
            app.render();
          },
        ),
        button(
          {
            label: `Сбросить прогресс: ${name}`,
            key: `pc-reset-${profile.id}`,
            content: 'Сбросить прогресс',
          },
          async () => {
            if (!confirm(`Сбросить весь прогресс профиля «${name}»? Другие профили не изменятся.`))
              return;
            await app.resetProfile(profile.id);
            say(`Прогресс профиля «${name}» сброшен.`);
          },
        ),
        button(
          {
            label: `Удалить профиль: ${name}`,
            key: `pc-delete-${profile.id}`,
            content: 'Удалить профиль',
          },
          async () => {
            if (!confirm(`Удалить профиль «${name}» и его прогресс?`)) return;
            await app.deleteProfile(profile.id);
            say(`Профиль «${name}» удалён.`);
          },
        ),
      ),
    );
  });
  const offline = app.offline.status;
  const offlineText =
    offline.state === 'ready'
      ? offline.update === 'installed-next-launch'
        ? 'Новая версия скачана. Она включится при следующем запуске игры.'
        : 'Игра установлена и работает без интернета.'
      : offline.state === 'installing'
        ? `Устанавливаем… (${offline.done} из ${offline.total})`
        : offline.state === 'unsupported'
          ? `Установка недоступна: ${offline.reason}`
          : offline.state === 'failed'
            ? `Установка не удалась: ${offline.reason}`
            : offline.state === 'missing'
              ? 'Игра ещё не установлена для работы без интернета.'
              : 'Проверяем…';
  void loadProgress(app);
  return h(
    'div',
    { class: 'parent-corner' },
    close(),
    h('h2', null, 'Родительский уголок'),
    status,
    section(
      'Громкость',
      volume('narration', 'Голос'),
      volume('music', 'Музыка'),
      volume('effects', 'Звуки'),
    ),
    section(
      'Напоминание о перерыве',
      h(
        'p',
        null,
        'Мягкое напоминание в безопасный момент, после сохранения. Без обратного отсчёта.',
      ),
      h(
        'div',
        { class: 'segmented', role: 'group', 'aria-label': 'Интервал' },
        ...breaks.map((minutes) =>
          button(
            {
              label: minutes ? `${minutes} минут` : 'Выключено',
              key: `pc-break-${minutes}`,
              pressed: device.breakMinutes === minutes,
            },
            () => app.updateDevice((d) => void (d.breakMinutes = minutes)),
          ),
        ),
      ),
    ),
    section(
      'Профили и прогресс',
      h('ul', { class: 'parent-profiles' }, ...profiles),
      h('label', { for: 'backup-file' }, 'Файл копии для загрузки: '),
      fileInput,
      h(
        'p',
        { class: 'note' },
        'Копия — это файл на этом устройстве, а не облако. Данные никуда не отправляются.',
      ),
    ),
    section(
      'Работа без интернета',
      h('p', { dataset: { testid: 'offline-status' } }, offlineText),
      button({ label: 'Установить или проверить обновление', key: 'pc-install' }, async () => {
        say('Проверяем установку…');
        try {
          await app.offline.install();
          say('Готово.');
        } catch (error) {
          say(`Не удалось: ${error instanceof Error ? error.message : String(error)}`);
        }
        app.render();
      }),
    ),
    section(
      'Благодарности и лицензии',
      h(
        'ul',
        { class: 'credits' },
        ...CREDITS.map((item) => h('li', null, h('strong', null, item.name), ` — ${item.detail}`)),
      ),
      h(
        'p',
        { class: 'note' },
        'Игра не собирает данные, не показывает рекламу и не содержит внешних ссылок.',
      ),
    ),
  );
}

async function exportProfile(app: App, profileId: string): Promise<string | null> {
  if (app.session?.profileId === profileId) {
    try {
      return await app.session.exportBackup();
    } catch {
      return null;
    }
  }
  const history = await app.storage.read({ gameId: 'fluffy-bureau', profileId });
  return history.current?.payload ?? null;
}

const progressCache = new Map<string, string>();
function progressText(_app: App, profileId: string): string {
  return progressCache.get(profileId) ?? '…';
}

async function loadProgress(app: App): Promise<void> {
  for (const profile of app.device.profiles) {
    const history = await app.storage.read({ gameId: 'fluffy-bureau', profileId: profile.id });
    let text = 'Ещё не играл(а).';
    if (history.current) {
      try {
        const envelope = JSON.parse(history.current.payload) as {
          state: {
            world: {
              resources: Record<
                string,
                { completed?: string[]; buttons?: number; hearts?: number }
              >;
            };
          };
        };
        const state = envelope.state.world.resources['aegis.runtime.state'];
        const done = state?.completed ?? [];
        const names = done.map((id) =>
          id === 'prologue' ? 'пролог' : id.replace(/^case0(\d)-l(\d)$/, 'дело №$1, сложность $2'),
        );
        text = `${names.length ? `Пройдено: ${names.join(', ')}.` : 'Начато, пока ничего не пройдено.'} Пуговки: ${state?.buttons ?? 0}, сердечки: ${state?.hearts ?? 0}.`;
      } catch {
        text = 'Сохранение не читается — откройте профиль для восстановления.';
      }
    }
    if (progressCache.get(profile.id) !== text) {
      progressCache.set(profile.id, text);
      const node = app.root.querySelector(`[data-profile="${profile.id}"]`);
      if (node) node.textContent = text;
    }
  }
}
