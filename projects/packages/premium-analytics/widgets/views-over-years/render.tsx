/**
 * External dependencies
 */
import {
	createTZDateFromParts,
	drillDateRange,
	reportingTimeZone,
	toLocalTZ,
	type DateRange,
} from '@jetpack-premium-analytics/datetime';
import { useOpenSectionRange } from '@jetpack-premium-analytics/routing';
import {
	HeatmapSkeleton,
	MonthlyHeatmap,
	WidgetRoot,
	WidgetState,
	describeError,
	formatDailyViewCount,
	formatViewCount,
	type MonthlyHeatmapTarget,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { seen } from '@wordpress/icons';
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import { resolveMetric, type ViewsOverYearsMetric } from './build-views-over-years';
import useViewsOverYears from './use-views-over-years';
import type { ViewsOverYearsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type ViewsOverYearsRenderAttributes = ViewsOverYearsAttributes &
	Partial< ReportParamsFieldAttributes >;
type ViewsOverYearsWidgetProps = WidgetRenderProps< ViewsOverYearsRenderAttributes >;

// The dashboard section a picked month opens, where the site's traffic is read over a period.
const TRAFFIC_SECTION = 'traffic';

/** The calendar month or year in the site timezone, cut at today. */
function periodRange( { year, month }: MonthlyHeatmapTarget, timeZone: string ): DateRange | null {
	return drillDateRange(
		createTZDateFromParts( [ year, month ?? 0, 1 ], timeZone ),
		month === undefined ? 'year' : 'month',
		toLocalTZ( undefined, timeZone )
	);
}

function ViewsOverYearsInner( { metric }: { metric: ViewsOverYearsMetric } ) {
	const { rows, isLoading, isFetching, isError, error, refetch } = useViewsOverYears( metric );
	const openSectionRange = useOpenSectionRange();
	const timeZone = reportingTimeZone();

	// Classic Stats links each month to the traffic page over it; the year's
	// roll-up opens the whole year.
	const openTraffic = useCallback(
		( target: MonthlyHeatmapTarget ) => {
			const range = periodRange( target, timeZone );

			if ( range?.from && range.to ) {
				openSectionRange( TRAFFIC_SECTION, { from: range.from, to: range.to } );
			}
		},
		[ timeZone, openSectionRange ]
	);

	// Keep stale rows visible when a background refetch fails.
	const showError = isError && rows.length === 0;

	return (
		<WidgetState
			isLoading={ isLoading }
			isFetching={ isFetching }
			isError={ showError }
			isEmpty={ rows.length === 0 }
			// Gated by the same predicate as `isError`, so the two cannot disagree.
			error={
				showError
					? describeError( error, {
							retryDescription: __(
								"We couldn't load your views. Please try again in a moment.",
								'jetpack-premium-analytics-pkg'
							),
							onRetry: refetch,
					  } )
					: null
			}
			empty={ {
				icon: seen,
				description: __( 'No views yet.', 'jetpack-premium-analytics-pkg' ),
			} }
			renderLoading={ <HeatmapSkeleton /> }
		>
			<MonthlyHeatmap
				rows={ rows }
				formatValue={ metric === 'average' ? formatDailyViewCount : formatViewCount }
				emptyLabel={ __( 'No views', 'jetpack-premium-analytics-pkg' ) }
				lessLabel={
					metric === 'average'
						? __( 'Fewer views per day', 'jetpack-premium-analytics-pkg' )
						: __( 'Fewer views', 'jetpack-premium-analytics-pkg' )
				}
				moreLabel={
					metric === 'average'
						? __( 'More views per day', 'jetpack-premium-analytics-pkg' )
						: __( 'More views', 'jetpack-premium-analytics-pkg' )
				}
				onSelect={ openTraffic }
			/>
		</WidgetState>
	);
}

export default function ViewsOverYears( { attributes = {} }: ViewsOverYearsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<ViewsOverYearsInner metric={ resolveMetric( attributes.metric ) } />
		</WidgetRoot>
	);
}
