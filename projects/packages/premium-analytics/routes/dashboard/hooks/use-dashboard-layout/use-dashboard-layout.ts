/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { DASHBOARD_LAYOUT_KEY, DASHBOARD_PREFERENCES_SCOPE } from '../constants';
import type { DashboardWidget } from '@wordpress/widget-dashboard';
/**
 * Internal dependencies
 */

/**
 * Identifier of a dashboard, structured as `<plugin>_<page>` to mirror
 * the underscore form produced by the wp-build pipeline (see
 * `{{PREFIX}}_{{PAGE_SLUG_UNDERSCORE}}` in the page templates).
 */
export type DashboardName = `${ string }_${ string }`;

/**
 * Read the persisted dashboard-wide layout from the preferences store.
 *
 * @return The persisted layout, or an empty array.
 */
export function useDashboardLayout(): DashboardWidget[] {
	return useSelect( select => {
		const stored = (
			select( preferencesStore ) as unknown as {
				get: ( scope: string, name: string ) => DashboardWidget[] | undefined;
			}
		 ).get( DASHBOARD_PREFERENCES_SCOPE, DASHBOARD_LAYOUT_KEY );
		return stored ?? [];
	}, [] );
}
