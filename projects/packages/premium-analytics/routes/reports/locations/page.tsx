/**
 * External dependencies
 */
import { usePrefetchViewerCountry } from '@jetpack-premium-analytics/data';
import { useReportDateFilters, useSectionTab } from '@jetpack-premium-analytics/routing';
import { StatsBreadcrumbs, StatsPageIcon } from '@jetpack-premium-analytics/ui';
import {
	ExporterCsvAction,
	LOCATIONS_GEO_MODES,
	ReportLocationsMap,
	ReportPageLayout,
	ReportErrorState,
	ReportPageShell,
	ReportPageTabs,
	ReportRecordsTable,
	locationsCsvExporter,
	supportsLocationsCountryFilter,
	type LocationsGeoRow,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { route } from '../package.json';
import { REPORTS } from '../registry';
import { useReportParams } from '../use-report-params';
import {
	getLocationFields,
	getReportLocationsTabs,
	getTabLabel,
	resolveSection,
	useLocationsReportRecords,
	type LocationRow,
	type ReportLocationsTabId,
} from './config';
import type { View } from '@jetpack-premium-analytics/externals';
import type { JSX } from 'react';

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

/** The country picked in the records table, and the tab it was picked on. */
type PickedCountry = { tab: ReportLocationsTabId; code: string };

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
	usePrefetchViewerCountry();
	const reportParams = useReportParams();
	const tabs = useMemo( () => getReportLocationsTabs(), [] );
	const [ activeTab, setActiveTab ] = useSectionTab( ROUTE_FROM, resolveSection );
	// The tab lives on the URL, so Back and Forward move it without the tab strip's
	// change event. Keying the picked country to the tab it was picked on clears it
	// whichever way the tab moved, and resetting during render keeps the stale pair
	// out of the request this render makes.
	const [ pickedCountry, setPickedCountry ] = useState< PickedCountry >( {
		tab: activeTab,
		code: '',
	} );
	if ( pickedCountry.tab !== activeTab && pickedCountry.code ) {
		setPickedCountry( { tab: activeTab, code: '' } );
	}
	const countryFilter = pickedCountry.tab === activeTab ? pickedCountry.code : '';
	const records = useLocationsReportRecords( activeTab, reportParams, countryFilter || undefined );
	const fields = useMemo(
		() =>
			getLocationFields(
				supportsLocationsCountryFilter( activeTab ) ? records.countries.options : undefined,
				records.hasComparison,
				activeTab
			),
		[ activeTab, records.countries.options, records.hasComparison ]
	);
	const csvExporter = useMemo(
		() => locationsCsvExporter( activeTab, countryFilter ? { country: countryFilter } : undefined ),
		[ activeTab, countryFilter ]
	);

	// The API scopes the rows, so the picked country has to reach the request.
	const handleChangeView = useCallback(
		( view: View ) => {
			const code = getCountryFilter( view );

			setPickedCountry( previous =>
				previous.tab === activeTab && previous.code === code ? previous : { tab: activeTab, code }
			);
		},
		[ activeTab ]
	);

	// The map plots the rows the table already fetched, so it costs no request
	// of its own. Rows the API left without a country cannot be placed on it.
	const geoRows = useMemo(
		(): LocationsGeoRow[] =>
			records.table.rows
				.filter( ( row ): row is LocationRow & { countryCode: string } => !! row.countryCode )
				.map( row => ( {
					label: row.label,
					value: row.views,
					countryCode: row.countryCode,
					countryFull: row.countryFull,
					coordinates: row.coordinates,
				} ) ),
		[ records.table.rows ]
	);
	const focusCountry = useMemo( () => {
		if ( ! countryFilter ) {
			return undefined;
		}

		const country = records.countries.options.find( option => option.code === countryFilter );

		return { code: countryFilter, name: country?.label ?? countryFilter };
	}, [ countryFilter, records.countries.options ] );

	const dateFilters = useReportDateFilters( ROUTE_FROM );
	const tableIsLoading = records.table.isLoading || records.table.isFetching;
	const { getLabel } = REPORTS.locations;
	// Stays mounted while the rows load, so a map the user collapsed stays collapsed.
	const showMap = !! countryFilter || records.table.rows.length > 0 || records.table.isLoading;

	return (
		<ReportPageShell
			visual={ <StatsPageIcon /> }
			breadcrumbs={ <StatsBreadcrumbs items={ [ { label: getLabel() } ] } /> }
			actions={
				<ExporterCsvAction
					exporter={ csvExporter }
					items={ records.table.rows }
					status={ records.table }
					reportParams={ reportParams }
				/>
			}
		>
			<ReportPageLayout
				title={ getTabLabel( activeTab ) }
				tabs={ <ReportPageTabs tabs={ tabs } value={ activeTab } onChange={ setActiveTab } /> }
				dateFilters={ dateFilters }
			>
				<ReportErrorState
					status={ records }
					retryDescription={ __(
						"We couldn't load locations. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					) }
				>
					<>
						{ showMap && (
							<ReportLocationsMap
								rows={ geoRows }
								mode={ LOCATIONS_GEO_MODES[ activeTab ] }
								focusCountry={ focusCountry }
								isLoading={ tableIsLoading }
							/>
						) }
						<ReportRecordsTable< LocationRow >
							key={ activeTab }
							data={ records.table.rows }
							fields={ fields }
							getItemId={ getLocationRowId }
							isLoading={ records.table.isLoading }
							isFetching={ records.table.isFetching }
							initialView={ RECORDS_VIEW }
							searchLabel={ __( 'Search locations', 'jetpack-premium-analytics-pkg' ) }
							onChangeView={ handleChangeView }
						/>
					</>
				</ReportErrorState>
			</ReportPageLayout>
		</ReportPageShell>
	);
}
