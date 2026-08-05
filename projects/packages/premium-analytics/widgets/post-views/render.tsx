/**
 * External dependencies
 */
import { toPostId } from '@jetpack-premium-analytics/data';
import { formatDateRange } from '@jetpack-premium-analytics/formatters';
import { reports } from '@jetpack-premium-analytics/icons';
import {
	ComparativeLineChart,
	WidgetRoot,
	WidgetState,
	useSeriesStyles,
	useWidgetRootContext,
	type ComparativeLineChartSeries,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import usePostViews, { type PostViewsPoint } from './use-post-views';
import type { PostViewsAttributes, PostViewsGranularity } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type PostViewsRenderAttributes = PostViewsAttributes & Partial< ReportParamsFieldAttributes >;
type PostViewsWidgetProps = WidgetRenderProps< PostViewsRenderAttributes >;

const DATA_FORMAT = {
	type: 'number' as const,
	options: { useMultipliers: true, decimals: 0 },
};

/**
 * A series' legend label as its date range (first to last point), consistent
 * with the other comparative charts — used only when a comparison overlay
 * makes the plain "Views" label ambiguous.
 *
 * @param points - The series points, oldest first.
 * @return The formatted date range, or '' when empty.
 */
function rangeLabel( points: PostViewsPoint[] ): string {
	const first = points[ 0 ];
	const last = points[ points.length - 1 ];
	return first && last ? formatDateRange( { from: first.date, to: last.date } ) : '';
}

type PostViewsInnerProps = {
	/** The granularity attribute: the chart's bucket size. */
	granularity: PostViewsGranularity;
};

/**
 * Post views inner component. Reads the post scope and report params from
 * WidgetRoot context and renders the view-trend line through `<WidgetState>`;
 * without a post scope (e.g. the widget added outside a post detail page) the
 * query never enables and the empty state shows.
 *
 * @param {PostViewsInnerProps} props - The component props.
 * @return The rendered widget content.
 */
function PostViewsInner( { granularity }: PostViewsInnerProps ) {
	const { reportParams } = useWidgetRootContext();
	const postId = toPostId( reportParams.post_id );

	const { current, previous, isLoading, isFetching, isError, hasData, refetch } = usePostViews(
		postId,
		reportParams,
		granularity
	);

	const series = useMemo< ComparativeLineChartSeries[] >( () => {
		if ( ! current.length ) {
			return [];
		}

		if ( ! previous?.length ) {
			return [
				{
					label: __( 'Views', 'jetpack-premium-analytics-pkg' ),
					group: 'views',
					data: current,
				},
			];
		}

		// With a comparison overlay both series are labelled by date range, so
		// the legend distinguishes the periods; the previous period draws as a
		// same-colour dashed line with no fill.
		return [
			{ label: rangeLabel( current ), group: 'views', data: current },
			{
				label: rangeLabel( previous ),
				group: 'views',
				data: previous,
				options: {
					type: 'comparison',
					gradient: { from: 'transparent', to: 'transparent', fromOpacity: 0, toOpacity: 0 },
				},
			},
		];
	}, [ current, previous ] );
	const seriesStyles = useSeriesStyles( series );

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ isLoading && ! hasData }
				isFetching={ isFetching }
				isError={ isError }
				isEmpty={ postId <= 0 }
				error={ {
					description: __(
						"We couldn't load this post's views. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
				} }
				empty={ {
					icon: reports,
					description: __(
						'Open a post or page report to see its views here.',
						'jetpack-premium-analytics-pkg'
					),
				} }
			>
				<ComparativeLineChart
					className={ styles.chart }
					series={ series }
					styles={ seriesStyles }
					dataFormat={ DATA_FORMAT }
				/>
			</WidgetState>
		</div>
	);
}

/**
 * Post views widget: the scoped post's view trend over the dashboard date
 * range as a comparative line chart — the legacy Calypso post summary chart
 * (`stats-post-summary`). The view series comes from `stats/post`'s full
 * daily history, zero-filled and bucketed client-side per the granularity
 * attribute, with the comparison window sliced from the same request.
 *
 * @param {PostViewsWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function PostViews( { attributes = {} }: PostViewsWidgetProps ) {
	// Coerce unknown persisted values to the default.
	const attrGranularity = attributes?.granularity;
	const granularity =
		attrGranularity === 'week' || attrGranularity === 'month' ? attrGranularity : 'day';

	return (
		<WidgetRoot attributes={ attributes }>
			<PostViewsInner granularity={ granularity } />
		</WidgetRoot>
	);
}
