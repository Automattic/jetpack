/**
 * External dependencies
 */
import { useStatsUtm, type ReportParams } from '@jetpack-premium-analytics/data';
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { aggregateUtmRows } from './aggregate';
import { getUtmParam, type UtmReportTabId } from './tabs';

/**
 * Fetch and derive the table records for the active UTM dimension.
 *
 * @param activeTab    - The active UTM dimension tab.
 * @param reportParams - The shared report-window parameters.
 * @return The active dimension's table rows and loading state.
 */
export function useUtmReportRecords( activeTab: UtmReportTabId, reportParams: ReportParams ) {
	const baseParams = useMemo(
		() => ( {
			...reportParams,
			max: 0,
			summarize: 0,
			// Match Calypso's full UTM report request and include the posts
			// grouped under each UTM value.
			query_top_posts: true,
		} ),
		[ reportParams ]
	);

	const sourceMedium = useStatsUtm(
		{ ...baseParams, utmParam: getUtmParam( 'source-medium' ) } as Parameters<
			typeof useStatsUtm
		>[ 0 ],
		{ enabled: activeTab === 'source-medium' }
	);
	const campaignSourceMedium = useStatsUtm(
		{ ...baseParams, utmParam: getUtmParam( 'campaign-source-medium' ) } as Parameters<
			typeof useStatsUtm
		>[ 0 ],
		{ enabled: activeTab === 'campaign-source-medium' }
	);
	const source = useStatsUtm(
		{ ...baseParams, utmParam: getUtmParam( 'source' ) } as Parameters< typeof useStatsUtm >[ 0 ],
		{ enabled: activeTab === 'source' }
	);
	const medium = useStatsUtm(
		{ ...baseParams, utmParam: getUtmParam( 'medium' ) } as Parameters< typeof useStatsUtm >[ 0 ],
		{ enabled: activeTab === 'medium' }
	);
	const campaign = useStatsUtm(
		{ ...baseParams, utmParam: getUtmParam( 'campaign' ) } as Parameters< typeof useStatsUtm >[ 0 ],
		{ enabled: activeTab === 'campaign' }
	);

	const activeReport = {
		'source-medium': sourceMedium,
		'campaign-source-medium': campaignSourceMedium,
		source,
		medium,
		campaign,
	}[ activeTab ];
	const rows = useMemo(
		() => aggregateUtmRows( activeReport.comparisonRows?.rows ?? [] ),
		[ activeReport.comparisonRows ]
	);

	return {
		rows,
		isLoading: activeReport.isLoading,
		isFetching: activeReport.isFetching,
		isError: activeReport.isError,
		refetch: activeReport.refetch,
	};
}
