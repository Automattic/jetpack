/**
 * Skeleton loading primitives.
 *
 * A shimmering placeholder block plus a card-shaped row skeleton, used in place
 * of a spinner so the loading state mirrors the layout that's about to appear.
 *
 * @package
 */

import { Card, Stack } from '@wordpress/ui';

type SkeletonProps = {
	width?: string;
	height?: string;
};

/**
 * A single shimmering placeholder block.
 *
 * @param {SkeletonProps} props        - Component props.
 * @param {string}        props.width  - CSS width (default full width).
 * @param {string}        props.height - CSS height (default 1em).
 * @return The skeleton block element.
 */
export const Skeleton = ( { width = '100%', height = '1em' }: SkeletonProps ) => (
	<span className="jetpack-beta-skeleton" style={ { width, height } } aria-hidden="true" />
);

/**
 * A single skeleton row mirroring a plugin / branch row: a couple of text lines
 * on the left and a small action placeholder on the right. Rendered inside a
 * `ListSkeleton` so it matches the compact list layout.
 *
 * @return The skeleton row element.
 */
const RowSkeleton = () => (
	<div className="jetpack-beta-list-row">
		<Stack
			className="jetpack-beta-skeleton-row__inner"
			direction="row"
			align="center"
			justify="space-between"
		>
			<Stack direction="column" gap="xs">
				<Skeleton width="180px" height="16px" />
				<Skeleton width="110px" height="12px" />
			</Stack>
			<Skeleton width="24px" height="24px" />
		</Stack>
	</div>
);

/**
 * A compact list skeleton: one bordered card of divider-separated skeleton rows,
 * mirroring the loaded plugin/branch list so the loading state matches its shape.
 *
 * @param {object} props      - Component props.
 * @param {number} props.rows - Number of skeleton rows to render (default 5).
 * @return The list skeleton element.
 */
export const ListSkeleton = ( { rows = 5 }: { rows?: number } ) => (
	<Card.Root className="jetpack-beta-list" aria-hidden="true">
		{ Array.from( { length: rows } ).map( ( _, index ) => (
			<RowSkeleton key={ index } />
		) ) }
	</Card.Root>
);
