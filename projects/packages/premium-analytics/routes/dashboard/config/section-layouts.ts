import type { DashboardSectionId } from './sections';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

export type DashboardSectionLayouts = Partial< Record< DashboardSectionId, DashboardWidget[] > >;

/**
 * Check whether a value can be used as the persisted section layout map.
 *
 * Keys are server-driven section slugs, so any string key is accepted: a stored
 * layout must survive its section becoming temporarily unavailable.
 *
 * @param value - Candidate preference value.
 * @return Whether the value is a valid section layout map.
 */
export function isDashboardSectionLayouts( value: unknown ): value is DashboardSectionLayouts {
	if ( ! value || typeof value !== 'object' || Array.isArray( value ) ) {
		return false;
	}

	return Object.values( value ).every( layout => Array.isArray( layout ) );
}
