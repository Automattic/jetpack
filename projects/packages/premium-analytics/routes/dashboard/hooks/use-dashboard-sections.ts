/**
 * External dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import type { DashboardSection } from '../config';

/**
 * Get the ordered list of dashboard sections. Reads the `dashboardSection`
 * core-data entity (registered in the route's `beforeLoad`), which resolves
 * from `GET /sections`.
 *
 * @return The ordered list of dashboard sections.
 */
export function useDashboardSections(): DashboardSection[] {
	return useSelect( select => {
		const core = select( coreStore ) as unknown as {
			getEntityRecords: (
				kind: string,
				name: string,
				query?: Record< string, unknown >
			) => DashboardSection[] | null;
		};

		return core.getEntityRecords( 'root', 'dashboardSection', { per_page: -1 } ) ?? [];
	}, [] );
}
