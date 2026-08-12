/**
 * External dependencies
 */
import { Skeleton } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import { SkeletonRoot } from './skeleton-root';
import styles from './widget-skeleton.module.scss';

const LINE_COUNT = 4;

/**
 * Fallback shape for widgets with no content-specific skeleton: four stacked
 * lines of varying width.
 *
 * @return The rendered skeleton.
 */
export function GenericSkeleton() {
	return (
		<SkeletonRoot>
			<div className={ styles.lines }>
				{ Array.from( { length: LINE_COUNT }, ( _, index ) => (
					<Skeleton key={ index } className={ styles.line } data-testid="skeleton-line" />
				) ) }
			</div>
		</SkeletonRoot>
	);
}
