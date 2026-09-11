/**
 * External dependencies
 */
import { reportingTimeZone } from '@jetpack-premium-analytics/datetime';
import { useOpenSectionRange } from '@jetpack-premium-analytics/routing';
import {
	HeatmapSkeleton,
	MonthlyHeatmap,
	WidgetRoot,
	WidgetState,
	describeError,
	monthRange,
	monthlyHeatmapLabels,
	resolveMonthlyHeatmapMetric,
	yearRange,
	type MonthlyHeatmapMetric,
	type MonthlyHeatmapTarget,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { seen } from '@wordpress/icons';
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import useViewsOverYears from './use-views-over-years';
import type { ViewsOverYearsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type ViewsOverYearsRenderAttributes = ViewsOverYearsAttributes &
	Partial< ReportParamsFieldAttributes >;
type ViewsOverYearsWidgetProps = WidgetRenderProps< ViewsOverYearsRenderAttributes >;

// The dashboard section a picked month opens, where the site's traffic is read over a period.
const TRAFFIC_SECTION = 'traffic';

function ViewsOverYearsInner( { metric }: { metric: MonthlyHeatmapMetric } ) {
	const { rows, isLoading, isFetching, isError, error, refetch } = useViewsOverYears( metric );
	const openSectionRange = useOpenSectionRange();
	const timeZone = reportingTimeZone();

	// Classic Stats links each month to the traffic page over it; the year's
	// roll-up opens the whole year.
	const openTraffic = useCallback(
		( { year, month }: MonthlyHeatmapTarget ) => {
			const bounds = { timeZone };
			const range =
				month === undefined ? yearRange( year, bounds ) : monthRange( { year, month }, bounds );

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
				{ ...monthlyHeatmapLabels( metric ) }
				onSelect={ openTraffic }
			/>
		</WidgetState>
	);
}

export default function ViewsOverYears( { attributes = {} }: ViewsOverYearsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<ViewsOverYearsInner metric={ resolveMonthlyHeatmapMetric( attributes.metric ) } />
		</WidgetRoot>
	);
}
