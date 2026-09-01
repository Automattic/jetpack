/**
 * External dependencies
 */
import {
	normalizeReportParams,
	useReportScope,
	withoutComparison,
} from '@jetpack-premium-analytics/data';
import { useSearch } from '@wordpress/route';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { route } from './package.json';

const ROUTE_FROM = route.path;

/**
 * The report's fetch window from the URL, normalized like the widgets use it. Comparison is
 * stripped when the surface doesn't offer it — a report's header has no baseline to show a
 * delta against — though the params themselves stay on the URL for the dashboard to reuse.
 *
 * @return The report params, carrying a comparison only where one is offered.
 */
export function useReportParams() {
	const search = useSearch( { from: ROUTE_FROM } ) as Record< string, string | undefined >;
	const { offersComparison } = useReportScope();

	return useMemo( () => {
		const params = normalizeReportParams(
			search as Parameters< typeof normalizeReportParams >[ 0 ]
		);

		return offersComparison ? params : withoutComparison( params );
	}, [ search, offersComparison ] );
}
