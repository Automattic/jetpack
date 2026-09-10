/**
 * External dependencies
 */
import { Skeleton } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import { SkeletonRoot } from '../widget-skeleton';
import styles from './metric-tabs-chart-skeleton.module.scss';

export function MetricTabsChartSkeleton() {
	return (
		<SkeletonRoot>
			<Skeleton className={ styles.chartBlock } data-testid="skeleton-chart-block" />
		</SkeletonRoot>
	);
}
