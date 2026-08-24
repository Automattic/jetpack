/**
 * External dependencies
 */
import { Skeleton } from '@jetpack-premium-analytics/externals';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import { SkeletonRoot } from '../widget-skeleton';
import styles from './leaderboard-skeleton.module.scss';

const DEFAULT_ROW_COUNT = 5;

/**
 * What a widget asking for every row draws — enough to fill a tall tile, and
 * the wrapper clips whatever does not fit.
 */
const ALL_ROWS_COUNT = 12;

/**
 * Which of the design's two leaderboard shapes to draw.
 *
 * `list` matches a chart drawn `withOverlayLabel`, where the label sits on the
 * bar and the row loads as one line. `bars` matches the plain chart, whose
 * label sits above its bar.
 */
export type LeaderboardSkeletonVariant = 'list' | 'bars';

export interface LeaderboardSkeletonProps {
	/** Rows to draw; pass the widget's own row count so the shape matches the list that will load. */
	rows?: number;
	/** Which shape to draw. */
	variant?: LeaderboardSkeletonVariant;
}

/**
 * Loading shape for `LeaderboardChart`: a centred stack of rows.
 *
 * Rows past the tile's height are clipped rather than overflowing, mirroring
 * the chart's `fitRows` — a ten-row widget in a tile with room for three shows
 * three either way.
 *
 * @param props         - Component props.
 * @param props.rows    - Rows to draw.
 * @param props.variant - Which shape to draw.
 * @return The rendered skeleton.
 */
export function LeaderboardSkeleton( {
	rows = DEFAULT_ROW_COUNT,
	variant = 'list',
}: LeaderboardSkeletonProps ) {
	// A widget's `max` of 0 means "all rows", so it cannot be drawn literally.
	const rowCount = rows > 0 ? rows : ALL_ROWS_COUNT;

	return (
		<SkeletonRoot>
			{ /* Own wrapper: the `:nth-child()` width steps must not count
			     SkeletonRoot's hidden label. */ }
			<div className={ clsx( styles.rows, styles[ variant ] ) }>
				{ Array.from( { length: rowCount }, ( _, index ) => (
					<div key={ index } className={ styles.row } data-testid="skeleton-row">
						{ variant === 'bars' ? (
							<>
								<Skeleton className={ styles.barLabel } data-testid="skeleton-bar-label" />
								<Skeleton className={ styles.bar } data-testid="skeleton-bar" />
							</>
						) : (
							<>
								<Skeleton className={ styles.listLabel } data-testid="skeleton-list-label" />
								<Skeleton className={ styles.value } data-testid="skeleton-value" />
							</>
						) }
					</div>
				) ) }
			</div>
		</SkeletonRoot>
	);
}
