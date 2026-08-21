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
				<Text>
					{ __(
						'This is usually temporary. Try again in a moment — your backups are unaffected.',
						'jetpack-backup-pkg'
					) }
				</Text>
				{ /*
				 * Busy rather than merely clickable. The screen holds its
				 * error across the retry now, so without this the DOM is
				 * byte-identical before and after the click and a retry
				 * that fails again reads as a dead button.
				 *
				 * `accessibleWhenDisabled` is what keeps this from undoing
				 * the fix for keyboard users. `Button` sets the *native*
				 * `disabled` attribute unless it is passed
				 * (`trulyDisabled = disabled && ! accessibleWhenDisabled`),
				 * and a browser blurs the element it has just disabled —
				 * so focus would land on `<body>`. This card is the entire
				 * dashboard body on all three routes, so there is nothing
				 * adjacent to land on: the page would disappear for
				 * exactly the readers the visual fix does not reach. The
				 * prop also applies `aria-disabled` itself.
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
