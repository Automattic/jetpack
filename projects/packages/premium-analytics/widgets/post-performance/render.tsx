/**
 * External dependencies
 */
import { reports } from '@jetpack-premium-analytics/icons';
import {
	MetricTabsChart,
	WidgetRoot,
	WidgetState,
	useWidgetRootContext,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import usePostPerformance from './use-post-performance';
import type { PostPerformanceAttributes, PostPerformanceGranularity } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type PostPerformanceRenderAttributes = PostPerformanceAttributes &
	Partial< ReportParamsFieldAttributes >;
type PostPerformanceWidgetProps = WidgetRenderProps< PostPerformanceRenderAttributes >;

const DATA_FORMAT = {
	type: 'number' as const,
	options: { useMultipliers: true, decimals: 0 },
};

type PostPerformanceInnerProps = {
	/** The granularity attribute: the chart's bucket size. */
	granularity: PostPerformanceGranularity;
};

/**
 * Performance inner component. Reads the post scope and report params from
 * WidgetRoot context, and renders the metric tabs over the view-trend chart
 * through `<WidgetState>`; without a post scope (e.g. the widget added
 * outside a post detail page) the query never enables and the empty state
 * shows.
 *
 * @param {PostPerformanceInnerProps} props - The component props.
 * @return The rendered widget content.
 */
function PostPerformanceInner( { granularity }: PostPerformanceInnerProps ) {
	const { reportParams } = useWidgetRootContext();
	const postId = Number( reportParams.post_id ) || 0;

	const { metrics, isLoading, isFetching, isError, hasData, refetch } = usePostPerformance(
		postId,
		reportParams,
		granularity
	);

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ isLoading && ! hasData }
				isError={ isError }
				isEmpty={ postId <= 0 }
				error={ {
					description: __(
						"We couldn't load this post's performance. Please try again in a moment.",
						'jetpack-premium-analytics'
					),
					actions: [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: refetch } ],
				} }
				empty={ {
					icon: reports,
					description: __(
						'Open a post or page report to see its performance here.',
						'jetpack-premium-analytics'
					),
				} }
			>
				<MetricTabsChart
					className={ styles.metricTabs }
					metrics={ metrics }
					distributeTabs
					dataFormat={ DATA_FORMAT }
					loading={ isFetching }
					groupLabel={ __( 'Performance metric', 'jetpack-premium-analytics' ) }
				/>
			</WidgetState>
		</div>
	);
}

/**
 * Performance widget: the scoped post's views, comments, and likes as metric
 * tabs over a comparative view-trend line chart. The post detail Traffic
 * view's main card, merging the legacy Calypso post summary chart with the
 * highlights metrics per the new design spec. Comments and likes render
 * value-only (the API has no per-post series for them).
 *
 * @param {PostPerformanceWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function PostPerformance( { attributes = {} }: PostPerformanceWidgetProps ) {
	// Coerce unknown persisted values (e.g. the removed `auto`) to the default.
	const attrGranularity = attributes?.granularity;
	const granularity =
		attrGranularity === 'week' || attrGranularity === 'month' ? attrGranularity : 'day';

	return (
		<WidgetRoot attributes={ attributes }>
			<PostPerformanceInner granularity={ granularity } />
		</WidgetRoot>
	);
}
