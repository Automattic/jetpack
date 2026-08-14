import { Button, Card, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';

type Props = {
	error: Error;
	onRetry: () => void;
};

/**
 * Fallback shown when the capabilities request fails.
 *
 * Without this branch a transient 5xx or network error leaves
 * `capabilities.data` undefined, which reads identically to "no plan" —
 * so an entitled site would be shown the upgrade upsell. Failing to read
 * the plan is not the same as having no plan, so say so and offer a
 * retry.
 *
 * @param props         - Component props.
 * @param props.error   - The error the capabilities query failed with.
 * @param props.onRetry - Refetches the capabilities query.
 * @return The rendered fallback.
 */
export default function CapabilitiesErrorScreen( { error, onRetry }: Props ) {
	return (
		<Card className="jpb-gates__card">
			<Stack direction="column" gap="md" align="center">
				<Text variant="heading-md" render={ <h3 /> }>
					{ __( "We couldn't load your backup details", 'jetpack-backup-pkg' ) }
				</Text>
				<Notice status="error" isDismissible={ false }>
					{ error.message }
				</Notice>
				<Text>
					{ __(
						'This is usually temporary. Try again in a moment — your backups are unaffected.',
						'jetpack-backup-pkg'
					) }
				</Text>
				<Button variant="primary" onClick={ onRetry }>
					{ __( 'Try again', 'jetpack-backup-pkg' ) }
				</Button>
			</Stack>
		</Card>
	);
}
