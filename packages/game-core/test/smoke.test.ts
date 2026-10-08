import { describe, expect, it } from 'vitest';
import { createRuntimeHost } from '@aegis/runtime';
import { GAME_ID } from '../src/index.js';

describe('scaffold', () => {
  it('resolves the vendored SDK and the game core', () => {
    expect(typeof createRuntimeHost).toBe('function');
    expect(GAME_ID).toBe('fluffy-bureau');
  });
});
