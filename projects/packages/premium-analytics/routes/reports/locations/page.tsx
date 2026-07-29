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
	ReportErrorState,
	ReportPageLayout,
	ReportPageShell,
	ReportPageTabs,
	ReportRecordsTable,
	useReportRetry,
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
	getCountryFilterAllLabel,
	getLocationFields,
	getReportLocationsTabs,
	LocationsCountryFilter,
	resolveSection,
	supportsCountryFilter,
	useLocationsReportRecords,
	type LocationRow,
	type ReportLocationsTabId,
} from './config';

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
	layout: {
		styles: {
			location: { width: '100%' },
			views: { align: 'end' as const },
		},
	},
};

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
	const fields = useMemo( () => getLocationFields(), [] );

	// A country picked on one tab does not carry to the next: the Countries tab
	// cannot be scoped at all, and a country with regions may have no cities.
	const handleTabChange = useCallback(
		( tab: ReportLocationsTabId ) => {
			setCountryFilter( '' );
			setActiveTab( tab );
		},
		[ setActiveTab ]
	);

	const dateFilters = useReportDateFilters( ROUTE_FROM );
	const dashboardLink = useDashboardLink();
	const [ containerElement, setContainerElement ] = useState< HTMLDivElement | null >( null );

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
		>
			<ReportPageLayout
				tabs={ <ReportPageTabs tabs={ tabs } value={ activeTab } onChange={ handleTabChange } /> }
				filters={
					<div ref={ setContainerElement }>
						<DateFiltersPanel { ...dateFilters } containerElement={ containerElement } />
					</div>
				}
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
						isLoading={ records.table.isLoading }
						initialView={ RECORDS_VIEW }
						searchLabel={ __( 'Search locations', 'jetpack-premium-analytics-pkg' ) }
						header={
							supportsCountryFilter( activeTab ) ? (
								<LocationsCountryFilter
									countries={ records.countries.options }
									value={ countryFilter }
									allLabel={ getCountryFilterAllLabel( activeTab ) }
									onChange={ setCountryFilter }
								/>
							) : undefined
						}
					/>
				) }
			</ReportPageLayout>
		</ReportPageShell>
	);
}
