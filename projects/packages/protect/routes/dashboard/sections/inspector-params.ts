import { HISTORY_THREAT_PARAM } from './history/store';
import { THREAT_PARAM } from './scan/store';

/** Each section's inspector param, kept apart from the sections so route.tsx needn't bundle their components. */
export const INSPECTOR_PARAMS = [ THREAT_PARAM, HISTORY_THREAT_PARAM ];
