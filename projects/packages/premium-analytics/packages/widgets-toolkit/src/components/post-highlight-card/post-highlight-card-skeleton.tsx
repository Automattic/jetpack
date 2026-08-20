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
 * Loading shape for `PostHighlightCard`: the post's title lines above its row
 * of stat tiles.
 *
 * The design prototype leads with a thumbnail, but the card renders its
 * featured image only when the post has one, and hides it below a 520px cell
 * either way — so a thumbnail placeholder would resolve to nothing in most
 * cells, which is the layout jump the shape exists to prevent.
 *
 * @return The rendered skeleton.
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
