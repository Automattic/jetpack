/**
 * External dependencies
 */
import { useStatsVisits, type StatsVisitsResponse } from '@jetpack-premium-analytics/data';
import { parseSiteDateTime } from '@jetpack-premium-analytics/datetime';
import { formatDate } from '@jetpack-premium-analytics/formatters';
import {
	AdaptiveCalendarHeatmap,
	CalendarHeatmapTooltip,
	HeatmapChartUnresponsive,
	WidgetRoot,
	WidgetState,
	describeError,
	formatViewCount,
	resolveCalendarHeatmapWindow,
	resolveCalendarHeatmapWindowDays,
	useViewportWidth,
	useWidgetRootContext,
	withoutComparison,
	type HeatmapTooltipData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __, sprintf } from '@wordpress/i18n';
import { seen } from '@wordpress/icons';
import { format } from 'date-fns';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import type { TrafficViewsActivityAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type TrafficViewsActivityRenderAttributes = TrafficViewsActivityAttributes &
	Partial< ReportParamsFieldAttributes >;
type TrafficViewsActivityWidgetProps = WidgetRenderProps< TrafficViewsActivityRenderAttributes >;

function renderCellTooltip( { value, cellLabel }: HeatmapTooltipData ) {
	return (
		<CalendarHeatmapTooltip
			value={ value }
			cellLabel={ cellLabel }
			emptyLabel={ __( 'No views', 'jetpack-premium-analytics-pkg' ) }
			formatValue={ formatViewCount }
		/>
	);
}

function TrafficViewsActivityInner() {
	const { reportParams } = useWidgetRootContext();

	const viewportWidth = useViewportWidth();
	const windowDays = resolveCalendarHeatmapWindowDays( viewportWidth );

	// One reading for both windows below, so a render across midnight cannot resolve
	// them against different days.
	const today = format( new Date(), 'yyyy-MM-dd' );

	const fetchWindow = useMemo(
		() =>
			resolveCalendarHeatmapWindow(
				reportParams,
				{ minDays: windowDays, maxDays: windowDays },
				today
			),
		[ reportParams, windowDays, today ]
	);

	// The period as selected, before the viewport window, and the only use for it:
	// All time on a long-dormant site reaches back past the window, and the empty
	// state has to know the response says nothing about the years left out.
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

	const viewsByDay = useMemo(
		() =>
			new Map< string, number | null >(
				( report?.data ?? [] ).map( row => {
					const views = Number( row.views ?? 0 );

					return [ String( row.time_interval ), views > 0 ? views : null ];
				} )
			),
		[ report ]
	);

	// Key the empty state to the response rather than the densified calendar, whose
	// missing dates are represented by null-valued cells.
	const hasViews = ( report?.data ?? [] ).some( row => Number( row.views ?? 0 ) > 0 );

	// And where the period outran the window, the message names the days the request
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
		<AdaptiveCalendarHeatmap valueByDay={ viewsByDay } period={ fetchWindow }>
			{ chartProps => (
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
						{ ...chartProps }
						primaryColor="var(--wp-admin-theme-color, #3858e9)"
						withTooltips
						renderTooltip={ renderCellTooltip }
					/>
				</WidgetState>
			) }
		</AdaptiveCalendarHeatmap>
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
