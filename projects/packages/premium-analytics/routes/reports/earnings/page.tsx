/**
 * External dependencies
 */
import { useSectionTab } from '@jetpack-premium-analytics/routing';
import { StatsBreadcrumbs, StatsPageIcon } from '@jetpack-premium-analytics/ui';
import {
	ReportCsvAction,
	ReportErrorState,
	ReportPageLayout,
	ReportPageShell,
	ReportPageTabs,
	ReportRecordsTable,
	getEarningsStatus,
	getWordAdsHistoryFields,
	useReportCsvExport,
	useReportRetry,
	type CsvColumn,
	type EarningsHistoryRow,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { route } from '../package.json';
import { REPORTS } from '../registry';
import {
	getEarningsReportTabs,
	getTabTitle,
	hasAdsServed,
	resolveSection,
	useEarningsReportRecords,
} from './config';

const ROUTE_FROM = route.path;

// Period is the row's title field: DataViews draws it bold in the content
// colour, as in the design, and sizes it to the width the other columns leave.
const RECORDS_VIEW = {
	titleField: 'period',
	sort: { field: 'period', direction: 'desc' as const },
	layout: {
		styles: {
			amount: { align: 'end' as const },
			pageviews: { align: 'end' as const },
		},
	},
};

/**
 * Get the DataViews row id for an earnings-history row.
 *
 * @param item - The earnings-history row.
 * @return The row id.
 */
function getEarningsRowId( item: EarningsHistoryRow ): string {
	return item.id;
}

// The payload arrives period-keyed in no particular order, so the export needs the
// table's own ordering applied to it.
const sortEarningsCsvRows = ( a: EarningsHistoryRow, b: EarningsHistoryRow ) =>
	b.period.localeCompare( a.period );

/**
 * Premium Analytics WordAds earnings report page.
 *
 * @return The earnings report page.
 */
function EarningsReport(): JSX.Element {
	const [ urlTab, setActiveTab ] = useSectionTab( ROUTE_FROM, resolveSection );
	const records = useEarningsReportRecords( urlTab );
	const { tab, availableTabs } = records;
	const showAdsServed = hasAdsServed( tab );
	const tabs = useMemo(
		() => getEarningsReportTabs().filter( ( { id } ) => availableTabs.includes( id ) ),
		[ availableTabs ]
	);
	const fields = useMemo( () => {
		const all = getWordAdsHistoryFields();

		return showAdsServed ? all : all.filter( field => field.id !== 'pageviews' );
	}, [ showAdsServed ] );
	const csvColumns = useMemo< CsvColumn< EarningsHistoryRow >[] >(
		() => [
			{ label: __( 'Period', 'jetpack-premium-analytics-pkg' ), getValue: row => row.period },
			{ label: __( 'Earnings', 'jetpack-premium-analytics-pkg' ), getValue: row => row.amount },
			...( showAdsServed
				? [
						{
							label: __( 'Ads Served', 'jetpack-premium-analytics-pkg' ),
							getValue: ( row: EarningsHistoryRow ) => row.pageviews,
						},
					]
				: [] ),
			{
				label: __( 'Status', 'jetpack-premium-analytics-pkg' ),
				// The numeric code says nothing to a reader of the export; a pending
				// row keeps its reason, which the table shows in an icon.
				getValue: row => {
					const { label, detail } = getEarningsStatus( row.status );
					return detail
						? sprintf(
								/* translators: 1: payment status, e.g. "Pending"; 2: the reason, e.g. "Missing tax info". */
								__( '%1$s (%2$s)', 'jetpack-premium-analytics-pkg' ),
								label,
								detail
							)
						: label;
				},
			},
		],
		[ showAdsServed ]
	);
	const {
		canExport,
		rows: csvRows,
		filename: csvFilename,
	} = useReportCsvExport( {
		rows: records.rows,
		// The tabs export different lists, so each gets its own filename.
		filenamePrefix: `earnings-${ tab }`,
		status: records,
		sort: sortEarningsCsvRows,
	} );
	const retry = useReportRetry( records.refetch );

	const { getLabel } = REPORTS.earnings;

	return (
		<ReportPageShell
			visual={ <StatsPageIcon /> }
			breadcrumbs={ <StatsBreadcrumbs items={ [ { label: getLabel() } ] } /> }
			actions={
				canExport ? (
					<ReportCsvAction columns={ csvColumns } rows={ csvRows } filename={ csvFilename } />
				) : undefined
			}
		>
			{ /* No date filters: the `wordads/earnings` endpoint is all-time, and the Ads tab has no global date controls. */ }
			<ReportPageLayout
				title={ getTabTitle( tab ) }
				tabs={
					tabs.length > 1 ? (
						<ReportPageTabs tabs={ tabs } value={ tab } onChange={ setActiveTab } />
					) : undefined
				}
			>
				{ records.isError ? (
					<ReportErrorState
						title={ __( 'Unable to load earnings', 'jetpack-premium-analytics-pkg' ) }
						onRetry={ retry }
					/>
				) : (
					<ReportRecordsTable< EarningsHistoryRow >
						key={ tab }
						data={ records.rows }
						fields={ fields }
						getItemId={ getEarningsRowId }
						isLoading={ records.isLoading }
						initialView={ RECORDS_VIEW }
						searchLabel={ __( 'Search earnings history', 'jetpack-premium-analytics-pkg' ) }
					/>
				) }
			</ReportPageLayout>
		</ReportPageShell>
	);
}

/**
 * Earnings report page (default export for the report registry).
 *
 * @return The earnings report page.
 */
export default function EarningsReportPage(): JSX.Element {
	return <EarningsReport />;
}
