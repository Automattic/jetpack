/**
 * External dependencies
 */
import { Skeleton } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import { SkeletonRoot } from '../widget-skeleton';
import styles from './bar-chart-skeleton.module.scss';

/**
 * Columns for a widget that cannot know its own bar count: these charts are
 * categorical rather than time series, so a handful of bars is the shape to expect.
 */
const DEFAULT_COLUMN_COUNT = 4;

export interface BarChartSkeletonProps {
	/** Columns to draw; pass the widget's own bar count where it is known before the response. */
	columns?: number;
}

/**
 * Loading shape for `BarChart`: bottom-aligned columns of stepping heights.
 */
export function BarChartSkeleton( { columns = DEFAULT_COLUMN_COUNT }: BarChartSkeletonProps ) {
	const columnCount = columns > 0 ? columns : DEFAULT_COLUMN_COUNT;

	return (
		<SkeletonRoot>
			{ /* Own wrapper: the `:nth-child()` height steps must not count
			     SkeletonRoot's hidden label. */ }
			<div className={ styles.columns }>
				{ Array.from( { length: columnCount }, ( _, index ) => (
					<Skeleton key={ index } className={ styles.column } data-testid="skeleton-bar-column" />
				) ) }
			</div>
		</SkeletonRoot>
	);
}
