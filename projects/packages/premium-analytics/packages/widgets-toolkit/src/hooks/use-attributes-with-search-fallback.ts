/**
 * External dependencies
 */
import { useSearch } from '@wordpress/route';
/**
 * Internal dependencies
 */
import type { ReportParamsFieldAttributes } from '../fields';

/**
 * Hook that provides widget attributes with URL search params as fallback.
 *
 * When attributes don't contain reportParams (empty or missing), this hook
 * will attempt to get them from the URL using useSearch(). This is useful
 * for dashboard widgets that can work in two contexts:
 * - Dashboard-v2: No attributes, needs URL params
 * - Post-Launch: Has attributes, ignores URL
 *
 * @param { Partial< ReportParamsFieldAttributes > } attributes - The widget attributes (may be empty or partial)
 * @return { ReportParamsFieldAttributes } Effective attributes with reportParams guaranteed
 *
 * @example
 * ```typescript
 * function MyWidgetRender( { attributes } ) {
 *   const effectiveAttributes = useAttributesWithSearchFallback( attributes );
 *   return <MyWidget attributes={ effectiveAttributes } />;
 * }
 * ```
 */
export function useAttributesWithSearchFallback(
	attributes: Partial< ReportParamsFieldAttributes >
): ReportParamsFieldAttributes {
	/*
	 * Try to get search params from router.
	 * This may fail in contexts without router (e.g., Post-Launch).
	 * We declare the variable and use try/catch to handle both cases.
	 */
	let search: Record< string, any >;

	try {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		search = useSearch( {
			from: '/',
		} );
	} catch {
		/*
		 * Not in router context or route doesn't exist.
		 * This can happen in Post-Launch where widgets are rendered
		 * outside the Analytics dashboard context.
		 */
		search = {};
	}

	/*
	 * Check if reportParams exists and is not empty.
	 * If it exists, use the provided attributes.
	 * Otherwise, build attributes from URL search params.
	 */
	const hasReportParams =
		!! attributes?.reportParams && Object.keys( attributes.reportParams ).length > 0;

	return hasReportParams ? ( attributes as ReportParamsFieldAttributes ) : { reportParams: search };
}
