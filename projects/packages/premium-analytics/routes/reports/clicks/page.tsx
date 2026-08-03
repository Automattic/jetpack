/**
 * External dependencies
 */
import { normalizeReportParams } from '@jetpack-premium-analytics/data';
import { useDashboardLink, useReportDateFilters } from '@jetpack-premium-analytics/routing';
import { DateFiltersPanel } from '@jetpack-premium-analytics/ui';
import {
	ReportDrilldownTable,
	ReportErrorState,
	ReportPageLayout,
	ReportPageShell,
	ReportCsvAction,
	useReportCsvExport,
	useReportRetry,
	type CsvColumn,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { Breadcrumbs } from '@wordpress/admin-ui';
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSearch } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { route } from '../package.json';
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
	const search = useSearch( { from: ROUTE_FROM } ) as Record< string, string | undefined >;
	const reportParams = useMemo(
		() => normalizeReportParams( search as Parameters< typeof normalizeReportParams >[ 0 ] ),
		[ search ]
	);

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
	const dashboardLink = useDashboardLink();
	const [ containerElement, setContainerElement ] = useState< HTMLDivElement | null >( null );
	const isTableLoading = records.isLoading || records.isFetching;

	return (
		<ReportPageShell
			breadcrumbs={
				<Breadcrumbs
					items={ [
						{
							label: __( 'Stats', 'jetpack-premium-analytics-pkg' ),
							to: dashboardLink,
						},
						{ label: __( 'Clicks', 'jetpack-premium-analytics-pkg' ) },
					] }
				/>
			}
			actions={
				canExport ? (
					<ReportCsvAction columns={ csvColumns } rows={ exportRows } filename={ csvFilename } />
				) : undefined
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
		</ReportPageShell>
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
