/**
 * External dependencies
 */
import {
	normalizeReportParams,
	type IntervalType,
	type StatsChartBucketPeriod,
} from '@jetpack-premium-analytics/data';
import {
	useDashboardLink,
	useReportDateFilters,
	useSectionTab,
} from '@jetpack-premium-analytics/routing';
import { DateFiltersPanel } from '@jetpack-premium-analytics/ui';
import {
	formatLegendLabels,
	ReportPageLayout,
	ReportPageTabs,
	ReportPerformanceChart,
	ReportRecordsTable,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { Breadcrumbs, Page } from '@wordpress/admin-ui';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate, useSearch } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { route } from '../package.json';
import {
	getLocationFields,
	getReportLocationsTabs,
	resolveSection,
	useLocationsReportRecords,
	type LocationRow,
} from './config';
import styles from './page.module.css';

const ROUTE_FROM = route.path;
const REPORT_PARAMS = { report: 'locations' };
const CHART_PERIODS = [
	'day',
	'week',
	'month',
] as const satisfies readonly StatsChartBucketPeriod[];

/**
 * Check whether a URL value is a supported chart period.
 *
 * @param value - The URL search value.
 * @return Whether the value is a chart period.
 */
function isChartPeriod( value: unknown ): value is StatsChartBucketPeriod {
	return CHART_PERIODS.includes( value as StatsChartBucketPeriod );
}

/**
 * Choose the default chart bucket period for a report interval.
 *
 * @param interval - The report date interval.
 * @return The default chart period.
 */
function getDefaultChartPeriod( interval?: IntervalType ): StatsChartBucketPeriod {
	if ( interval === 'week' ) {
		return 'week';
	}

	if ( interval === 'month' || interval === 'quarter' || interval === 'year' ) {
		return 'month';
	}

	return 'day';
}

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
	const chartPeriod = isChartPeriod( search.period )
		? search.period
		: getDefaultChartPeriod( reportParams.interval );
	const records = useLocationsReportRecords( activeTab, reportParams, chartPeriod );
	const fields = useMemo( () => getLocationFields(), [] );
	const chartMetrics = useMemo(
		() => [ { key: 'views', label: __( 'Views', 'jetpack-premium-analytics-pkg' ) } ],
		[]
	);
	const chartLegendLabels = useMemo( () => formatLegendLabels( reportParams ), [ reportParams ] );

	const navigate = useNavigate();
	const handleIntervalChange = useCallback(
		( interval: IntervalType ) => {
			const period = isChartPeriod( interval ) ? interval : getDefaultChartPeriod( interval );
			navigate( {
				to: ROUTE_FROM,
				params: REPORT_PARAMS as unknown as never,
				replace: true,
				search: ( ( current: Record< string, unknown > ) => ( {
					...current,
					period,
				} ) ) as unknown as never,
			} );
		},
		[ navigate ]
	);

	const dateFilters = useReportDateFilters( ROUTE_FROM );
	const dashboardLink = useDashboardLink();
	const [ containerElement, setContainerElement ] = useState< HTMLDivElement | null >( null );

	return (
		<Page
			breadcrumbs={
				<Breadcrumbs
					items={ [
						{ label: __( 'Stats', 'jetpack-premium-analytics-pkg' ), to: dashboardLink },
						{ label: __( 'Locations', 'jetpack-premium-analytics-pkg' ) },
					] }
				/>
			}
			subTitle={ __(
				'See where your visitors are viewing from.',
				'jetpack-premium-analytics-pkg'
			) }
			className={ styles.page }
		>
			<div className={ styles.content }>
				<ReportPageLayout
					tabs={ <ReportPageTabs tabs={ tabs } value={ activeTab } onChange={ setActiveTab } /> }
					filters={
						<div ref={ setContainerElement } className={ styles.dateFilters }>
							<DateFiltersPanel { ...dateFilters } containerElement={ containerElement } />
						</div>
					}
				>
					<ReportPerformanceChart
						primary={ records.chart.primary }
						comparison={ records.chart.comparison }
						isLoading={ records.chart.isLoading }
						metrics={ chartMetrics }
						interval={ chartPeriod }
						onIntervalChange={ handleIntervalChange }
						legendLabels={ chartLegendLabels }
					/>
					<ReportRecordsTable< LocationRow >
						key={ activeTab }
						data={ records.table.rows }
						fields={ fields }
						getItemId={ getLocationRowId }
						isLoading={ records.table.isLoading }
						initialView={ RECORDS_VIEW }
						searchLabel={ __( 'Search locations', 'jetpack-premium-analytics-pkg' ) }
					/>
				</ReportPageLayout>
			</div>
		</Page>
	);
}
