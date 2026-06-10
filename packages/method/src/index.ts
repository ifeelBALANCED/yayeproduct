// Головний entry @ya-ye/method. Реалізації buildSystemPrompt / detectCrisis /
// validateAsymmetry — канонічні рутові файли (ті самі, що й subpath-експорти
// "./system-prompt", "./crisis-detector", "./principles/asymmetry").
export { buildSystemPrompt } from '../system-prompt';
export type { SessionContext, Jurisdiction, AgeBand, Locale } from '../system-prompt';
export { detectCrisis } from '../crisis-detector';
export type { DetectionResult } from '../crisis-detector';
export { validateAsymmetry } from '../principles/asymmetry';
export { detectMode, detectModeFromKeywords } from './mode-detector';
export { getHotlines, HOTLINES } from './hotlines';
export { SCENARIOS, fm1NoSpace, fm1Freeze, fm1SelfTrust, fm2NoJoy, fm2Loss } from './scenarios';
export { matchScenario, matchAllScenarios, fm1Keywords, fm2Keywords } from './matchScenario';
export type { Scenario } from './scenarios';
export type { Mode, FM, CrisisSeverity, Message, ModeDetection, Hotline } from './types';
