/**
 * External dependencies
 */
import { Skeleton } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import styles from './annual-highlights-skeleton.module.scss';
import { SkeletonRoot } from './skeleton-root';

/** The design prototype draws four rows. */
const DEFAULT_ROW_COUNT = 4;

export interface AnnualHighlightsSkeletonProps {
	/** Rows to draw; pass the widget's own metric count so the shape matches what will load. */
	rows?: number;
}

/**
 * Loading shape for the Annual highlights widget: a stack of rows, each an icon
 * beside a label line with its value trailing.
 *
 * @param props      - Component props.
 * @param props.rows - Rows to draw.
 * @return The rendered skeleton.
 */
export function AnnualHighlightsSkeleton( {
	rows = DEFAULT_ROW_COUNT,
}: AnnualHighlightsSkeletonProps ) {
	// An instance with every metric turned off asks for no rows, and drawing that
	// literally would leave an empty loading region.
	const rowCount = rows > 0 ? rows : DEFAULT_ROW_COUNT;

	return (
		<SkeletonRoot>
			{ /* Own wrapper: SkeletonRoot's hidden label is a real element, and the
			     row gap must not space it as a row. */ }
			<div className={ styles.rows }>
				{ Array.from( { length: rowCount }, ( _, index ) => (
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
