/**
 * External dependencies
 */
import { useSearch } from '@wordpress/route';
/**
 * Internal dependencies
 */
import type { ReportParamsFieldAttributes } from '../fields';

/**
 * Falls back to the URL search params when `attributes` carry no reportParams,
 * so a widget works in both hosts: Dashboard-v2 passes no attributes and needs
 * the URL, Post-Launch passes attributes and ignores it.
 *
 * @param { Partial< ReportParamsFieldAttributes > } attributes - The widget attributes (may be empty or partial)
 * @return { ReportParamsFieldAttributes } Effective attributes with reportParams guaranteed
 */
export function useAttributesWithSearchFallback(
	attributes: Partial< ReportParamsFieldAttributes >
): ReportParamsFieldAttributes {
	// `useSearch` throws outside a router context, which is how Post-Launch
	// renders widgets, so the call is guarded rather than assumed.
	let search: Record< string, any >;

	try {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		search = useSearch( {
			from: '/',
		} );
	} catch {
		search = {};
	}

	const hasReportParams =
		!! attributes?.reportParams && Object.keys( attributes.reportParams ).length > 0;

	return hasReportParams ? ( attributes as ReportParamsFieldAttributes ) : { reportParams: search };
}
