/**
 * WordPress dependencies
 */
import { useSearch } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { buildDashboardLink } from '../../search/report-params';

/**
 * Build the `to` link back to the dashboard, carrying the current report window
 * (date range + comparison) from the URL.
 *
 * Report pages use this for the breadcrumb's root crumb so returning to the
 * dashboard restores the same view.
 *
 * @return A dashboard `to` path (e.g. `/?from=…&to=…`).
 */
export function useDashboardLink(): string {
	const search = useSearch( { strict: false } ) as Record< string, unknown >;
	return buildDashboardLink( search );
}
