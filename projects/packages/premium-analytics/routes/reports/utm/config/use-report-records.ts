/**
 * External dependencies
 */
import { useStatsUtm, type ReportParams } from '@jetpack-premium-analytics/data';
import {
	aggregateUtmRows,
	getUtmReportQueryParams,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import type { UtmReportTabId } from './tabs';

/**
 * Fetch and derive the table records for the active UTM dimension.
 *
 * @param activeTab    - The active UTM dimension tab.
 * @param reportParams - The shared report-window parameters.
 * @return The active dimension's table rows and loading state.
 */
export function useUtmReportRecords( activeTab: UtmReportTabId, reportParams: ReportParams ) {
	const queryParams = useMemo(
		() => ( {
			'source-medium': getUtmReportQueryParams( reportParams, 'source-medium' ),
			'campaign-source-medium': getUtmReportQueryParams( reportParams, 'campaign-source-medium' ),
			source: getUtmReportQueryParams( reportParams, 'source' ),
			medium: getUtmReportQueryParams( reportParams, 'medium' ),
			campaign: getUtmReportQueryParams( reportParams, 'campaign' ),
		} ),
		[ reportParams ]
	);

	const sourceMedium = useStatsUtm( queryParams[ 'source-medium' ], {
		enabled: activeTab === 'source-medium',
	} );
	const campaignSourceMedium = useStatsUtm( queryParams[ 'campaign-source-medium' ], {
		enabled: activeTab === 'campaign-source-medium',
	} );
	const source = useStatsUtm( queryParams.source, { enabled: activeTab === 'source' } );
	const medium = useStatsUtm( queryParams.medium, { enabled: activeTab === 'medium' } );
	const campaign = useStatsUtm( queryParams.campaign, { enabled: activeTab === 'campaign' } );

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
