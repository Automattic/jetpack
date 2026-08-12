/**
 * External dependencies
 */
import { useStatsVisits, type StatsVisitsResponse } from '@jetpack-premium-analytics/data';
import { parseSiteDateTime } from '@jetpack-premium-analytics/datetime';
import { formatDate, formatMetricValue } from '@jetpack-premium-analytics/formatters';
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

// The design's cell is 61:40. The cells grow or shrink from that shape to fill the
// tile — the height exactly, and the width an integer column count leaves over.
const CELL_ASPECT_RATIO = 61 / 40;
// Cells narrower than this have no room for a number.
const VALUE_MIN_CELL_WIDTH = 30;

// A whole leap year, so a selected leap year never loses 1 January.
const WINDOW_YEAR_DAYS = 366;
// Six years fills a ~4100px-wide tile, past any display worth planning for; beyond
// it the request grows faster than the columns it buys.
const MAX_WINDOW_YEARS = 6;

/**
 * How many days of history are worth requesting at a given viewport width.
 *
 * The grid only draws the week columns that fit, so history beyond what the widest
 * possible tile could show would be fetched and thrown away. The design's 11px
 * square is the smallest cell the grid ever shrinks to, so it bounds that ceiling;
 * the tile is never wider than the viewport; and the result is quantized to whole
 * years so resizing the window cannot fire a fresh request per column gained.
 */
function resolveWindowDays( viewportWidth: number ): number {
	const capacityDays = compactCalendarHeatmapCapacity( viewportWidth ) * 7;
	const years = Math.ceil( capacityDays / WINDOW_YEAR_DAYS );

	return Math.min( Math.max( years, 1 ), MAX_WINDOW_YEARS ) * WINDOW_YEAR_DAYS;
}

// Show the exact count before the date instead of the chart's default ordering.
//
// An empty cell gets the date alone. It covers two days the grid cannot tell apart:
// a day the request covered that had no views, and a padding day added to fill the
// tile, which was never requested and may well have traffic. "No views" would speak
// for both.
function renderCellTooltip( { value, cellLabel }: HeatmapTooltipData ) {
	// The same element the valued cells put the date in, so the weight does not jump
	// as the pointer crosses between them.
	if ( value === null ) {
		return <div>{ cellLabel }</div>;
	}

	return (
		<>
			<strong>
				{ sprintf(
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

	// One reading for every window below, so a render across midnight cannot resolve
	// them against different days.
	const today = format( new Date(), 'yyyy-MM-dd' );

	const fetchWindow = useMemo(
		() => resolveCalendarHeatmapWindow( reportParams, { maxDays: maxWindowDays }, today ),
		[ reportParams, maxWindowDays, today ]
	);

	// The period as selected, before the viewport cap, and the only use for it: All
	// time on a long-dormant site reaches back past the cap, and the empty state has
	// to know the response says nothing about the years the request left out.
	const periodWindow = useMemo(
		() => resolveCalendarHeatmapWindow( reportParams, {}, today ),
		[ reportParams, today ]
	);
	const isWindowClipped = periodWindow.startDate < fetchWindow.startDate;

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

	// Height picks the cell size, width the column count, and the grid is sized to
	// the rectangle it occupies — so it fills the tile without ever overflowing it.
	//
	// The chart's own `compact` mode is deliberately not used. Its cell size is fixed
	// by the chart theme (11px square, 2px gap), which needs ~104px of body height
	// once the month-label header is counted; the shipped one-row tile only offers
	// ~86px, so the grid overflowed and `overflow: hidden` sliced the month labels
	// off the top and the last weekday row off the bottom. Sizing every tile lets the
	// cells shrink to fit instead.
	const { columns, sizingProps } = useMemo( () => {
		const layout = computeCalendarHeatmapLayout( {
			availWidth: size.width,
			availHeight: size.height,
			aspectRatio: CELL_ASPECT_RATIO,
			// Avoid shrinking the cells for a legend this widget does not render.
			legendHeight: 0,
		} );

		// Before the first measurement there is no rectangle to size to, so leave the
		// chart unsized for that one paint rather than handing it a zero box.
		if ( layout.columns <= 0 ) {
			return { columns: 0, sizingProps: {} };
		}

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

		return resolveCalendarHeatmapWindow( reportParams, { minDays: days, maxDays: days }, today );
	}, [ reportParams, fetchWindow, columns, today ] );

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

	// And where the cap clipped the period, the message names the days the request
	// covers instead of the period: the site may well have views outside them. Both
	// ends are named — the clipped end is the start, but the period can also end
	// before today, and "since" would speak for the days after it.
	const windowStart = parseSiteDateTime( fetchWindow.startDate );
	const windowEnd = parseSiteDateTime( fetchWindow.endDate );
	const emptyDescription =
		isWindowClipped && windowStart && windowEnd
			? sprintf(
					/* translators: 1: first date the request covers, e.g. "Aug 9, 2024". 2: last date it covers. */
					__( 'No views between %1$s and %2$s.', 'jetpack-premium-analytics-pkg' ),
					formatDate( windowStart, 'compact' ),
					formatDate( windowEnd, 'compact' )
			  )
			: __( 'No views in this period.', 'jetpack-premium-analytics-pkg' );

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
						description: emptyDescription,
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
