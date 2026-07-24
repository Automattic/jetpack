/**
 * External dependencies
 */
import {
	normalizeReportParams,
	type StatsFileDownloadsComparisonItem,
} from '@jetpack-premium-analytics/data';
import { useDashboardLink, useReportDateFilters } from '@jetpack-premium-analytics/routing';
import { DateFiltersPanel } from '@jetpack-premium-analytics/ui';
import {
	ReportErrorState,
	ReportPageLayout,
	ReportPageShell,
	ReportRecordsTable,
	useReportRetry,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { Breadcrumbs } from '@wordpress/admin-ui';
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSearch } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { route } from '../package.json';
import { getDownloadsFields, useDownloadsReportRecords } from './config';

const ROUTE_FROM = route.path;

/**
 * Stable table row identity for a downloaded file.
 *
 * @param item - File-download row.
 * @return The row identity.
 */
function getDownloadRowId( item: StatsFileDownloadsComparisonItem ): string {
	return item.link ?? String( item.label ?? item.shortLabel ?? '' );
}

const RECORDS_VIEW = {
	sort: { field: 'downloads', direction: 'desc' as const },
	layout: {
		styles: {
			file: { width: '100%' },
			downloads: { align: 'end' as const },
		},
	},
};

/**
 * File downloads report page.
 *
 * @return The rendered report page.
 */
function DownloadsReport(): JSX.Element {
	const search = useSearch( { from: ROUTE_FROM } ) as Record< string, string | undefined >;
	const reportParams = useMemo(
		() => normalizeReportParams( search as Parameters< typeof normalizeReportParams >[ 0 ] ),
		[ search ]
	);
	const records = useDownloadsReportRecords( reportParams );
	const retry = useReportRetry( records.refetch );
	const fields = useMemo(
		() => getDownloadsFields( records.hasComparison ),
		[ records.hasComparison ]
	);
	const isRecordsLoading = records.isLoading || records.isFetching;

	const dateFilters = useReportDateFilters( ROUTE_FROM );
	const dashboardLink = useDashboardLink();
	const [ containerElement, setContainerElement ] = useState< HTMLDivElement | null >( null );

	return (
		<ReportPageShell
			breadcrumbs={
				<Breadcrumbs
					items={ [
						{ label: __( 'Stats', 'jetpack-premium-analytics-pkg' ), to: dashboardLink },
						{ label: __( 'File downloads', 'jetpack-premium-analytics-pkg' ) },
					] }
				/>
			}
		>
			<ReportPageLayout
				filters={
					<div ref={ setContainerElement }>
						<DateFiltersPanel { ...dateFilters } containerElement={ containerElement } />
					</div>
				}
			>
				{ records.isError ? (
					<ReportErrorState
						title={ __( 'Unable to load file downloads', 'jetpack-premium-analytics-pkg' ) }
						onRetry={ retry }
					/>
				) : (
					<ReportRecordsTable< StatsFileDownloadsComparisonItem >
						data={ isRecordsLoading ? [] : records.rows }
						fields={ fields }
						getItemId={ getDownloadRowId }
						isLoading={ isRecordsLoading }
						initialView={ RECORDS_VIEW }
						searchLabel={ __( 'Search files', 'jetpack-premium-analytics-pkg' ) }
					/>
				) }
			</ReportPageLayout>
		</ReportPageShell>
	);
}

/**
 * File downloads report page (default export for the report registry).
 *
 * @return The rendered report page.
 */
export default function DownloadsReportPage(): JSX.Element {
	return <DownloadsReport />;
}
