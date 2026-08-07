/**
 * External dependencies
 */
import { toPostId } from '@jetpack-premium-analytics/data';
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
import usePostViews from './use-post-views';
import type { PostViewsAttributes, PostViewsGranularity } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type PostViewsRenderAttributes = PostViewsAttributes & Partial< ReportParamsFieldAttributes >;
type PostViewsWidgetProps = WidgetRenderProps< PostViewsRenderAttributes >;

const DATA_FORMAT = {
	type: 'number' as const,
	options: { useMultipliers: true, decimals: 0 },
};

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

	const { current, isLoading, isFetching, isError, hasData, refetch } = usePostViews(
		postId,
		reportParams,
		granularity
	);

	// The post detail page has no comparison control, so the chart always
	// draws the single "Views" series.
	const series = useMemo< ComparativeLineChartSeries[] >( () => {
		if ( ! current.length ) {
			return [];
		}

		return [
			{
				label: __( 'Views', 'jetpack-premium-analytics-pkg' ),
				group: 'views',
				data: current,
			},
		];
	}, [ current ] );
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
 * range as a line chart — the legacy Calypso post summary chart
 * (`stats-post-summary`). The view series comes from `stats/post`'s full
 * daily history, zero-filled and bucketed client-side per the granularity
 * attribute.
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
