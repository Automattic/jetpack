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
 * A card-shaped skeleton mirroring a plugin / branch row: a couple of text lines
 * on the left and a small action placeholder on the right.
 *
 * @return The card row skeleton element.
 */
export const CardRowSkeleton = () => (
	<Card.Root>
		<Card.Content>
			<Stack direction="row" align="center" justify="space-between">
				<Stack direction="column" gap="xs">
					<Skeleton width="180px" height="16px" />
					<Skeleton width="110px" height="12px" />
				</Stack>
				<Skeleton width="24px" height="24px" />
			</Stack>
		</Card.Content>
	</Card.Root>
);
