/**
 * External dependencies
 */
import {
	DASHBOARD_PREFERENCES_SCOPE,
	getSectionOrder,
	orderSections,
} from '@jetpack-premium-analytics/data';
import { useEntityRecords } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import type { DashboardSection } from '../../config';

export const DASHBOARD_SECTIONS_QUERY = { per_page: -1 };
const NO_SECTIONS: DashboardSection[] = [];

/**
 * Get the list of dashboard sections, in the order the reader arranged them or,
 * failing that, the server's. Reads the `dashboardSection` core-data entity
 * (registered at app boot in `packages/init`), which resolves from `GET /sections`.
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
		DASHBOARD_SECTIONS_QUERY
	);
	const order = useSelect( select => getSectionOrder( DASHBOARD_PREFERENCES_SCOPE, select ), [] );
	const sections = useMemo(
		() => orderSections( records ?? NO_SECTIONS, order ),
		[ records, order ]
	);

	return { sections, hasResolved };
}
