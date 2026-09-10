/**
 * External dependencies
 */
import { Skeleton } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import { SkeletonRoot } from '../widget-skeleton';
import styles from './post-highlight-card-skeleton.module.scss';

/** Both widgets sharing the card render views, likes, and comments. */
const STAT_COUNT = 3;

/**
 * Loading shape for `PostHighlightCard`: the post's title lines above its row of stat
 * tiles. No thumbnail placeholder, unlike the design prototype: the card hides its
 * featured image below a 520px cell, so the placeholder would cause the very jump the
 * shape exists to prevent.
 */
export function PostHighlightCardSkeleton() {
	return (
		<SkeletonRoot>
			{ /* Own wrapper: SkeletonRoot's hidden label is a real element, and the
			     block gap must not space it as a block. */ }
			<div className={ styles.shape }>
				<div className={ styles.title }>
					<Skeleton className={ styles.titleLine } data-testid="skeleton-title-line" />
					<Skeleton className={ styles.titleLineShort } data-testid="skeleton-title-line" />
				</div>
				<div className={ styles.stats }>
					{ Array.from( { length: STAT_COUNT }, ( _, index ) => (
						<div key={ index } className={ styles.stat } data-testid="skeleton-stat">
							<Skeleton className={ styles.statLabel } data-testid="skeleton-stat-label" />
							<Skeleton className={ styles.statValue } data-testid="skeleton-stat-value" />
						</div>
					) ) }
				</div>
			</div>
		</SkeletonRoot>
	);
}
