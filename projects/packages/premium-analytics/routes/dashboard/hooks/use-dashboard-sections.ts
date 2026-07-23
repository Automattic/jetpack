/**
 * External dependencies
 */
import { useEntityRecords } from '@wordpress/core-data';
/**
 * Internal dependencies
 */
import type { DashboardSection } from '../config';

/**
 * Get the ordered list of dashboard sections. Reads the `dashboardSection`
 * core-data entity (registered in the route's `beforeLoad`), which resolves
 * from `GET /sections`.
 *
 * `hasResolved` distinguishes "still fetching" (empty `sections`) from a
 * resolved query, so callers can hold layout-dependent UI until the sections
 * — and the default layouts they carry — actually exist.
 *
 * @return The ordered list of dashboard sections, and whether the query has resolved.
 */
export function useDashboardSections(): {
	sections: DashboardSection[];
	hasResolved: boolean;
} {
	const { records, hasResolved } = useEntityRecords< DashboardSection >(
		'root',
		'dashboardSection',
		{ per_page: -1 }
	);

	return { sections: records ?? [], hasResolved };
}
