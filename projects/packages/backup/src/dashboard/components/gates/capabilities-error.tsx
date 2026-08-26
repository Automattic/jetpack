import { Button, Card, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';

type Props = {
	error: Error;
	onRetry: () => void;
	/** A retry is already in flight. */
	isRetrying?: boolean;
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
 * @param props            - Component props.
 * @param props.error      - The error the capabilities query failed with.
 * @param props.onRetry    - Refetches the capabilities query.
 * @param props.isRetrying - Whether a retry is already in flight.
 * @return The rendered fallback.
 */
export default function CapabilitiesErrorScreen( { error, onRetry, isRetrying = false }: Props ) {
	return (
		<Card className="jpb-gates__card">
			<Stack direction="column" gap="md" align="center">
				<Text variant="heading-md" render={ <h3 /> }>
					{ __( "We couldn't load your backup details", 'jetpack-backup-pkg' ) }
				</Text>
				<Notice status="error" isDismissible={ false }>
					{ error.message }
				</Notice>
				{ /*
				 * Not "this is usually temporary". This screen also covers
				 * `capabilities_unreadable`, which is upstream shape drift —
				 * no amount of retrying clears it, so the copy has to leave
				 * the reader somewhere to go when the button doesn't help.
				 */ }
				<Text>
					{ __(
						'Your backups are unaffected. Try again, and contact support if this keeps happening.',
						'jetpack-backup-pkg'
					) }
				</Text>
				{ /*
				 * Busy rather than merely clickable: the screen holds its
				 * error across a retry, so without this the DOM is
				 * byte-identical before and after the click and a retry
				 * that fails again reads as a dead button.
				 *
				 * `accessibleWhenDisabled` keeps that from costing keyboard
				 * users the page. `Button` sets the *native* `disabled`
				 * attribute unless it is passed, and a browser blurs the
				 * element it has just disabled — focus would land on
				 * `<body>`, and this card is the entire dashboard body, so
				 * there is nothing adjacent to land on.
				 */ }
				<Button
					variant="primary"
					onClick={ onRetry }
					isBusy={ isRetrying }
					disabled={ isRetrying }
					accessibleWhenDisabled
				>
					{ __( 'Try again', 'jetpack-backup-pkg' ) }
				</Button>
			</Stack>
		</Card>
	);
}
