/**
 * External dependencies
 */
import { useReportScope, withoutComparison } from '@jetpack-premium-analytics/data';
import { useSearch } from '@wordpress/route';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import type { ReportParamsFieldAttributes } from '../fields';

/**
 * Falls back to the URL search params when `attributes` carry no reportParams,
 * so a widget works in both hosts: Dashboard-v2 passes no attributes and needs
 * the URL, Post-Launch passes attributes and ignores it.
 *
 * @param attributes - The widget attributes, which may be empty or partial.
 * @return The original attributes with effective reportParams guaranteed.
 */
export function useAttributesWithSearchFallback< T extends Partial< ReportParamsFieldAttributes > >(
	attributes: T
): T & ReportParamsFieldAttributes {
	// `useSearch` throws outside a router context, which is how Post-Launch
	// renders widgets, so the call is guarded rather than assumed.
	let search: Record< string, any >;

	try {
		// `strict: false` rather than `from: '/'`, matching `WidgetRoot`: widgets
		// pick up the date range on any page, not only the dashboard at `/`. Pinned
		// to `/`, this throws on every other matched route and falls back to `{}` —
		// leaving a widget's header control reading a default range while its body
		// reads the real one.
		// eslint-disable-next-line react-hooks/rules-of-hooks
		search = useSearch( { strict: false } );
	} catch {
		search = {};
	}

	const hasReportParams =
		!! attributes?.reportParams && Object.keys( attributes.reportParams ).length > 0;
	const sourceReportParams = hasReportParams
		? ( attributes as ReportParamsFieldAttributes ).reportParams
		: search;

	const { offersComparison } = useReportScope();

	return useMemo( () => {
		const reportParams = offersComparison
			? sourceReportParams
			: withoutComparison( sourceReportParams );

		return { ...attributes, reportParams };
	}, [ attributes, offersComparison, sourceReportParams ] );
}
