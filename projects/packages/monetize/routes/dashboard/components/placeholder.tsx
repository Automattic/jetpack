import { __ } from '@wordpress/i18n';
import { Card, Text } from '@wordpress/ui';

/**
 * Stands in for a tab until its screen is ported.
 *
 * @return The placeholder.
 */
export default function Placeholder() {
	return (
		<Card.Root>
			<Card.Content>
				<Text>{ __( 'This screen is coming soon.', 'jetpack-monetize' ) }</Text>
			</Card.Content>
		</Card.Root>
	);
}
