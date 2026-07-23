/* eslint-disable react/jsx-no-bind */

import { __ } from '@wordpress/i18n';
import { Button, Card, Stack, Text } from '@wordpress/ui';
import useSeoToolsToggle from '../data/use-seo-tools-toggle';
import type { SeoTracksScreen } from '../data/record-seo-event';
import type { FC } from 'react';

/**
 * Shown when the `seo-tools` module is inactive. Explains what SEO tools do and
 * offers a one-click enable. Activating reloads the page so the rest of the SEO
 * surface comes online (see `useSeoToolsToggle`).
 *
 * Rendered both on the Overview and, via `SeoDisabledStage`, on every other
 * tab's module-off stage — hence the required `screen`, so the enable event
 * reports where it was actually clicked.
 *
 * @param props        - Component props.
 * @param props.screen - The screen this card is rendering on.
 * @return The enable-SEO-tools card.
 */
const EnableSeoCard: FC< { screen: SeoTracksScreen } > = ( { screen } ) => {
	const { isToggling, setActive } = useSeoToolsToggle( screen );

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Enable SEO tools', 'jetpack-seo' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="md">
					<Text variant="body-md" render={ <p /> }>
						{ __(
							'SEO tools help your content get found: customize titles and meta descriptions, generate a sitemap, verify your site with search engines, and control how pages look when shared. Turn it on to manage all of it from here.',
							'jetpack-seo'
						) }
					</Text>
					<div>
						<Button
							onClick={ () => setActive( true ) }
							loading={ isToggling }
							disabled={ isToggling }
						>
							{ __( 'Enable SEO tools', 'jetpack-seo' ) }
						</Button>
					</div>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
};

export default EnableSeoCard;
