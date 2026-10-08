// Registry of authored sources. The compiler (tools/content/build.ts) reads only this module.
import type { CaseSource, SharedSource } from '../tools/content/dsl.ts';
import { case01 } from './case01/index.ts';
import { prologue } from './prologue/index.ts';
import { shared } from './shared/index.ts';

export const sharedSource: SharedSource = shared;

/** Stage 1 sources (prologue, case 1). */
export const stage1: CaseSource[] = [prologue, case01];

/** Preparatory sources for cases 2–8 (C2); no assets before «дальше». */
export const stage2: CaseSource[] = [];