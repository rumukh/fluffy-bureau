// Deployment base path under test: `/` locally, `/fluffy-bureau/` for the GitHub Pages layout.
export const BASE = process.env.FLUFFY_E2E_BASE ?? '/';
if (!BASE.startsWith('/') || !BASE.endsWith('/'))
  throw new Error('FLUFFY_E2E_BASE must start and end with /');
