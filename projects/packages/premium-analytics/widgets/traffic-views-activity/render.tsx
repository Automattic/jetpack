/**
 * External dependencies
 */
import { useStatsVisits, type StatsVisitsResponse } from '@jetpack-premium-analytics/data';
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
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { seen } from '@wordpress/icons';
import { format } from 'date-fns';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { TrafficViewsActivityAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// Report params are dashboard-driven — WidgetRoot resolves them from the period
// control — but the host (and Storybook) may also inject them via `attributes`.
type TrafficViewsActivityRenderAttributes = TrafficViewsActivityAttributes &
	Partial< ReportParamsFieldAttributes >;
type TrafficViewsActivityWidgetProps = WidgetRenderProps< TrafficViewsActivityRenderAttributes >;

// Inclusive dates to request at most. Insights offers all time, which can span
// years, but the widest card shows ~33 week columns — the rest is fetched and
// thrown away. 366 rather than 365 so a selected leap year survives whole.
const MAX_WINDOW_DAYS = 366;

// The design's cell. The ratio is what turns the capped 40px height into the
// 61px width, so the two must stay in step.
const CELL_HEIGHT = 40;
const CELL_ASPECT_RATIO = 61 / CELL_HEIGHT;

/**
 * The site's daily views over the selected period, as a calendar heatmap.
 *
 * Unlike `jpa/posting-activity` it never switches to compact squares: the design
 * pairs the two on Insights so one reads as counts and the other as density.
 */
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

	// The window goes in `from`/`to`, not the `startDate`/`endDate` pair
	// `stats/streak` takes: `reportParamsToStatsQueryParams` reads
	// `start_date ?? from`, so camel-case fields would be dropped and the
	// request would silently cover the whole period instead of the cap.
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

				// Blank rather than a `0` label for days with no traffic.
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

	// The measured div fills the widget slot with no padding of its own, so its
	// size is the space the heatmap has to work with.
	const [ setRef, size ] = useElementSize< HTMLDivElement >();

	const layout = useMemo(
		() =>
			computeCalendarHeatmapLayout( {
				availWidth: size.width,
				availHeight: size.height,
				dataColumns: heatmapData.length,
				aspectRatio: CELL_ASPECT_RATIO,
				maxCellHeight: CELL_HEIGHT,
				// No legend is rendered, so reserving its default allowance
				// would shrink every cell to make room for nothing.
				legendHeight: 0,
			} ),
		[ size.width, size.height, heatmapData.length ]
	);

	// Drop the oldest columns when the tile cannot fit them all. `slice( -0 )`
	// returns the whole array, so a degenerate tile leaves the data untouched.
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
					// The query keeps the previous response via `placeholderData`, so
					// only surface the error when there is nothing to show.
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
