// Registry of authored sources. The compiler (tools/content/build.ts) reads only this module.
import type { CaseSource, SharedSource } from '../tools/content/dsl.ts';
import { case01 } from './case01/index.ts';
import { case02 } from './case02/index.ts';
import { case03 } from './case03/index.ts';
import { case04 } from './case04/index.ts';
import { case05 } from './case05/index.ts';
import { case06 } from './case06/index.ts';
import { case07 } from './case07/index.ts';
import { case08 } from './case08/index.ts';
import { prologue } from './prologue/index.ts';
import { shared } from './shared/index.ts';
import { stage2Common } from './stage2-common.ts';

export const sharedSource: SharedSource = shared;

/** Stage 1 sources (prologue, case 1). */
export const stage1: CaseSource[] = [prologue, case01];

/** Preparatory sources for cases 2–8 (C2); no assets before «дальше». */
export const stage2: CaseSource[] = [stage2Common, case02, case03, case04, case05, case06, case07, case08];