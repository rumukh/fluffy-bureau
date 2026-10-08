import { App } from './app.js';
import { Assets } from './assets.js';
import { loadAssetManifest, loadContent } from './loader.js';

declare const FLUFFY_DEV: boolean;

function meta(name: string): string {
  return document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.content ?? '';
}

async function boot(): Promise<void> {
  const root = document.querySelector<HTMLElement>('#app');
  if (!root) return;
  const base = meta('fluffy-base') || '/';
  const baseUrl = new URL(base, location.origin).href;
  try {
    const [{ library, packs }, manifest] = await Promise.all([
      loadContent(baseUrl),
      loadAssetManifest(baseUrl),
    ]);
    const app = new App({
      root,
      baseUrl,
      buildId: meta('fluffy-build'),
      channel: FLUFFY_DEV ? 'dev' : meta('fluffy-channel') || 'release',
      library,
      packs,
      assets: new Assets(manifest, baseUrl),
    });
    await app.start();
  } catch (error) {
    root.removeAttribute('aria-busy');
    const message = document.createElement('p');
    message.setAttribute('role', 'alert');
    message.textContent = 'Не получилось открыть бюро. Попробуй ещё раз.';
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.textContent = 'Ещё раз';
    retry.addEventListener('click', () => location.reload());
    root.replaceChildren(message, retry);
    if (FLUFFY_DEV) console.error(error);
  }
}

void boot();
