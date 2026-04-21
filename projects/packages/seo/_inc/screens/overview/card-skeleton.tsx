/* eslint-disable jsdoc/require-returns, jsdoc/require-param-description */

import { Spinner } from '@wordpress/components';
import { Card, Stack, Text } from '@wordpress/ui';
import type { FC } from 'react';

interface Props {
	title: string;
}

/**
 * Loading placeholder for the Overview cards. Paints the card chrome and
 * the uppercase eyebrow title immediately, then shows a spinner where the
 * card body will eventually render — so the 2×2 grid is visible on first
 * paint instead of waiting for `/overview` to resolve.
 * @param root0
 * @param root0.title
 */
const CardSkeleton: FC< Props > = ( { title } ) => (
	<Card.Root style={ { height: '100%' } }>
		<Card.Content style={ { flex: 1, display: 'flex', flexDirection: 'column' } }>
			<Stack direction="column" gap="lg" style={ { flex: 1 } }>
				<Text
					variant="heading-sm"
					style={ {
						color: 'var(--wpds-color-fg-content-neutral-weak, #6d6d6d)',
					} }
				>
					{ title }
				</Text>
				<Spinner />
			</Stack>
		</Card.Content>
	</Card.Root>
);

export default CardSkeleton;
