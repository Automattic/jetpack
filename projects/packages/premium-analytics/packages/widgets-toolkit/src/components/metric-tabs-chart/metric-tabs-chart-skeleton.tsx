/**
 * External dependencies
 */
import { Skeleton } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import { SkeletonRoot } from '../widget-skeleton';
import styles from './metric-tabs-chart-skeleton.module.scss';

const DEFAULT_TAB_COUNT = 4;

export interface MetricTabsChartSkeletonProps {
	/** Metric cards to draw; pass the widget's own tab count so the strip lands where the cards will. */
	tabs?: number;
}

/**
 * Loading shape for `MetricTabsChart`: a strip of metric cards over a
 * full-bleed chart block.
 *
 * @param props      - Component props.
 * @param props.tabs - Metric cards to draw.
 * @return The rendered skeleton.
 */
export function MetricTabsChartSkeleton( {
	tabs = DEFAULT_TAB_COUNT,
}: MetricTabsChartSkeletonProps ) {
	return (
		<SkeletonRoot className={ styles.root }>
			{ /* Own wrapper: `:nth-child()` must not count SkeletonRoot's hidden label. */ }
			<div className={ styles.tabs }>
				{ Array.from( { length: tabs }, ( _, index ) => (
					<div key={ index } className={ styles.tab }>
						<Skeleton className={ styles.tabLabel } />
						<Skeleton className={ styles.tabValue } />
					</div>
				) ) }
			</div>
			<div className={ styles.chart }>
				<Skeleton className={ styles.chartBlock } />
			</div>
		</SkeletonRoot>
	);
}
