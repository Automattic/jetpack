/**
 * External dependencies
 */
import { useStatsVisits, type StatsVisitsResponse } from '@jetpack-premium-analytics/data';
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import {
	HeatmapChartUnresponsive,
	WidgetRoot,
	WidgetState,
	buildCalendarHeatmapData,
	buildDenseDaySeries,
	computeCalendarHeatmapLayout,
	describeError,
	resolveCalendarHeatmapWindow,
	useElementSize,
	useWidgetRootContext,
	withoutComparison,
	type HeatmapTooltipData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __, _n, sprintf } from '@wordpress/i18n';
import { seen } from '@wordpress/icons';
import { format } from 'date-fns';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { TrafficViewsActivityAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type TrafficViewsActivityRenderAttributes = TrafficViewsActivityAttributes &
	Partial< ReportParamsFieldAttributes >;
type TrafficViewsActivityWidgetProps = WidgetRenderProps< TrafficViewsActivityRenderAttributes >;

// Avoid fetching years the widget cannot display; 366 preserves a complete leap year.
const MAX_WINDOW_DAYS = 366;

// Preserve the design's 61:40 cell ratio.
const CELL_HEIGHT = 40;
const CELL_ASPECT_RATIO = 61 / CELL_HEIGHT;

// Show the exact count before the date instead of the chart's default ordering.
function renderCellTooltip( { value, cellLabel }: HeatmapTooltipData ) {
	return (
		<>
			<strong>
				{ value === null
					? __( 'No views', 'jetpack-premium-analytics-pkg' )
					: sprintf(
							/* translators: %s: number of views, e.g. "2,033". */
							_n( '%s view', '%s views', value, 'jetpack-premium-analytics-pkg' ),
							formatMetricValue( value, 'number', { decimals: 0 } )
					  ) }
			</strong>
			<div>{ cellLabel }</div>
		</>
	);
}

function TrafficViewsActivityInner() {
	const { reportParams } = useWidgetRootContext();

	const fetchWindow = useMemo(
		() =>
			resolveCalendarHeatmapWindow(
				reportParams,
				{ maxDays: MAX_WINDOW_DAYS },
				format( new Date(), 'yyyy-MM-dd' )
			),
		[ reportParams ]
	);

	// stats/visits reads from/to; startDate/endDate are specific to stats/streak.
	const params = useMemo(
		() =>
			withoutComparison( {
				...reportParams,
				from: fetchWindow.startDate,
				to: fetchWindow.endDate,
				period: 'day',
				stat_fields: 'views' as const,
			} ),
		[ reportParams, fetchWindow ]
	);

	const { primary, isLoading, isFetching, isError, error, refetch } = useStatsVisits( params );
	const report = primary.data as StatsVisitsResponse | undefined;

	const { data: heatmapData, rowLabels } = useMemo( () => {
		const viewsByDay = new Map< string, number | null >(
			( report?.data ?? [] ).map( row => {
				const views = Number( ( row as Record< string, unknown > ).views ?? 0 );

				return [ String( row.time_interval ), views > 0 ? views : null ];
			} )
		);

		return buildCalendarHeatmapData(
			buildDenseDaySeries( viewsByDay, fetchWindow.startDate, fetchWindow.endDate )
		);
	}, [ report, fetchWindow ] );

	const hasViews = heatmapData.some( column =>
		column.data.some( cell => cell.value !== null && cell.value > 0 )
	);

	const [ setRef, size ] = useElementSize< HTMLDivElement >();

	const layout = useMemo(
		() =>
			computeCalendarHeatmapLayout( {
				availWidth: size.width,
				availHeight: size.height,
				dataColumns: heatmapData.length,
				aspectRatio: CELL_ASPECT_RATIO,
				maxCellHeight: CELL_HEIGHT,
				// Avoid shrinking the cells for a legend this widget does not render.
				legendHeight: 0,
			} ),
		[ size.width, size.height, heatmapData.length ]
	);

	// slice( -0 ) keeps the data intact until the tile has a measurable width.
	const trimmedData = useMemo(
		() => heatmapData.slice( -layout.columns ),
		[ heatmapData, layout.columns ]
	);

	return (
		<div className={ styles.root }>
			<div className={ styles.content } ref={ setRef }>
				<WidgetState
					isLoading={ isLoading }
					isFetching={ isFetching }
					// Keep stale data visible when a background refetch fails.
					isError={ isError && ! hasViews }
					isEmpty={ ! hasViews }
					error={ describeError( error, {
						retryDescription: __(
							"We couldn't load your traffic activity. Please try again in a moment.",
							'jetpack-premium-analytics-pkg'
						),
						onRetry: refetch,
					} ) }
					empty={ {
						icon: seen,
						description: __( 'No views in this period.', 'jetpack-premium-analytics-pkg' ),
					} }
				>
					<HeatmapChartUnresponsive
						data={ trimmedData }
						rowLabels={ rowLabels }
						className={ styles.heatmap }
						primaryColor="var(--wp-admin-theme-color, #3858e9)"
						withTooltips
						renderTooltip={ renderCellTooltip }
						showValues
						width={ layout.heatmapWidth }
						height={ layout.heatmapHeight }
					/>
				</WidgetState>
			</div>
		</div>
	);
}

export default function TrafficViewsActivity( {
	attributes = {},
}: TrafficViewsActivityWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<TrafficViewsActivityInner />
		</WidgetRoot>
	);
}
