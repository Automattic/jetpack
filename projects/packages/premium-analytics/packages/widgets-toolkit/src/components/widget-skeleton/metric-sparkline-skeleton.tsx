/**
 * External dependencies
 */
import { Skeleton } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import styles from './metric-sparkline-skeleton.module.scss';
import { SkeletonRoot } from './skeleton-root';

export interface MetricSparklineSkeletonProps {
	/** Draw a second placeholder beside the value, for headlines that carry a trailing count. */
	withHeadlineCount?: boolean;
}

/**
 * Loading shape for the widgets that put a headline metric over a sparkline. The
 * prototype stacks a label under the value, but none of these widgets render one, so
 * the trailing count is opt-in and inline instead.
 */
export function MetricSparklineSkeleton( {
	withHeadlineCount = false,
}: MetricSparklineSkeletonProps ) {
	return (
		<SkeletonRoot>
			<div className={ styles.headline }>
				<Skeleton className={ styles.value } data-testid="skeleton-metric-value" />
				{ withHeadlineCount && (
					<Skeleton className={ styles.count } data-testid="skeleton-metric-count" />
				) }
			</div>
			{ /* Own wrapper: the band keeps its minimum height independently of the
			     headline above it. */ }
			<div className={ styles.chart }>
				<Skeleton className={ styles.chartBlock } data-testid="skeleton-chart-block" />
			</div>
		</SkeletonRoot>
	);
}
