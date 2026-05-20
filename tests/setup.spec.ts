/**
 * Smoke test — verifies the Jest + ts-jest + ESM pipeline is wired correctly.
 * Real unit tests are added per module starting Phase 2.
 */

import { VERSION } from '../src/index.js';

describe('migrate-angular — Phase 1 scaffold', () => {
  it('exports a VERSION string', () => {
    expect(typeof VERSION).toBe('string');
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('runs in a Node environment', () => {
    expect(typeof process).toBe('object');
    expect(typeof process.version).toBe('string');
  });
});
