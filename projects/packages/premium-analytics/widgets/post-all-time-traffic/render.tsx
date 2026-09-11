/**
 * External dependencies
 */
import { toPostId } from '@jetpack-premium-analytics/data';
import { PRESET_CUSTOM } from '@jetpack-premium-analytics/datetime';
import { reports } from '@jetpack-premium-analytics/icons';
import { useReportDateFilters } from '@jetpack-premium-analytics/routing';
import {
	HeatmapSkeleton,
	MonthlyHeatmap,
	WidgetRoot,
	WidgetState,
	describeError,
	formatDailyViewCount,
	formatViewCount,
	useWidgetRootContext,
	type MonthlyHeatmapRow,
	type MonthlyHeatmapTarget,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo } from 'react';
/**
 * Internal dependencies
 */
import { resolveMetric, type AllTimeTrafficMetric } from './build-all-time-traffic-rows';
import { monthRange, yearRange } from './period-range';
import usePostAllTimeTraffic from './use-post-all-time-traffic';
import type { PostAllTimeTrafficAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type PostAllTimeTrafficRenderAttributes = PostAllTimeTrafficAttributes &
	Partial< ReportParamsFieldAttributes >;
type PostAllTimeTrafficWidgetProps = WidgetRenderProps< PostAllTimeTrafficRenderAttributes >;

function PostAllTimeTrafficInner( { metric }: { metric: AllTimeTrafficMetric } ) {
	const { reportParams } = useWidgetRootContext();
	const postId = toPostId( reportParams.post_id );

	const { rows, lifeStartsAt, isLoading, isFetching, isError, error, refetch } =
		usePostAllTimeTraffic( postId, metric );

	// Bound to the route hosting the widget: a month picked here becomes the
	// page's period, read over by the other cards while this one stays all-time.
	const { onChange, onApply, timeZone } = useReportDateFilters();

	// A month without views reads 0, as the endpoint reports it; the months
	// outside the post's life are filler.
	const heatmapRows = useMemo< MonthlyHeatmapRow[] >(
		() =>
			rows.map( row => ( {
				year: row.year,
				months: row.months.map( value => ( typeof value === 'number' ? value : null ) ),
				total: row.total,
			} ) ),
		[ rows ]
	);

	const openPeriod = useCallback(
		( { year, month }: MonthlyHeatmapTarget ) => {
			const bounds = { lifeStartsAt, timeZone };
			// The year's roll-up opens the whole year.
			const range =
				month === undefined ? yearRange( year, bounds ) : monthRange( { year, month }, bounds );

			if ( range ) {
				onChange( range, PRESET_CUSTOM );
				onApply();
			}
		},
		[ lifeStartsAt, timeZone, onChange, onApply ]
	);

	// Keep stale rows visible when a background refetch fails.
	const showError = isError && rows.length === 0;

	return (
		<WidgetState
			isLoading={ isLoading }
			isFetching={ isFetching }
			isError={ showError }
			isEmpty={ postId <= 0 || rows.length === 0 }
			// Gated by the same predicate as `isError`, so the two cannot disagree.
			error={
				showError
					? describeError( error, {
							retryDescription: __(
								"We couldn't load this post's traffic. Please try again in a moment.",
								'jetpack-premium-analytics-pkg'
							),
							onRetry: refetch,
					  } )
					: null
			}
			empty={ {
				icon: reports,
				description:
					postId > 0
						? __( 'No views yet.', 'jetpack-premium-analytics-pkg' )
						: __(
								'Open a post or page report to see its all-time traffic here.',
								'jetpack-premium-analytics-pkg'
						  ),
			} }
			renderLoading={ <HeatmapSkeleton /> }
		>
			<MonthlyHeatmap
				rows={ heatmapRows }
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
				onSelect={ openPeriod }
			/>
		</WidgetState>
	);
}

export default function PostAllTimeTraffic( { attributes = {} }: PostAllTimeTrafficWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<PostAllTimeTrafficInner metric={ resolveMetric( attributes.metric ) } />
		</WidgetRoot>
	);
}
