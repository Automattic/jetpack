/**
 * External dependencies
 */
import { Skeleton } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import { SkeletonRoot } from '../widget-skeleton';
import styles from './donut-chart-skeleton.module.scss';

/**
 * Deliberately not derived from the widget: a donut's segment count only arrives
 * with the response, so a stand-in tracking it would read as a layout jump.
 */
const LEGEND_ROW_COUNT = 4;

/**
 * Loading shape for `DonutChart`: a ring beside a stack of legend rows.
 *
 * @return The rendered skeleton.
 */
export function DonutChartSkeleton() {
	return (
		<SkeletonRoot>
			{ /* Own wrapper: SkeletonRoot's hidden label is a real element, and the
			     row layout must not lay it out beside the ring. */ }
			<div className={ styles.shape }>
				<Skeleton className={ styles.ring } data-testid="skeleton-ring" />
				<div className={ styles.legend }>
					{ Array.from( { length: LEGEND_ROW_COUNT }, ( _, index ) => (
						<div key={ index } className={ styles.legendRow } data-testid="skeleton-legend-row">
							<Skeleton className={ styles.swatch } />
							<Skeleton className={ styles.label } />
						</div>
					) ) }
				</div>
			</div>
		</SkeletonRoot>
	);
}
