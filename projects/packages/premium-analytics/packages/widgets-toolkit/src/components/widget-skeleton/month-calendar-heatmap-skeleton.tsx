/**
 * External dependencies
 */
import { Skeleton, useGlobalChartsContext } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import styles from './month-calendar-heatmap-skeleton.module.scss';
import { SkeletonRoot } from './skeleton-root';
import type { CSSProperties } from 'react';

const MONTHS = 12;

/** Loading shape for a month calendar heatmap: a block and a label per month. */
export function MonthCalendarHeatmapSkeleton() {
	// The same merged theme the loaded chart reads, so the blocks land where the months will.
	const { compactCellSize, compactCellGap, groupGap } = useGlobalChartsContext().theme.heatmapChart;
	const geometry = {
		'--jpa-month-cell-size': `${ compactCellSize }px`,
		'--jpa-month-cell-gap': `${ compactCellGap }px`,
		'--jpa-month-group-gap': `${ groupGap }px`,
	} as CSSProperties;

	return (
		<SkeletonRoot>
			{ /* Own wrapper: SkeletonRoot's hidden label is a real element, and the
			     row must not lay it out as a month. */ }
			<div className={ styles.months } style={ geometry }>
				{ Array.from( { length: MONTHS }, ( _, index ) => (
					<div key={ index } className={ styles.month } data-testid="skeleton-month">
						<Skeleton className={ styles.grid } />
						<Skeleton className={ styles.label } />
					</div>
				) ) }
			</div>
		</SkeletonRoot>
	);
}
