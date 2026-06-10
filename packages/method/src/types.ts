// Канонічні типи Mode/FM/CrisisSeverity і SessionContext живуть у
// ../system-prompt.ts (runtime-версія, яку використовує route.ts).
// Тут — лише типи, що не мають канонічного джерела.
export type { Mode, FM, CrisisSeverity } from '../system-prompt';

import type { Mode, FM } from '../system-prompt';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  mode?: Mode;
  fm_detected?: FM;
  principle_applied?: string;
}

export interface ModeDetection {
  mode: Mode;
  fm: FM;
  confidence: number;
  triggers: string[];
}

export interface Hotline {
  name: string;
  number: string;
  note: string;
}
