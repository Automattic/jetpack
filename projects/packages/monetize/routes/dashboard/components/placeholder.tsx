import { __ } from '@wordpress/i18n';
import { Card, Link, Stack, Text } from '@wordpress/ui';
import { getState } from '../data/state';
import { getCalypsoUrl, getTab } from '../data/tabs';
import type { TabValue } from '../data/tabs';

/**
 * Stands in for a tab until it is ported, pointing at the WordPress.com screen that still serves it.
 *
 * @param props     - Component props.
 * @param props.tab - The tab to link to.
 * @return The placeholder.
 */
export default function Placeholder( { tab }: { tab: TabValue } ) {
	return (
		<Card.Root>
			<Card.Content>
				<Stack direction="column" gap="md">
					<Text>
						{ __(
							'This screen is still being moved here from WordPress.com.',
							'jetpack-monetize'
						) }
					</Text>
					<Link href={ getCalypsoUrl( getTab( tab ), getState().siteSlug ) }>
						{ __( 'Open it on WordPress.com', 'jetpack-monetize' ) }
					</Link>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
