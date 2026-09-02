/**
 * External dependencies
 */
import { Skeleton } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import styles from './annual-highlights-skeleton.module.scss';
import { SkeletonRoot } from './skeleton-root';

/** The design prototype draws four rows, one per metric tile the widget shows. */
const ROW_COUNT = 4;

/**
 * Loading shape for the Annual highlights widget: a stack of rows, each an icon
 * beside a label line with its value trailing.
 *
 * @return The rendered skeleton.
 */
export function AnnualHighlightsSkeleton() {
	return (
		<SkeletonRoot>
			{ /* Own wrapper: SkeletonRoot's hidden label is a real element, and the
			     row gap must not space it as a row. */ }
			<div className={ styles.rows }>
				{ Array.from( { length: ROW_COUNT }, ( _, index ) => (
					<div key={ index } className={ styles.row } data-testid="skeleton-row">
						<Skeleton className={ styles.icon } />
						<Skeleton className={ styles.label } />
						<Skeleton className={ styles.value } />
					</div>
				) ) }
			</div>
		</SkeletonRoot>
	);
}
