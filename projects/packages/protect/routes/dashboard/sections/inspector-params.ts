import { HISTORY_THREAT_PARAM } from './history/store';
import { THREAT_PARAM } from './scan/store';

/** Each section's inspector param, kept apart from the sections so route.tsx needn't bundle their components. */
export const INSPECTOR_PARAMS = [ THREAT_PARAM, HISTORY_THREAT_PARAM ];

/** Search params that close every inspector, to spread into a navigation. */
export const CLOSED_INSPECTOR: Record< string, undefined > = Object.fromEntries(
	INSPECTOR_PARAMS.map( param => [ param, undefined ] )
);
