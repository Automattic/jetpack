/**
 * External dependencies
 */
import { useReportDateFilters } from '@jetpack-premium-analytics/routing';
import { StatsBreadcrumbs, StatsPageIcon } from '@jetpack-premium-analytics/ui';
import {
	ReportDrilldownTable,
	ReportErrorState,
	ReportPageLayout,
	ReportCsvAction,
	useReportCsvExport,
	useReportRetry,
	type CsvColumn,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { Page } from '@wordpress/admin-ui';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { route } from '../package.json';
import { REPORTS } from '../registry';
import { useReportParams } from '../use-report-params';
import { getReferrerFields, useReferrersReportRecords, type ReferrerRecord } from './config';

const ROUTE_FROM = route.path;

/**
 * Stable row id for the Referrers records table.
 *
 * @param item - The referrer row.
 * @return The row id.
 */
function getReferrerRowId( item: ReferrerRecord ): string {
	return item.id;
}

/**
 * Resolve the parent row for nested referrers.
 *
 * @param item - The referrer row.
 * @return The parent row id, if present.
 */
function getReferrerParentId( item: ReferrerRecord ): string | undefined {
	return item.parentId;
}

const RECORDS_VIEW = {
	sort: { field: 'views', direction: 'desc' as const },
	// Keep Referrer as the title field so DataViews renders native hierarchy
	// levels on the same nested group/source/domain structure as the widget.
	fields: [ 'referrer', 'views' ],
	layout: {
		styles: {
			referrer: { width: '100%' },
			views: { align: 'end' as const },
		},
	},
};

/**
 * Premium Analytics Referrers report page component.
 *
 * @return {JSX.Element} The Referrers report page.
 */
function ReferrersReport(): JSX.Element {
	const reportParams = useReportParams();

	const records = useReferrersReportRecords( reportParams );
	const retry = useReportRetry( records.refetch );
	const fields = useMemo( () => getReferrerFields(), [] );
	const csvColumns = useMemo< CsvColumn< ReferrerRecord >[] >(
		() => [
			{ label: __( 'Referrer', 'jetpack-premium-analytics-pkg' ), getValue: row => row.label },
			{
				label: __( 'Group', 'jetpack-premium-analytics-pkg' ),
				getValue: row => row.parentLabel ?? '',
			},
			{ label: __( 'Views', 'jetpack-premium-analytics-pkg' ), getValue: row => row.views },
			{ label: __( 'URL', 'jetpack-premium-analytics-pkg' ), getValue: row => row.link ?? '' },
		],
		[]
	);
	const {
		canExport,
		rows: csvRows,
		filename: csvFilename,
	} = useReportCsvExport( {
		rows: records.rows,
		filenamePrefix: 'referrers',
		range: reportParams,
		status: records,
	} );

	const dateFilters = useReportDateFilters( ROUTE_FROM );
	const { getLabel, getTitle } = REPORTS.referrers;

	return (
		<Page
			visual={ <StatsPageIcon /> }
			breadcrumbs={ <StatsBreadcrumbs items={ [ { label: getLabel() } ] } /> }
			actions={
				canExport ? (
					<ReportCsvAction columns={ csvColumns } rows={ csvRows } filename={ csvFilename } />
				) : undefined
			}
		>
			<ReportPageLayout title={ getTitle() } dateFilters={ dateFilters }>
				{ records.isError ? (
					<ReportErrorState
						title={ __( 'Unable to load referrers', 'jetpack-premium-analytics-pkg' ) }
						onRetry={ retry }
					/>
				) : (
					<ReportDrilldownTable< ReferrerRecord >
						data={ records.rows }
						fields={ fields }
						getItemId={ getReferrerRowId }
						getItemParentId={ getReferrerParentId }
						hideLevelMarkers
						isLoading={ records.isLoading }
						initialView={ RECORDS_VIEW }
						searchLabel={ __( 'Search referrers', 'jetpack-premium-analytics-pkg' ) }
					/>
				) }
			</ReportPageLayout>
		</Page>
	);
}

/**
 * Referrers report page (default export for the report registry).
 *
 * @return {JSX.Element} The Referrers report page.
 */
export default function ReferrersReportPage(): JSX.Element {
	return <ReferrersReport />;
}
