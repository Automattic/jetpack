/**
 * External dependencies
 */
import {
	type StatsVisitsResponse,
	useStatsVisits,
	withoutComparison,
} from '@jetpack-premium-analytics/data';
import { parseSiteDateTime } from '@jetpack-premium-analytics/datetime';
import { formatDate } from '@jetpack-premium-analytics/formatters';
import {
	AdaptiveCalendarHeatmap,
	CalendarHeatmapPagerOverlay,
	CalendarHeatmapTooltip,
	HeatmapChartUnresponsive,
	HeatmapSkeleton,
	WidgetRoot,
	WidgetState,
	describeError,
	formatViewCount,
	resolveCalendarHeatmapWindow,
	resolveCalendarHeatmapWindowDays,
	useViewportWidth,
	useWidgetRootContext,
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

	// A ceiling only — a floor would leak years outside the selection into the
	// card's heading (WOOA7S-1963); it also bounds paging, so paging can't escape the selection.
	const fetchWindow = useMemo(
		() => resolveCalendarHeatmapWindow( reportParams, { maxDays: windowDays }, today ),
		[ reportParams, windowDays, today ]
	);

	// The period as selected, before the ceiling — the empty state needs it to know
	// the response says nothing about years the ceiling left out.
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

	// Key the empty state to the response, not the densified calendar (whose gaps
	// are null cells) — a stale wider-selection response can't hide the empty state.
	const hasViews = ( report?.data ?? [] ).some( row => {
		const day = String( row.time_interval );

		return (
			Number( row.views ?? 0 ) > 0 && day >= fetchWindow.startDate && day <= fetchWindow.endDate
		);
	} );

	// When the period outran the window, name the days the request covers (both
	// ends) — the period can end before today, so "since" would misname the tail.
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
			{ ( chartProps, pager ) => (
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
					renderLoading={ <HeatmapSkeleton /> }
				>
					<CalendarHeatmapPagerOverlay pager={ pager }>
						<HeatmapChartUnresponsive
							{ ...chartProps }
							primaryColor="var(--wp-admin-theme-color, #3858e9)"
							withTooltips
							renderTooltip={ renderCellTooltip }
						/>
					</CalendarHeatmapPagerOverlay>
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
