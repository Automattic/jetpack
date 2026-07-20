import type { DashboardSectionId } from './sections';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

export type DashboardSectionLayouts = Partial< Record< DashboardSectionId, DashboardWidget[] > >;

/**
 * Check whether a value can be used as the persisted section layout map.
 *
 * Keys are section slugs, which are server-driven, so any string key is
 * accepted: a stored layout must survive its section becoming unavailable
 * (e.g. the store section after WooCommerce is deactivated) so it is still
 * there when the section comes back.
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
