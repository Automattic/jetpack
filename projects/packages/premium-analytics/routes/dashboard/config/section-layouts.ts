import { DASHBOARD_SECTION_IDS } from './sections';
import type { DashboardSectionId } from './sections';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

export type DashboardSectionLayouts = Partial< Record< DashboardSectionId, DashboardWidget[] > >;

const SECTION_IDS = new Set< string >( DASHBOARD_SECTION_IDS );

/**
 * Check whether a value can be used as the persisted section layout map.
 *
 * @param value - Candidate preference value.
 * @return Whether the value is a valid section layout map.
 */
export function isDashboardSectionLayouts( value: unknown ): value is DashboardSectionLayouts {
	if ( ! value || typeof value !== 'object' || Array.isArray( value ) ) {
		return false;
	}

	return Object.entries( value ).every(
		( [ sectionId, layout ] ) => SECTION_IDS.has( sectionId ) && Array.isArray( layout )
	);
}
