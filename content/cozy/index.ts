// «Уютный денёк» (D23, T12, T28, T29) and ranks (D12). New texts (not in the PM scripts): the PM is
// notified (Q47, T28). Stories never hint at later mysteries (D07, D09).
import { added, lines, type CozySource } from '../../tools/content/dsl.ts';
import type { CozyDay, ShopItem } from '../../packages/content/src/schema.ts';

const story = (reason = 'История жителя для «Уютного денька»') => added(reason, 'T28', { delivery: 'warm' });
const inv = () => added('Приглашение на чай в «Уютном деньке»', 'T28', { delivery: 'cheerful' });
const lbl = (reason: string, ref = 'T29') => added(reason, ref, { kind: 'label' });
const rank = () => added('Сообщение о новом звании', 'D12', { delivery: 'warm' });

const L = lines('cozy', 'dialogue', [
  // Residents met in cases 1–4 (T28): invitation + one story of 3–5 lines each.
  ['CZ-pudding-INV', 'pudding', 'Чаепитие? Обожаю! Я принесу семечки.', inv()],
  ['CZ-pudding-S1-01', 'pudding', 'Знаешь, почему у меня такие щёки?', story()],
  ['CZ-pudding-S1-02', 'pudding', 'Хомяки носят запасы в щеках. Очень удобно!', story()],
  ['CZ-pudding-S1-03', 'pudding', 'Однажды я принёс так целую горсть подсолнуха.', story()],
  ['CZ-pudding-S1-04', 'pudding', 'Потом чихнул, и семечки разлетелись по площади!', story()],
  ['CZ-pudding-S1-05', 'pudding', 'С тех пор на площади растут подсолнухи.', story()],
  ['CZ-tyopa-INV', 'tyopa', 'Иду! Возьму кусочек черничного мыла в подарок.', inv()],
  ['CZ-tyopa-S1-01', 'tyopa', 'Мыло я варю с детства. Бабушка научила.', story()],
  ['CZ-tyopa-S1-02', 'tyopa', 'Сначала у меня выходили одни пузыри.', story()],
  ['CZ-tyopa-S1-03', 'tyopa', 'Пузыри улетали прямо в окна соседей.', story()],
  ['CZ-tyopa-S1-04', 'tyopa', 'Соседи не сердились. Говорили: пахнет праздником!', story()],
  ['CZ-fitilyok-INV', 'fitilyok', 'Чай вечером? Я посвечу над столом!', inv()],
  ['CZ-fitilyok-S1-01', 'fitilyok', 'Я зажигаю фонари на Пироговой улице.', story()],
  ['CZ-fitilyok-S1-02', 'fitilyok', 'Каждый вечер облетаю все до одного.', story()],
  ['CZ-fitilyok-S1-03', 'fitilyok', 'Один фонарь всегда гаснет раньше всех.', story()],
  ['CZ-fitilyok-S1-04', 'fitilyok', 'Я зову его Соней. Он просто рано ложится.', story()],
  ['CZ-kartofan-INV', 'kartofan', 'Иду! Принесу свежей морковки к чаю.', inv()],
  ['CZ-kartofan-S1-01', 'kartofan', 'Я сажаю огород на ощупь и по запаху.', story()],
  ['CZ-kartofan-S1-02', 'kartofan', 'Морковь пахнет сладко, а укроп — свежо.', story()],
  ['CZ-kartofan-S1-03', 'kartofan', 'Однажды я посадил тюльпаны вместо лука.', story()],
  ['CZ-kartofan-S1-04', 'kartofan', 'Весной весь огород расцвёл. Было очень красиво!', story()],
  ['CZ-stella-INV', 'stella', 'Чай? Лечу! Захвачу свежую газету.', inv()],
  ['CZ-stella-S1-01', 'stella', 'Я знаю каждый почтовый ящик в Пушистино.', story()],
  ['CZ-stella-S1-02', 'stella', 'Самое трудное письмо пришло без адреса.', story()],
  ['CZ-stella-S1-03', 'stella', 'На конверте был только рисунок: дом с красной крышей.', story()],
  ['CZ-stella-S1-04', 'stella', 'Я облетела весь город и нашла этот дом!', story()],
  ['CZ-mouse-INV', 'mouse', 'Нам можно на чай? Мы тихонько!', inv()],
  ['CZ-mouse-S1-01', 'mouse', 'Нас в семье очень много мышат.', story()],
  ['CZ-mouse-S1-02', 'mouse', 'Мы спим в одной большой кровати.', story()],
  ['CZ-mouse-S1-03', 'mouse', 'Кто ворочается, тот рассказывает сказку.', story()],
  ['CZ-mouse-S1-04', 'mouse', 'Поэтому сказки у нас каждую ночь!', story()],
  ['CZ-damka-INV', 'damka', 'С удовольствием! Только сначала проверю маяк.', inv()],
  ['CZ-damka-S1-01', 'damka', 'Медовый маяк построила ещё моя прабабушка.', story()],
  ['CZ-damka-S1-02', 'damka', 'Бобры умеют строить из веток и ила.', story()],
  ['CZ-damka-S1-03', 'damka', 'А я научилась ещё и чинить фонари.', story()],
  ['CZ-damka-S1-04', 'damka', 'Свет маяка видно с самого дальнего берега.', story()],
  ['CZ-pukhlik-INV', 'pukhlik', 'Чай? Только вечерний. Днём я сплю.', inv()],
  ['CZ-pukhlik-S1-01', 'pukhlik', 'Я учусь дежурить ночью, как настоящий сыщик.', story()],
  ['CZ-pukhlik-S1-02', 'pukhlik', 'Ночью город тихий, а звёзды яркие.', story()],
  ['CZ-pukhlik-S1-03', 'pukhlik', 'Я считаю огоньки в окнах. Так не хочется спать.', story()],
  ['CZ-pukhlik-S1-04', 'pukhlik', 'Гаснет огонёк — я шепчу: спокойной ночи.', story()],

  // Cozy-day and shop reactions (T29).
  ['CZ-INTRO', 'watsony', 'Уютный денёк! Отдохнём и украсим Контору?', added('Вступление «Уютного денька»', 'T12', { delivery: 'warm' })],
  ['CZ-BOUGHT', 'watsony', 'Отличный выбор! Записала в покупки.', added('Реакция на покупку', 'T29', { delivery: 'cheerful' })],
  ['CZ-RETURNED', 'watsony', 'Вернули. Всё снова в копилке.', added('Реакция на возврат покупки (Q40)', 'T29', { delivery: 'warm' })],
  ['CZ-NOT-ENOUGH', 'watsony', 'Пока не хватает. Раскроем ещё одно дело?', added('Не хватает пуговок или сердечек', 'T29', { delivery: 'warm' })],
  ['CZ-TEA-THANKS', 'khvosts', 'Чудесный чай! Спасибо за компанию.', added('Конец чаепития с жителем', 'T28', { delivery: 'warm' })],

  // Shop items (T29) and decor slots.
  ['SHOP-hat-acorn', 'narrator', 'Шапочка-жёлудь', lbl('Шапка в магазине')],
  ['SHOP-hat-flower', 'narrator', 'Шляпка с цветком', lbl('Шапка в магазине')],
  ['SHOP-hat-beret', 'narrator', 'Берет художника', lbl('Шапка в магазине')],
  ['SHOP-hat-detective', 'narrator', 'Шапка сыщика', lbl('Шапка в магазине')],
  ['SHOP-scarf-stripes', 'narrator', 'Шарф в полоску', lbl('Узор шарфа в магазине')],
  ['SHOP-scarf-dots', 'narrator', 'Шарф в горошек', lbl('Узор шарфа в магазине')],
  ['SHOP-scarf-hearts', 'narrator', 'Шарф с сердечками', lbl('Узор шарфа в магазине')],
  ['SHOP-scarf-stars', 'narrator', 'Шарф со звёздочками', lbl('Узор шарфа в магазине')],
  ['SHOP-decor-geranium', 'narrator', 'Горшок с геранью', lbl('Украшение Конторы в магазине')],
  ['SHOP-decor-firefly-lamp', 'narrator', 'Фонарик-светлячок', lbl('Украшение Конторы в магазине')],
  ['SHOP-decor-rug', 'narrator', 'Коврик-ромашка', lbl('Украшение Конторы в магазине')],
  ['SHOP-decor-trophy-shelf', 'narrator', 'Полочка для наград', lbl('Украшение Конторы в магазине')],
  ['DS-shelf', 'narrator', 'На полку', lbl('Место для украшения в Конторе')],
  ['DS-window', 'narrator', 'На окно', lbl('Место для украшения в Конторе')],
  ['DS-table', 'narrator', 'На стол', lbl('Место для украшения в Конторе')],
  ['DS-floor', 'narrator', 'На пол', lbl('Место для украшения в Конторе')],
  ['DS-wall', 'narrator', 'На стену', lbl('Место для украшения в Конторе')],

  // Ranks (D12): names and messages.
  ['RANK-intern', 'narrator', 'Стажёр', lbl('Название звания', 'D12')],
  ['RANK-helper', 'narrator', 'Помощник сыщика', lbl('Название звания', 'D12')],
  ['RANK-junior', 'narrator', 'Младший детектив', lbl('Название звания', 'D12')],
  ['RANK-intern-MSG', 'khvosts', 'Каждый сыщик начинает со стажёра.', rank()],
  ['RANK-helper-MSG', 'khvosts', 'Помощник сыщика! Ты уже читаешь шифры.', rank()],
  ['RANK-junior-MSG', 'khvosts', 'Младший детектив! Даже взрослых проверяешь честно.', rank()],
]);

const item = (id: string, kind: ShopItem['kind'], asset: string, amount: number, unlockAfter: number): ShopItem => ({
  id, kind, label: `SHOP-${id}`, asset, price: { currency: kind === 'decor' ? 'hearts' : 'buttons', amount }, unlockAfter,
});

const resident = (speaker: string, unlockAfter: number, count: number) => ({
  speaker,
  unlockAfter,
  invite: `CZ-${speaker}-INV`,
  stories: [Array.from({ length: count }, (_, i) => `CZ-${speaker}-S1-${String(i + 1).padStart(2, '0')}`)],
  teaPrice: 2,
});

const cozyDay: CozyDay = {
  residents: [
    resident('pudding', 1, 5),
    resident('tyopa', 1, 4),
    resident('fitilyok', 1, 4),
    resident('kartofan', 1, 4),
    resident('stella', 2, 4),
    resident('mouse', 2, 4),
    resident('damka', 3, 4),
    resident('pukhlik', 3, 4),
  ],
  // Economy (T11): through case 4, level 1 earns 45 buttons (≈ half of 90), levels 1+2 earn 105.
  shop: [
    item('hat-acorn', 'hat', 'acc.hat.acorn', 8, 0),
    item('hat-flower', 'hat', 'acc.hat.flower', 10, 1),
    item('hat-beret', 'hat', 'acc.hat.beret', 12, 2),
    item('hat-detective', 'hat', 'acc.hat.detective', 20, 4),
    item('scarf-stripes', 'scarf-pattern', 'scarf.pattern.stripes', 8, 0),
    item('scarf-dots', 'scarf-pattern', 'scarf.pattern.dots', 9, 1),
    item('scarf-hearts', 'scarf-pattern', 'scarf.pattern.hearts', 10, 2),
    item('scarf-stars', 'scarf-pattern', 'scarf.pattern.stars', 13, 3),
    item('decor-geranium', 'decor', 'decor.geranium', 3, 1),
    item('decor-firefly-lamp', 'decor', 'decor.firefly-lamp', 3, 1),
    item('decor-rug', 'decor', 'decor.rug-daisy', 4, 2),
    item('decor-trophy-shelf', 'decor', 'decor.trophy-shelf', 5, 4),
  ],
  decorSlots: [
    { id: 'shelf', label: 'DS-shelf' },
    { id: 'window', label: 'DS-window' },
    { id: 'table', label: 'DS-table' },
    { id: 'floor', label: 'DS-floor' },
    { id: 'wall', label: 'DS-wall' },
  ],
  ranks: [
    { id: 'intern', label: 'RANK-intern', afterCase: 0, message: ['RANK-intern-MSG'], reward: 'rw-prologue-title' },
    { id: 'helper', label: 'RANK-helper', afterCase: 2, message: ['RANK-helper-MSG'], reward: 'rw-c2-title-helper' },
    { id: 'junior', label: 'RANK-junior', afterCase: 4, message: ['RANK-junior-MSG'], reward: 'rw-c4-title-junior' },
  ],
  lines: {
    intro: ['CZ-INTRO'],
    bought: ['CZ-BOUGHT'],
    returned: ['CZ-RETURNED'],
    notEnough: ['CZ-NOT-ENOUGH'],
    teaThanks: ['CZ-TEA-THANKS'],
  },
};

export const cozy: CozySource = { id: 'cozy', lines: L, rewards: [], cozy: cozyDay };
