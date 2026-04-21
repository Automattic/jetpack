/* eslint-disable jsdoc/require-returns, jsdoc/require-param-description */

import { Card, Stack, Text } from '@wordpress/ui';
import type { FC, ReactNode } from 'react';

interface Props {
	/**
	 * Small uppercase eyebrow rendered above the hero number — the feature
	 * name (e.g. "Content SEO health"). Mirrors the `title` slot on the
	 * Calypso OverviewCard.
	 */
	title: string;
	/**
	 * Hero readout — the large number or state word.
	 */
	heading: ReactNode;
	/**
	 * Short supporting line below the heading.
	 */
	description?: ReactNode;
	/**
	 * Optional decoration rendered flush-right of the hero column (e.g. a
	 * chart). Sized by the consumer so the card dictates, not the chart.
	 */
	decoration?: ReactNode;
	/**
	 * Additional body rendered below the hero row — issue lists, inline
	 * ProgressBars, etc.
	 */
	body?: ReactNode;
	/**
	 * Footer rendered at the bottom of the card — usually a Link. Pinned
	 * to the bottom of the card so every card in the same row lines up.
	 */
	footer?: ReactNode;
}

/**
 * The Overview screen's shared card shell. Composes `@wordpress/ui` `Card`,
 * `Stack`, and `Text` primitives in the Calypso dashboard-overview-card
 * structure: small uppercase title, hero heading, supporting description,
 * and an optional decoration (chart) anchored to the right. Footer is
 * pinned to the bottom so cards in a row share a baseline for their
 * actions.
 * @param root0
 * @param root0.title
 * @param root0.heading
 * @param root0.description
 * @param root0.decoration
 * @param root0.body
 * @param root0.footer
 */
const OverviewCard: FC< Props > = ( { title, heading, description, decoration, body, footer } ) => (
	// `height: 100%` lets the card stretch to the tallest sibling in the
	// grid row; the inner flex column + `margin-block-start: auto` on the
	// footer then pins the footer to the bottom of that stretched height.
	<Card.Root style={ { height: '100%' } }>
		<Card.Content style={ { flex: 1, display: 'flex', flexDirection: 'column' } }>
			<Stack direction="column" gap="lg" style={ { flex: 1 } }>
				<Stack direction="row" justify="space-between" align="flex-start" gap="md">
					<Stack direction="column" gap="lg" style={ { flex: '1 1 auto', minWidth: 0 } }>
						<Text
							variant="heading-sm"
							style={ { color: 'var(--wpds-color-fg-content-neutral-weak, #6d6d6d)' } }
						>
							{ title }
						</Text>
						<Stack direction="column" gap="xs">
							<Text variant="heading-xl">{ heading }</Text>
							{ description && <Text variant="body-sm">{ description }</Text> }
						</Stack>
					</Stack>
					{ decoration }
				</Stack>
				{ body }
				{ footer && <div style={ { marginBlockStart: 'auto' } }>{ footer }</div> }
			</Stack>
		</Card.Content>
	</Card.Root>
);

export default OverviewCard;
