/* eslint-disable react/jsx-no-bind */

import { __ } from '@wordpress/i18n';
import { Button, Card, Stack } from '@wordpress/ui';
import useSeoToolsToggle from '../data/use-seo-tools-toggle';
import type { FC } from 'react';

/**
 * Shown on the Overview when the `seo-tools` module is inactive. Explains what
 * SEO tools do and offers a one-click enable. Activating reloads the page so
 * the rest of the SEO surface comes online (see `useSeoToolsToggle`).
 *
 * @return The enable-SEO-tools card.
 */
const EnableSeoCard: FC = () => {
	const { isToggling, setActive } = useSeoToolsToggle();

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Enable SEO tools', 'jetpack-seo' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="md">
					<p>
						{ __(
							'SEO tools help your content get found: customize titles and meta descriptions, generate a sitemap, verify your site with search engines, and control how pages look when shared. Turn it on to manage all of it from here.',
							'jetpack-seo'
						) }
					</p>
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
