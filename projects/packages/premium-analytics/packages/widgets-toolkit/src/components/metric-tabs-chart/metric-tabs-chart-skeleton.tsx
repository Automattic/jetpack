/**
 * External dependencies
 */
import { Skeleton } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import { SkeletonRoot } from '../widget-skeleton';
import styles from './metric-tabs-chart-skeleton.module.scss';

/**
 * Loading shape for `MetricTabsChart`: one block filling the widget body.
 *
 * The metric cards deliberately get no placeholder. Their count is only known
 * once the data lands (`subscribers-chart` drops its Paid tab until a paid
 * subscriber shows up), and the real header collapses its card grid into a
 * single dropdown below `metrics.length × MIN_TAB_WIDTH` — so a card-shaped
 * stand-in lands on the wrong count or the wrong shape and reads as a jump.
 *
 * @return The rendered skeleton.
 */
export function MetricTabsChartSkeleton() {
	return (
		<SkeletonRoot>
			<Skeleton className={ styles.chartBlock } data-testid="skeleton-chart-block" />
		</SkeletonRoot>
	);
}
