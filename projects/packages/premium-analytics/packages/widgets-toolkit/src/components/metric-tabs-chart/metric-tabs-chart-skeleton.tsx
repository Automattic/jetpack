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

/**
 * Largest tab count the stylesheet gives its own container query; more tabs
 * collapse at that same width.
 */
const MAX_BREAKPOINT_TABS = 6;

export interface MetricTabsChartSkeletonProps {
	/** Metric cards to draw; pass the widget's own tab count so the strip lands where the cards will. */
	tabs?: number;
}

/**
 * Loading shape for `MetricTabsChart`: a strip of metric cards over a
 * full-bleed chart block. Narrow tiles get the dropdown trigger the real
 * header collapses to instead of the strip — both are in the DOM, and the
 * stylesheet's container queries pick one.
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
			{ /* Own wrapper: `:nth-child()` must not count SkeletonRoot's hidden label.
			     `data-tabs` keys the tabs↔dropdown container queries, which CSS cannot
			     derive by multiplying the count by the per-tab width budget. */ }
			<div
				className={ styles.header }
				data-tabs={ Math.min( Math.max( tabs, 1 ), MAX_BREAKPOINT_TABS ) }
			>
				<div className={ styles.tabs }>
					{ Array.from( { length: tabs }, ( _, index ) => (
						<div key={ index } className={ styles.tab }>
							<Skeleton className={ styles.tabLabel } />
							<Skeleton className={ styles.tabValue } />
						</div>
					) ) }
				</div>
				<Skeleton className={ styles.picker } />
			</div>
			<div className={ styles.chart }>
				<Skeleton className={ styles.chartBlock } />
			</div>
		</SkeletonRoot>
	);
}
