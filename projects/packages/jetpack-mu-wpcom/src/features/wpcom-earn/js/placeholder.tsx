import { __ } from '@wordpress/i18n';
import { Card, Link, Stack, Text } from '@wordpress/ui';
import { getCalypsoUrl } from './sections.ts';
import { getInitialState } from './state.ts';
import type { EarnSection } from './sections.ts';

/**
 * Stands in for a section until it is ported, pointing at the Calypso screen that still serves it.
 *
 * @param props         - Component props.
 * @param props.section - The section to link to.
 * @return The rendered placeholder.
 */
export function Placeholder( { section }: { section: EarnSection } ) {
	const { domain } = getInitialState();

	return (
		<Card.Root>
			<Card.Content>
				<Stack direction="column" gap="md">
					<Text>
						{ __(
							'This section is still being moved here from WordPress.com.',
							'jetpack-mu-wpcom'
						) }
					</Text>
					<Link href={ getCalypsoUrl( section, domain ) }>
						{ __( 'Open it on WordPress.com', 'jetpack-mu-wpcom' ) }
					</Link>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
