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
	compactCalendarHeatmapCapacity,
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

// The design's labelled cell is 61:40; the ratio is preserved as the cells grow to
// fill the tile's height.
const EXPANDED_ASPECT_RATIO = 61 / 40;
// Below this the tile cannot fit a row of labelled cells, so it renders the
// chart's compact squares instead. The shipped one-row tile is deliberately here:
// compact fits years of history across the tile, where labelled cells fit weeks.
const EXPANDED_MIN_HEIGHT = 220;
// Labelled cells narrower than this have no room for a number.
const VALUE_MIN_CELL_WIDTH = 30;

// A whole leap year, so a selected leap year never loses 1 January.
const WINDOW_YEAR_DAYS = 366;
// Six years fills a ~4100px-wide tile, past any display worth planning for; beyond
// it the request grows faster than the columns it buys.
const MAX_WINDOW_YEARS = 6;

/**
 * How many days of history are worth requesting at a given viewport width.
 *
 * The grid keeps its cell size and trims to the week columns that fit, so history
 * beyond what the widest possible tile can show would be fetched and thrown away.
 * Compact cells are the smallest, so they set that ceiling; the tile is never wider
 * than the viewport; and the result is quantized to whole years so resizing the
 * window cannot fire a fresh request per column gained.
 */
function resolveWindowDays( viewportWidth: number ): number {
	const capacityDays = compactCalendarHeatmapCapacity( viewportWidth ) * 7;
	const years = Math.ceil( capacityDays / WINDOW_YEAR_DAYS );

	return Math.min( Math.max( years, 1 ), MAX_WINDOW_YEARS ) * WINDOW_YEAR_DAYS;
}

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

	const maxWindowDays = resolveWindowDays( typeof window === 'undefined' ? 0 : window.innerWidth );

	const fetchWindow = useMemo(
		() =>
			resolveCalendarHeatmapWindow(
				reportParams,
				{ maxDays: maxWindowDays },
				format( new Date(), 'yyyy-MM-dd' )
			),
		[ reportParams, maxWindowDays ]
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
	const report: StatsVisitsResponse | undefined = primary.data;

	// Measure before mapping the data: the window the grid renders is as wide as the
	// tile, not as wide as the selected period.
	const [ setRef, size ] = useElementSize< HTMLDivElement >();

	// Height picks the cell size, width the column count. Compact renders the
	// chart's own fixed squares (so it sizes itself); expanded fills the height with
	// 61:40 cells and is sized to the rectangle they fill.
	const { columns, sizingProps } = useMemo( () => {
		if ( size.height < EXPANDED_MIN_HEIGHT ) {
			return {
				columns: compactCalendarHeatmapCapacity( size.width ),
				sizingProps: { compact: true },
			};
		}

		const layout = computeCalendarHeatmapLayout( {
			availWidth: size.width,
			availHeight: size.height,
			aspectRatio: EXPANDED_ASPECT_RATIO,
			// Avoid shrinking the cells for a legend this widget does not render.
			legendHeight: 0,
		} );

		return {
			columns: layout.columns,
			sizingProps: {
				width: layout.heatmapWidth,
				height: layout.heatmapHeight,
				showValues: layout.cellWidth > VALUE_MIN_CELL_WIDTH,
			},
		};
	}, [ size.width, size.height ] );

	// The grid fills the tile rather than stopping where the period does: it spans
	// the weeks that fit, ending on the period's last day, so a short period pads
	// with empty columns instead of leaving whitespace. One extra week is generated
	// and trimmed below, because the first column is partial unless the period ends
	// on a week boundary. Before the first measurement there is no width to fill, so
	// the fetched period stands in.
	const displayWindow = useMemo( () => {
		if ( columns <= 0 ) {
			return fetchWindow;
		}

		const days = ( columns + 1 ) * 7;

		return resolveCalendarHeatmapWindow(
			reportParams,
			{ minDays: days, maxDays: days },
			format( new Date(), 'yyyy-MM-dd' )
		);
	}, [ reportParams, fetchWindow, columns ] );

	const { data: heatmapData, rowLabels } = useMemo( () => {
		const viewsByDay = new Map< string, number | null >(
			( report?.data ?? [] ).map( row => {
				const views = Number( row.views ?? 0 );

				return [ String( row.time_interval ), views > 0 ? views : null ];
			} )
		);

		// Days the request never covered — the padding, and any gap in the response —
		// densify to empty cells.
		return buildCalendarHeatmapData(
			buildDenseDaySeries( viewsByDay, displayWindow.startDate, displayWindow.endDate )
		);
	}, [ report, displayWindow ] );

	// slice( -0 ) keeps the data intact until the tile has a measurable width.
	const trimmedData = useMemo( () => heatmapData.slice( -columns ), [ heatmapData, columns ] );

	// Scoped to the period, not to the weeks on screen: the grid pads to fill the
	// tile, so a wide tile can show only empty padding for a period that does have
	// views — "No views in this period" would be a lie there.
	const hasViews = ( report?.data ?? [] ).some( row => Number( row.views ?? 0 ) > 0 );

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
						{ ...sizingProps }
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
