/**
 * External dependencies
 */
import { Skeleton } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import { SkeletonRoot } from '../widget-skeleton';
import styles from './subscriber-list-skeleton.module.scss';

const DEFAULT_ROW_COUNT = 5;

/**
 * What a widget asking for every row draws — enough to fill a tall tile, and
 * the wrapper clips whatever does not fit.
 */
const ALL_ROWS_COUNT = 12;

export interface SubscriberListSkeletonProps {
	/** Rows to draw; pass the widget's own row count so the shape matches the list that will load. */
	rows?: number;
}

/**
 * Loading shape for `SubscriberList`: a centred stack of rows, each an avatar,
 * a name line, and the trailing secondary line.
 *
 * @param props      - Component props.
 * @param props.rows - Rows to draw.
 * @return The rendered skeleton.
 */
export function SubscriberListSkeleton( {
	rows = DEFAULT_ROW_COUNT,
}: SubscriberListSkeletonProps ) {
	// A widget's `max` of 0 means "all rows", so it cannot be drawn literally.
	const rowCount = rows > 0 ? rows : ALL_ROWS_COUNT;

	return (
		<SkeletonRoot>
			{ /* Own wrapper: the `:nth-child()` width steps must not count
			     SkeletonRoot's hidden label. */ }
			<div className={ styles.rows }>
				{ Array.from( { length: rowCount }, ( _, index ) => (
					<div key={ index } className={ styles.row } data-testid="skeleton-row">
						<Skeleton className={ styles.avatar } data-testid="skeleton-avatar" />
						<Skeleton className={ styles.name } data-testid="skeleton-name" />
						<Skeleton className={ styles.secondary } data-testid="skeleton-secondary" />
					</div>
				) ) }
			</div>
		</SkeletonRoot>
	);
}
