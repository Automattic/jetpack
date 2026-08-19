/**
 * External dependencies
 */
import { normalizeReportParams, withoutComparison } from '@jetpack-premium-analytics/data';
import { useReportScope } from '@jetpack-premium-analytics/routing';
import { useSearch } from '@wordpress/route';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { route } from './package.json';

const ROUTE_FROM = route.path;

/**
 * The window a report's records are fetched for, resolved from the URL with the
 * same normalizer the widgets use.
 *
 * Comparison follows the surface's declared scope, which the report route sets
 * to none: a report offers no control for one and its header names no compared
 * period, so a delta in the table would have no baseline the reader could see
 * or change. The params themselves stay on the URL, for the dashboard to pick
 * back up.
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
