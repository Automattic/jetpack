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
import { getClickCsvGroup, getClicksFields, useClicksReportRecords, type ClickRow } from './config';

const ROUTE_FROM = route.path;

/**
 * Stable row id for the Clicks records table.
 *
 * @param item - The clicked URL row.
 * @return The row id.
 */
function getClickRowId( item: ClickRow ): string {
	return item.id;
}

/**
 * Resolve the click-group parent row id for nested URL rows.
 *
 * @param item - The clicked URL row.
 * @return The parent row id, if any.
 */
function getClickRowParentId( item: ClickRow ): string | undefined {
	return item.parentId;
}

/*
 * No default sort: the aggregated rows arrive pre-ordered by clicks (groups,
 * then each group's URLs), and the unsorted view preserves that order. Sorting
 * a field reorders rows within each hierarchy level.
 */
const RECORDS_VIEW = {
	layout: {
		styles: {
			clickedUrl: { width: '100%' },
			clicks: { align: 'end' as const },
		},
	},
};

type ClickCsvRow = ClickRow & { group: string };

/**
 * Premium Analytics Clicks report page component.
 *
 * @return The Clicks report page.
 */
function ClicksReport(): JSX.Element {
	const reportParams = useReportParams();

	const records = useClicksReportRecords( reportParams );
	const retry = useReportRetry( records.refetch );
	const fields = useMemo(
		() => getClicksFields( records.hasComparison ),
		[ records.hasComparison ]
	);
	const csvRows = useMemo< ClickCsvRow[] >(
		() =>
			records.rows.map( row => ( {
				...row,
				group: row.isGroup ? '' : getClickCsvGroup( row ),
			} ) ),
		[ records.rows ]
	);
	const csvColumns = useMemo< CsvColumn< ClickCsvRow >[] >(
		() => [
			{
				label: __( 'Clicked URL', 'jetpack-premium-analytics-pkg' ),
				getValue: row => row.clickedUrl,
			},
			{ label: __( 'Group', 'jetpack-premium-analytics-pkg' ), getValue: row => row.group },
			{ label: __( 'Clicks', 'jetpack-premium-analytics-pkg' ), getValue: row => row.clicks },
		],
		[]
	);
	const {
		canExport,
		rows: exportRows,
		filename: csvFilename,
	} = useReportCsvExport( {
		rows: csvRows,
		filenamePrefix: 'clicks',
		range: reportParams,
		status: records,
	} );

	const dateFilters = useReportDateFilters( ROUTE_FROM );
	const isTableLoading = records.isLoading || records.isFetching;

	const { getLabel, getTitle } = REPORTS.clicks;

	return (
		<Page
			visual={ <StatsPageIcon /> }
			breadcrumbs={ <StatsBreadcrumbs items={ [ { label: getLabel() } ] } /> }
			actions={
				canExport ? (
					<ReportCsvAction columns={ csvColumns } rows={ exportRows } filename={ csvFilename } />
				) : undefined
			}
		>
			<ReportPageLayout title={ getTitle() } dateFilters={ dateFilters }>
				{ records.isError ? (
					<ReportErrorState
						title={ __( 'Unable to load clicks', 'jetpack-premium-analytics-pkg' ) }
						onRetry={ retry }
					/>
				) : (
					<ReportDrilldownTable< ClickRow >
						data={ records.rows }
						fields={ fields }
						getItemId={ getClickRowId }
						getItemParentId={ getClickRowParentId }
						isLoading={ isTableLoading }
						initialView={ RECORDS_VIEW }
						searchLabel={ __( 'Search clicked URLs', 'jetpack-premium-analytics-pkg' ) }
						hideLevelMarkers
					/>
				) }
			</ReportPageLayout>
		</Page>
	);
}

/**
 * Clicks report page (default export for the report registry).
 *
 * @return The Clicks report page.
 */
export default function ClicksReportPage(): JSX.Element {
	return <ClicksReport />;
}
