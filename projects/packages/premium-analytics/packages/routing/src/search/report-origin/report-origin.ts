import { pickReportDateParams } from '../report-params';

export type ReportOrigin = {
	report: string;
	section?: string;
};

/**
 * Search params that name the report a detail page was opened from.
 *
 * The origin travels in the URL rather than in history state. Every navigation
 * carries the search params forward on its own, so a date change or a tab
 * switch on the detail page cannot drop the breadcrumb. A route that allowlists
 * its params must pass these through with `pickReportOriginParams()`.
 */
export const REPORT_ORIGIN_PARAM_KEYS = [ 'ref', 'ref_section' ] as const;

/**
 * Build the search params that carry a report origin to a detail page.
 *
 * @param report  - The report the detail link belongs to.
 * @param section - The active report section, when the report has tabs.
 * @return Search params to merge into the detail link.
 */
export function createReportOriginSearch(
	report: string,
	section?: string
): Record< string, string > {
	return {
		ref: report,
		...( section ? { ref_section: section } : {} ),
	};
}

/**
 * Builds the next search params of a detail link from the current ones.
 *
 * The router types a link's `search` prop against the destination route's own
 * param shape and does not model this updater form, so a call site that passes
 * the updater to a router `Link` casts it — the same cast those links already
 * apply to `params`. Components that accept an updater of this type, such as
 * `PostTitleLink`, take it without a cast.
 */
export type DetailLinkSearchUpdater = (
	current: Record< string, unknown >
) => Record< string, unknown >;

/**
 * Build the `search` prop for a report table's detail link.
 *
 * Every report table links a row to a detail page the same way: carry the
 * shared report window forward, then name the report the visitor came from so
 * the detail page can render the origin breadcrumb.
 *
 * @param options               - Link options.
 * @param options.report        - The report the detail link belongs to.
 * @param options.originSection - The active report section, when the report has tabs.
 * @param options.extraParams   - Params the destination owns, such as the detail page's section.
 * @return The `search` updater for the detail link.
 */
export function createDetailLinkSearch( {
	report,
	originSection,
	extraParams,
}: {
	report: string;
	originSection?: string;
	extraParams?: Record< string, string >;
} ): DetailLinkSearchUpdater {
	return current => ( {
		...pickReportDateParams( current ),
		...createReportOriginSearch( report, originSection ),
		...( extraParams ?? {} ),
	} );
}

/**
 * Read a report origin from the current route search params.
 *
 * The values are untrusted: anyone can type them into the URL. The caller
 * resolves them against the report registry before linking to them.
 *
 * @param search - The current route search params.
 * @return The report origin, when one is present.
 */
export function readReportOriginSearch(
	search: Record< string, unknown > | undefined
): ReportOrigin | undefined {
	const report = search?.ref;
	if ( typeof report !== 'string' || ! report ) {
		return undefined;
	}

	const section = search?.ref_section;

	return {
		report,
		...( typeof section === 'string' && section ? { section } : {} ),
	};
}

/**
 * Pick the report-origin params out of a search object.
 *
 * Detail routes allowlist the params they own when they seed the URL, so the
 * origin needs to be re-added explicitly to survive that redirect.
 *
 * @param search - The current route search params.
 * @return Only the report-origin params that are set.
 */
export function pickReportOriginParams(
	search: Record< string, unknown > | undefined
): Record< string, string > {
	const picked: Record< string, string > = {};

	for ( const key of REPORT_ORIGIN_PARAM_KEYS ) {
		const value = search?.[ key ];
		if ( typeof value === 'string' && value ) {
			picked[ key ] = value;
		}
	}

	return picked;
}
