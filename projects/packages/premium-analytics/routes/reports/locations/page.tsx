/**
 * External dependencies
 */
import { normalizeReportParams } from '@jetpack-premium-analytics/data';
import {
	useDashboardLink,
	useReportDateFilters,
	useSectionTab,
} from '@jetpack-premium-analytics/routing';
import { DateFiltersPanel } from '@jetpack-premium-analytics/ui';
import {
	ReportCsvAction,
	ReportErrorState,
	ReportPageLayout,
	ReportPageShell,
	ReportPageTabs,
	ReportRecordsTable,
	useReportCsvExport,
	useReportRetry,
	type CsvColumn,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { Breadcrumbs } from '@wordpress/admin-ui';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSearch } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { route } from '../package.json';
import {
	getLocationFields,
	getReportLocationsTabs,
	resolveSection,
	supportsCountryFilter,
	useLocationsReportRecords,
	type LocationRow,
	type ReportLocationsTabId,
} from './config';
import type { View } from '@jetpack-premium-analytics/externals';

const ROUTE_FROM = route.path;

/**
 * Get the stable ID for a Locations records table row.
 *
 * @param item - The location row.
 * @return The row ID.
 */
function getLocationRowId( item: LocationRow ): string {
	return item.id;
}

const RECORDS_VIEW = {
	sort: { field: 'views', direction: 'desc' as const },
	// The country field exists to filter, not to display, so it stays out of
	// the columns. DataViews shows only what `fields` lists.
	fields: [ 'location', 'views' ],
	layout: {
		styles: {
			location: { width: '100%' },
			views: { align: 'end' as const },
		},
	},
};

const COUNTRY_FILTER_FIELD = 'country';

// Match the table's own default order, so the file reads like the screen.
const sortLocationCsvRows = ( a: LocationRow, b: LocationRow ) => b.views - a.views;

/**
 * Read the picked country out of a records-table view.
 *
 * @param view - The view the table just moved to.
 * @return The ISO country code, or an empty string when unfiltered.
 */
function getCountryFilter( view: View ): string {
	const value = view.filters?.find( filter => filter.field === COUNTRY_FILTER_FIELD )?.value;

	return typeof value === 'string' ? value : '';
}

/**
 * Premium Analytics Locations report page.
 *
 * @return The Locations report page.
 */
export default function LocationsReportPage(): JSX.Element {
	const search = useSearch( { from: ROUTE_FROM } ) as Record< string, string | undefined >;
	const reportParams = useMemo(
		() => normalizeReportParams( search as Parameters< typeof normalizeReportParams >[ 0 ] ),
		[ search ]
	);
	const tabs = useMemo( () => getReportLocationsTabs(), [] );
	const [ activeTab, setActiveTab ] = useSectionTab( ROUTE_FROM, resolveSection );
	const [ countryFilter, setCountryFilter ] = useState( '' );
	const records = useLocationsReportRecords( activeTab, reportParams, countryFilter || undefined );
	const retry = useReportRetry( records.refetch );
	const fields = useMemo(
		() =>
			getLocationFields(
				supportsCountryFilter( activeTab ) ? records.countries.options : undefined,
				records.hasComparison
			),
		[ activeTab, records.countries.options, records.hasComparison ]
	);
	// Region and city names repeat across countries. On screen the flag tells
	// them apart; a CSV needs its own column.
	const csvColumns = useMemo< CsvColumn< LocationRow >[] >(
		() => [
			{ label: __( 'Location', 'jetpack-premium-analytics-pkg' ), getValue: row => row.label },
			...( supportsCountryFilter( activeTab )
				? [
						{
							label: __( 'Country', 'jetpack-premium-analytics-pkg' ),
							getValue: ( row: LocationRow ) => row.countryFull,
						},
				  ]
				: [] ),
			{ label: __( 'Views', 'jetpack-premium-analytics-pkg' ), getValue: row => row.views },
		],
		[ activeTab ]
	);
	const {
		canExport,
		rows: csvRows,
		filename: csvFilename,
	} = useReportCsvExport( {
		rows: records.table.rows,
		// The tabs export different lists, so each gets its own filename.
		filenamePrefix: `locations-${ activeTab }`,
		range: reportParams,
		status: records.table,
		sort: sortLocationCsvRows,
	} );

	// A country picked on one tab does not carry to the next: the Countries tab
	// cannot be scoped at all, and a country with regions may have no cities.
	// The table remounts per tab, so its own filter clears alongside this.
	const handleTabChange = useCallback(
		( tab: ReportLocationsTabId ) => {
			setCountryFilter( '' );
			setActiveTab( tab );
		},
		[ setActiveTab ]
	);

	// The API scopes the rows, so the picked country has to reach the request.
	const handleChangeView = useCallback( ( view: View ) => {
		setCountryFilter( getCountryFilter( view ) );
	}, [] );

	const dateFilters = useReportDateFilters( ROUTE_FROM );
	const dashboardLink = useDashboardLink();
	const tableIsLoading = records.table.isLoading || records.table.isFetching;

	return (
		<ReportPageShell
			tabbed
			breadcrumbs={
				<Breadcrumbs
					items={ [
						{ label: __( 'Stats', 'jetpack-premium-analytics-pkg' ), to: dashboardLink },
						{ label: __( 'Locations', 'jetpack-premium-analytics-pkg' ) },
					] }
				/>
			}
			actions={
				canExport ? (
					<ReportCsvAction columns={ csvColumns } rows={ csvRows } filename={ csvFilename } />
				) : undefined
			}
		>
			<ReportPageLayout
				tabs={ <ReportPageTabs tabs={ tabs } value={ activeTab } onChange={ handleTabChange } /> }
				filters={ <DateFiltersPanel { ...dateFilters } /> }
			>
				{ records.isError ? (
					<ReportErrorState
						title={ __( 'Unable to load locations', 'jetpack-premium-analytics-pkg' ) }
						onRetry={ retry }
					/>
				) : (
					<ReportRecordsTable< LocationRow >
						key={ activeTab }
						data={ records.table.rows }
						fields={ fields }
						getItemId={ getLocationRowId }
						isLoading={ tableIsLoading }
						initialView={ RECORDS_VIEW }
						searchLabel={ __( 'Search locations', 'jetpack-premium-analytics-pkg' ) }
						onChangeView={ handleChangeView }
					/>
				) }
			</ReportPageLayout>
		</ReportPageShell>
	);
}
