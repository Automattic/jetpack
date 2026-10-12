/**
 * External dependencies
 */
import { type StatsFileDownloadsComparisonItem } from '@jetpack-premium-analytics/data';
import { useReportDateFilters } from '@jetpack-premium-analytics/routing';
import { StatsBreadcrumbs, StatsPageIcon } from '@jetpack-premium-analytics/ui';
import {
	ReportPageLayout,
	ReportErrorState,
	ReportPageShell,
	ReportRecordsTable,
	ExporterCsvAction,
	fileDownloadsCsvExporter,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { type JSX } from 'react';
/**
 * Internal dependencies
 */
import { route } from '../package.json';
import { REPORTS } from '../registry';
import { useReportParams } from '../use-report-params';
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
	const reportParams = useReportParams();
	const records = useDownloadsReportRecords( reportParams );
	const fields = useMemo(
		() => getDownloadsFields( records.hasComparison ),
		[ records.hasComparison ]
	);

	const dateFilters = useReportDateFilters( ROUTE_FROM );
	const { getLabel } = REPORTS.downloads;

	return (
		<ReportPageShell
			visual={ <StatsPageIcon /> }
			breadcrumbs={ <StatsBreadcrumbs items={ [ { label: getLabel() } ] } /> }
			actions={
				<ExporterCsvAction
					exporter={ fileDownloadsCsvExporter }
					items={ records.rows }
					status={ records }
					reportParams={ reportParams }
				/>
			}
		>
			<ReportPageLayout title={ getLabel() } dateFilters={ dateFilters }>
				<ReportErrorState
					status={ records }
					retryDescription={ __(
						"We couldn't load file downloads. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					) }
				>
					<ReportRecordsTable< StatsFileDownloadsComparisonItem >
						data={ records.rows }
						fields={ fields }
						getItemId={ getDownloadRowId }
						isLoading={ records.isLoading }
						isFetching={ records.isFetching }
						initialView={ RECORDS_VIEW }
						searchLabel={ __( 'Search files', 'jetpack-premium-analytics-pkg' ) }
					/>
				</ReportErrorState>
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
