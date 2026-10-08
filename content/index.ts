// Registry of authored sources. The compiler (tools/content/build.ts) reads only this module.
import type { CaseSource, CozySource, SharedSource } from '../tools/content/dsl.ts';
import { case01 } from './case01/index.ts';
import { case02 } from './case02/index.ts';
import { case03 } from './case03/index.ts';
import { case04 } from './case04/index.ts';
import { case05 } from './case05/index.ts';
import { case06 } from './case06/index.ts';
import { case07 } from './case07/index.ts';
import { case08 } from './case08/index.ts';
import { cozy } from './cozy/index.ts';
import { prologue } from './prologue/index.ts';
import { shared } from './shared/index.ts';
import { stage2Common } from './stage2-common.ts';

export const sharedSource: SharedSource = shared;

/** Stage 1 sources (prologue, case 1): released (v0.1.0). */
export const stage1: CaseSource[] = [prologue, case01];

/** Stage 2 production sources (T26): cases 2–4 and lines they share with later cases. */
export const production: CaseSource[] = [stage2Common, case02, case03, case04];

/** Preparatory sources for cases 5–8 (T27): validated, not produced before the next «дальше». */
export const preview: CaseSource[] = [case05, case06, case07, case08];

/** «Уютный денёк», shop and ranks (T28, T29, D12). */
export const cozySource: CozySource = cozy;

/** All non-Stage-1 case sources (kept for older tools). */
export const stage2: CaseSource[] = [...production, ...preview];